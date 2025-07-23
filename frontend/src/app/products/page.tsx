'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { ProductList } from '@/components/products/ProductList';
import ProductFilters from '@/components/products/ProductFilters';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const sort = searchParams.get('sort');

  const { data, isLoading } = useQuery({
    queryKey: ['products', query],
    queryFn: () =>
      fetch(`http://localhost:5000/api/products?${query}`).then((res) =>
        res.json()
      ),
  });

  const sortedProducts = useMemo(() => {
    const products = data?.products || [];

    if (sort === 'price-asc') {
      return [...products].sort((a, b) => a.price - b.price);
    }

    if (sort === 'price-desc') {
      return [...products].sort((a, b) => b.price - a.price);
    }

    if (sort === 'newest') {
      return [...products].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return products;
  }, [data?.products, sort]);

  return (
    <div className="grid md:grid-cols-[250px_1fr] gap-4">
      <ProductFilters />
      <ProductList products={sortedProducts} isLoading={isLoading} />
    </div>
  );
}
