'use client';

import { useCartStore } from '@/store/cart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';

export function CartView() {
  const router = useRouter();
  const {
    items,
    totalItems,
    totalPrice,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartSnapshot,
  } = useCartStore();

  const handleProceed = () => {
    const token = getAuthToken();

    if (!token) {
      router.push('/login?redirect=/checkout');
    } else {
      getCartSnapshot(); // Data will be used on /checkout page
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Your cart is empty 🛒</h2>
        <Link href="/" className="text-blue-600 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 space-y-4">
      <h2 className="text-xl font-bold">Cart ({totalItems()} items)</h2>

      {items.map((item) => (
        <div
          key={`${item.id}-${item.sizeId ?? 'nosize'}`} 
          className="flex gap-4 items-center border p-2 rounded-lg"
        >
          <div className="relative h-16 w-16 rounded overflow-hidden">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-medium">{item.name}</h3>
            <p className="text-xl text-muted-foreground">₹{item.price}</p>
            <p className="text-xs opacity-90 text-gray-500">
              {item.name} - Size: {item.sizeLabel}
            </p>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() =>
                  updateQuantity(item.id, item.sizeId, item.quantity - 1)
                }
                className="border rounded w-6 h-6 text-sm"
              >
                -
              </button>
              <span className="text-sm">{item.quantity}</span>
              <button
                onClick={() =>
                  updateQuantity(item.id, item.sizeId, item.quantity + 1)
                }
                className="border rounded w-6 h-6 text-sm"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={() => removeFromCart(item.id, item.sizeId)}
            className="text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <div className="pt-2 border-t">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>₹{totalPrice()}</span>
        </div>
      </div>

      <button
        onClick={handleProceed}
        className="w-full bg-black text-white rounded-lg py-3 mt-4 text-center cursor-pointer hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black"
      >
        Proceed to Checkout
      </button>

      <button
        onClick={clearCart}
        className="w-full text-sm text-gray-600 mt-2 underline"
      >
        Clear Cart
      </button>
    </div>
  );
}
