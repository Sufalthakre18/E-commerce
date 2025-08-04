import { useState, useMemo } from 'react';
import { Product } from '@/lib/api/products';

export default function useProductFiltering(initialProducts: Product[]) {
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(2000);

  const filteredAndSortedProducts = useMemo(() => {
    let result = initialProducts;

    // Filter by price
    if (maxPrice < 2000) {
      result = result.filter(p => p.price <= maxPrice);
    }

    // Sort products
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [initialProducts, sortBy, maxPrice]);

  return {
    filteredAndSortedProducts,
    sortBy,
    setSortBy,
    maxPrice,
    setMaxPrice,
  };
}