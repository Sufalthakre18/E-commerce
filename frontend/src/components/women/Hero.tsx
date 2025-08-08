'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronRight, ArrowRight, ShoppingBagIcon } from 'lucide-react';

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
    className={`group cursor-pointer flex-none w-72 sm:w-80 snap-center transition-transform duration-300 will-change-transform ${
      isMobile && isTouched ? 'scale-105' : ''
    }`}
    onClick={() => onTouch(product.id)}
    onTouchStart={() => isMobile && onTouch(product.id)}
  >
    <div className="relative h-96 overflow-hidden bg-white rounded-lg shadow-xl border border-gray-100">
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
        isMobile ? (isTouched ? 'from-black/60' : '') : 'group-hover:from-black/60'
      }`} />
      
      {/* Price badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-red-700 text-white px-3 py-1 text-sm font-medium rounded-full shadow-lg">
          {product.price}
        </div>
      </div>

      {/* Product info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className={`text-xl font-light text-white mb-2 transition-colors duration-300 ${
          isMobile && isTouched ? 'text-red-300' : ''
        }`}>
          {product.name}
        </h3>
        <p className="text-gray-100 text-sm mb-4">{product.description}</p>
        
        <div className={`transition-all duration-300 ${
          isMobile ? (isTouched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
        }`}>
          <button className="w-auto  text-white py-2 px-4 text-sm font-medium uppercase hover:bg-red-600 transition-all duration-200 rounded-lg shadow-lg">
            <ShoppingBagIcon className="inline-block mr-2 h-4 w-4" />
            
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
        <h3 className="text-2xl md:text-3xl font-light tracking-wider text-gray-900 mb-2">
          {category.name.toUpperCase()}
        </h3>
        <p className="text-gray-600 text-sm">Curated collection</p>
      </div>
      <button
        className="group mt-4 md:mt-0 flex items-center text-gray-900 hover:text-red-700 transition-colors duration-200"
        onClick={() => onCategoryClick(category.id)}
      >
        <span className="text-sm uppercase mr-2">Shop All</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
        className="group cursor-pointer relative h-80 lg:h-96 overflow-hidden bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent group-hover:from-red-800/90 transition-all duration-300" />
        
        <div className="absolute top-6 left-6">
          <div className="bg-red-700 px-4 py-2 text-xs text-white uppercase font-medium rounded-full shadow-lg">
            {category.name}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
            <span className="text-base font-light mr-3">DISCOVER {category.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory, subIndex) => (
          <div
            key={subIndex}
            className="group cursor-pointer bg-white p-6 hover:bg-red-50 transform hover:-translate-y-1 transition-all duration-200 rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md"
            onClick={() => onCategoryClick(category.id)}
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-red-700 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <span className="text-white text-sm font-medium">
                  {subcategory.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-red-800 transition-colors duration-200">
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

const WomensLandingPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('clothing');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [touchedElements, setTouchedElements] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // mobile detection
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

  // touch handler
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

  // category click handler
  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  // intersection observer
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

  // Memoized data with women's categories
  const categories: Category[] = useMemo(() => [
    {
      id: 'clothing',
      name: 'Clothing',
      subcategories: ['Dresses', 'Tops & Blouses', 'Jeans', 'Pants', 'Skirts', 'Jackets', 'Coats', 'Knitwear', 'Activewear', 'Loungewear'],
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'shoes',
      name: 'Footwear',
      subcategories: ['Heels', 'Flats', 'Sneakers', 'Boots', 'Sandals', 'Athletic'],
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'accessories',
      name: 'Accessories',
      subcategories: ['Handbags', 'Jewelry', 'Scarves', 'Sunglasses', 'Belts', 'Watches'],
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    }
  ], []);

  const featuredProducts: Product[] = useMemo(() => [
    {
      id: 'dress-1',
      name: 'Silk Wrap Dress',
      price: '$185',
      originalPrice: '$245',
      description: '100% Silk',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Best Seller'
    },
    {
      id: 'heels-1',
      name: 'Designer Block Heels',
      price: '$295',
      originalPrice: '$395',
      description: 'Italian Leather',
      category: 'shoes',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Limited'
    },
    {
      id: 'blazer-1',
      name: 'Tailored Blazer',
      price: '$425',
      originalPrice: '$565',
      description: 'Wool Blend',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'New'
    },
    {
      id: 'bag-1',
      name: 'Luxury Handbag',
      price: '$795',
      originalPrice: '$995',
      description: 'Genuine Leather',
      category: 'accessories',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Exclusive'
    },
    {
      id: 'cashmere-1',
      name: 'Cashmere Sweater',
      price: '$325',
      originalPrice: '$425',
      description: '100% Cashmere',
      category: 'clothing',
      image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop&auto=format&q=80',
      badge: 'Premium'
    }
  ], []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop&auto=format&q=80"
            alt="Elegant woman in luxury fashion"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b  to-black/85" />
        </div>

        <div
          id="hero-content"
          data-animate
          className={`relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-800 ease-out ${
            isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-widest mb-8 text-white leading-tight">
            LUXURIOUS
            <span className="block font-normal mt-2 bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">SOPHISTICATION</span>
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wider text-gray-100 mb-8 max-w-2xl mx-auto">
            Fashion is the armor to survive the reality of everyday life
          </p>
          <p className="text-sm text-red-300 tracking-widest mb-12">— BILL CUNNINGHAM</p>
          <button className="group bg-red-700 text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-red-800 transition-all duration-300 flex items-center mx-auto rounded-full shadow-lg hover:shadow-red-700/25">
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
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-gray-900 mb-3">
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
        <div className="absolute inset-0 z-0 bg-red-900" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="featured-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ease-out ${
              isVisible['featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-white mb-4">
              FEATURED COLLECTION
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="Scroll left"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </button>
              
              <button
                onClick={scrollRight}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-red-600 hover:bg-red-700 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-105"
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
            <button className="bg-red-600 border-0 text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-red-700 transition-all duration-300 rounded-full shadow-lg hover:shadow-red-700/25">
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

export default WomensLandingPage;