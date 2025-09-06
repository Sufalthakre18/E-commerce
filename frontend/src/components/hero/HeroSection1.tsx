'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';

export default function HeroSection1() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  const heroSlides = useMemo(() => [
    {
      id: 1,
      desktopImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=2560&h=1440&fit=crop&q=80",
      mobileImage: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1024&h=1820&fit=crop&q=80",
      category: "The New Heritage Collection",
      title: "Timeless elegance, redefined.",
      ctaButtons: [
        { text: "Shop Apperal", href: "/apparel", variant: "primary" },
        { text: "Shop Decor", href: "/home", variant: "primary" }
      ]
    },
    {
      id: 2,
      desktopImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=2560&h=1440&fit=crop&q=80",
      mobileImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1024&h=1820&fit=crop&q=80",
      category: "digital tools",
      title: "Improve your everyday with digital tools.",
      ctaButtons: [
        { text: "Creative & Bussiness", href: "/digitaltools", variant: "primary" },
        { text: "EduCore", href: "/educore", variant: "secondary" }
      ]
    }
  ], []);
  
  const slideCount = heroSlides.length;
  const slideInterval = 8000;
  
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slideCount);
    startTimeRef.current = null;
  }, [slideCount]);
  
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      if (!prev) startTimeRef.current = null;
      return !prev;
    });
  }, []);
  
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    startTimeRef.current = null;
  }, []);
  
  const updateProgress = useCallback((timestamp: number) => {
    if (!isPlaying || !progressRef.current) return;
    
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / slideInterval, 1) * 100;
    const currentSegment = progressRef.current.children[currentSlide] as HTMLElement;
    
    if (currentSegment) {
      const progressBar = currentSegment.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }
    }
    
    if (progress >= 100) {
      nextSlide();
    } else {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, currentSlide, nextSlide, slideInterval]);
  
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);
  
  useEffect(() => {
    if (!progressRef.current) return;
    
    Array.from(progressRef.current.children).forEach((segment, index) => {
      const progressBar = segment.querySelector('.progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = index < currentSlide ? '100%' : '0%';
      }
    });
    
    startTimeRef.current = null;
  }, [currentSlide]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToSlide((currentSlide - 1 + slideCount) % slideCount);
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, togglePlayPause, goToSlide, currentSlide, slideCount]);
  
  const currentSlideData = heroSlides[currentSlide];
  
  return (
    <section
      className="relative m-2.5 h-[calc(100vh-8.25rem)] md:h-[calc(100vh-5.25rem)] overflow-hidden rounded-2xl text-white"
      role="banner"
      aria-label="Hero carousel"
    >
      <div className="relative size-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
            aria-hidden={index !== currentSlide}
          >
            <img src={slide.desktopImage} alt="" className="hidden md:block w-full h-full object-cover" />
            <img src={slide.mobileImage} alt="" className="block md:hidden w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ))}
        
        <div className="absolute inset-0 flex size-full flex-col p-6 sm:p-8 md:p-12 lg:p-20 pt-16 sm:pt-20 pb-12 sm:pb-16 justify-end items-start md:items-end z-20">
          <div className="max-w-2xl text-left md:text-right w-full">
            <p className="mb-3 sm:mb-4 font-light text-xs sm:text-sm font-mono tracking-[0.2em] uppercase text-gray-300 opacity-90">
              {currentSlideData.category}
            </p>
            <h1
              className="mb-6 sm:mb-8 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-light tracking-wide leading-tight"
            >
              {currentSlideData.title}
            </h1>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:justify-end">
              {currentSlideData.ctaButtons.map((button, index) => (
                <Link
                  key={index}
                  href={button.href}
                  className={`
                    inline-flex items-center justify-center px-4 sm:px-4 py-3 sm:py-3 rounded-lg font-light text-xs sm:text-sm tracking-wide transition-all duration-300 transform hover:scale-105
                    ${button.variant === 'primary'
                      ? 'bg-gradient-to-r from-gray-200 to-gray-400/30 text-gray-900 hover:from-gray-100 hover:to-gray-300 shadow-lg hover:shadow-xl'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                    }
                  `}
                >
                  {button.text}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute right-0 bottom-4 sm:bottom-5 left-0 flex items-center justify-between gap-3 sm:gap-5 px-4 sm:px-5 z-30">
        <div className="flex-1 relative">
          <div className="flex h-0.5 sm:h-1 gap-1">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="flex-1 h-full bg-white/20 hover:bg-white/30 transition-colors duration-200 first:rounded-l-full last:rounded-r-full"
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
          <div ref={progressRef} className="absolute inset-0 flex h-0.5 sm:h-1 gap-1 pointer-events-none">
            {heroSlides.map((_, index) => (
              <div key={index} className="flex-1 h-full overflow-hidden first:rounded-l-full last:rounded-r-full">
                <div className="progress-bar h-full bg-gradient-to-r from-gray-200 to-gray-400 will-change-transform" />
              </div>
            ))}
          </div>
        </div>
        
        
      </div>
    </section>
  );
};