'use client';

import { useCartStore } from '@/store/cart';
import ImageGallery from './ImageGallery';
import { useState } from 'react';

export function ProductDetail({ product }: { product: any }) {
  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedSize, setSelectedSize] = useState<{ id: string, size: string } | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [confirmationMessage, setConfirmationMessage] = useState('');

  const defaultVariant = product.variants?.[0] || null;
  const currentVariant = selectedVariant || defaultVariant;

  const currentImages = currentVariant?.images?.length > 0
    ? currentVariant.images.map((img: any) => img.url)
    : product.images?.map((img: any) => img.url) || [];

  const currentPrice = currentVariant?.price || product.price;

  const mainImage = currentImages[0] || '';

  const handleColorSelect = (variant: any) => {
    setSelectedVariant(variant);
  };

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: currentPrice,
      quantity: 1,
      sizeId: selectedSize?.id ?? null,
      sizeLabel: selectedSize?.size ?? '',
      image: mainImage,
      variantId: currentVariant?.id ?? null,
      color: currentVariant?.color ?? '',
    });

    setConfirmationMessage('Item added to cart!');

    setTimeout(() => {
      setConfirmationMessage('');
    }, 3000);
  };

  return (
    <div className="p-4 pb-24">

      {confirmationMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 text-sm font-light tracking-wide rounded-md z-50 shadow-lg">
          {confirmationMessage}
        </div>
      )}

      <ImageGallery images={currentImages} />

      <h1 className="text-xl font-bold mt-4">{product.name}</h1>
      <p className="text-muted-foreground text-sm capitalize mb-1">
        Category: {product.category?.name}
      </p>
      <p className="text-sm mb-2">Stock: {product.stock > 0 ? 'In stock' : 'Out of stock'}</p>

      {/* Color Selection */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">
            Color: {currentVariant?.color || 'Select a color'}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {product.variants.map((variant: any) => {
              const isSelected = currentVariant?.id === variant.id;
              
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleColorSelect(variant)}
                  className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                    isSelected ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: variant.colorCode }}
                  title={variant.color}
                >
                  {isSelected && (
                    <div className="absolute inset-0 rounded-full border-2 border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Size:</h3>
          <div className="flex gap-2 flex-wrap">
            {product.sizes.map((size: any) => {
              const isSelected = selectedSize?.id === size.id;
              const isOutOfStock = size.stock <= 0;

              return (
                <button
                  key={size.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-2 rounded-full border text-sm transition-all ${
                    isSelected
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700'
                  } ${
                    isOutOfStock
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-black hover:text-white'
                  }`}
                >
                  {size.size} ({size.stock})
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-lg font-semibold text-black mb-4">₹{currentPrice}</p>
      <p className="text-sm text-gray-600">{product.description}</p>

      {/* Sticky Add to Cart */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50">
          <button
            onClick={handleAddToCart}
            disabled={product.sizes && product.sizes.length > 0 && !selectedSize}
            className={`w-full bg-black cursor-pointer text-white rounded-lg py-3 text-center transition-all ${
              product.sizes && product.sizes.length > 0 && !selectedSize
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-800'
            }`}
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}