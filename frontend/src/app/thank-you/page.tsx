'use client';

import Link from 'next/link';
import { Bebas_Neue, Source_Sans_3 } from 'next/font/google';

const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['400'], variable: '--font-source-sans' });
const bebasNeue = Bebas_Neue({subsets: ['latin-ext'],weight: '400'});

export default function ThankYou() {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-gray-100 to-white flex items-center justify-center p-4 ${sourceSans.className}`}>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-sm w-full text-center">
        <h1 className={`${bebasNeue.className} text-2xl font-semibold text-gray-800 mb-3`}>Thank You!</h1>
        <p className="text-gray-600 text-sm mb-5">Order placed successfully.</p>
        <div className="flex justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-md transition-all duration-150 hover:bg-purple-50 hover:text-purple-500 active:bg-purple-100 active:text-purple-500"
            data-formignore="true"
          >
            Home
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-md transition-all duration-150 hover:bg-purple-50 hover:text-purple-500 active:bg-purple-100 active:text-purple-500"
            data-formignore="true"
          >
            My Orders
          </Link>
        </div>
      </div>
    </div>
  );
}