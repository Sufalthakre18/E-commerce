'use client';

import Image from 'next/image';
import Link from 'next/link';

export function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-red-600 dark:border-red-600">
        <div className="w-full h-48 overflow-hidden">
          <Image
            src={
              product.images[0]?.url ||
              'https://res.cloudinary.com/diwncnwls/image/upload/v1743091600/cld-sample-5.jpg'
            }
            alt={product.name}
            width={300}
            height={300}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-4 bg-slate-600">
          <h5 className="text- font-semibold text-white dark:text-red truncate">
            {product.name}
          </h5>
          <p className="mt-1 text-gray-200 text-5xl  dark:text-gray-400">
            ₹{product.price}
          </p>
        </div>
      </div>
    </Link>
  );
}
