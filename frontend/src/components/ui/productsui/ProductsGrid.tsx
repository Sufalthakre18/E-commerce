'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Cinzel, Unica_One } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'] });
const unica = Unica_One({ subsets: ['latin'], weight: ['400'], variable: '--font-unica' });

interface ProductImage {
  id: string;
  url: string;
  publicId: string;
  productId?: string;
  variantId?: string;
}

interface ProductVariant {
  id: string;
  color: string;
  colorCode: string;
  price: number;
  productId: string;
  images: ProductImage[];
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
    parentId: string | null;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  type: string | null;
  createdAt: string;
  images: ProductImage[];
  category: Category;
  variants: ProductVariant[];
}

interface ProductsGridProps {
  products: Product[];
  clearFilters?: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({ products, clearFilters }) => {
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: string }>({});
  const [hoveredSwatch, setHoveredSwatch] = useState<{ productId: string; variantId: string } | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  const handleVariantSelect = useCallback((productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: prev[productId] === variantId ? '' : variantId,
    }));
  }, []);

  const getCurrentProductImage = useCallback(
    (product: Product) => {
      const selectedVariantId = selectedVariants[product.id];
      if (selectedVariantId) {
        const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
        if (selectedVariant && selectedVariant.images.length > 0) {
          return selectedVariant.images[0].url;
        }
      }
      return product.images[0]?.url || '';
    },
    [selectedVariants]
  );

  const getCurrentProductPrice = useCallback(
    (product: Product) => {
      const selectedVariantId = selectedVariants[product.id];
      if (selectedVariantId) {
        const selectedVariant = product.variants.find((v) => v.id === selectedVariantId);
        if (selectedVariant) {
          return selectedVariant.price;
        }
      }
      return product.price;
    },
    [selectedVariants]
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <h3 className="text-2xl font-light text-gray-900 mb-4">No products found</h3>
        <p className="text-gray-600 mb-8">Try adjusting your filters or search terms</p>
        {clearFilters && (
          <button
            onClick={clearFilters}
            className="bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-300"
          >
            CLEAR FILTERS
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          word-break: break-word;
          line-height: 1.4;
          max-height: 2.8em;
          min-height: 2.8em;
        }
      `}</style>
      
      <div className="grid lg:gap-4 gap-x-[1px] gap-y-1 lg:gap-x-0.5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="relative"
            onMouseEnter={() => setHoveredProduct(product.id)}
            onMouseLeave={() => setHoveredProduct(null)}
            onTouchStart={() => setHoveredProduct(product.id)}
            onTouchEnd={() => setTimeout(() => setHoveredProduct(null), 2000)}
          >
            <Link href={`/products/${product.id}`}>
              {/* Product Image Container */}
              <div className="relative overflow-hidden bg-gray-50 aspect-[3/4] lg:aspect-[3/4] mb-1 md:mb-3 lg:mb-3">
                {getCurrentProductImage(product) ? (
                  <Image
                    src={getCurrentProductImage(product)}
                    alt={product.name}
                    fill
                    className={`object-cover transition-transform duration-700 ${
                      hoveredProduct === product.id ? 'scale-105' : ''
                    }`}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    priority={false}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Stock Badge */}
                {product.stock < 5 && product.stock > 0 && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 text-xs font-medium tracking-wide">
                    LOW STOCK
                  </div>
                )}

                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                    <span className="text-gray-900 text-sm font-medium tracking-wide">OUT OF STOCK</span>
                  </div>
                )}
              </div>
            </Link>

            {/* Product Info */}
            <div className="pl-3 lg:px-0">
              <div>
                <div>
                  <h3
                    className={`${cinzel.className} font-semibold text-sm text-gray-900 mb-2 tracking-wide line-clamp-2 overflow-hidden w-full`}
                  >
                    {product.name}
                  </h3>
                  {product.variants && product.variants.length > 0 && (
                    <div className="product-data-swatches mb-3">
                      <div className="product-data-swatches-in">
                        <div className="swatches-cont">
                          <div className="product-swatches">
                            <ul className="swatch-list flex items-center gap-2">
                              {product.variants.map((variant) => (
                                <li
                                  key={variant.id}
                                  className="swatch-item js-swatch-item relative"
                                  onMouseEnter={() =>
                                    setHoveredSwatch({ productId: product.id, variantId: variant.id })
                                  }
                                  onMouseLeave={() => setHoveredSwatch(null)}
                                >
                                  <div
                                    className={`indicator-cont absolute -top-1 -left-1 w-6 h-6 border-2 rounded-full transition-all duration-200 ${
                                      selectedVariants[product.id] === variant.id
                                        ? 'border-gray-900'
                                        : 'border-transparent'
                                    }`}
                                  ></div>
                                  <button
                                    onClick={() => handleVariantSelect(product.id, variant.id)}
                                    className={`swatch relative w-5 h-5 rounded-full border border-gray-300 transition-all duration-200 hover:scale-110 drop-shadow-sm ${
                                      selectedVariants[product.id] === variant.id
                                        ? 'ring-2 ring-gray-900 ring-offset-1'
                                        : ''
                                    }`}
                                    style={{ backgroundColor: variant.colorCode }}
                                    data-variantid={variant.id}
                                    data-color={variant.color}
                                    aria-label={`${variant.color} Color for ${product.name}`}
                                    title={`${variant.color} - ₹${variant.price}`}
                                  >
                                    {variant.images.length > 0 && (
                                      <img
                                        className="swatch-image w-full h-full object-cover rounded-full opacity-80"
                                        src={variant.images[0].url}
                                        alt={variant.color}
                                        loading="lazy"
                                      />
                                    )}
                                  </button>

                                  {/* Tooltip for color name and price */}
                                  {hoveredSwatch?.productId === product.id &&
                                    hoveredSwatch?.variantId === variant.id && (
                                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                        {variant.color} - ₹{variant.price}
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                                      </div>
                                    )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`${unica.className} text-gray-900 font-light text-[0.8rem] leading-[1.125rem] tracking-[0.25px]`}
                  >
                    ₹{getCurrentProductPrice(product).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ProductsGrid;