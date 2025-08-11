
import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
    memo
} from 'react';
import Link from 'next/link';

interface Product {
    id: number;
    brand: string;
    title: string;
    description: string;
    productImage: string;
    lifestyleImage: string;
    shopMenLink: string;
    shopWomenLink: string;
}

const LuxuryProductCarousel = memo(function LuxuryProductCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [progress, setProgress] = useState(0);

    const products = useMemo<Product[]>(() => [
        {
            id: 1,
            brand: "LUXE ESSENTIALS",
            title: "Heritage Runner",
            description: "Timeless craftsmanship meets modern comfort technology.",
            productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop&q=80",
            lifestyleImage: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=800&fit=crop&q=80",
            shopMenLink: "/products/heritage-runner-men",
            shopWomenLink: "/products/heritage-runner-women"
        },
        {
            id: 2,
            brand: "ARTISAN COLLECTION",
            title: "Urban Explorer",
            description: "Handcrafted luxury for city adventures and weekend escapes.",
            productImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop&q=80",
            lifestyleImage: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=800&fit=crop&q=80",
            shopMenLink: "/products/urban-explorer-men",
            shopWomenLink: "/products/urban-explorer-women"
        },
        {
            id: 3,
            brand: "SIGNATURE SERIES",
            title: "Minimalist Elite",
            description: "Pure sophistication in every step, designed for discerning tastes.",
            productImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop&q=80",
            lifestyleImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=800&fit=crop&q=80",
            shopMenLink: "/products/minimalist-elite-men",
            shopWomenLink: "/products/minimalist-elite-women"
        }
    ], []);

    const totalSlides = products.length;
    const slideInterval = 5000;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    const clearIntervals = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    // Slide Navigation
    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
        setProgress(0);
        startTimeRef.current = Date.now();
    }, [totalSlides]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
        setProgress(0);
        startTimeRef.current = Date.now();
    }, [totalSlides]);

    const goToSlide = useCallback((idx: number) => {
        if (idx === currentSlide) return;
        setCurrentSlide(idx);
        setProgress(0);
        startTimeRef.current = Date.now();
    }, [currentSlide]);

    const togglePlayPause = useCallback(() => {
        setIsPlaying(prev => {
            if (!prev) {
                startTimeRef.current = Date.now();
                setProgress(0);
            }
            return !prev;
        });
    }, []);

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const handleTouchEnd = () => {
        if (touchStart === null || touchEnd === null) return;
        const dist = touchStart - touchEnd;
        if (dist > 50) nextSlide();
        if (dist < -50) prevSlide();
        setTouchStart(null);
        setTouchEnd(null);
    };

    // Auto-play effect
    useEffect(() => {
        clearIntervals();

        if (isPlaying) {
            progressIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTimeRef.current;
                const newProgress = Math.min((elapsed / slideInterval) * 100, 100);
                setProgress(newProgress);

                if (newProgress >= 100) {
                    nextSlide();
                }
            }, 16);

            return clearIntervals;
        }
    }, [isPlaying, currentSlide, nextSlide, slideInterval, clearIntervals]);

    useEffect(() => {
        setProgress(0);
        startTimeRef.current = Date.now();
    }, [currentSlide]);

    useEffect(() => {
        return clearIntervals;
    }, [clearIntervals]);

    const ProgressIndicators = useMemo(() => (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 w-4/5 max-w-xs">
            <div className="flex h-1 gap-0">
                {products.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className="flex-1 h-full relative cursor-pointer transition-all duration-300 hover:h-1.5 group"
                        aria-label={`Go to slide ${index + 1}`}
                    >
                        <div
                            className={`absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300 ${index === currentSlide ? 'rounded-full' : ''
                                }`}
                            style={{
                                width: index < currentSlide
                                    ? '100%'
                                    : index === currentSlide
                                        ? `${progress}%`
                                        : '0%',
                                transformOrigin: 'left center',
                                opacity: index < currentSlide ? 0.3 : 1
                            }}
                        />

                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {products[index].title}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <button
                onClick={togglePlayPause}
                className="hidden sm:flex absolute -right-10 top-1/2 -translate-y-1/2 size-8 bg-black/40 hover:bg-black/70 backdrop-blur-sm rounded-full items-center justify-center transition-all duration-200 group flex-shrink-0"
                aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                style={{
                    boxShadow: '0 2px 12px 2px rgba(0,0,0,0.15)'
                }}
            >
                {isPlaying ? (
                    <svg className="w-3 h-3 text-white group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                ) : (
                    <svg className="w-3 h-3 text-white group-hover:scale-110 transition-transform ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                )}
            </button>
        </div>
    ), [products, currentSlide, progress, totalSlides, isPlaying, goToSlide, togglePlayPause]);


    return (
        <div className="w-full md:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white">


            <div
                className="relative w-full min-h-[800px] sm:min-h-[800px] md:min-h-[700px]"

                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {products.map((product, index) => (
                    <div
                        key={product.id}
                        className=" absolute left-0 top-0 w-full h-full transition-opacity duration-800 ease-in-out"
                        style={{
                            opacity: index === currentSlide ? 1 : 0,
                            pointerEvents: index === currentSlide ? 'auto' : 'none',
                            zIndex: index === currentSlide ? 20 : 0,

                        }}
                    >
                        <div className="flex w-full flex-col-reverse md:flex-row md:max-h-[90vh] min-h-[600px] md:min-h-[700px] flex-shrink-0">
                            
                            <div className="relative md:my-auto aspect-square overflow-hidden md:w-1/2 bg-gradient-to-br from-amber-50 to-yellow-50">
                                
                                <div className="absolute inset-0 opacity-30">
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: `
                                                radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.1) 0%,transparent 50%),
                                                radial-gradient(circle at 75% 75%, rgba(245, 158, 11, 0.1) 0%,transparent 50%)`
                                        }}
                                    />
                                </div>

                                {/* Product Image */}
                                <div className="absolute md:mx-auto left-1/2 top-8 -translate-x-1/2 w-3/4 md:w-4/5 lg:w-5/6 aspect-square">
                                    <img
                                        src={product.productImage}
                                        alt={product.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                                        loading={index === 0 ? "eager" : "lazy"}
                                        style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.1))' }}
                                    />
                                </div>

                                {/* Overlay Content */}
                                {/* Overlay Content - Zara Style */}
                                <div className="absolute inset-0 flex flex-col items-center justify-between gap-4 px-6 py-8 md:px-12">
                                    <p className="text-xs tracking-[0.3em] uppercase text-black/60 font-light">{product.brand}</p>
                                    <div className="flex flex-col items-center justify-center gap-8 md:gap-10 max-w-sm">


                                        
                                        <div className="mt-20  flex flex-row gap-4 w-full max-w-xs">
                                            <Link href={product.shopMenLink} className="group text-xs uppercase tracking-[0.2em] text-black font-light border-b border-black/20 pb-1 hover:border-black active:border-black transition-all duration-300 text-center">
                                                <span>Shop Men</span>
                                            </Link>
                                            <Link href={product.shopWomenLink} className="group text-xs uppercase tracking-[0.2em] text-black font-light border-b border-black/20 pb-1 hover:border-black active:border-black transition-all duration-300 text-center">
                                                <span>Shop Women</span>
                                            </Link>
                                        </div>
                                        <div className="items-center gap-4 text-center">
                                            <h2 className=" text-3xl md:text-4xl font-light text-black tracking-[0.1em] uppercase leading-tight">{product.title}</h2>

                                        </div>


                                    </div>
                                    <div />
                                </div>
                            </div>

                            {/* Right - Lifestyle Image */}
                            <div className="relative aspect-square md:w-1/2 flex items-end md:my-15">
                                <div className="absolute inset-8 md:inset-y-0 md:left-0 md:right-16 overflow-hidden rounded-3xl">
                                    <img
                                        src={product.lifestyleImage}
                                        alt={`${product.title} lifestyle`}
                                        className="w-full h-full object-cover transition-transform duration-1000 ease-out hover:scale-105"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

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

// Category Card Component (from original HeroSection2)
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
            className="relative overflow-hidden group h-[36rem] md:h-[44rem] md:z-5 cursor-pointer transform-gpu"
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
            <div className="relative w-full h-full overflow-hidden will-change-transform">
                <picture>
                    <source media="(min-width: 768px)" srcSet={block.desktopImage} />
                    <source media="(max-width: 767px)" srcSet={block.mobileImage} />
                    <img
                        src={block.desktopImage}
                        alt={block.title}
                        className="w-full h-full object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                        style={{
                            transform: `scale(${hovered ? 1.06 : isInView ? 1.02 : 1})`,
                            opacity: isInView ? 1 : 0,
                            transitionDelay: `${index * 150}ms`
                        }}
                        loading="lazy"
                        decoding="async"
                    />
                </picture>

                {/* Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none transition-all duration-300"
                    style={{
                        background: hovered
                            ? 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), rgba(0,0,0,0.1))'
                            : 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)'
                    }}
                />
            </div>

            {/* Text Content */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-10 pointer-events-none">
                <span
                    className="text-xs font-semibold tracking-[0.2em] uppercase mb-3 pointer-events-auto"
                    style={{
                        color: hovered ? '#fbbf24' : '#fcd34d',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transition: 'all 0.6s ease',
                        transitionDelay: `${index * 150 + 100}ms`
                    }}
                >
                    {block.brand}
                </span>

                <h2
                    className="text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-3 pointer-events-auto"
                    style={{
                        color: hovered ? '#fef3c7' : '#ffffff',
                        transform: `translateY(${isInView ? 0 : '24px'})`,
                        opacity: isInView ? 1 : 0,
                        transition: 'all 0.8s ease',
                        transitionDelay: `${index * 150 + 200}ms`
                    }}
                >
                    {block.title}
                </h2>

                <p
                    className="text-sm md:text-base font-light mb-6 max-w-md pointer-events-auto"
                    style={{
                        color: hovered ? '#f3f4f6' : '#d1d5db',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transition: 'all 0.6s ease',
                        transitionDelay: `${index * 150 + 300}ms`
                    }}
                >
                    {block.description}
                </p>

                <Link
                    href={block.link}
                    className="inline-block text-sm font-medium tracking-[0.15em] uppercase relative pointer-events-auto"
                    style={{
                        color: hovered ? '#fbbf24' : '#ffffff',
                        transform: `translateY(${isInView ? 0 : '16px'})`,
                        opacity: isInView ? 1 : 0,
                        transition: 'all 0.8s ease',
                        transitionDelay: `${index * 150 + 400}ms`
                    }}
                >
                    {block.linkText}
                    <span className="absolute bottom-0 left-0 h-px bg-white w-full" />
                    <span
                        className="absolute bottom-0 left-0 h-px"
                        style={{
                            width: '100%',
                            background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                            transform: `scaleX(${hovered ? 1 : 0})`,
                            transformOrigin: 'left',
                            transition: 'transform 0.4s ease-out'
                        }}
                    />
                </Link>
            </div>
        </div>
    );
});

