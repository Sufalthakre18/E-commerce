'use client';

import { useCartStore } from '@/store/cart';
import { checkoutSchema, CheckoutFormType } from '@/lib/validators/checkout';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import CheckoutAddressSection from './CheckoutAddressSection';
import { getAuthToken } from '@/lib/utils/auth';
import { loadRazorpay } from '@/lib/utils/loadRazorpay';

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
    totalPrice,
    clearCart,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormType>({
    resolver: zodResolver(checkoutSchema),
  });

  const onSubmit = async (data: CheckoutFormType) => {
    if (items.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    setIsLoading(true);

    const token = getAuthToken();
    console.log('Submitting order with data:', data, 'and selected address:', selectedAddress);
    console.log(token);

    const commonPayload = {
      addressId: selectedAddress.id,
      items: items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        sizeId: item.sizeId,
      })),
      total: totalPrice(),
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

        alert('✅ Order placed successfully with Cash on Delivery!');
        clearCart();
        window.location.href = '/thank-you';
      }



      if (data.paymentMethod === 'razorpay') {
  const isLoaded = await loadRazorpay();
  if (!isLoaded) {
    alert('Razorpay SDK failed to load. Try again later.');
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
    amount: razorData.amount,
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

        alert('✅ Payment successful!');
        clearCart();
        window.location.href = '/thank-you';
      } catch (err) {
        console.error('Payment verification failed:', err);
        alert('Payment succeeded but could not be verified. Please contact support.');
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

  const razorpay = new window.Razorpay(options);
  razorpay.open();
}

    } catch (err: any) {
      console.error('Order error:', err);
      alert(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-3xl mx-auto p-4 space-y-4"
    >
      <h2 className="text-xl font-bold">Shipping Information</h2>

      <CheckoutAddressSection onSelectAddress={setSelectedAddress} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <input {...register('name')} placeholder="Full Name" className="input" />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}

        <input {...register('email')} placeholder="Email" className="input" />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

        <input {...register('phone')} placeholder="Phone" className="input" />
        {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
      </div>

      <div>
        <h3 className="font-semibold mt-4 mb-2">Payment Method</h3>
        <label className="flex items-center gap-2">
          <input type="radio" value="razorpay" {...register('paymentMethod')} />
          Razorpay (UPI, Cards)
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="COD" {...register('paymentMethod')} />
          Cash on Delivery
        </label>
      </div>

      <div className="mt-4 border-t pt-4">
        <h3 className="text-lg font-bold mb-2">Order Summary</h3>
        <div className="flex justify-between">
          <span>Total:</span>
          <span>₹{totalPrice()}</span>
        </div>
      </div>

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
