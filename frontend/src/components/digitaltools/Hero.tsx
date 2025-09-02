'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronRight, ArrowRight, Download, Sparkles } from 'lucide-react';

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
  type?: string;
}

// Memoized components
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
    <div className="relative h-96 overflow-hidden bg-white rounded-sm shadow-sm border border-gray-200">
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity duration-300 ${
        isMobile ? (isTouched ? 'from-black/60' : '') : 'group-hover:from-black/60'
      }`} />
      
      {/* Price badge */}
      <div className="absolute top-4 right-4">
        <div className="bg-white text-black px-3 py-1 text-sm font-medium rounded-sm border border-gray-300">
          {product.price}
        </div>
      </div>

      {/* Type badge */}
      <div className="absolute top-4 left-4">
        <div className="bg-black text-white px-2 py-1 text-xs font-medium rounded-sm">
          {product.type}
        </div>
      </div>

      {/* Product info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className={`text-xl font-medium text-white mb-2 transition-colors duration-300 ${
          isMobile && isTouched ? 'text-gray-200' : ''
        }`}>
          {product.name}
        </h3>
        <p className="text-gray-200 text-sm mb-4">{product.description}</p>
        
        <div className={`transition-all duration-300 ${
          isMobile ? (isTouched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
        }`}>
          <button className="w-auto bg-white text-black py-2 px-4 text-xs font-medium uppercase hover:bg-gray-100 transition-all duration-200 rounded-sm">
            <Download className="inline-block mr-2 h-4 w-4" />
            Instant Access
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
        <p className="text-gray-600 text-sm">Elevate your creative projects</p>
      </div>
      <button
        className="group mt-4 md:mt-0 flex items-center text-gray-900 hover:text-black transition-colors duration-200"
        onClick={() => onCategoryClick(category.id)}
      >
        <span className="text-sm uppercase mr-2 tracking-widest">Explore All</span>
        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
        className="group cursor-pointer relative h-80 lg:h-96 overflow-hidden bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300 rounded-sm"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/70 transition-all duration-300" />
        
        <div className="absolute top-6 left-6">
          <div className="bg-white px-4 py-2 text-xs text-black uppercase font-medium rounded-sm border border-gray-300 flex items-center gap-1">
            {category.name}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
            <span className="text-base font-light mr-3 tracking-widest">DISCOVER {category.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory, subIndex) => (
          <div
            key={subIndex}
            className="group cursor-pointer bg-white p-6 hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-200 rounded-sm border border-gray-200 hover:border-gray-400 hover:shadow-sm"
            onClick={() => onCategoryClick(category.id)}
          >
            <div className="text-center">
              <div className="w-10 h-10 bg-black rounded-sm mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white text-sm font-medium">
                  {subcategory.charAt(0)}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 group-hover:text-black transition-colors duration-200">
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

const CreativeBussinessPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('design-assets');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [touchedElements, setTouchedElements] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mobile detection
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

  // Touch handler
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

  // Category click handler
  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  // Intersection observer
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

  // Memoized data
  const categories: Category[] = useMemo(() => [
    {
      id: 'design-assets',
      name: 'Design Assets & Mockups',
      subcategories: ['Vectors', 'Icons', 'Mockups', 'Patterns', 'Textures', 'Fonts'],
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'templates',
      name: 'Templates & Marketing Kits',
      subcategories: ['Website Templates', 'Email Templates', 'Social Media Kits', 'Presentation Templates', 'Brochures'],
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    },
    {
      id: 'audio-media',
      name: 'Audio & Media Packs',
      subcategories: ['Sound Effects', 'Music Tracks', 'Stock Video', 'Animations', 'Podcast Kits'],
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      featured: true
    }
  ], []);

  const featuredProducts: Product[] = useMemo(() => [
    {
      id: 'asset-1',
      name: 'Premium Vector Pack',
      price: '$29',
      originalPrice: '$49',
      description: 'Versatile design elements',
      category: 'design-assets',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      badge: 'Popular',
      type: 'Design'
    },
    {
      id: 'template-1',
      name: 'Marketing Kit Pro',
      price: '$39',
      originalPrice: '$59',
      description: 'Complete branding suite',
      category: 'templates',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      badge: 'Premium',
      type: 'Marketing'
    },
    {
      id: 'audio-1',
      name: 'Sound Effects Bundle',
      price: '$19',
      originalPrice: '$29',
      description: 'High-quality audio assets',
      category: 'audio-media',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      badge: 'Essential',
      type: 'Audio'
    },
    {
      id: 'mockup-1',
      name: 'Device Mockup Set',
      price: '$25',
      originalPrice: '$35',
      description: 'Realistic presentations',
      category: 'design-assets',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      badge: 'Modern',
      type: 'Design'
    },
    {
      id: 'video-1',
      name: 'Stock Video Pack',
      price: '$49',
      originalPrice: '$69',
      description: '4K media collection',
      category: 'audio-media',
      image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
      badge: 'Pro',
      type: 'Media'
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
            src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80"
            alt="Creative digital tools background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            quality={90}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/40 to-black/70" />
        </div>

        <div
          id="hero-content"
          data-animate
          className={`relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-800 ease-out ${
            isVisible['hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-widest mb-8 text-white leading-tight">
            UNLEASH
            <span className="block font-normal mt-2 text-white">YOUR CREATIVITY</span>
          </h1>
          <p className="text-lg md:text-xl font-light tracking-wider text-gray-200 mb-8 max-w-2xl mx-auto">
            Premium digital tools for designers and creators
          </p>
          <p className="text-sm text-gray-300 tracking-widest mb-12">INSPIRE YOUR NEXT PROJECT</p>
          <button className="group bg-black text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-gray-800 transition-all duration-300 flex items-center mx-auto rounded-sm">
            <span>Start Creating</span>
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
              BROWSE CATEGORIES
            </h2>
            <p className="text-gray-600 text-base tracking-wider font-light">
              Find the perfect digital assets for your needs
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
                  isVisible={isVisible[`category-section-${category.id}`] || false}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-gray-50">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="featured-header"
            data-animate
            className={`text-center mb-16 transition-all duration-700 ease-out ${
              isVisible['featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-gray-900 mb-4">
              FEATURED TOOLS
            </h2>
            <p className="text-gray-600 text-base tracking-wider font-light">
              Curated digital assets to boost your creativity
            </p>
          </div>

          <div
            id="featured-products"
            data-animate
            className={`transition-all duration-700 ease-out delay-200 ${
              isVisible['featured-products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
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
                    isTouched={touchedElements[product.id] || false}
                    isMobile={isMobile}
                  />
                ))}
                <div className="flex-none w-6" />
              </div>
              
              <button
                onClick={scrollLeft}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-black w-12 h-12 rounded-sm flex items-center justify-center shadow-sm transition-all duration-200 border border-gray-300"
                aria-label="Scroll left"
              >
                <ChevronRight className="h-6 w-6 rotate-180" />
              </button>
              
              <button
                onClick={scrollRight}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white hover:bg-gray-100 text-black w-12 h-12 rounded-sm flex items-center justify-center shadow-sm transition-all duration-200 border border-gray-300"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="lg:hidden">
              <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                <div className="flex-none w-6" />
                {featuredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onTouch={handleTouch}
                    isTouched={touchedElements[product.id] || false}
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
            <button className="bg-black text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-gray-800 transition-all duration-300 rounded-sm flex items-center mx-auto gap-2">
              Explore All Tools
            </button>
          </div>
        </div>
      </section>

      {/* Styles */}
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

export default CreativeBussinessPage;