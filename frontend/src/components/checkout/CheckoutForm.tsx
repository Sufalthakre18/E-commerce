// src/components/CheckoutForm.tsx
'use client';

import { useCartStore } from '@/store/cart';
import { checkoutSchema, CheckoutFormType } from '@/lib/validators/checkout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo, useEffect } from 'react';
import CheckoutAddressSection from './CheckoutAddressSection';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { loadRazorpay } from '@/lib/utils/loadRazorpay';
import { toast } from 'sonner';
import { Cinzel, Source_Sans_3 } from 'next/font/google';
import { Truck, CreditCard, Package, Download } from 'lucide-react';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'] });
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

interface AppliedPromotion {
  valid: boolean;
  discount: number;
  type: 'percentage' | 'fixed';
  message: string;
  code: string;
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
  const { items, totalPrice, clearCart, isDigitalOnly } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedPromotion | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckoutFormType>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: 'razorpay' }, // Default to Razorpay
  });

  useEffect(() => {
    setIsClient(true);
    // Disable COD for digital products
    if (isDigitalOnly()) {
      setValue('paymentMethod', 'razorpay');
    }
  }, [isDigitalOnly, setValue]);

  const calculateFinalTotal = useMemo(() => {
    const subtotal = totalPrice();
    if (appliedCoupon && appliedCoupon.valid) {
      let discountAmount = 0;
      if (appliedCoupon.type === 'percentage') {
        discountAmount = subtotal * (appliedCoupon.discount / 100);
      } else if (appliedCoupon.type === 'fixed') {
        discountAmount = appliedCoupon.discount;
      }
      return Math.max(0, subtotal - discountAmount);
    }
    return subtotal;
  }, [totalPrice, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code.');
      setAppliedCoupon(null);
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');
    setAppliedCoupon(null);

    try {
      const data: AppliedPromotion = await fetchWrapper(
        `${process.env.NEXT_PUBLIC_API_URL}/promo/validate?code=${couponCodeInput.trim()}`
      );
      setAppliedCoupon({ ...data, code: couponCodeInput.trim().toUpperCase() });
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

    if (!isDigitalOnly() && !selectedAddress) {
      toast.error('Please select a delivery address for physical products.');
      return;
    }

    setIsLoading(true);
    const commonPayload = {
      addressId: isDigitalOnly() ? null : selectedAddress?.id, // Send null for digital-only
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        sizeId: item.sizeId,
        variantId: item.variantId,
      })),
      total: calculateFinalTotal,
      couponCode: appliedCoupon?.valid ? appliedCoupon.code : undefined,
    };

    try {
      if (data.paymentMethod === 'COD') {
        const codData = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/cod`, {
          method: 'POST',
          body: JSON.stringify(commonPayload),
        });

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

        const razorData = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/razorpay`, {
          method: 'POST',
          body: JSON.stringify(commonPayload),
        });

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
          amount: razorData.amount,
          currency: razorData.currency,
          name: 'Your Store Name',
          description: 'Order Payment',
          order_id: razorData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              const verifyData = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/payment/verify`, {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: razorData.razorpayOrderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: razorData.orderId,
                }),
              });

              if (razorData.downloadLinks?.length > 0) {
                toast.success('Payment successful! Download links are available in your order details.');
              } else {
                toast.success('Payment successful!');
              }
              clearCart();
              window.location.href = '/thank-you';
            } catch (err: any) {
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className={`${cinzel.className} text-3xl font-semibold text-gray-900 mb-8 text-center`}>
          Checkout
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {!isDigitalOnly() && ( // Hide address section for digital-only orders
              <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <Truck className="w-6 h-6 text-gray-700" />
                  <h2 className={`${cinzel.className} text-xl font-semibold text-gray-900`}>
                    Shipping Information
                  </h2>
                </div>
                <CheckoutAddressSection onSelectAddress={setSelectedAddress} />
              </section>
            )}

            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <CreditCard className="w-6 h-6 text-gray-700" />
                <h2 className={`${cinzel.className} text-xl font-semibold text-gray-900`}>
                  Contact & Payment
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('name')}
                    placeholder="Full Name"
                    className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <input
                    {...register('email')}
                    placeholder="Email"
                    className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <input
                    {...register('phone')}
                    placeholder="Phone"
                    className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors`}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div className="mt-6">
                <h3 className={`${sourceSansPro.className} font-semibold text-gray-900 mb-3`}>
                  Payment Method
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                    <input
                      type="radio"
                      value="razorpay"
                      {...register('paymentMethod')}
                      className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <span className={`${sourceSansPro.className} text-sm text-gray-700`}>
                      Razorpay (UPI, Cards, Netbanking)
                    </span>
                  </label>
                  {!isDigitalOnly() && ( // Hide COD for digital products
                    <label className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer transition-colors">
                      <input
                        type="radio"
                        value="COD"
                        {...register('paymentMethod')}
                        className="h-4 w-4 text-black border-gray-300 focus:ring-black"
                      />
                      <span className={`${sourceSansPro.className} text-sm text-gray-700`}>
                        Cash on Delivery
                      </span>
                    </label>
                  )}
                </div>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-2">{errors.paymentMethod.message}</p>
                )}
                {isDigitalOnly() && (
                  <p className={`${sourceSansPro.className} text-sm text-gray-500 mt-2`}>
                    <Download className="w-4 h-4 inline-block mr-1" />
                    Digital products will be available for download after payment.
                  </p>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 sticky top-4">
              <div className="flex items-center space-x-3 mb-6">
                <Package className="w-6 h-6 text-gray-700" />
                <h2 className={`${cinzel.className} text-xl font-semibold text-gray-900`}>
                  Order Summary
                </h2>
              </div>

              {isClient ? (
                <div className="space-y-4 mb-6">
                  {items.length === 0 ? (
                    <p className={`${sourceSansPro.className} text-gray-500 text-sm`}>
                      Your cart is empty.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {items.map((item) => (
                        <li
                          key={`${item.id}-${item.sizeId}-${item.variantId}`}
                          className="flex py-4 space-x-4 items-center"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                            loading="lazy"
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <h4 className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>
                                {item.name}
                              </h4>
                              <span className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            {item.productType === 'physical' && item.sizeLabel && (
                              <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                Size: {item.sizeLabel}
                              </p>
                            )}
                            <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                              {item.productType === 'digital' ? 'Digital' : 'Physical'}
                            </p>
                            <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                              Quantity: {item.quantity}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <p className={`${sourceSansPro.className} text-gray-500 text-sm`}>Loading cart...</p>
              )}

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className={`${sourceSansPro.className} font-semibold text-gray-900 mb-3`}>
                  Apply Coupon
                </h3>
                <div className="flex gap-2 lg:gap-1">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCodeInput}
                    onChange={(e) => {
                      setCouponError('');
                      setAppliedCoupon(null);
                      setCouponCodeInput(e.target.value);
                    }}
                    className={`${sourceSansPro.className} flex-1 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none transition-colors disabled:bg-gray-100`}
                    disabled={isApplyingCoupon}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isApplyingCoupon || !couponCodeInput.trim()}
                    className={`${sourceSansPro.className} bg-gray-900 text-white px-4 lg:px-2 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isApplyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                {appliedCoupon && appliedCoupon.valid && (
                  <div className="mt-2 text-green-600 text-sm font-medium">
                    Coupon "{appliedCoupon.code}" applied! You get a{' '}
                    {appliedCoupon.type === 'percentage'
                      ? `${appliedCoupon.discount}%`
                      : `₹${appliedCoupon.discount}`}{' '}
                    discount.
                  </div>
                )}
              </div>

              {isClient ? (
                <div className="space-y-3 text-gray-700">
                  <div className="flex justify-between">
                    <span className={`${sourceSansPro.className} text-sm`}>Subtotal:</span>
                    <span className={`${sourceSansPro.className} text-sm font-medium`}>
                      ₹{totalPrice().toFixed(2)}
                    </span>
                  </div>
                  {appliedCoupon && appliedCoupon.valid && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span className={`${sourceSansPro.className} text-sm`}>
                        Discount ({appliedCoupon.code}):
                      </span>
                      <span className={`${sourceSansPro.className} text-sm`}>
                        - ₹{(totalPrice() - calculateFinalTotal).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-4 text-gray-900">
                    <span className={`${cinzel.className}`}>Total:</span>
                    <span className={`${sourceSansPro.className}`}>
                      ₹{calculateFinalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`${sourceSansPro.className} text-gray-500 text-sm`}>Calculating total...</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !isClient}
                className={`${cinzel.className} w-full bg-gray-900 text-white py-4 rounded-lg mt-6 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? 'Placing Order...' : 'Place Order'}
              </button>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}