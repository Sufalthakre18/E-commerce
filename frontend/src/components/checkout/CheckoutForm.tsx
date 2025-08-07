'use client';

import { useCartStore } from '@/store/cart';
import { checkoutSchema, CheckoutFormType } from '@/lib/validators/checkout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo } from 'react'; // Added useMemo
import CheckoutAddressSection from './CheckoutAddressSection';
import { getAuthToken } from '@/lib/utils/auth';
import { loadRazorpay } from '@/lib/utils/loadRazorpay';
import { toast } from 'sonner'; // Import toast from sonner

// Define the structure for the applied promotion
interface AppliedPromotion {
  valid: boolean;
  discount: number;
  type: 'percentage' | 'fixed';
  message: string;
  code: string; // Add the code itself for sending to backend
}

type Address = {
  id: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
};

export function CheckoutForm() {
  const {
    items,
    totalPrice, // This is the original total price from the cart
    clearCart,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // --- Coupon State ---
  const [couponCodeInput, setCouponCodeInput] = useState(''); // User input for coupon code
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedPromotion | null>(null); // Validated coupon from backend
  const [couponError, setCouponError] = useState(''); // Error message for coupon validation
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false); // Loading state for coupon application

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormType>({
    resolver: zodResolver(checkoutSchema),
  });

  // Function to calculate the final total including discount
  const calculateFinalTotal = useMemo(() => {
    const subtotal = totalPrice(); // Get the original total from cart store

    if (appliedCoupon && appliedCoupon.valid) {
      let discountAmount = 0;
      if (appliedCoupon.type === 'percentage') {
        discountAmount = subtotal * (appliedCoupon.discount / 100);
      } else if (appliedCoupon.type === 'fixed') {
        discountAmount = appliedCoupon.discount;
      }
      // Ensure discount doesn't make total negative
      return Math.max(0, subtotal - discountAmount);
    }
    return subtotal; // No coupon applied or invalid, return original total
  }, [totalPrice, appliedCoupon]);

  // Function to apply the coupon
  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code.');
      setAppliedCoupon(null);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setAppliedCoupon(null); // Clear any previously applied coupon

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/promo/validate?code=${couponCodeInput.trim()}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data: AppliedPromotion = await res.json();

      if (!res.ok || !data.valid) {
        // Backend returns { valid: false, message: '...' } on invalid
        throw new Error(data.message || 'Invalid or expired coupon code.');
      }

      setAppliedCoupon({ ...data, code: couponCodeInput.trim().toUpperCase() }); // Store validated coupon and its code
      toast.success(data.message || 'Coupon applied successfully!');
    } catch (err: any) {
      setCouponError(err.message || 'Failed to apply coupon.');
      toast.error(err.message || 'Failed to apply coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const onSubmit = async (data: CheckoutFormType) => {
    if (items.length === 0) {
      toast.error('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select a delivery address.');
      return;
    }

    setIsLoading(true);

    const token = getAuthToken();

    // Prepare common payload, including the final calculated total and coupon code if applied
    const commonPayload = {
      addressId: selectedAddress.id,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        sizeId: item.sizeId,
        variantId: item.variantId,
      })),
      total: calculateFinalTotal, // Use the calculated final total
      couponCode: appliedCoupon?.valid ? appliedCoupon.code : undefined, // Include coupon code if valid
    };

    try {
      if (data.paymentMethod === 'COD') {
        const codRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/cod`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(commonPayload),
        });

        const codData = await codRes.json();
        if (!codRes.ok) throw new Error(codData.error || 'COD order failed');

        toast.success('Order placed successfully with Cash on Delivery!');
        clearCart();
        window.location.href = '/thank-you';
      }

      if (data.paymentMethod === 'razorpay') {
        const isLoaded = await loadRazorpay();
        if (!isLoaded) {
          toast.error('Razorpay SDK failed to load. Try again later.');
          return;
        }

        const razorRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/razorpay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(commonPayload),
        });

        const razorData = await razorRes.json();
        if (!razorRes.ok) throw new Error(razorData.error || 'Razorpay order failed');

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: razorData.amount, // Razorpay amount should reflect the discounted total
          currency: razorData.currency,
          name: 'Your Store Name',
          description: 'Order Payment',
          order_id: razorData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: razorData.razorpayOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: razorData.orderId,
                }),
              });

              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');

              toast.success('Payment successful!');
              clearCart();
              window.location.href = '/thank-you';
            } catch (err) {
              console.error('Payment verification failed:', err);
              toast.error('Payment succeeded but could not be verified. Please contact support.');
            }
          },
          prefill: {
            name: data.name,
            email: data.email,
            contact: data.phone,
          },
          theme: {
            color: '#000000',
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      }
    } catch (err: any) {
      console.error('Order error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl mx-auto p-4 space-y-8"
    >
      {/* Shipping Information Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Shipping Information</h2>
        <CheckoutAddressSection onSelectAddress={setSelectedAddress} />
      </section>

      {/* Contact and Payment Section */}
      <section>
        <h2 className="text-xl font-bold mb-4">Contact & Payment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input {...register('name')} placeholder="Full Name" className="input border p-2 rounded-md" />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

          <input {...register('email')} placeholder="Email" className="input border p-2 rounded-md" />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

          <input {...register('phone')} placeholder="Phone" className="input border p-2 rounded-md" />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold mb-2">Payment Method</h3>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer">
              <input type="radio" value="razorpay" {...register('paymentMethod')} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
              <span>Razorpay (UPI, Cards, Netbanking)</span>
            </label>
            <label className="flex items-center gap-2 border p-3 rounded-lg cursor-pointer">
              <input type="radio" value="COD" {...register('paymentMethod')} className="h-4 w-4 text-black border-gray-300 focus:ring-black" />
              <span>Cash on Delivery</span>
            </label>
          </div>
          {errors.paymentMethod && <p className="text-red-500 text-sm mt-2">{errors.paymentMethod.message}</p>}
        </div>
      </section>

      {/* Order Summary Section with Product Details and Coupon */}
      <section className="border-t pt-8">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>

        {/* Cart Items List */}
        <div className="space-y-4 mb-6">
          {items.length === 0 ? (
            <p className="text-gray-500">Your cart is empty.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item) => (
                <li key={`${item.id}-${item.sizeId}-${item.variantId}`} className="flex py-4 space-x-4 items-center">
                  {/* Product Image */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  
                  {/* Product Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <span className="text-sm font-medium text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Size: {item.sizeLabel}</p>
                    <p className="text-sm text-gray-600">Color: {item.color}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Coupon Input Section */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold mb-2">Apply Coupon</h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCodeInput}
              onChange={(e) => {
                setCouponCodeInput(e.target.value);
                setCouponError(''); // Clear error when user types
                setAppliedCoupon(null); // Clear applied coupon when input changes
              }}
              className="flex-1 border p-2 rounded-md text-sm"
              disabled={isApplyingCoupon}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon || !couponCodeInput.trim()}
              className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isApplyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
          {appliedCoupon && appliedCoupon.valid && (
            <div className="mt-2 text-green-700 text-sm font-medium">
              Coupon "{appliedCoupon.code}" applied! You get a {
                appliedCoupon.type === 'percentage' ? `${appliedCoupon.discount}%` : `₹${appliedCoupon.discount}`
              } discount.
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="space-y-2 text-gray-700">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₹{totalPrice().toFixed(2)}</span>
          </div>
          {appliedCoupon && appliedCoupon.valid && (
            <div className="flex justify-between text-green-700 font-medium">
              <span>Discount ({appliedCoupon.code}):</span>
              <span>
                - ₹{
                  (totalPrice() - calculateFinalTotal).toFixed(2)
                }
              </span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-4 text-gray-900">
            <span>Total:</span>
            <span>₹{calculateFinalTotal.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-3 rounded-lg mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        {isLoading ? 'Placing order...' : 'Place Order'}
      </button>
    </form>
  );
}
