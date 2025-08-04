'use client';

import { FC } from 'react';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: { url: string }[];
  category: { name: string };
}

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}




export const ProductList: FC<ProductListProps> = ({ products, isLoading }) => {
  if (isLoading) return <p>Loading...</p>;
  if (!products || products.length === 0) return <p>No products found.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <Link
          href={`/products/${product.id}`}
          key={product.id}
          className="border rounded-lg p-4 shadow-sm hover:shadow-md transition block"
        >
          <img
            src={product.images?.[0]?.url}
            alt={product.name}
            className="h-40 w-full object-cover rounded mb-2"
          />
          <h3 className="font-semibold">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category?.name}</p>
          <p className="text-lg font-bold">₹{product.price}</p>
        </Link>
      ))}
    </div>
  );
};
