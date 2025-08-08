'use client';

import { useCartStore } from '@/store/cart';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Import and configure fonts using Next.js Font Optimization
import { Cinzel, Source_Sans_3 } from 'next/font/google';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-cinzel', // Use CSS variables for Tailwind
});

const sourceSansPro = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-source-sans-3', // Use CSS variables for Tailwind
});

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
      getCartSnapshot();
      router.push('/checkout');
    }
  };

  const handleQuantityChange = async (
    id: string, 
    sizeId: string | null, 
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;
    const itemKey = `${id}-${sizeId ?? 'nosize'}`;
    setLoadingItems(prev => [...prev, itemKey]);
    
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
      <div className={`flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-white rounded-lg shadow-xl ${sourceSansPro.className}`}>
        <ShoppingBag className="w-20 h-20 text-gray-200 mb-6" />
        <h2 className={`text-3xl font-bold mb-2 text-gray-900 ${cinzel.className}`}>Your cart is empty</h2>
        <p className="text-lg text-gray-500 mb-8 max-w-sm">
          Looks like you haven't added anything to your cart yet. Explore our curated collections.
        </p>
        <Link 
          href="/" 
          className="bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors font-medium text-lg tracking-wide"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className={`container mx-auto mt-5 lg:mt-1 p-4 md:p-8 lg:p-12 ${sourceSansPro.className}`}>
      <h1 className={`text-4xl md:text-5xl font-bold text-gray-900  md:mb-12 border-b-2 pt-2 ${cinzel.className}`}>Shopping Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-2">
          {items.map((item) => {
            const itemKey = `${item.id}-${item.sizeId ?? 'nosize'}`;
            const isLoading = loadingItems.includes(itemKey);
            
            return (
              <div
                key={itemKey}
                className={`flex gap-4 items-center p-4 bg-white border-b border-gray-200 transition-opacity duration-300 ${
                  isLoading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-md overflow-hidden flex-shrink-0 border border-gray-100">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 ">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
                      {item.sizeLabel && (
                        <span>
                          <span className="font-medium">Size:</span> {item.sizeLabel}
                        </span>
                      )}
                      {item.color && (
                        <span>
                          <span className="font-medium">Color:</span> {item.color}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-start md:justify-end gap-2">
                    <div className="flex items-center border border-gray-300 rounded-full">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.sizeId, item.quantity - 1)}
                        disabled={isLoading || item.quantity <= 1}
                        className="p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-black"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 text-lg font-medium text-center text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.sizeId, item.quantity + 1)}
                        disabled={isLoading}
                        className="p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 hover:text-black"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveItem(item.id, item.sizeId)}
                      disabled={isLoading}
                      className="flex items-center text-red-600 hover:text-red-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove item"
                    >
                      {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                          <Trash2 className="h-5 w-5" />
                      )}
                      <span className="ml-1 text-sm md:hidden">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline"
            >
              Clear All Items
            </button>
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors underline"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="lg:col-span-1 h-fit sticky top-4">
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200">
            <h2 className={`text-2xl font-bold mb-6 text-gray-900 ${cinzel.className}`}>Order Summary</h2>
            
            <div className="flex justify-between text-lg text-gray-700 mb-2">
              <span>Subtotal ({totalItems()} items)</span>
              <span>₹{totalPrice().toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between text-lg text-gray-700 mb-4">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            
            <div className="border-t border-gray-300 my-6"></div>

            <div className="flex justify-between items-center text-2xl font-bold text-gray-900 mb-6">
              <span>Total:</span>
              <span>₹{totalPrice().toLocaleString()}</span>
            </div>

            <button
              onClick={handleProceed}
              className="w-full bg-black text-white rounded-full py-4 text-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>

            <div className="text-sm text-gray-500 mt-6">
              <ul className="list-disc list-inside space-y-1">
                <li>Free delivery on all orders</li>
                <li>Easy returns within 30 days of purchase</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}