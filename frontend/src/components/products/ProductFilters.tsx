'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');

  // Handle typing delay (debounce)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) {
        params.set('search', search);
      } else {
        params.delete('search');
      }
      router.push(`/products?${params.toString()}`);
    }, 500); // 500ms delay

    return () => clearTimeout(timeout);
  }, [search]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', e.target.value);
    router.push(`/products?${params.toString()}`);
  };

  const handleInStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.checked) {
      params.set('inStockOnly', 'true');
    } else {
      params.delete('inStockOnly');
    }
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* 🔍 Search */}
      <div>
        <label className="block mb-1 text-sm font-medium">Search</label>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {/* ✅ In Stock Filter */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="inStockOnly"
          onChange={handleInStockChange}
          checked={searchParams.get('inStockOnly') === 'true'}
        />
        <label htmlFor="inStockOnly" className="text-sm">
          In Stock Only
        </label>
      </div>

      {/* ↕️ Sort */}
      <div>
        <label className="block mb-1 text-sm font-medium">Sort By</label>
        <select
          onChange={handleSortChange}
          defaultValue={searchParams.get('sort') || ''}
          className="w-full border rounded px-2 py-1"
        >
          <option value="">Default</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}
