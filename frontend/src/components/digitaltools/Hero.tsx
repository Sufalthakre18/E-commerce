
'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';
import EditorsPicks from '@/components/layout/EditorPicks'; // Adjust path as needed
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  subcategories: string[];
  image: string;
  featured?: boolean;
  href: string;
}

const CategorySection = React.memo(
  ({ category, index, isVisible, onCategoryClick }: {
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
        </div>
        <Link href={category.href}>
        <button
          className="group mt-4 md:mt-0 flex items-center text-gray-900 hover:text-black transition-colors duration-200"
          onClick={() => onCategoryClick(category.id)}
        >
          <span className="text-sm uppercase mr-2 tracking-widest">Discover Collection</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href={category.href}><div
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
            <div className="bg-black px-4 py-2 text-xs text-white uppercase font-medium rounded-sm flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {category.name}
            </div>
          </div>
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
              <span className="text-base font-light mr-3 tracking-widest">EXPLORE {category.name.toUpperCase()}</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
        </Link>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {category.subcategories.map((subcategory, subIndex) => (
            <div
              key={subIndex}
              className="group bg-white p-6 hover:bg-gray-50 transform hover:-translate-y-1 transition-all duration-200 rounded-sm border border-gray-200 hover:border-gray-400 hover:shadow-sm"
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
                <span className="text-xs text-gray-300">choose in filter</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
);
CategorySection.displayName = 'CategorySection';

const CreativeBussinessPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('Creative & Business');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);

  // Enhanced smooth scroll function with easing
  const smoothScroll = useCallback((element: HTMLElement, duration: number = 1200) => {
    const start = window.pageYOffset;
    const target = element.getBoundingClientRect().top + start - 80; // Offset for header
    const distance = target - start;
    let startTime: number | null = null;
    let animationFrameId: number;

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);

      // Easing function (easeInOutCubic)
      const easeInOutCubic = (t: number) => {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      };

      window.scrollTo(0, start + distance * easeInOutCubic(progress));

      if (timeElapsed < duration) {
        animationFrameId = requestAnimationFrame(animation);
      }
    };

    const cancelOnUserScroll = () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('wheel', cancelOnUserScroll);
      window.removeEventListener('touchmove', cancelOnUserScroll);
    };

    window.addEventListener('wheel', cancelOnUserScroll, { passive: true });
    window.addEventListener('touchmove', cancelOnUserScroll, { passive: true });

    animationFrameId = requestAnimationFrame(animation);
  }, []);

  const scrollToCategories = useCallback(() => {
    if (categoriesSectionRef.current) {
      smoothScroll(categoriesSectionRef.current, 1200);
    }
  }, [smoothScroll]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();

    const debouncedResize = debounce(checkMobile, 150);
    window.addEventListener('resize', debouncedResize, { passive: true });
    return () => window.removeEventListener('resize', debouncedResize);
  }, []);

  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({
              ...prev,
              [entry.target.id]: true,
            }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px 0px -50px 0px' }
    );
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const categories: Category[] = useMemo(
    () => [
      {
        id: 'design-assets',
        name: 'Design Assets & Mockups',
        subcategories: ['Vectors', 'Icons', 'Mockups', 'Patterns', 'Textures', 'Fonts'],
        image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
        featured: true,
        href: '/digitaltools/asset',
      },
      {
        id: 'templates',
        name: 'Templates & Marketing Kits',
        subcategories: ['Website Templates', 'Email Templates', 'Social Media Kits', 'Presentation Templates', 'Brochures'],
        image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
        featured: true,
        href: '/digitaltools/kits',
      },
      {
        id: 'audio-media',
        name: 'Audio & Media Packs',
        subcategories: ['Sound Effects', 'Music Tracks', 'Stock Video', 'Animations', 'Podcast Kits'],
        image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=1000&fit=crop&auto=format&q=80',
        featured: true,
        href: '/digitaltools/packs',
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
            Creator & Business
            <span className="block font-normal mt-2">EXPRESSION</span>
          </h1>
          <button
            onClick={scrollToCategories}
            className="group bg-black text-white px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-gray-800 transition-all duration-300 flex items-center mx-auto rounded-sm"
          >
            <span>Begin Creating</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </section>

      {/* Categories Section */}
      <section ref={categoriesSectionRef} className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="categories-header"
            data-animate
            className={`text-center mb-16 transition-all duration-600 ease-out ${
              isVisible['categories-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-gray-900 mb-3">CREATIVE TOOLBOX</h2>
            <p className="text-gray-600 text-base tracking-wider font-light">Everything you need to bring your vision to life</p>
          </div>
          <div className="space-y-20">
            {categories.map((category, index) => (
              <div key={category.id} id={`category-section-${category.id}`} data-animate>
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

      {/* Editors Picks Section */}
      <EditorsPicks category={activeCategory} newClass='bg-black'  />

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        /* Enhanced smooth scrolling */
        .smooth-scroll {
          scroll-behavior: smooth;
          scroll-padding-top: 80px;
        }

        /* Disable smooth scrolling for users who prefer reduced motion */
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
      `}</style>

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
