'use client';

import { useCartStore } from '@/store/cart';
import ImageGallery from './ImageGallery';
import { useState } from 'react';

export function ProductDetail({ product }: { product: any }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedSize, setSelectedSize] = useState<{ id: string, size: string } | null>(null);



  const mainImage = product.images?.[0]?.url || '';

  return (
    <div className="p-4 pb-24">
      <ImageGallery images={product.images.map((img: any) => img.url)} />

      <h1 className="text-xl font-bold mt-4">{product.name}</h1>
      <p className="text-muted-foreground text-sm capitalize mb-1">
        Category: {product.category?.name}
      </p>
      <p className="text-sm mb-2">Stock: {product.stock > 0 ? 'In stock' : 'Out of stock'}</p>
      {product.sizes.map((size: any) => {
        const isSelected = selectedSize?.id === size.id;

        const isOutOfStock = size.stock <= 0;

        return (
          <button
            key={size.id}
            type="button"
            disabled={isOutOfStock}
            onClick={() => setSelectedSize(size)}
            className={`px-4 py-2 rounded-full border text-sm transition-all ${isSelected ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
              } ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:text-white'}`}
          >
            {size.size} ({size.stock})
          </button>
        );
      })}

      <p className="text-lg font-semibold text-black mb-4">₹{product.price}</p>
      <p className="text-sm text-gray-600">{product.description}</p>

      {/* Sticky Add to Cart */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t  z-50">
          <button
            onClick={() =>
              addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                sizeId: selectedSize?.id ?? null,  // ✅ this is good
                sizeLabel: selectedSize?.size ?? '',
                image: mainImage,
              })

            }
            className="w-full bg-black cursor-pointer text-white rounded-lg py-3 text-center"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}
