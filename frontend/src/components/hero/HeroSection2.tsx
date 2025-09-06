import Link from 'next/link';
import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    memo
} from 'react';

interface Product {
    id: number;
    brand: string;
    title: string;
    productImage: string;
    lifestyleImage: string;
}

const LuxuryProductCarousel = memo(function LuxuryProductCarousel() {
  const products = useMemo<Product[]>(
    () => [
      {
        id: 1,
        brand: "Your Brand",
        title: "Heritage Runner",
        productImage:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
        lifestyleImage:
          "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop&q=80",
      },
      {
        id: 2,
        brand: "Your Brand",
        title: "Urban Explorer",
        productImage:
          "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80",
        lifestyleImage:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop&q=80",
      },
      {
        id: 3,
        brand: "Your Brand",
        title: "Minimalist Elite",
        productImage:
          "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop&q=80",
        lifestyleImage:
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&q=80",
      },
    ],
    []
  );

  const totalSlides = products.length;
  const slideInterval = 5000; // ms

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  // Refs for animation/timing
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedElapsedRef = useRef<number>(0); // ms accumulated when paused

  // Helpers to set/reset timing
  const resetTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedElapsedRef.current = 0;
    setProgress(0);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const next = (prev + 1) % totalSlides;
      // reset timers for next slide
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      setProgress(0);
      return next;
    });
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => {
      const prevIdx = (prev - 1 + totalSlides) % totalSlides;
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      setProgress(0);
      return prevIdx;
    });
  }, [totalSlides]);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide((prev) => {
      if (idx === prev) return prev;
      startTimeRef.current = Date.now();
      pausedElapsedRef.current = 0;
      setProgress(0);
      return idx;
    });
  }, []);

  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) {
        // Pausing: capture elapsed so we can resume later
        pausedElapsedRef.current = Date.now() - startTimeRef.current;
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        return false;
      } else {
        // Resuming: adjust startTime so elapsed resumes from pausedElapsed
        startTimeRef.current = Date.now() - pausedElapsedRef.current;
        pausedElapsedRef.current = 0;
        // RAF loop will start in useEffect below
        return true;
      }
    });
  }, []);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) =>
    setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null) return;
    const dist = touchStart - touchEnd;
    if (dist > 50) nextSlide();
    if (dist < -50) prevSlide();
    setTouchStart(null);
    setTouchEnd(null);
  };

  // RAF loop for progress + slide auto-advance
  useEffect(() => {
    // cancel any existing frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!isPlaying) {
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current; // ms since start (already adjusted on resume)
      const pct = Math.min((elapsed / slideInterval) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        // advance slide and reset timer
        setCurrentSlide((prev) => {
          const next = (prev + 1) % totalSlides;
          // reset start time for next slide so progress restarts cleanly
          startTimeRef.current = Date.now();
          setProgress(0);
          return next;
        });
        // schedule next tick for next slide
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // initialize startTimeRef if not set
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, slideInterval, totalSlides]);

  // reset timer when user manually changes slide externally (safeguard)
  useEffect(() => {
    resetTimer();
  }, [currentSlide, resetTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Build progress indicators
  const ProgressIndicators = (
    <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 w-4/5 max-w-xs">
      <div className="flex h-0.5 gap-1">
        {products.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="flex-1 h-full relative cursor-pointer bg-white/20"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className="absolute inset-0 bg-white"
              style={{
                // No CSS transition on width — we update instantly via RAF to match timing
                width:
                  index < currentSlide
                    ? "100%"
                    : index === currentSlide
                    ? `${progress}%`
                    : "0%",
                transformOrigin: "left center",
                opacity: index < currentSlide ? 0.45 : 1,
              }}
            />

            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-black/80 text-white text-xs px-3 py-1.5 rounded whitespace-nowrap font-light">
                {products[index].title}
              </div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={togglePlayPause}
        className="hidden sm:flex absolute -right-10 top-1/2 -translate-y-1/2 size-7 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full items-center justify-center transition-all duration-200 group flex-shrink-0 border border-white/20"
        aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
      >
        {isPlaying ? (
          <svg
            className="w-2.5 h-2.5 text-white group-hover:scale-110 transition-transform"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg
            className="w-2.5 h-2.5 text-white group-hover:scale-110 transition-transform ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div className="w-full md:col-span-2 relative overflow-hidden bg-[#3C3C3C]">
      <div
        className="relative w-full min-h-[800px] sm:min-h-[800px] md:min-h-[700px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="absolute left-0 top-0 w-full h-full transition-opacity duration-800 ease-in-out"
            style={{
              opacity: index === currentSlide ? 1 : 0,
              pointerEvents: index === currentSlide ? "auto" : "none",
              zIndex: index === currentSlide ? 20 : 0,
            }}
          >
            <div className="flex w-full flex-col-reverse md:flex-row md:max-h-[90vh] min-h-[600px] md:min-h-[700px] flex-shrink-0">
              {/* Left - Product Section */}
              <div className="relative md:my-auto aspect-square overflow-hidden md:w-1/2 bg-stone-50">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-50" />
                </div>

                {/* Product Image */}
                <div className="absolute md:mx-auto left-1/2 top-8 -translate-x-1/2 w-3/4 md:w-4/5 lg:w-5/6 aspect-square">
                  <img
                    src={product.productImage}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                    style={{ filter: "drop-shadow(0 15px 30px rgba(0,0,0,0.08))" }}
                  />
                </div>

                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-between gap-4 px-6 py-8 md:px-12">
                  <p className="text-xs tracking-[0.3em] uppercase text-stone-500 font-light">
                    {product.brand}
                  </p>

                  <div className="flex flex-col items-center justify-center gap-8 md:gap-10 max-w-sm">
                    <div className="items-center gap-4 text-center">
                      <h2 className="text-3xl md:text-4xl font-light text-stone-800 tracking-[0.1em] uppercase leading-tight">
                        {product.title}
                      </h2>
                    </div>
                  </div>
                  <div />
                </div>
              </div>

              {/* Right - Lifestyle Image */}
              <div className="relative aspect-square md:w-1/2 flex items-end md:my-15">
                <div className="absolute inset-8 md:inset-y-0 md:left-0 md:right-16 overflow-hidden">
                  <img
                    src={product.lifestyleImage}
                    alt={`${product.title} lifestyle`}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                  {/* Progress Indicators - Only show for current slide */}
                  {index === currentSlide && ProgressIndicators}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// Category Card Component
const CategoryCard = memo(function CategoryCard({
    block,
    index,
    isInView
}: {
    block: any;
    index: number;
    isInView: boolean;
}) {
    const [hovered, setHovered] = useState(false);

    const handleMouseEnter = () => setHovered(true);
    const handleMouseLeave = () => setHovered(false);
    const handleTouchStart = () => setHovered(true);
    const handleTouchEnd = () =>
        requestAnimationFrame(() => setTimeout(() => setHovered(false), 200));

    return (
        <div
            className="relative  overflow-hidden group h-[36rem] md:h-[44rem]  transform-gpu"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: 'translate3d(0,0,0)',
                backfaceVisibility: 'hidden',
                perspective: 1000
            }}
        >
            {/* Image */}
            <Link href={block.link}>
            <div className="relative w-full h-full overflow-hidden will-change-transform">
                <img
                    src={block.desktopImage}
                    alt={block.title}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                    style={{
                        transform: `scale(${hovered ? 1.05 : isInView ? 1.02 : 1})`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150}ms`
                    }}
                    loading="lazy"
                    decoding="async"
                />

                <div
                    className="absolute inset-0 pointer-events-none transition-all duration-500"
                    style={{
                        background: hovered
                            ? 'linear-gradient(to top, rgba(0,0,0,0.4), rgba(0,0,0,0), transparent)'
                            : 'linear-gradient(to top, rgba(0,0,0,0.3), rgba(0,0,0,0), transparent)'
                    }}
                />
            </div>
            </Link>
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
                <span
                    className="text-xs font-light tracking-[0.25em] uppercase mb-3 pointer-events-auto transition-all duration-300"
                    style={{
                        color: hovered ? '#f5f5f4' : '#e7e5e4',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150 + 100}ms`
                    }}
                >
                    {block.brand}
                </span>

                <h2
                    className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4 pointer-events-auto transition-all duration-500"
                    style={{
                        color: hovered ? '#ffffff' : '#f5f5f4',
                        transform: `translateY(${isInView ? 0 : '24px'})`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150 + 200}ms`
                    }}
                >
                    {block.title}
                </h2>

                <p
                    className="text-sm md:text-base font-light mb-6 max-w-md pointer-events-auto transition-all duration-400"
                    style={{
                        color: hovered ? '#e7e5e4' : '#d6d3d1',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150 + 300}ms`
                    }}
                >
                    {block.description}
                </p>
                <Link href={block.link}>
                <button
                    className="cursor-pointer inline-block text-sm font-light tracking-[0.15em] uppercase relative pointer-events-auto transition-all duration-400"
                    style={{
                        color: hovered ? '#ffffff' : '#f5f5f4',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transitionDelay: `${index * 150 + 400}ms`
                    }}
                >
                    {block.linkText}
                    <span className="absolute bottom-0 left-0 h-px bg-white/60 w-full transition-all duration-300" />
                    <span
                        className="absolute bottom-0 left-0 h-px bg-black"
                        style={{
                            width: '100%',
                            transform: `scaleX(${hovered ? 1 : 0})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.4s ease-out'
                        }}
                    />
                </button></Link>
            </div>
        </div>
    );
});

// Main Component
export default function HeroSection2() {
    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    const categoryBlocks = useMemo(
        () => [
            {
                id: 1,
                brand: 'Your brand',
                title: "Apparel Collection",
                description: "Sophisticated styles crafted for the modern gentleman's refined taste",
                desktopImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1500&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80',
                link: '/apparel',
                linkText: 'Shop -> Man/Woman'
            },
            {
                id: 2,
                brand: 'your brand',
                title: "Home",
                description: 'Elevate your living space with our exclusive home collection',
                desktopImage: 'https://i.pinimg.com/originals/80/71/5a/80715a770a9956645cc86b9f333130cc.jpg',
                mobileImage: 'https://i.pinimg.com/originals/80/71/5a/80715a770a9956645cc86b9f333130cc.jpg',
                link: '/home',
                linkText: 'Shop -> Decor/Stationary'
            },
            {
                id: 3,
                brand: 'Your brand',
                title: "Creative & Bussiness",
                description: 'Empower your creativity with our curated digital tools',
                desktopImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=1500&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
                link: '/digitaltools',
                linkText: 'Shop -> Digital Tools'
            },
            {
                id: 4,
                brand: 'Your brand',
                title: "EduCore",
                description: "Tools to enhance learning and productivity",
                desktopImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=1500&fit=crop&q=80',
                mobileImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=1000&fit=crop&q=80',
                link: '/educore',
                linkText: 'Shop -> Study Resources'
            }
        ],
        []
    );

    // Optimized IntersectionObserver
    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.2,
                rootMargin: '100px'
            }
        );

        observer.observe(section);

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <section className="relative overflow-hidden bg-stone-100">
                {/* Subtle texture overlay */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute inset-0 bg-gradient-to-b from-stone-100/50 to-transparent"></div>
                </div>

                <div className="relative mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
                    <div className="text-center">
                        
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-[0.15em] uppercase text-stone-800 leading-[0.85] mb-8">
                            Preserve Legacy.<br />
                            Inspire Generations.
                        </h1>
                        <div className="max-w-lg mx-auto">
                            <p className="text-sm sm:text-base text-stone-600 font-light tracking-wider uppercase mb-8 sm:mb-12">
                                Curating timeless pieces for the modern wardrobe
                            </p>
                            <div className="inline-flex items-center group cursor-pointer">
                                <span className="text-xs uppercase tracking-[0.2em] text-stone-700 font-light mr-4 group-hover:text-stone-900 transition-colors duration-300">
                                    Explore Collection
                                </span>
                                <div className="w-12 h-px bg-stone-400 group-hover:w-16 group-hover:bg-stone-600 transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-px h-12 bg-gradient-to-b from-stone-300 to-transparent"></div>
            </section>

            <section
                ref={sectionRef}
                className="relative mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-14 bg-stone-100"
                aria-label="Collections"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                    {categoryBlocks.map((block, index) => {
                        // Insert carousel after 2nd item
                        if (index === 2) {
                            return (
                                <React.Fragment key={`carousel-${block.id}`}>
                                    <LuxuryProductCarousel />
                                    <CategoryCard
                                        key={block.id}
                                        block={block}
                                        index={index}
                                        isInView={isInView}
                                    />
                                </React.Fragment>
                            );
                        }
                        return (
                            <CategoryCard
                                key={block.id}
                                block={block}
                                index={index}
                                isInView={isInView}
                            />
                        );
                    })}
                </div>
            </section>
        </>
    );
}