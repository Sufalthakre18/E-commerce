'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Filter, ChevronDown, ArrowUpDown, ShoppingBag, Search, X } from 'lucide-react';
import Link from 'next/link';
import { Cinzel } from 'next/font/google';
const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'] });

import { Unica_One } from 'next/font/google';
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

interface ApiResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

const clothingTypes = [
  "T-Shirts",
  "Jeans",
  "Sneakers",
  "Casual Shirts",
  "Hoodies & Sweatshirts",
  "Track Pants / Joggers",
  "Shorts",
  "Formal Shirts",
  "Jackets",
  "Underwear & Socks"
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' }
];

const MensClothingCollection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and UI states
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Color variant states
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: string]: string }>({});
  const [hoveredSwatch, setHoveredSwatch] = useState<{ productId: string, variantId: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Hover states for product interactions
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: ApiResponse = await response.json();

        const mensClothingProducts = data.products.filter(product =>
          product.category.parent?.name === 'Man' &&
          product.category.name === 'Clothing'
        );

        setProducts(mensClothingProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleVariantSelect = useCallback((productId: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: prev[productId] === variantId ? '' : variantId
    }));
  }, []);

  const processedProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.type?.toLowerCase().includes(query)
      );
    }

    if (selectedType) {
      filtered = filtered.filter(product =>
        product.type?.toLowerCase() === selectedType.toLowerCase()
      );
    }

    filtered = filtered.filter(product => {
      const prices = [product.price, ...product.variants.map(v => v.price)];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return maxPrice >= priceRange.min && minPrice <= priceRange.max;
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const aMinPrice = Math.min(a.price, ...a.variants.map(v => v.price));
          const bMinPrice = Math.min(b.price, ...b.variants.map(v => v.price));
          return aMinPrice - bMinPrice;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const aMaxPrice = Math.max(a.price, ...a.variants.map(v => v.price));
          const bMaxPrice = Math.max(b.price, ...b.variants.map(v => v.price));
          return bMaxPrice - aMaxPrice;
        });
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, selectedType, sortBy, searchQuery, priceRange]);

  // Pagination logic - memoized for performance
  const { totalPages, paginatedProducts, filteredProducts } = useMemo(() => {
    const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = processedProducts.slice(startIndex, startIndex + itemsPerPage);

    return {
      totalPages,
      paginatedProducts,
      filteredProducts: processedProducts,
    };
  }, [processedProducts, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [processedProducts]);

  const clearFilters = useCallback(() => {
    setSelectedType('');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 10000 });
  }, []);

  const getCurrentProductImage = useCallback((product: Product) => {
    const selectedVariantId = selectedVariants[product.id];
    if (selectedVariantId) {
      const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
      if (selectedVariant && selectedVariant.images.length > 0) {
        return selectedVariant.images[0].url;
      }
    }
    return product.images[0]?.url || '';
  }, [selectedVariants]);

  const getCurrentProductPrice = useCallback((product: Product) => {
    const selectedVariantId = selectedVariants[product.id];
    if (selectedVariantId) {
      const selectedVariant = product.variants.find(v => v.id === selectedVariantId);
      if (selectedVariant) {
        return selectedVariant.price;
      }
    }
    return product.price;
  }, [selectedVariants]);

  const generatePageNumbers = useCallback(() => {
    const pages = [];
    const maxPageButtons = 5;

    // Logic for displaying a centered range of pages
    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add '...' for pages not shown
      if (startPage > 1) {
        pages.unshift(1, '...');
      }
      if (endPage < totalPages) {
        pages.push('...', totalPages);
      }
    }
    return pages;
  }, [totalPages, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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
          .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        `}</style>
        <div className="container mx-auto px-6 py-16">
          <div className="animate-pulse space-y-12">
            <div className="h-12 bg-gray-100 rounded w-80 mx-auto"></div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[3/4] bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-light text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-300"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Refined Hero Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              MEN'S COLLECTION
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Timeless pieces crafted with precision. Discover our curated selection of essential menswear.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-[0.1px] lg:px-6">
        {/* Refined Filter Bar */}
        <div className="border-b border-gray-200 py-4 lg:py-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-1 lg:py-3 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 lg:gap-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors duration-300"
              >
                <Filter className="w-4 h-4" />
                FILTER & SORT
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm font-medium text-gray-900 border border-gray-300 px-4 py-2 focus:outline-none focus:border-gray-900 transition-colors duration-300"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Filters Section */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4 tracking-wide">CATEGORY</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedType('')}
                      className={`block w-full text-left text-sm py-2 transition-colors duration-300 ${selectedType === '' ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      All Items
                    </button>
                    {clothingTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`block w-full text-left text-sm py-2 transition-colors duration-300 ${selectedType === type ? 'text-gray-900 font-medium' : 'text-gray-600 hover:text-gray-900'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-4 tracking-wide">PRICE RANGE</label>
                  <div className="flex gap-4">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      className="flex-1 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 transition-colors duration-300 text-sm"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300 underline"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="flex justify-between items-center px-3 lg:px-0 py-3 border-gray-200">
          <p className="lg:text-sm text-[13px] text-gray-500 font-extralight">
            {paginatedProducts.length} of {filteredProducts.length} Products
          </p>
          {(selectedType || searchQuery) && (
            <div className="flex items-center gap-2">
              {selectedType && (
                <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium tracking-wide flex items-center gap-2">
                  {selectedType}
                  <button onClick={() => setSelectedType('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-gray-900 text-white px-3 py-1 text-xs font-medium tracking-wide flex items-center gap-2">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Premium Products Grid and Pagination */}
        {paginatedProducts.length === 0 ? (
          <div className="text-center py-24">
            <h3 className="text-2xl font-light text-gray-900 mb-4">No products found</h3>
            <p className="text-gray-600 mb-8">Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              className="bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-300"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <>
            <div className={`grid lg:gap-4 gap-x-[1px] gap-y-1 lg:gap-x-0.5  grid-cols-2 md:grid-cols-3 lg:grid-cols-4`}>
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className={`relative`}
                  onMouseEnter={() => setHoveredProduct(product.id)}
                  onMouseLeave={() => setHoveredProduct(null)}
                  onTouchStart={() => setHoveredProduct(product.id)}
                  onTouchEnd={() => setTimeout(() => setHoveredProduct(null), 2000)}
                >
                  <Link href={`/products/${product.id}`}>
                    {/* Product Image Container */}
                    <div className={`relative overflow-hidden bg-gray-50 aspect-[3/4] lg:aspect-[3/4] mb-1 md:mb-3 lg:mb-3`}>
                      {getCurrentProductImage(product) ? (
                        <Image
                          src={getCurrentProductImage(product)}
                          alt={product.name}
                          fill
                          className={`object-cover transition-transform duration-700 ${hoveredProduct === product.id ? 'scale-105' : ''}`}
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
                          <span className="text-gray-900 text-sm font-medium tracking-wide">
                            OUT OF STOCK
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className='pl-3 lg:px-0'>
                    <div>
                      <div>
                        <h3 className={`${cinzel.className} font-semibold text-sm text-gray-900 mb-2  tracking-wide line-clamp-2 overflow-hidden w-full`}>
                          {product.name}
                        </h3>
                        {product.variants && product.variants.length > 0 && (
                          <div className={`product-data-swatches mb-3`}>
                            <div className="product-data-swatches-in">
                              <div className="swatches-cont">
                                <div className="product-swatches">
                                  <ul className="swatch-list flex items-center gap-2">
                                    {product.variants.map((variant) => (
                                      <li
                                        key={variant.id}
                                        className="swatch-item js-swatch-item relative"
                                        onMouseEnter={() => setHoveredSwatch({ productId: product.id, variantId: variant.id })}
                                        onMouseLeave={() => setHoveredSwatch(null)}
                                      >
                                        <div className={`indicator-cont absolute -top-1 -left-1 w-6 h-6 border-2 rounded-full transition-all duration-200 ${selectedVariants[product.id] === variant.id
                                            ? 'border-gray-900'
                                            : 'border-transparent'
                                          }`}></div>
                                        <button
                                          onClick={() => handleVariantSelect(product.id, variant.id)}
                                          className={`swatch relative w-5 h-5 rounded-full border border-gray-300 transition-all duration-200 hover:scale-110 drop-shadow-sm ${selectedVariants[product.id] === variant.id ? 'ring-2 ring-gray-900 ring-offset-1' : ''
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
                                        {hoveredSwatch?.productId === product.id && hoveredSwatch?.variantId === variant.id && (
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

                      <div className={`flex items-center justify-between`}>
                        <span className={`${unica.className} text-gray-900 font-light text-[0.8rem] leading-[1.125rem] tracking-[0.25px]`}>
                          ₹{getCurrentProductPrice(product).toLocaleString()}
                        </span>

                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Refined Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center py-16 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    PREVIOUS
                  </button>

                  <div className="flex space-x-2">
                    {generatePageNumbers().map((page, index) => {
                      if (page === '...') {
                        return <span key={index} className="text-gray-600">...</span>;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(Number(page))}
                          className={`w-8 h-8 text-sm font-medium transition-colors duration-300 ${currentPage === page
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                  >
                    NEXT
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MensClothingCollection;