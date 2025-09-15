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
const manApparelType = [
  "Oversized Tees", "Polo Tees", "Hoodies", "Tank tops", "Shorts", "Caps"
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'name', label: 'Name A-Z' },
];

const ManApparel: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter and UI states
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // For the input field
  const [appliedSearchQuery, setAppliedSearchQuery] = useState(''); // For actual filtering
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch products with all filters applied
  const fetchProducts = useCallback(async (page: number) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        mainCategory: 'Apparel',
        subCategory: 'Man-Apparel',
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      // Add optional filters
      if (selectedType) params.append('type', selectedType);
      if (appliedSearchQuery) params.append('search', appliedSearchQuery);
      if (priceRange.min > 0) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max < 10000) params.append('maxPrice', priceRange.max.toString());
      
      const data: ApiResponse = await fetchWrapper(
        `${process.env.NEXT_PUBLIC_API_URL}/products?${params.toString()}`
      );
      
      setProducts(data.products);
      setTotalProducts(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [selectedType, appliedSearchQuery, priceRange, itemsPerPage]);

  // Initial load and when filters change
  useEffect(() => {
    fetchProducts(currentPage);
  }, [fetchProducts, currentPage]);

  // Handle search submission
  const handleSearchSubmit = useCallback(() => {
    setAppliedSearchQuery(searchQuery);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery]);

  // Handle Enter key press in search input
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSelectedType('');
    setSearchQuery('');
    setAppliedSearchQuery('');
    setPriceRange({ min: 0, max: 10000 });
    setCurrentPage(1);
  }, []);

  // Process products for sorting (since backend only sorts by date)
  const processedProducts = useMemo(() => {
    let sorted = [...products];
    
    // Sorting
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => {
          const aMinPrice = Math.min(a.price, ...a.variants.map((v) => v.price));
          const bMinPrice = Math.min(b.price, ...b.variants.map((v) => v.price));
          return aMinPrice - bMinPrice;
        });
        break;
      case 'price-high':
        sorted.sort((a, b) => {
          const aMaxPrice = Math.max(a.price, ...a.variants.map((v) => v.price));
          const bMaxPrice = Math.max(b.price, ...b.variants.map((v) => v.price));
          return bMaxPrice - aMaxPrice;
        });
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // 'featured' - keep the backend order (newest first)
        break;
    }
    
    return sorted;
  }, [products, sortBy]);

  // Loading state for initial load
  if (loading && currentPage === 1) {
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
    // Case 1: User performed a search but no products were found
    if (appliedSearchQuery.trim() !== '') {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-3xl font-light text-gray-900 mb-4">No products found</h2>
            <p className="text-gray-600 mb-8">
              We couldn't find any products matching "{appliedSearchQuery}"
            </p>
            <button
              onClick={clearFilters}
              className="bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-300"
            >
              CLEAR SEARCH
            </button>
          </div>
        </div>
      );
    }
    
    // Case 2: No products exist at all and no search was performed
    if (totalProducts === 0) {
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
    
    // Case 3: Products exist but none match the current filters
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-light text-gray-900 mb-4">No products found</h2>
          <p className="text-gray-600 mb-8">Try adjusting your filters</p>
          <button
            onClick={clearFilters}
            className="bg-gray-900 text-white px-8 py-3 text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors duration-300"
          >
            CLEAR ALL FILTERS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-6 py-20">
          <div className="text-center">
            <h1 className="uppercase text-4xl md:text-6xl font-light text-gray-900 mb-6 tracking-tight">
              MEN'S COLLECTION
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Timeless pieces crafted with precision. Discover our curated selection of essential menswear.
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
          categories={manApparelType}
          onSearchSubmit={handleSearchSubmit}
          onKeyDown={handleKeyDown}
        />
        
        {/* Products Grid Component */}
        <ProductsGrid products={processedProducts} clearFilters={clearFilters} />
        
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

export default ManApparel;