'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

// Product interface based on API response
interface Product {
  id: string;
  name: string;
  type: string | null;
  images: { url: string }[];
  category: {
    parent: {
      name: string;
    };
  };
}

// Category item interface
interface CategoryItem {
  id: string;
  title: string;
  defaultImage: string;
  hoverImage: string;
  links: {
    single?: {
      url: string;
      label: string;
    };
    second?: {
      url: string;
      label: string;
    };
  };
}

const CategoryCard = memo(function CategoryCard({
  item,
  isActive,
  onHover,
  onLeave,
}: {
  item: CategoryItem;
  isActive: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false);
  
  return (
    <div
      className="category-row-item group/category-row-item relative aspect-[0.7] overflow-hidden rounded-3xl flex-shrink-0 cursor-pointer"
      style={{ width: '259.929px' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
    >
      {/* Images */}
      <div className="relative w-full h-full">
        <Image
          alt={item.title}
          src={item.defaultImage}
          fill
          sizes="(max-width: 600px) 100vw, 251px"
          className="w-full h-full object-cover transition-transform duration-400 ease-out"
          placeholder="blur"
          blurDataURL="/placeholder.jpg"
          onLoadingComplete={() => setImageLoaded(true)}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
          }}
          unoptimized={false}
        />
        <Image
          alt={`${item.title} hover`}
          src={item.hoverImage}
          fill
          sizes="(max-width: 600px) 100vw, 251px"
          className="category-row-item-hover-image absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ease-out"
          placeholder="blur"
          blurDataURL="/placeholder.jpg"
          onLoadingComplete={() => setHoverImageLoaded(true)}
          style={{
            opacity: isActive && hoverImageLoaded ? 1 : 0,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))',
          }}
          unoptimized={false}
        />
      </div>
      
      {/* Overlay */}
      <div
        className="pointer-events-none absolute z-10 inset-0 transition-all duration-400 ease-out"
        style={{
          background: isActive
            ? 'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.25), transparent)'
            : 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2), transparent)',
        }}
      />
      
      {/* Content */}
      <div
        className="absolute inset-0 z-20 m-auto flex h-fit w-fit flex-col items-center justify-center gap-4 transition-transform duration-400 ease-out"
        style={{
          transform: isActive ? 'translate(0px, 0px)' : 'translate(0%, 30%)',
        }}
      >
        {/* Title */}
        <h2
          className="category-row-item-title btn btn-outline-white pointer-events-none px-6 py-2 text-sm font-light tracking-[0.2em] uppercase rounded-full border transition-all duration-400 ease-out"
          style={{
            borderColor: isActive ? 'transparent' : 'rgb(255, 255, 255)',
            color: 'white',
          }}
        >
          {item.links.second?.label}
        </h2>
        
        {/* CTA Buttons */}
        <div
          className="category-row-item-cta-buttons m-auto flex flex-col items-center justify-center gap-2 w-full max-w-[200px] transition-opacity duration-400 ease-out"
          style={{ opacity: isActive ? 1 : 0 }}
        >
          {item.links.single && (
            <Link
              href={`${item.links.single.url}`}
              className="category-row-item-cta-button btn btn-outline-white w-full px-4 py-2 text-sm font-light tracking-[0.15em] uppercase rounded-full border border-white text-white hover:bg-amber-200 hover:text-gray-900 hover:border-amber-200 transition-all duration-400 ease-out"
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              aria-label={`Shop ${item.links.single.label}`}
            >
              {item.links.single.label}
            </Link>
          )}
          {item.links.second && (
            <Link
              href={item.links.second.url}
              className="category-row-item-cta-button btn btn-outline-white w-full px-4 py-2 text-sm font-light tracking-[0.15em] uppercase rounded-full border border-white/20 text-white bg-white/10 backdrop-blur-sm hover:bg-amber-200 hover:text-gray-900 hover:border-amber-200 transition-all duration-400 ease-out"
              style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              aria-label={`Shop ${item.links.second.label}`}
            >
              {item.links.second.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
});

export default function CategoryRow() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // List of categories to randomly select from
  const categoriesList = useMemo(() => [
    "EduCore", "Home", "Creative & Business", "Apparel"
  ], []);
  
  // Fetch featured products from API with random category
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        // Select a random category from the list
        const randomCategory = categoriesList[Math.floor(Math.random() * categoriesList.length)];
        setSelectedCategory(randomCategory);
        console.log(`Selected category: ${randomCategory}`);
        
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/products/featured?category=${randomCategory}`, { responseType: 'json' });
        if (data?.data) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch featured products:', error);
        // Fallback to empty array on error
        setProducts([]);
      }
    };
    
    fetchFeaturedProducts();
  }, [categoriesList]);
  
  // Map products to CategoryItem
  const categories = useMemo<CategoryItem[]>(() => {
    return products.map((product) => ({
      id: product.id,
      title: product.name,
      defaultImage: product.images[0]?.url || '/placeholder.jpg',
      hoverImage: product.images[1]?.url || product.images[0]?.url || '/placeholder.jpg',
      links: {
        single: {
          url: `/${product.category.parent.name.toLowerCase()}`,
          label: product.category.parent.name,
        },
        second: product.type
          ? {
            url: `/products/${product.id}`,
            label: product.type,
          }
          : undefined,
      },
    }));
  }, [products]);
  
  // Intersection Observer for animations
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);
  
  // Optimized scroll handler with throttling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Set a new timeout to update the index after scrolling stops
      scrollTimeoutRef.current = setTimeout(() => {
        const scrollLeft = container.scrollLeft;
        const itemWidth = 251.429 + 10; // width + margin
        const newIndex = Math.round(scrollLeft / itemWidth);
        setCurrentIndex(Math.max(0, Math.min(newIndex, categories.length - 1)));
      }, 100); // Throttle to 100ms
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [categories.length]);
  
  // Set middle item as active on mount
  useEffect(() => {
    if (categories.length > 0) {
      setActiveIndex(Math.floor(categories.length / 2));
    }
  }, [categories.length]);
  
  // Scroll to center the active item
  useEffect(() => {
    if (activeIndex === null || !containerRef.current) return;
    
    const container = containerRef.current;
    const itemWidth = 251.429 + 10; // width + margin
    const scrollPosition = activeIndex * itemWidth - (container.clientWidth - itemWidth) / 2;
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }, [activeIndex]);
  
  return (
    <>
      <section
        className="relative overflow-hidden px-8 py-20 md:px-12 md:py-24 bg-gradient-to-b from-stone-100 to-stone-200 text-white transition-opacity duration-1000"
        style={{
          opacity: isInView ? 1 : 0,
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        <div className="flex justify-between items-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase text-black">
            Bestsellers & New Arrivals
          </h2>
          
        </div>
        
        <div className="relative block">
          <div
            ref={containerRef}
            className="flex gap-2.5 overflow-x-auto scroll-smooth scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              willChange: 'scroll-position',
              transform: 'translateZ(0)', // Hardware acceleration
            }}
          >
            {categories.map((item, index) => (
              <div
                key={item.id}
                style={{
                  scrollSnapAlign: 'center',
                  scrollSnapStop: 'always',
                }}
              >
                <CategoryCard
                  item={item}
                  isActive={activeIndex === index}
                  onHover={() => setActiveIndex(index)}
                  onLeave={() => {
                    if (index !== currentIndex) {
                      setActiveIndex(null);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Custom styles */}
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 400;
            text-align: center;
            vertical-align: middle;
            user-select: none;
            border: 1px solid transparent;
            transition: all 0.4s ease-out;
            text-decoration: none;
          }
          .btn-outline-white {
            color: white;
            border-color: white;
            background-color: transparent;
          }
          .btn-outline-white:hover {
            color: #1f2937;
            background-color: #f5e7d2;
            border-color: #f5e7d2;
          }
        `}</style>
      </section>
      
      <section className="py-10 md:py-12 lg:py-16 from-stone-200 to-[#E0DED9] bg-gradient-to-b">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
          {/* Minimal Heading */}
          <h2 className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase text-black mb-12 md:mb-16">
            Newsletter
          </h2>
   
          <div className="mb-12 md:mb-16">
            <p className="text-sm md:text-base text-black/70 font-light mb-12 lg:mb-16 leading-relaxed max-w-2xl mx-auto tracking-wide">
              Receive thoughtful updates about new arrivals, seasonal releases, and our approach to craftsmanship.
            </p>
          </div>
          
          <div className="flex justify-center items-center space-x-12 md:space-x-16">
            {[
              { name: 'INSTAGRAM', href: 'https://instagram.com' },
              { name: 'FACEBOOK', href: 'https://facebook.com' },
              { name: 'YOUTUBE', href: 'https://youtube.com' }
            ].map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs tracking-[0.15em] text-black/60 font-bold hover:text-black active:text-black transition-colors duration-300"
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

