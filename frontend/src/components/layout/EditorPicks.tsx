
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper'; // Adjust path as needed
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  description?: string;
}

interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[];
  category: {
    name: string;
    parent: {
      name: string;
    };
  };
}

const ProductCard = React.memo(
  ({ product, index, onTouch, isTouched, isMobile }: {
    product: Product;
    index: number;
    onTouch: (id: string) => void;
    isTouched: boolean;
    isMobile: boolean;
  }) => (
    <div
      className={`group flex-none w-72 sm:w-80 snap-center transition-transform duration-300 will-change-transform ${
        isMobile && isTouched ? 'scale-105' : ''
      }`}
      onClick={() => onTouch(product.id)}
      onTouchStart={() => isMobile && onTouch(product.id)}
    >
      <div className="relative h-96 overflow-hidden bg-gray-900 rounded-lg shadow-xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`object-cover transition-transform duration-500 will-change-transform ${
            isMobile ? (isTouched ? 'scale-110' : '') : 'group-hover:scale-110'
          }`}
          priority={index < 2}
          sizes="(max-width: 640px) 288px, 320px"
          quality={85}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/10 to-transparent transition-opacity duration-300 ${
            isMobile ? (isTouched ? 'from-black/90' : '') : 'group-hover:from-black/90'
          }`}
        />
        <div className="absolute top-4 right-4">
          <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 text-sm font-medium rounded">
            {product.price}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3
            className={`text-xl font-light text-white mb-2 transition-colors duration-300 ${
              isMobile && isTouched ? 'text-green-300' : ''
            }`}
          >
            {product.name}
          </h3>
          <p className="text-gray-300 text-sm mb-4">{product.description}</p>
          <div
            className={`transition-all duration-300 ${
              isMobile
                ? isTouched
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
                : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
            }`}
          > 
          <Link href={`/products/${product.id}`} key={product.id}>
            <button className="w-auto text-white py-2 px-4 text-sm font-medium uppercase hover:text-zinc-700 hover:cursor-pointer transition-colors duration-200">
              <ShoppingBag className="inline mr-2 h-4 w-4" />
              Add to Wardrobe
            </button></Link>
          </div>
        </div>
      </div>
    </div>
  ),
);
ProductCard.displayName = 'ProductCard';

const EditorsPicks: React.FC<{ category?: string; newClass?:string }> = ({ category = 'Apparel',newClass='bg-slate-900' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [touchedElements, setTouchedElements] = useState<{ [key: string]: boolean }>({});
  const [inView, setInView] = useState<{ [key: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView((prev) => ({ ...prev, [entry.target.id]: true }));
            observer.current?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    const elements = document.querySelectorAll('[data-animate-featured]');
    elements.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/products`);
        const apiProducts: ApiProduct[] = data.products || [];

        // Filter by category (parent.name === category prop)
        const filtered = apiProducts.filter(
          (p) => p.category.parent?.name === category
        );

        // Shuffle and pick random 5 (or all if less)
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 5);

        // Map to Product interface
        const mapped: Product[] = selected.map((p) => ({
          id: p.id,
          name: p.name,
          price: `₹${p.price}`,
          image: p.images[0]?.url || 'https://via.placeholder.com/600x800',
          category: p.category.name,
          description: p.description.split('\r\n')[0].trim(),
        }));

        setProducts(mapped);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  const handleTouch = useCallback((elementId: string) => {
    if (isMobile) {
      setTouchedElements((prev) => ({ ...prev, [elementId]: !prev[elementId] }));
    }
  }, [isMobile]);

  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  }, []);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  return (
    <section className="relative py-20 md:py-24 overflow-hidden">
      <div className={`absolute inset-0 z-0 ${newClass}`} />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div
          id="featured-header"
          data-animate-featured
          className={`text-center mb-16 transition-all duration-700 ease-out ${
            inView['featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-widest text-white mb-4">
            EDITOR'S PICKS
          </h2>
          
        </div>
        <div
          id="featured-products"
          data-animate-featured
          className={`transition-all duration-700 ease-out delay-200 ${
            inView['featured-products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {loading ? (
            <div className="text-center text-white py-12">Loading Editor's Picks...</div>
          ) : products.length === 0 ? (
            <div className="text-center text-white py-12">No products available</div>
          ) : (
            <>
              <div className="hidden lg:block relative">
                <div
                  ref={scrollContainerRef}
                  className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
                >
                  <div className="flex-none w-6" />
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      onTouch={handleTouch}
                      isTouched={touchedElements[product.id]}
                      isMobile={isMobile}
                    />
                  ))}
                  <div className="flex-none w-6" />
                </div>
                <button
                  onClick={scrollLeft}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                  aria-label="Scroll left"
                >
                  <ChevronRight className="h-6 w-6 rotate-180" />
                </button>
                <button
                  onClick={scrollRight}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-6 w-4" />
                </button>
              </div>
              <div className="lg:hidden">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                  <div className="flex-none w-6" />
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      onTouch={handleTouch}
                      isTouched={touchedElements[product.id]}
                      isMobile={isMobile}
                    />
                  ))}
                  <div className="flex-none w-6" />
                </div>
              </div>
              
            </>
          )}
        </div>
        
      </div>
    </section>
  );
};

export default EditorsPicks;