// Main Component - Integrated HeroSection2 with embedded carousel
export default function HeroSection2() {
    const [isInView, setIsInView] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    const categoryBlocks = useMemo(
        () => [
            {
                id: 1,
                brand: 'LUXE',
                title: "Men's Collection",
                description:
                    "Sophisticated styles crafted for the modern gentleman's refined taste",
                desktopImage:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1500&fit=crop&q=80',
                mobileImage:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80',
                link: '/collections/men',
                linkText: 'Shop Men'
            },
            {
                id: 2,
                brand: 'LUXE',
                title: "Women's Collection",
                description: 'Timeless elegance meets contemporary design in every piece',
                desktopImage:
                    'https://i.pinimg.com/originals/80/71/5a/80715a770a9956645cc86b9f333130cc.jpg',
                mobileImage:
                    'https://i.pinimg.com/originals/80/71/5a/80715a770a9956645cc86b9f333130cc.jpg',
                link: '/collections/women',
                linkText: 'Shop Women'
            },
            {
                id: 3,
                brand: 'LUXE',
                title: "Accessories Collection",
                description: 'Complete your look with our curated selection of premium accessories',
                desktopImage:
                    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=1500&fit=crop&q=80',
                mobileImage:
                    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
                link: '/collections/accessories',
                linkText: 'Shop Accessories'
            },
            {
                id: 4,
                brand: 'LUXE',
                title: "Men's Collection",
                description:
                    "Sophisticated styles crafted for the modern gentleman's refined taste",
                desktopImage:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=1500&fit=crop&q=80',
                mobileImage:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80',
                link: '/collections/men',
                linkText: 'Shop Men'
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
            <section className="relative overflow-hidden">
                {/* Background with subtle texture */}
                <div className="absolute inset-0 bg-gradient-to-b from-stone-50 to-white"></div>

                <div className="relative mx-auto max-w-6xl px-6 sm:px-8 lg:px-12 pt-24 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-24">
                    <div className="text-center">
                        {/* Main Heading - Zara Style */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-[0.15em] uppercase text-black leading-[0.85] mb-6">
                            Preserve Legacy.<br />
                            Inspire Generations.
                        </h1>

                        {/* Subtitle */}
                        <div className="max-w-lg mx-auto">
                            <p className="text-sm sm:text-base text-black/60 font-light tracking-wider uppercase mb-8 sm:mb-12">
                                Curating timeless pieces for the modern wardrobe
                            </p>

                            {/* Minimal CTA */}
                            <div className="inline-flex items-center group cursor-pointer">
                                <span className="text-xs uppercase tracking-[0.2em] text-black font-medium mr-3 group-hover:text-black/70 transition-colors duration-300">
                                    Explore Collection
                                </span>
                                <div className="w-12 h-px bg-black group-hover:w-16 transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Minimal divider */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-px h-12 bg-gradient-to-b from-black/20 to-transparent"></div>
            </section>

            {/* Category + Carousel Section */}
            <section
                ref={sectionRef}
                className="relative mx-auto max-w-7xl px sm:px-6 lg:px-8 py-14"
                aria-label="LUXE Collections"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
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
