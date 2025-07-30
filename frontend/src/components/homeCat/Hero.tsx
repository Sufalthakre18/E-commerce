'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronRight, ArrowRight, Home, Sparkles,ShoppingBagIcon } from 'lucide-react';


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
  room?: string;
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
    className={`group  flex-none w-72 sm:w-80 snap-center transition-transform duration-300 will-change-transform ${
      isMobile && isTouched ? 'scale-105' : ''
    }`}
    onClick={() => onTouch(product.id)}
    onTouchStart={() => isMobile && onTouch(product.id)}
  >
    <div className="relative h-96 overflow-hidden bg-white rounded-lg shadow-xl border border-amber-100">
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
      <div className={`absolute inset-0 bg-gradient-to-t from-amber-900/80 to-transparent transition-opacity duration-300 ${
        isMobile ? (isTouched ? 'from-amber-900/90' : '') : 'group-hover:from-amber-900/90'
      }`} />
      
      {/* Price badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-amber-600 text-white px-3 py-1 text-sm font-medium rounded-lg shadow-lg">
          {product.price}
        </div>
      </div>

      {/* Room badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-amber-800 text-white px-2 py-1 text-xs font-medium rounded-lg">
          {product.room}
        </div>
      </div>

      {/* Product info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className={`text-xl font-medium text-white mb-2 transition-colors duration-300 ${
          isMobile && isTouched ? 'text-amber-200' : ''
        }`}>
          {product.name}
        </h3>
        <p className="text-amber-100 text-sm mb-4">{product.description}</p>
        
        <div className={`transition-all duration-300 ${
          isMobile ? (isTouched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
        }`}>
          <button className="w-auto  text-white py-2 px-4 text-sm font-medium uppercase hover:cursor-pointer hover:text-gray-400 transition-all duration-200 rounded-lg shadow-lg">
            <ShoppingBagIcon className="inline-block mr-2 h-4 w-4 " />
            
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
    className={`transition-all duration-500 ease-out will-change-transform ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}
    style={{ transitionDelay: `${index * 100}ms` }}
  >
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
      <div>
        <h3 className="text-2xl md:text-3xl font-light tracking-wider text-gray-900 mb-2 flex items-center gap-2">
          {category.name.toUpperCase()}
          <Sparkles className="h-6 w-6 text-amber-500" />
        </h3>
        <p className="text-gray-600 text-sm">Transform your space</p>
      </div>
      <button
        className="group mt-4 md:mt-0 flex items-center text-gray-900 hover:text-amber-600 transition-colors duration-200"
        onClick={() => onCategoryClick(category.id)}
      >
        <span className="text-sm uppercase mr-2">Shop All</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
        className="group cursor-pointer relative h-80 lg:h-96 overflow-hidden bg-amber-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
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
        <div className="absolute inset-0 bg-gradient-to-t from-amber-900/70 to-transparent group-hover:from-amber-900/80 transition-all duration-300" />
        
        <div className="absolute top-6 left-6">
          <div className="bg-amber-600 px-4 py-2 text-xs text-white uppercase font-medium rounded-lg shadow-lg flex items-center gap-1">
            <Home className="h-3 w-3" />
            {category.name}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
            <span className="text-base font-light mr-3">SHOP {category.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory, subIndex) => (
          <div
            key={subIndex}
            className="group cursor-pointer bg-white p-6 hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-200 rounded-lg border border-amber-100 hover:border-amber-300 hover:shadow-md"
            onClick={() => onCategoryClick(category.id)}
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-amber-600 rounded-lg mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white text-sm font-medium">
                  {subcategory.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-amber-700 transition-colors duration-200">
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

const HomeLandingPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('living-room');
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

  // Memoized data with home categories
  const categories: Category[] = useMemo(() => [
    {
      id: 'living-room',
      name: 'Living Room',
      subcategories: ['Sofas', 'Coffee Tables', 'Rugs', 'Lighting', 'Decor', 'Storage'],
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'bedroom',
      name: 'Bedroom',
      subcategories: ['Bedding', 'Pillows', 'Throws', 'Furniture', 'Lighting'],
      image: 'https://images.unsplash.com/photo-1540518614846-7eded1432cc6?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    }
  ], []);

  const featuredProducts: Product[] = useMemo(() => [
    {
      id: 'sofa-1',
      name: 'Modern Sectional',
      price: '$1,299',
      originalPrice: '$1,599',
      description: 'Comfort Meets Style',
      category: 'living-room',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Popular',
      room: 'Living'
    },
    {
      id: 'bedding-1',
      name: 'Luxury Bedding Set',
      price: '$149',
      originalPrice: '$199',
      description: 'Egyptian Cotton',
      category: 'bedroom',
      image: 'https://images.unsplash.com/photo-1540518614846-7eded1432cc6?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Premium',
      room: 'Bedroom'
    },
    {
      id: 'table-1',
      name: 'Oak Coffee Table',
      price: '$389',
      originalPrice: '$499',
      description: 'Handcrafted Wood',
      category: 'living-room',
      image: 'https://images.unsplash.com/photo-1586373986071-4b32c7d82fd2?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Artisan',
      room: 'Living'
    },
    {
      id: 'lighting-1',
      name: 'Designer Floor Lamp',
      price: '$225',
      originalPrice: '$295',
      description: 'Ambient Lighting',
      category: 'bedroom',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Modern',
      room: 'Bedroom'
    },
    {
      id: 'rug-1',
      name: 'Persian Area Rug',
      price: '$449',
      originalPrice: '$599',
      description: 'Hand-Woven',
      category: 'living-room',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Heritage',
      room: 'Living'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-amber-50 text-gray-900">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop&auto=format&q=80"
            alt="Beautiful modern home interior"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-amber-900/40 to-amber-900/70" />
        </div>

        <div
          id="hero-content"
          data-animate
          className={`relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-800 ease-out ${
            isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-widest mb-8 text-white leading-tight">
            TRANSFORM
            <span className="block font-normal mt-2 bg-gradient-to-r from-amber-200 to-amber-400 bg-clip-text text-transparent">YOUR SPACE</span>
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wider text-amber-100 mb-8 max-w-2xl mx-auto">
            Create the home of your dreams with our curated collection
          </p>
          <p className="text-sm text-amber-200 tracking-widest mb-12">✨ DESIGNED FOR LIVING ✨</p>
          <button className="group bg-amber-600 text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-amber-700 transition-all duration-300 flex items-center mx-auto rounded-lg shadow-lg hover:shadow-amber-600/25">
            <Home className="mr-2 h-4 w-4" />
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
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-gray-900 mb-3 flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-amber-500" />
              SHOP BY ROOM
              <Sparkles className="h-8 w-8 text-amber-500" />
            </h2>
            <p className="text-gray-600 text-base tracking-wider font-light">
              Discover furniture and decor for every space
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
        <div className="absolute inset-0 z-0 bg-amber-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="featured-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ease-out ${
              isVisible['featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-white mb-4 flex items-center justify-center gap-3">
              <Home className="h-8 w-8 text-amber-300" />
              FEATURED COLLECTION
              <Home className="h-8 w-8 text-amber-300" />
            </h2>
            <p className="text-amber-200 text-base tracking-wider font-light">
              Handpicked pieces to elevate your home
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-amber-200 hover:bg-amber-300 text-amber-800 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="Scroll left"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </button>
              
              <button
                onClick={scrollRight}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-amber-200 hover:bg-amber-300 text-amber-800 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
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
            <button className="bg-amber-200 text-amber-900 px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-amber-300 transition-all duration-300 rounded-lg shadow-lg hover:shadow-amber-200/25 flex items-center mx-auto gap-2">
              <Sparkles className="h-4 w-4" />
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

export default HomeLandingPage;