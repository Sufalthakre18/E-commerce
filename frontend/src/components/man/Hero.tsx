'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronRight, ArrowRight,ShoppingBag } from 'lucide-react';

//  types
interface Category {
  id: string;
  name: string;
  subcategories: string[];
  image: string;
  featured?: boolean;
}

interface Product {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
  badge?: string;
  originalPrice?: string;
  description?: string;
}

// Memoized components for 
const ProductCard = React.memo(({ product, index, onTouch, isTouched, isMobile }: {
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${
        isMobile ? (isTouched ? 'from-black/90' : '') : 'group-hover:from-black/90'
      }`} />
      
      {/* Price badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 text-sm font-medium rounded">
          {product.price}
        </div>
      </div>

      {/* Product info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className={`text-xl font-light text-white mb-2 transition-colors duration-300 ${
          isMobile && isTouched ? 'text-green-300' : ''
        }`}>
          {product.name}
        </h3>
        <p className="text-gray-300 text-sm mb-4">{product.description}</p>
        
        <div className={`transition-all duration-300 ${
          isMobile ? (isTouched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
        }`}>
          <button className="w-auto   text-white py-2 px-4 text-sm font-medium uppercase hover:text-zinc-700 hover:cursor-pointer  transition-colors duration-200">
            <ShoppingBag className="inline mr-2 h-4 w-4" />
            
          </button>
        </div>
      </div>
    </div>
  </div>
));

ProductCard.displayName = 'ProductCard';

const CategorySection = React.memo(({ category, index, isVisible, onCategoryClick }: {
  category: Category;
  index: number;
  isVisible: boolean;
  onCategoryClick: (id: string) => void;
}) => (
  <div
    className={`transition-all duration-700 ease-out will-change-transform ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}
    style={{ transitionDelay: `${index * 100}ms` }}
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h3 className="text-2xl md:text-3xl font-light tracking-wider text-slate-900 mb-2">
          {category.name.toUpperCase()}
        </h3>
        <p className="text-gray-600 text-sm">Premium collection</p>
      </div>
      <button
        className="group mt-4 md:mt-0 flex items-center text-slate-900 hover:text-gray-700 transition-colors duration-200"
        onClick={() => onCategoryClick(category.id)}
      >
        <span className="text-sm uppercase mr-2">View All</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
        className="group cursor-pointer relative h-80 lg:h-96 overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
        onClick={() => onCategoryClick(category.id)}
      >
        <Image
          src={category.image}
          alt={category.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent group-hover:from-slate-900/70 transition-all duration-300" />
        
        <div className="absolute top-6 left-6">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 text-xs text-slate-900 uppercase font-medium">
            {category.name}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
            <span className="text-base font-light mr-3">EXPLORE {category.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory, subIndex) => (
          <div
            key={subIndex}
            className="group cursor-pointer bg-gray-50 p-6 hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-200"
            onClick={() => onCategoryClick(category.id)}
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-slate-900 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white text-sm font-medium">
                  {subcategory.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-medium text-slate-900 group-hover:text-gray-700 transition-colors duration-200">
                {subcategory}
              </h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

CategorySection.displayName = 'CategorySection';

const MensLandingPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('clothing');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [touchedElements, setTouchedElements] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  //  mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    
    const debouncedResize = debounce(checkMobile, 150);
    window.addEventListener('resize', debouncedResize, { passive: true });
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  // Debounce utility
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }, []);

  //  touch handler
  const handleTouch = useCallback((elementId: string) => {
    if (isMobile) {
      setTouchedElements(prev => ({
        ...prev,
        [elementId]: !prev[elementId]
      }));
    }
  }, [isMobile]);

  // Scroll functions for desktop navigation
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -320,
        behavior: 'smooth'
      });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: 'smooth'
      });
    }
  }, []);

  //  category click handler
  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  //  intersection observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.id]: true
            }));
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // Hero image preloading - simplified since Next.js Image handles this
  useEffect(() => {
    // Image optimization handled by Next.js
  }, []);

  // Memoized data
  const categories: Category[] = useMemo(() => [
    {
      id: 'clothing',
      name: 'Clothing',
      subcategories: ['Shirts', 'Polos', 'Blazers', 'T-Shirts', 'Knitwear', 'Hoodies'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'shoes',
      name: 'Shoes',
      subcategories: ['Dress', 'Sneakers', 'Loafers', 'Boots', 'Athletic', 'Casual'],
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'accessories',
      name: 'Accessories',
      subcategories: ['Watches', 'Belts', 'Wallets', 'Bags', 'Sunglasses', 'Jewelry'],
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    }
  ], []);

  const featuredProducts: Product[] = useMemo(() => [
    {
      id: 'polo-1',
      name: 'Classic Polo Shirt',
      price: '$145',
      originalPrice: '$195',
      description: 'Premium Cotton',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Best Seller'
    },
    {
      id: 'loafers-1',
      name: 'Italian Leather Loafers',
      price: '$425',
      originalPrice: '$550',
      description: 'Handcrafted in Italy',
      category: 'shoes',
      image: 'https://images.unsplash.com/photo-1582897085656-c636d006a246?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Limited'
    },
    {
      id: 'blazer-1',
      name: 'Tailored Wool Blazer',
      price: '$595',
      originalPrice: '$795',
      description: 'Pure Wool',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'New'
    },
    {
      id: 'watch-1',
      name: 'Swiss Chronograph',
      price: '$1,250',
      originalPrice: '$1,650',
      description: 'Swiss Movement',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1548181048-3651619e04d6?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Exclusive'
    },
    {
      id: 'cashmere-1',
      name: 'Cashmere V-Neck',
      price: '$385',
      originalPrice: '$485',
      description: '100% Cashmere',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Premium'
    }
  ], []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop&auto=format&q=80"
            alt="Modern gentleman in luxury fashion"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-slate-900/40 to-slate-900/70" />
        </div>

        <div
          id="hero-content"
          data-animate
          className={`relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-800 ease-out ${
            isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-widest mb-8 text-white leading-tight">
            MODERN
            <span className="block font-normal mt-2">GENTLEMAN</span>
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wider text-gray-200 mb-8 max-w-2xl mx-auto">
            Style is a way to say who you are without speaking
          </p>
          <p className="text-sm text-gray-300 tracking-widest mb-12">— RACHEL ZOE</p>
          <button className="group bg-white text-slate-900 px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-gray-100 transition-all duration-300 flex items-center mx-auto">
            <span>Explore Collection</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="categories-header"
            data-animate
            className={`text-center mb-16 transition-all duration-600 ease-out ${
              isVisible['categories-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-slate-900 mb-3">
              SHOP BY CATEGORY
            </h2>
            <p className="text-gray-600 text-base tracking-wider font-light">
              Discover our curated collections
            </p>
          </div>

          <div className="space-y-20">
            {categories.map((category, index) => (
              <div
                key={category.id}
                id={`category-section-${category.id}`}
                data-animate
              >
                <CategorySection
                  category={category}
                  index={index}
                  isVisible={isVisible[`category-section-${category.id}`]}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="relative py-20 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="featured-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ease-out ${
              isVisible['featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-white mb-4">
              FEATURED PRODUCTS
            </h2>
            <p className="text-gray-300 text-base tracking-wider font-light">
              Handpicked essentials from our premium collections
            </p>
          </div>

          <div
            id="featured-products"
            data-animate
            className={`transition-all duration-700 ease-out delay-200 ${
              isVisible['featured-products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Desktop Horizontal Scroll with Navigation Arrows */}
            <div className="hidden lg:block relative">
              <div 
                ref={scrollContainerRef}
                className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
              >
                <div className="flex-none w-6" />
                {featuredProducts.map((product, index) => (
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
              
              {/* Navigation Arrows */}
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
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile Horizontal Scroll */}
            <div className="lg:hidden">
              <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                <div className="flex-none w-6" />
                {featuredProducts.map((product, index) => (
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
          </div>

          <div
            id="featured-cta"
            data-animate
            className={`text-center mt-16 transition-all duration-600 ease-out delay-400 ${
              isVisible['featured-cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <button className="bg-transparent border border-white/60 text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:border-white hover:bg-white hover:text-slate-900 transition-all duration-300">
              Shop All Products
            </button>
          </div>
        </div>
      </section>

      {/*  Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .snap-x {
          scroll-snap-type: x mandatory;
        }
        .snap-center {
          scroll-snap-align: center;
        }
        .will-change-transform {
          will-change: transform;
        }
        
        /* GPU acceleration for smooth animations */
        .group:hover img {
          transform: scale(1.05) translateZ(0);
        }
      `}</style>
    </div>
  );
};

export default MensLandingPage;