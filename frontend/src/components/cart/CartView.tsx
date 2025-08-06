'use client';

import { useCartStore } from '@/store/cart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CartView() {
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<string[]>([]);
  
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

  const handleQuantityChange = async (
    id: string, 
    sizeId: string | null, 
    newQuantity: number
  ) => {
    const itemKey = `${id}-${sizeId ?? 'nosize'}`;
    setLoadingItems(prev => [...prev, itemKey]);
    
    // Simulate API delay for better UX
    setTimeout(() => {
      updateQuantity(id, sizeId, newQuantity);
      setLoadingItems(prev => prev.filter(item => item !== itemKey));
    }, 200);
  };

  const handleRemoveItem = async (id: string, sizeId: string | null) => {
    const itemKey = `${id}-${sizeId ?? 'nosize'}`;
    setLoadingItems(prev => [...prev, itemKey]);
    
    setTimeout(() => {
      removeFromCart(id, sizeId);
      setLoadingItems(prev => prev.filter(item => item !== itemKey));
    }, 200);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
        <ShoppingBag className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link 
          href="/" 
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-32">
      <h1>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptatibus amet maxime aliquam doloremque. Inventore, beatae. Blanditiis quisquam nihil culpa provident.</h1>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Shopping Cart ({totalItems()} {totalItems() === 1 ? 'item' : 'items'})
        </h2>
        <button
          onClick={clearCart}
          className="text-sm text-red-600 hover:text-red-800 underline transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const itemKey = `${item.id}-${item.sizeId ?? 'nosize'}`;
          const isLoading = loadingItems.includes(itemKey);
          
          return (
            <div
              key={itemKey}
              className={`flex gap-4 items-center bg-white border rounded-lg p-4 shadow-sm transition-opacity ${
                isLoading ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {/* Product Image */}
              <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-800 truncate">
                  {item.name}
                </h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₹{item.price.toLocaleString()}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                    Size: {item.sizeLabel}
                  </span>
                  {item.color && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Color: {item.color}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.sizeId, item.quantity - 1)}
                    disabled={isLoading || item.quantity <= 1}
                    className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 text-lg font-medium min-w-[3rem] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.sizeId, item.quantity + 1)}
                    disabled={isLoading}
                    className="p-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveItem(item.id, item.sizeId)}
                  disabled={isLoading}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[100px]">
                <p className="text-lg font-bold text-gray-900">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-gray-500">
                    ₹{item.price} × {item.quantity}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <div className="flex items-center justify-between text-xl font-bold text-gray-800 mb-4">
          <span>Total Amount:</span>
          <span>₹{totalPrice().toLocaleString()}</span>
        </div>
        
        <div className="text-sm text-gray-600 mb-6">
          <p>• Free delivery on orders above ₹499</p>
          <p>• Easy returns within 30 days</p>
        </div>

        <button
          onClick={handleProceed}
          className="w-full bg-blue-600 text-white rounded-lg py-4 text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          Proceed to Checkout
        </button>
      </div>

      {/* Continue Shopping */}
      <div className="text-center mt-6">
        <Link 
          href="/" 
          className="text-blue-600 hover:text-blue-800 underline font-medium"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}