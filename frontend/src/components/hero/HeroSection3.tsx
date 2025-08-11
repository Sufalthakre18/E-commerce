'use client';
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';


// Category item interface
interface CategoryItem {
    id: string;
    title: string;
    defaultImage: string;
    hoverImage: string;
    links: {
        men?: {
            url: string;
            label: string;
        };
        women?: {
            url: string;
            label: string;
        };
        single?: {
            url: string;
            label: string;
        };
    };
}

const CategoryCard = memo(function CategoryCard({
    item,
    isActive,
    onHover,
    onLeave
}: {
    item: CategoryItem;
    isActive: boolean;
    onHover: () => void;
    onLeave: () => void;
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [hoverImageLoaded, setHoverImageLoaded] = useState(false);

    return (
        <div
            className="category-row-item group/category-row-item relative aspect-[0.77] overflow-hidden rounded-[20px] flex-shrink-0 cursor-pointer"
            style={{ width: '251.429px' }}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onTouchStart={onHover}
            onTouchEnd={onLeave}
        >
            {/* Images */}
            <div className="relative w-full h-full">
  <Image
    alt={item.title}
    src={item.defaultImage}
    fill
    sizes="(max-width: 600px) 100vw, 251px"
    className="w-full h-full object-cover transition-opacity duration-300"
    placeholder="blur"
    blurDataURL="/placeholder.jpg"
    onLoadingComplete={() => setImageLoaded(true)}
    style={{ opacity: imageLoaded ? 1 : 0 }}
    unoptimized={false}
  />
  <Image
    alt={`${item.title} hover`}
    src={item.hoverImage}
    fill
    sizes="(max-width: 600px) 100vw, 251px"
    className="category-row-item-hover-image absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
    placeholder="blur"
    blurDataURL="/placeholder.jpg"
    onLoadingComplete={() => setHoverImageLoaded(true)}
    style={{
      opacity: isActive && hoverImageLoaded ? 1 : 0,
      pointerEvents: 'none'
    }}
    unoptimized={false}
  />
</div>

            {/* Overlay */}
            <div
                className="pointer-events-none absolute z-10 inset-0 transition-all duration-300"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.17)' }}
            />

            {/* Content */}
            <div
                className="absolute inset-0 z-20 m-auto flex h-fit w-fit flex-col items-center justify-center gap-2 transition-transform duration-300 ease-out"
                style={{
                    transform: isActive ? 'translate(0px, 0px)' : 'translate(0%, 30%)'
                }}
            >
                {/* Title */}
                <h2
                    className="category-row-item-title btn btn-outline-white pointer-events-none px-6 py-2 text-sm font-medium tracking-wider uppercase rounded-full border transition-all duration-300"
                    style={{
                        opacity: 1,
                        borderColor: isActive ? 'transparent' : 'rgb(255, 255, 255)',
                        color: 'white'
                    }}
                >
                    {item.title}
                </h2>

                {/* CTA Buttons */}
                <div
                    className="category-row-item-cta-buttons m-auto flex flex-col items-center justify-center gap-2 w-full max-w-[200px] transition-opacity duration-300"
                    style={{ opacity: isActive ? 1 : 0 }}
                >
                    {item.links.men && item.links.women ? (
                        <>
                            <Link
                                href={item.links.men.url}
                                className="category-row-item-cta-button btn btn-outline-white w-full px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-full border border-white text-white hover:bg-white hover:text-black transition-all duration-200"
                                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                            >
                                {item.links.men.label}
                            </Link>
                            <Link
                                href={item.links.women.url}
                                className="category-row-item-cta-button btn btn-outline-white w-full px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-full border border-white text-white hover:bg-white hover:text-black transition-all duration-200"
                                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                            >
                                {item.links.women.label}
                            </Link>
                        </>
                    ) : item.links.single ? (
                        <Link
                            href={item.links.single.url}
                            className="category-row-item-cta-button btn btn-outline-white w-full px-4 py-2 text-sm font-medium tracking-wide uppercase rounded-full border border-white text-white hover:bg-white hover:text-black transition-all duration-200"
                            style={{ pointerEvents: isActive ? 'auto' : 'none' }}
                        >
                            {item.links.single.label}
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    );
});

// Main CategoryRow component
export default function CategoryRow() {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInView, setIsInView] = useState(false);

    // Category data
    const categories = useMemo<CategoryItem[]>(() => [
        {
            id: 'bestsellers',
            title: 'Bestsellers',
            defaultImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=1200&fit=crop&q=80',
            hoverImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=1200&fit=crop&q=80',
            links: {
                men: {
                    url: '/collections/mens-bestsellers',
                    label: 'Shop Men'
                },
                women: {
                    url: '/collections/womens-bestsellers',
                    label: 'Shop Women'
                }
            }
        },
        {
            id: 'new-arrivals',
            title: 'New Arrivals',
            defaultImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=1200&fit=crop&q=80',
            hoverImage: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&h=1200&fit=crop&q=80',
            links: {
                men: {
                    url: '/collections/mens-new-arrivals',
                    label: 'Shop Men'
                },
                women: {
                    url: '/collections/womens-new-arrivals',
                    label: 'Shop Women'
                }
            }
        },
        {
            id: 'mens',
            title: 'Mens',
            defaultImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop&q=80',
            hoverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop&q=80',
            links: {
                single: {
                    url: '/collections/mens',
                    label: 'Shop Men'
                }
            }
        },
        {
            id: 'womens',
            title: 'Womens',
            defaultImage: 'https://i.pinimg.com/originals/80/71/5a/80715a770a9956645cc86b9f333130cc.jpg',
            hoverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop&q=80',
            links: {
                single: {
                    url: '/collections/womens',
                    label: 'Shop Women'
                }
            }
        },
        {
            id: 'accessories',
            title: 'Accessories',
            defaultImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1200&fit=crop&q=80',
            hoverImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=1200&fit=crop&q=80',
            links: {
                men: {
                    url: '/collections/mens-accessories',
                    label: 'Shop Men'
                },
                women: {
                    url: '/collections/womens-accessories',
                    label: 'Shop Women'
                }
            }
        }
    ], []);

    // Intersection Observer for animations
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Touch/Mouse handlers for dragging
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        e.preventDefault();
        const x = e.pageX - containerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        containerRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current) return;
        setIsDragging(true);
        setStartX(e.touches[0].pageX - containerRef.current.offsetLeft);
        setScrollLeft(containerRef.current.scrollLeft);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging || !containerRef.current) return;
        const x = e.touches[0].pageX - containerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        containerRef.current.scrollLeft = scrollLeft - walk;
    }, [isDragging, startX, scrollLeft]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Auto-set active item based on scroll position
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const scrollLeft = container.scrollLeft;
            const itemWidth = 251.429 + 10; // width + margin
            const newIndex = Math.round(scrollLeft / itemWidth);
            setCurrentIndex(Math.max(0, Math.min(newIndex, categories.length - 1)));
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [categories.length]);

    // Set middle item as active on mount
    useEffect(() => {
        if (categories.length > 0) {
            setActiveIndex(Math.floor(categories.length / 2));
        }
    }, [categories.length]);

    return (
        <section
            className="relative overflow-hidden p-2.5 text-white transition-opacity duration-1000"
            style={{
                opacity: isInView ? 1 : 0,
                fontFamily: 'var(--font-sans, "Geograph", system-ui, sans-serif)'
            }}
        >
            <h2 className="text-2xl md:text-5xl  font-light tracking-wider text-slate-900 text-center mb-8 ">
                <span className="block">Bestsellers and New Arrivals</span>
            </h2>

            <div className="relative block">
                <div
                    ref={containerRef}
                    className="flex gap-2.5 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {categories.map((item, index) => (
                        <CategoryCard
                            key={item.id}
                            item={item}
                            isActive={activeIndex === index}
                            onHover={() => setActiveIndex(index)}
                            onLeave={() => {
                                // Keep active if it's the current centered item
                                if (index !== currentIndex) {
                                    setActiveIndex(null);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Custom styles for hiding scrollbar */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                /* Button styles matching Allbirds */
                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 500;
                    text-align: center;
                    vertical-align: middle;
                    user-select: none;
                    border: 1px solid transparent;
                    transition: all 0.15s ease-in-out;
                    text-decoration: none;
                }
                
                .btn-outline-white {
                    color: white;
                    border-color: white;
                    background-color: transparent;
                }
                
                .btn-outline-white:hover {
                    color: black;
                    background-color: white;
                    border-color: white;
                }
            `}</style>
        </section>
    );
}
