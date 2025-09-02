'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, Download, Sparkles, BookOpen, Calendar, Award } from 'lucide-react';

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
  price?: string;
  image: string;
  category: string;
  badge?: string;
  originalPrice?: string;
  description?: string;
  type?: string;
}

// A lean, memoized product card tailored for educational items
const EduProductCard = React.memo(({ product, index, onTouch, isTouched, isMobile }: {
  product: Product;
  index: number;
  onTouch: (id: string) => void;
  isTouched: boolean;
  isMobile: boolean;
}) => (
  <article
    role="button"
    tabIndex={0}
    className={`group flex-none w-72 sm:w-80 snap-center transition-transform duration-300 will-change-transform outline-none focus:ring-2 focus:ring-indigo-300 ${{}.toString()}`}
    onClick={() => onTouch(product.id)}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onTouch(product.id)}
    onTouchStart={() => isMobile && onTouch(product.id)}
  >
    <div className="relative h-96 overflow-hidden bg-white rounded-2xl shadow-md border border-gray-100">
      <Image
        src={product.image}
        alt={product.name}
        fill
        className={`object-cover transition-transform duration-500 will-change-transform ${
          isMobile ? (isTouched ? 'scale-105' : '') : 'group-hover:scale-105'
        }`}
        priority={index < 2}
        sizes="(max-width: 640px) 288px, 320px"
        quality={85}
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent transition-opacity duration-300 ${
        isMobile ? (isTouched ? 'from-indigo-900/70' : '') : 'group-hover:from-indigo-900/70'
      }`} />

      {/* Badge */}
      {product.badge && (
        <div className="absolute top-4 left-4">
          <span className="bg-indigo-50 text-indigo-800 px-3 py-1 text-xs font-semibold rounded-lg border border-indigo-100 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {product.badge}
          </span>
        </div>
      )}

      {/* Price / Type */}
      <div className="absolute top-4 right-4 text-right">
        {product.price ? (
          <div className="bg-white/90 text-indigo-900 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-200">
            {product.price}
          </div>
        ) : (
          <div className="bg-white/90 text-gray-800 px-3 py-1 text-sm font-medium rounded-lg border border-gray-200">Free</div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h3 className={`text-xl font-medium text-white mb-1 transition-colors duration-300 ${
          isMobile && isTouched ? 'text-indigo-100' : ''
        }`}>
          {product.name}
        </h3>
        <p className="text-indigo-100 text-sm mb-4 line-clamp-2">{product.description}</p>

        <div className={`transition-all duration-300 ${
          isMobile ? (isTouched ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')
          : 'opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-4'
        }`}
        >
          <button className="inline-flex items-center gap-2 bg-white text-indigo-900 py-2 px-4 text-xs font-semibold uppercase hover:bg-gray-100 transition-all duration-200 rounded-md shadow-sm">
            <Download className="h-4 w-4" />
            Instant Access
          </button>
        </div>
      </div>
    </div>
  </article>
));

EduProductCard.displayName = 'EduProductCard';

const EduCategorySection = React.memo(({ category, index, isVisible, onCategoryClick }: {
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
        <p className="text-gray-600 text-sm">Essentials to make studying smarter, not harder</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="group flex items-center text-indigo-700 hover:text-indigo-900 transition-colors duration-200"
          onClick={() => onCategoryClick(category.id)}
        >
          <span className="text-sm uppercase mr-2 tracking-wide">Explore</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div
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
            <span className="text-base font-semibold mr-3 tracking-wide">DISCOVER {category.name.toUpperCase()}</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {category.subcategories.map((subcategory, subIndex) => (
          <div
            key={subIndex}
            className="group cursor-pointer bg-white p-5 hover:bg-indigo-50 transform hover:-translate-y-1 transition-all duration-200 rounded-xl border border-gray-100 hover:shadow-sm flex flex-col items-center text-center"
            onClick={() => onCategoryClick(category.id)}
            role="button"
            tabIndex={0}
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <span className="text-white text-sm font-semibold">{subcategory.charAt(0)}</span>
            </div>
            <h4 className="text-sm font-medium text-indigo-900 group-hover:text-indigo-800 transition-colors duration-200">{subcategory}</h4>
          </div>
        ))}
      </div>
    </div>
  </section>
));

EduCategorySection.displayName = 'EduCategorySection';

export default function EduCoreLandingPage() {
  const [activeCategory, setActiveCategory] = useState<string>('edu-core');
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const [touchedElements, setTouchedElements] = useState<{ [key: string]: boolean }>({});
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    const onResize = () => checkMobile();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleTouch = useCallback((elementId: string) => {
    if (isMobile) {
      setTouchedElements(prev => ({ ...prev, [elementId]: !prev[elementId] }));
    }
  }, [isMobile]);

  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
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
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.12, rootMargin: '40px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  // Data — single branded category "EduCore" with core subcategories requested
  const categories: Category[] = useMemo(() => [
    {
      id: 'study-planners',
      name: 'Study Planners & Trackers',
      subcategories: ['Weekly Planners', 'Daily Trackers', 'Habit Trackers', 'Focus Timers', 'Progress Dashboards'],
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&q=80&auto=format&fit=crop',
      featured: true
    },
    {
      id: 'exam-prep',
      name: 'Exam Prep Resources',
      subcategories: ['Practice Tests', 'Flashcards', 'Cheat Sheets', 'Revision Schedules', 'Answer Explanations'],
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop',
      featured: true
    },
    {
      id: 'gamified-packs',
      name: 'Gamified Learning Packs',
      subcategories: ['Math Games', 'Language Quests', 'Reward Systems', 'Level-based Courses', 'Interactive Challenges'],
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop',
      featured: true
    }
  ], []);

  const featuredProducts: Product[] = useMemo(() => [
    // Study Planners & Trackers
    {
      id: 'planner-pro',
      name: 'Academic Study Planner Pro',
      price: '$12',
      image: 'https://images.unsplash.com/photo-1524253482453-3fed8d2fe12b?w=1200&q=80&auto=format&fit=crop',
      category: 'study-planners',
      badge: 'Bestseller',
      description: 'Weekly + daily planning templates, habit trackers and focus timers',
      type: 'Planner Template'
    },
    {
      id: 'daily-tracker',
      name: 'Daily Focus & Habit Tracker',
      price: '$6',
      image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80&auto=format&fit=crop',
      category: 'study-planners',
      badge: 'Popular',
      description: 'Track study sessions, Pomodoro rounds and streaks',
      type: 'Tracker Sheet'
    },

    // Exam Prep Resources
    {
      id: 'exam-ultimate',
      name: 'Ultimate Exam Prep Pack',
      price: '$24',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop',
      category: 'exam-prep',
      badge: 'Top Rated',
      description: 'Practice tests, spaced-repetition guides and cheat-sheets',
      type: 'Practice Test Bundle'
    },
    {
      id: 'flashcards-boost',
      name: 'Flashcards Boost (Anki-ready)',
      price: '$9',
      image: 'https://images.unsplash.com/photo-1553531888-0a5a9f2d6f8d?w=1200&q=80&auto=format&fit=crop',
      category: 'exam-prep',
      badge: 'Essential',
      description: 'Curated flashcards with spaced repetition intervals',
      type: 'Flashcards Pack'
    },

    // Gamified Learning Packs
    {
      id: 'math-quest',
      name: 'Math Quest — Beginner to Pro',
      price: '$18',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80&auto=format&fit=crop',
      category: 'gamified-packs',
      badge: 'New',
      description: 'Interactive challenges, reward system and progress dashboard',
      type: 'Game Module'
    },
    {
      id: 'vocab-quest',
      name: 'Vocabulary Quest Pack',
      price: '$14',
      image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=1200&q=80&auto=format&fit=crop',
      category: 'gamified-packs',
      badge: 'Trending',
      description: 'Level-based language challenges with badges and leaderboards',
      type: 'Gamified Course'
    }
  ], []);

  return (
    <div className="min-h-screen bg-white text-indigo-900">
      {/* Hero */}
      <header className="relative min-h-[72vh] flex items-center justify-center bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=60&auto=format&fit=crop" alt="Edu background" fill className="object-cover" />
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
            <Award className="h-4 w-4 text-indigo-700" />
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">EduCore</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight mb-4">Study smarter — not harder</h1>
          <p className="text-lg text-indigo-700/80 mb-6">Tools, templates and gamified resources to help learners stay motivated and excel.</p>

          <div className="flex items-center justify-center gap-4">
            <button className="inline-flex items-center gap-2 bg-indigo-700 text-white px-6 py-3 text-sm font-semibold rounded-lg hover:opacity-95 transition">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </button>

            <button className="inline-flex items-center gap-2 bg-white border border-indigo-100 text-indigo-800 px-5 py-3 text-sm font-medium rounded-lg hover:bg-indigo-50 transition">
              Browse Free Resources
            </button>
          </div>
        </div>
      </header>

      {/* Categories */}
      <main className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div id="edu-categories-header" data-animate className={`text-center mb-12 transition-all duration-700 ${isVisible['edu-categories-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-indigo-900 mb-2">Core Collections</h2>
            <p className="text-gray-600">Curated for students, tutors and lifelong learners</p>
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

      {/* Featured */}
      <section className="relative py-16 bg-indigo-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div id="edu-featured-header" data-animate className={`text-center mb-10 transition-all duration-600 ${isVisible['edu-featured-header'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h3 className="text-3xl font-semibold text-indigo-900 mb-2">Featured Learning Kits</h3>
            <p className="text-gray-600">Handpicked packs to get you results—fast</p>
          </div>

          <div id="edu-featured-products" data-animate className={`transition-all duration-700 ${isVisible['edu-featured-products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="relative">
              <div className="hidden lg:block relative">
                <div ref={scrollContainerRef} className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                  <div className="flex-none w-6" />
                  {featuredProducts.map((product, idx) => (
                    <EduProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                      onTouch={handleTouch}
                      isTouched={!!touchedElements[product.id]}
                      isMobile={isMobile}
                    />
                  ))}
                  <div className="flex-none w-6" />
                </div>

                <button onClick={scrollLeft} aria-label="Scroll left" className="absolute left-3 top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                  <ChevronLeft className="h-5 w-5 text-indigo-700" />
                </button>
                <button onClick={scrollRight} aria-label="Scroll right" className="absolute right-3 top-1/2 -translate-y-1/2 bg-white w-12 h-12 rounded-lg flex items-center justify-center shadow-sm border border-gray-100">
                  <ChevronRight className="h-5 w-5 text-indigo-700" />
                </button>
              </div>

              <div className="lg:hidden">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4">
                  <div className="flex-none w-6" />
                  {featuredProducts.map((product, idx) => (
                    <EduProductCard
                      key={product.id}
                      product={product}
                      index={idx}
                      onTouch={handleTouch}
                      isTouched={!!touchedElements[product.id]}
                      isMobile={isMobile}
                    />
                  ))}
                  <div className="flex-none w-6" />
                </div>
              </div>
            </div>

            <div id="edu-featured-cta" data-animate className={`text-center mt-12 transition-all duration-600 ${isVisible['edu-featured-cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <button className="inline-flex items-center gap-2 bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-95 transition">
                Explore All Kits
n              </button>
            </div>
          </div>
        </div>
      </section>

      {/* small footer CTA */}
      <footer className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm text-gray-600">EduCore — built for learners. Need a custom bundle? Reach out to our team.</p>
        </div>
      </footer>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .snap-x { scroll-snap-type: x mandatory; }
        .snap-center { scroll-snap-align: center; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}
