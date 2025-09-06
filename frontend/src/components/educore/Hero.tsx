
'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ArrowRight, BookOpen} from 'lucide-react';
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

const EduCategorySection = React.memo(
  ({ category, index, isVisible, onCategoryClick }: {
    category: Category;
    index: number;
    isVisible: boolean;
    onCategoryClick: (id: string) => void;
  }) => (
    <section
      className={`transition-all duration-500 ease-out will-change-transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 90}ms` }}
      aria-labelledby={`cat-${category.id}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-6">
        <div>
          <h3 id={`cat-${category.id}`} className="text-2xl md:text-3xl font-semibold tracking-tight text-indigo-900 mb-2">
            {category.name}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <Link href={category.href}><button
            className="group flex items-center text-indigo-700 hover:text-indigo-900 transition-colors duration-200"
            onClick={() => onCategoryClick(category.id)}
          >
            <span className="text-sm uppercase mr-2 tracking-wide">Explore</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button></Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Link href={category.href}><div
          className="group cursor-pointer relative h-80 lg:h-96 overflow-hidden rounded-2xl shadow-lg border border-indigo-50"
          onClick={() => onCategoryClick(category.id)}
        >
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={88}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/50 to-transparent group-hover:from-indigo-900/60 transition-all duration-300" />
          <div className="absolute top-6 left-6">
            <div className="bg-white/90 px-4 py-2 text-xs text-indigo-900 uppercase font-semibold rounded-lg border border-indigo-100 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {category.name}
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center text-white group-hover:translate-x-2 transition-transform duration-300">
              <span className="text-base font-semibold mr-3 tracking-wide">EXPLORE</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div></Link>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {category.subcategories.map((subcategory, subIndex) => (
            <div
              key={subIndex}
              className="group  bg-white p-5 hover:bg-indigo-50 transform hover:-translate-y-1 transition-all duration-200 rounded-xl border border-gray-100 hover:shadow-sm flex flex-col items-center text-center"
              onClick={() => onCategoryClick(category.id)}
              role="button"
              tabIndex={0}
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <span className="text-white text-sm font-semibold">{subcategory.charAt(0)}</span>
              </div>
              <h4 className="text-sm font-medium text-indigo-900 group-hover:text-indigo-800 transition-colors duration-200">{subcategory}</h4>
              <span className="text-xs text-gray-300">choose in filter</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  ),
);
EduCategorySection.displayName = 'EduCategorySection';

export default function EduCoreLandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>('EduCore');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
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

    // Cancel if user scrolls manually
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
    const onResize = () => checkMobile();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(categoryId);
  }, []);

  // Intersection observer for subtle entrance animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12, rootMargin: '40px 0px -40px 0px' }
    );
    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  // Data — single branded category "EduCore" with core subcategories
  const categories: Category[] = useMemo(
    () => [
      {
        id: 'study-planners',
        name: 'Study Planners',
        subcategories: ['Weekly', 'Daily', 'Habits', 'Focus', 'Progress'],
        image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&q=80&auto=format&fit=crop',
        featured: true,
        href: '/educore/study',
      },
      {
        id: 'exam-prep',
        name: 'Exam Prep',
        subcategories: ['Tests', 'Flashcards', 'Cheat Sheets', 'Schedules', 'Explanations'],
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop',
        featured: true,
        href: '/educore/resources'
      },
      {
        id: 'gamified-packs',
        name: 'Learning Games',
        subcategories: ['Math', 'Language', 'Rewards', 'Levels', 'Challenges'],
        image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop',
        featured: true,
        href: '/educore/gamified'
      },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-white text-indigo-900">
      {/* Hero */}
      <header className="relative min-h-[72vh] flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=60&auto=format&fit=crop"
            alt="Edu background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-indigo-50 to-indigo-900/10" />
        </div>
        <div
          id="edu-hero-content"
          data-animate
          className={`relative z-10 text-center max-w-4xl mx-auto px-6 transition-all duration-800 ease-out ${
            isVisible['edu-hero-content'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="inline-flex items-center gap-3 bg-indigo-100/60 px-3 py-1 rounded-full mb-6 border border-indigo-200">
            <BookOpen className="h-4 w-4 text-indigo-700" />
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">EduCore</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4">Study smarter</h1>
          <p className="text-lg text-indigo-700/80 mb-6">Tools and resources to help you excel</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={scrollToCategories}
              className="inline-flex items-center gap-2 bg-indigo-700 text-white px-6 py-3 text-sm font-semibold rounded-lg hover:opacity-95 transition"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <main ref={categoriesSectionRef} className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div
            id="edu-categories-header"
            data-animate
            className={`text-center mb-12 transition-all duration-700 ${
              isVisible['edu-categories-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-indigo-900 mb-2">Collections</h2>
            <p className="text-gray-600">For students and lifelong learners</p>
          </div>
          <div className="space-y-16">
            {categories.map((category, index) => (
              <div key={category.id} id={`category-section-${category.id}`} data-animate>
                <EduCategorySection
                  category={category}
                  index={index}
                  isVisible={isVisible[`category-section-${category.id}`] || false}
                  onCategoryClick={handleCategoryClick}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Editors Picks */}
      <EditorsPicks  category={activeCategory} newClass='bg-[#312c85]'/>

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
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
