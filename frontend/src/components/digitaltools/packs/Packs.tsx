'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FilterBar from '@/components/ui/productsui/FilterBar';
import ProductsGrid from '@/components/ui/productsui/ProductsGrid';
import Pagination from '@/components/ui/productsui/Pagination';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

// Types (same as before)
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

// Configuration constants
const packsType = [
 'Sound Effects', 'Music Tracks', 'Stock Video', 'Animations', 'Podcast Kits'
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' },
];

const Packs: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and UI states
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data: ApiResponse = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const packsProducts = data.products.filter(
          (product) => product.category.parent?.name === 'Creative & Business' && product.category.name === 'Audio & Media Packs',
        );
        setProducts(packsProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Process and filter products
  const processedProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.type?.toLowerCase().includes(query),
      );
    }

    if (selectedType) {
      filtered = filtered.filter((product) => product.type?.toLowerCase() === selectedType.toLowerCase());
    }

    filtered = filtered.filter((product) => {
      const prices = [product.price, ...product.variants.map((v) => v.price)];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      return maxPrice >= priceRange.min && minPrice <= priceRange.max;
    });

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const aMinPrice = Math.min(a.price, ...a.variants.map((v) => v.price));
          const bMinPrice = Math.min(b.price, ...b.variants.map((v) => v.price));
          return aMinPrice - bMinPrice;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const aMaxPrice = Math.max(a.price, ...a.variants.map((v) => v.price));
          const bMaxPrice = Math.max(b.price, ...b.variants.map((v) => v.price));
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

  // Pagination logic
  const { totalPages, paginatedProducts } = useMemo(() => {
    const totalPages = Math.ceil(processedProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedProducts = processedProducts.slice(startIndex, startIndex + itemsPerPage);

    return {
      totalPages,
      paginatedProducts,
    };
  }, [processedProducts, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [processedProducts]);

  const clearFilters = useCallback(() => {
    setSelectedType('');
    setSearchQuery('');
    setPriceRange({ min: 0, max: 10000 });
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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

  // Error state
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

  // No products state
  if (processedProducts.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-5xl md:text-7xl font-semibold text-gray-900 mb-6 tracking-tight">
            COMING SOON
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 font-light">
            Stay Connected
          </p>
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
            <h1 className="uppercase text-4xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              Audio & Media Packs
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Elevate your projects with our curated selection of premium audio and media packs, designed to inspire and enhance your creative journey.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-[0.1px] lg:px-6">
        {/* Filter Bar Component */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          clearFilters={clearFilters}
          sortOptions={sortOptions}
          categories={packsType}
        />

        {/* Products Grid Component */}
        <ProductsGrid products={paginatedProducts} clearFilters={clearFilters} />

        {/* Pagination Component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default Packs;