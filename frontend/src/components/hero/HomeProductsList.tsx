'use client';

import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api/products';
import { ProductCard } from '../products/ProductCard';

export function HomeProductList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load products</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {data?.products?.map((product:any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
