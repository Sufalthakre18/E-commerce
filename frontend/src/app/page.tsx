'use client';

import Hero  from '../components/hero/Hero';
import { HomeProductList } from '../components/hero/HomeProductsList';
import Footer  from '@/components/layout/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <Hero />
      <HomeProductList/>
      <Footer />
    </main>
  );
}