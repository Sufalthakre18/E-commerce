'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function HeroSection4() {
    return (
        <div className="w-full">
            <section className="py-16 md:py-24 lg:py-32 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-0 items-stretch min-h-[80vh]">
                        {/* Content */}
                        <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-12 xl:px-16 py-12 lg:py-20">
                            <div className="max-w-lg">
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-[0.1em] uppercase text-black leading-[0.9] mb-8 lg:mb-12">
                                    Comfort<br />
                                    Made Simple
                                </h2>
                                <p className="text-base md:text-lg text-black/70 font-light mb-10 lg:mb-14 leading-relaxed tracking-wide">
                                    We believe the world's most comfortable products should also be the most sustainable.
                                    That's why we've spent years perfecting our approach to materials.
                                </p>

                                {/* Minimal CTA */}
                                <div className="group">
                                    <Link
                                        href="/our-story"
                                        className="inline-flex items-center text-xs uppercase tracking-[0.2em] text-black font-medium border-b border-black/20 pb-1 hover:border-black active:border-black transition-all duration-300"
                                    >
                                        Learn Our Story
                                        <span className="ml-3 w-6 h-px bg-black transform hover:w-8 active:w-8 transition-all duration-300"></span>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="relative aspect-[3/4] lg:aspect-auto lg:min-h-full">
                            <Image
                                src="https://images.pexels.com/photos/32934635/pexels-photo-32934635.jpeg"
                                alt="Our story"
                                fill
                                className="object-cover"
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-20 md:py-24 lg:py-32 bg-stone-50">
                <div className="max-w-2xl mx-auto px-6 sm:px-8 text-center">
                    {/* Minimal Heading */}
                    <h2 className="text-2xl md:text-3xl font-light tracking-[0.2em] uppercase text-black mb-12 md:mb-16">
                        Newsletter
                    </h2>

                    {/* Description */}
                    <div className="mb-12 md:mb-16">
                        <p className="text-sm md:text-base text-black/70 font-light mb-12 lg:mb-16 leading-relaxed max-w-2xl mx-auto tracking-wide">
                            Receive thoughtful updates about new arrivals, seasonal releases, and our approach to craftsmanship.
                        </p>
                    </div>

                    {/* Social Links - Ultra Minimal */}
                    <div className="flex justify-center items-center space-x-12 md:space-x-16">
                        {[
                            { name: 'INSTAGRAM', href: 'https://instagram.com' },
                            { name: 'FACEBOOK', href: 'https://facebook.com' },
                            { name: 'YOUTUBE', href: 'https://youtube.com' }
                        ].map((social) => (
                            <a
                                key={social.name}
                                href={social.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs tracking-[0.15em] text-black/60 font-bold hover:text-black active:text-black transition-colors duration-300"
                            >
                                {social.name}
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}