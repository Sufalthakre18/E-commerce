'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import EditorsPicks from '@/components/layout/EditorPicks'; // Adjust path as needed

// Data moved outside the component for better performance
const categoriesData = [
  {
    id: 'man',
    name: 'Man',
    subcategories: ['Oversized', 'Polo', 'Hoodies', 'Tank tops', 'Shorts', 'Caps'],
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&auto=format&q=80',
    featured: true,
    href: '/apparel/man',
  },
  {
    id: 'woman',
    name: 'Woman',
    subcategories: ['Oversized', 'Hoodies', 'Tote bags'],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&auto=format&q=80',
    featured: true,
    href: '/apparel/woman',
  },
];

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
        </div>
        <Link href={category.href}>
          <button
            className="group mt-4 md:mt-0 flex items-center text-slate-900 hover:text-gray-700 transition-colors duration-200"
            onClick={() => onCategoryClick(category.id)}
          >
            <span className="text-sm uppercase mr-2">Discover More</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href={category.href}>
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
                <span className="text-base font-light mr-3">ELEVATE YOUR STYLE</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </Link>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {category.subcategories.map((subcategory, subIndex) => (
            <div
              key={subIndex}
              className="group bg-gray-50 p-6 hover:bg-gray-100 transform hover:-translate-y-1 transition-all duration-200"
              onClick={() => onCategoryClick(category.id)}
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <span className="text-white text-sm font-medium">{subcategory.charAt(0)}</span>
                </div>
                <h4 className="text-sm font-medium text-slate-900 group-hover:text-gray-700 transition-colors duration-200">
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

const ApparelLandingPage: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [inView, setInView] = useState<{ [key: string]: boolean }>({});
  const [activeCategory, setActiveCategory] = useState<string>('Apparel'); // Default to 'man'

  const observer = useRef<IntersectionObserver | null>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => categoriesData, []);

  // Enhanced smooth scroll function with easing
  const smoothScroll = useCallback((element: HTMLElement, duration: number = 1000) => {
    const start = window.pageYOffset;
    const target = element.getBoundingClientRect().top + start - 80; // Offset for header
    const distance = target - start;
    let startTime: number | null = null;

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
        requestAnimationFrame(animation);
      }
    };

    requestAnimationFrame(animation);
  }, []);

  const scrollToCategories = useCallback(() => {
    if (categoriesSectionRef.current) {
      smoothScroll(categoriesSectionRef.current, 1200);
    }
  }, [smoothScroll]);

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
      {
        threshold: 0.1,
      }
    );
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observer.current?.observe(el));
    return () => observer.current?.disconnect();
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
    console.log(`Navigating to category: ${categoryId}`);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <section
        id="hero-section"
        data-animate
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
          className={`relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-800 ease-out ${
            inView['hero-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-widest mb-8 text-white leading-tight">
            ELEVATE YOUR
            <span className="block font-normal mt-2">Style Essence</span>
          </h1>
          <button
            onClick={scrollToCategories}
            className="group bg-white text-slate-900 px-8 py-3 text-sm font-medium tracking-wider uppercase hover:bg-gray-100 transition-all duration-300 flex items-center mx-auto"
          >
            <span>Begin Your Style Journey</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </section>
      <section ref={categoriesSectionRef} className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="categories-header"
            data-animate
            className={`text-center mb-16 transition-all duration-600 ease-out ${
              inView['categories-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-widest text-slate-900 mb-3">CURATED COLLECTIONS</h2>
            <p className="text-gray-600 text-base tracking-wider font-light">
              Where exceptional craftsmanship meets timeless design
            </p>
          </div>
          <div className="space-y-20">
            {categories.map((category, index) => (
              <div key={category.id} id={`category-section-${category.id}`} data-animate>
                <CategorySection
                  category={category}
                  index={index}
                  isVisible={inView[`category-section-${category.id}`]}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      <EditorsPicks category={activeCategory} />
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
    </div>
  );
};

export default ApparelLandingPage;
