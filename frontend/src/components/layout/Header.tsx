'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, X } from 'lucide-react';

type DropdownKey = 'MEN' | 'WOMEN' | 'KIDS' | 'HOME' | null;

interface Category {
  title: string;
  items: string[];
  image: string;
}

interface Featured {
  title: string;
  subtitle: string;
  image: string;
}

interface MegaMenuSection {
  categories: Category[];
  featured: Featured;
}

type MegaMenuData = {
  [K in Exclude<DropdownKey, null>]: MegaMenuSection;
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState<boolean>(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth < 1024;

      // Hide dropdown when scrolling down past 200px
      if (currentScrollY > 200 && activeDropdown) {
        setActiveDropdown(null);
        setIsHoveringDropdown(false);
        setIsDropdownVisible(false);
      }

      // Handle header visibility based on scroll
      if (isMobile && isMenuOpen) {
        // On mobile: keep header visible when mobile menu is open
        setVisible(true);
      } else {
        // Normal scroll behavior for desktop or mobile with closed menu
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setVisible(false);
        } else if (currentScrollY < lastScrollY) {
          setVisible(true);
        }
      }

      setScrolled(currentScrollY > 10);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, activeDropdown, isMenuOpen]);

  const megaMenuData: MegaMenuData = {
    MEN: {
      categories: [
        {
          title: "Clothing",
          items: ["T-Shirts & Tanks", "Shirts", "Jeans", "Pants", "Shorts", "Jackets", "Blazers", "Suits", "Knitwear", "Activewear"],
          image: "https://images.unsplash.com/photo-1516826957135-700dedea698c?w=300&h=200&fit=crop"
        },
        {
          title: "Shoes",
          items: ["Sneakers", "Dress Shoes", "Boots", "Loafers", "Sandals", "Athletic"],
          image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&h=200&fit=crop"
        },
        {
          title: "Accessories",
          items: ["Watches", "Belts", "Wallets", "Bags", "Sunglasses", "Ties", "Cufflinks"],
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop"
        }
      ],
      featured: {
        title: "New Collection",
        subtitle: "Spring 2025",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop"
      }
    },
    WOMEN: {
      categories: [
        {
          title: "Clothing",
          items: ["Dresses", "Tops & Blouses", "Jeans", "Pants", "Skirts", "Jackets", "Coats", "Knitwear", "Activewear", "Loungewear"],
          image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=200&fit=crop"
        },
        {
          title: "Shoes",
          items: ["Heels", "Flats", "Sneakers", "Boots", "Sandals", "Athletic"],
          image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=200&fit=crop"
        },
        {
          title: "Accessories",
          items: ["Handbags", "Jewelry", "Scarves", "Sunglasses", "Belts", "Watches"],
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=200&fit=crop"
        }
      ],
      featured: {
        title: "Summer Essentials",
        subtitle: "New Arrivals",
        image: "https://images.unsplash.com/photo-1494790108755-2616c2b8dce2?w=400&h=500&fit=crop"
      }
    },
    KIDS: {
      categories: [
        {
          title: "Girls",
          items: ["Dresses", "Tops", "Bottoms", "Outerwear", "Shoes", "Accessories"],
          image: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop"
        },
        {
          title: "Boys",
          items: ["T-Shirts", "Shirts", "Pants", "Shorts", "Outerwear", "Shoes"],
          image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300&h=200&fit=crop"
        },
      ],
      featured: {
        title: "Back to School",
        subtitle: "New Collection",
        image: "https://images.unsplash.com/photo-1514488356742-28d143e0a045?w=400&h=500&fit=crop"
      }
    },
    HOME: {
      categories: [
        {
          title: "Living Room",
          items: ["Sofas", "Coffee Tables", "Rugs", "Lighting", "Decor", "Storage"],
          image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop"
        },
        {
          title: "Bedroom",
          items: ["Bedding", "Pillows", "Throws", "Furniture", "Lighting"],
          image: "https://images.unsplash.com/photo-1540518614846-7eded1432cc6?w=300&h=200&fit=crop"
        },
        
      ],
      featured: {
        title: "Home Collection",
        subtitle: "New Season",
        image: "https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=400&h=500&fit=crop"
      }
    }
  };

  const navigationItems = useMemo(() => [
    { label: 'MEN', href: '#', className: 'text-amber-100 hover:text-amber-200' },
    { label: 'WOMEN', href: '#', className: 'text-amber-100 hover:text-amber-200' },
    { label: 'KIDS', href: '#', className: 'text-amber-100 hover:text-amber-200' },
    { label: 'HOME', href: '#', className: 'text-amber-100 hover:text-amber-200' },
    { label: 'SALE', href: '#', className: 'text-red-300 hover:text-red-200' }
  ], []);

  const utilityLinks = useMemo(() => [
    { label: 'Our Stores', href: '/' },
    { label: 'About', href: '#' },
    { label: 'Concierge', href: '#' }
  ], []);

  const handleMouseEnter = (label: string): void => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    if (megaMenuData[label as keyof MegaMenuData]) {
      setActiveDropdown(label as DropdownKey);
      setIsHoveringDropdown(true);
      // Add a small delay to ensure smooth animation
      setTimeout(() => {
        setIsDropdownVisible(true);
      }, 50);
    }
  };

  const handleMouseLeave = (): void => {
    setIsHoveringDropdown(false);
    const timeout = setTimeout(() => {
      if (!isHoveringDropdown) {
        setIsDropdownVisible(false);
        // Wait for animation to complete before removing from DOM
        setTimeout(() => {
          setActiveDropdown(null);
        }, 500);
      }
    }, 200);
    setDropdownTimeout(timeout);
  };

  const handleDropdownMouseEnter = (): void => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setIsHoveringDropdown(true);
  };

  const handleDropdownMouseLeave = (): void => {
    setIsHoveringDropdown(false);
    const timeout = setTimeout(() => {
      setIsDropdownVisible(false);
      // Wait for animation to complete before removing from DOM
      setTimeout(() => {
        setActiveDropdown(null);
      }, 500);
    }, 200);
    setDropdownTimeout(timeout);
  };

  const handleMobileDropdownToggle = (label: string): void => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else if (megaMenuData[label as keyof MegaMenuData]) {
      setActiveDropdown(label as DropdownKey);
    }
  };

  return (
    <div className="relative">
      <header
        className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-[2560px] rounded-b-2xl px-2.5 lg:px-5 transition-all duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'
          } ${scrolled ? 'py-2 bg-[#006466]' : 'py-3 bg-transparent'}`}
      >
        {/* Mobile Header */}
        <div className="relative flex h-12 items-center justify-between lg:hidden">
          <div className="flex items-center">
            <button
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              className="relative inline-flex items-center justify-center rounded-md p-2 text-amber-200 hover:text-amber-100 transition-colors duration-200"
              onClick={toggleMenu}
              type="button"
              aria-label={isMenuOpen ? "Close main menu" : "Open main menu"}
            >
              {isMenuOpen ? (
                <X className="size-6" />
              ) : (
                <svg className="size-6" fill="none" viewBox="0 0 24 24">
                  <line stroke="currentColor" strokeWidth="1.5" x1="6.65" y1="7.5" x2="18.35" y2="7.5" />
                  <line stroke="currentColor" strokeWidth="1.5" x1="6.65" y1="12" x2="18.35" y2="12" />
                  <line stroke="currentColor" strokeWidth="1.5" x1="6.65" y1="16.5" x2="13.85" y2="16.5" />
                </svg>
              )}
            </button>
          </div>

          <div className="absolute inset-0 mx-auto flex max-w-[120px] items-center justify-center lg:relative">
            <Link href="/" title="LUXE">
              <div className="text-2xl font-light text-amber-200 tracking-wider hover:text-amber-100 transition-colors duration-200 cursor-pointer">
                LUXE
              </div>
            </Link>
          </div>

          <div className="flex items-center">
            <button title="View Cart" type="button" className="relative flex items-center p-2 text-amber-200 hover:text-amber-100 rounded-md transition-colors duration-200" aria-label="View Cart">
              <ShoppingBag className="size-6" />
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-medium text-gray-900 opacity-0 transition-opacity duration-200">
                0
              </span>
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="relative hidden h-14 items-center justify-between lg:flex">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 shrink-0 items-center">
              <Link href="/" title="LUXE">
                <div className="text-3xl font-light text-amber-200 tracking-wider hover:text-amber-100 transition-colors duration-200 cursor-pointer">
                  LUXE
                </div>
              </Link>
            </div>

            <nav className="flex flex-1 justify-center gap-10" role="navigation">
              {navigationItems.map((item) => (
                <div 
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link href={item.href}>
                    <div className={`relative text-sm font-light tracking-[0.2em] uppercase transition-colors duration-200 nav-item cursor-pointer ${item.className}`}>
                      {item.label}
                    </div>
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex flex-1 items-center justify-end gap-6">
              <ul className="flex items-center gap-4">
                {utilityLinks.map((link) => (
                  <li key={link.label} className="leading-none">
                    <Link href={link.href}>
                      <span className="text-xs text-gray-300 hover:text-amber-200 transition-colors duration-200 font-light tracking-wide cursor-pointer">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex items-center gap-3">
                <Link href="#">
                  <span className="p-2 text-amber-200 hover:text-amber-100 rounded-md transition-colors duration-200 cursor-pointer" title="Account" aria-label="Account">
                    <User className="size-5" />
                  </span>
                </Link>
                <Link href="#">
                  <span className="p-2 text-amber-200 hover:text-amber-100 rounded-md transition-colors duration-200 cursor-pointer" title="Help" aria-label="Help">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="8.5" stroke="currentColor" />
                      <path d="M12.1663 13.21C11.823 13.21 11.6333 12.8117 11.8497 12.5452L12.3899 11.88C12.8099 11.35 13.1999 10.9 13.1999 10.22C13.1999 9.53 12.7199 8.94 11.8299 8.94C11.4012 8.94 10.9454 9.08283 10.5371 9.34209C10.279 9.50592 9.85986 9.3386 9.85986 9.03294C9.85986 8.94772 9.89246 8.8651 9.95578 8.80807C10.4168 8.39293 11.1533 8.08 11.8899 8.08C13.3199 8.08 14.1199 9.09 14.1199 10.19C14.1199 11.09 13.5399 11.75 13.0699 12.34L12.4822 13.06C12.4048 13.1549 12.2888 13.21 12.1663 13.21ZM11.8199 14.29C12.1799 14.29 12.4599 14.56 12.4599 14.92C12.4599 15.28 12.1799 15.55 11.8199 15.55H11.8099C11.4499 15.55 11.1699 15.28 11.1699 14.92C11.1699 14.56 11.4499 14.29 11.8099 14.29H11.8199Z" fill="currentColor" />
                    </svg>
                  </span>
                </Link>
                <button title="View Cart" type="button" aria-label="View Cart" className="relative flex items-center p-2 text-amber-200 hover:text-amber-100 rounded-md transition-colors duration-200">
                  <ShoppingBag className="size-5" />
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-medium text-gray-900 opacity-0 transition-opacity duration-200">
                    0
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden bg-white border-t border-gray-200 rounded-b-2xl transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}>
          <div className="px-6 py-8 space-y-6">
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <div key={item.label}>
                  <button
                    onClick={() => handleMobileDropdownToggle(item.label)}
                    className={`w-full text-left text-lg font-light uppercase tracking-[0.15em] transition-colors duration-200 cursor-pointer flex items-center justify-between ${
                      item.label === 'SALE' 
                        ? 'text-red-600 hover:text-red-700' 
                        : 'text-gray-900 hover:text-gray-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {megaMenuData[item.label as keyof MegaMenuData] && (
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 text-gray-600 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  
                  {/* Mobile Dropdown Content */}
                  {activeDropdown === item.label && megaMenuData[item.label as keyof MegaMenuData] && (
                    <div className="mt-6 pl-6 space-y-8 border-l border-gray-200">
                      {megaMenuData[item.label as keyof MegaMenuData].categories.map((category, index) => (
                        <div key={index} className="space-y-4">
                          <div className="flex items-center space-x-4">
                            <img 
                              src={category.image} 
                              alt={category.title}
                              className="w-14 h-14 object-cover"
                            />
                            <h4 className="text-gray-900 font-medium text-base tracking-wide uppercase">{category.title}</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-4 ml-18">
                            {category.items.slice(0, 6).map((subItem, subIndex) => (
                              <Link key={subIndex} href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-light">
                                {subItem}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                      
                      {/* Featured section for mobile */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={megaMenuData[item.label as keyof MegaMenuData].featured.image} 
                            alt={megaMenuData[item.label as keyof MegaMenuData].featured.title}
                            className="w-20 h-20 object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-gray-500 text-xs font-medium tracking-wide uppercase mb-1">{megaMenuData[item.label as keyof MegaMenuData].featured.subtitle}</p>
                            <h4 className="text-gray-900 font-medium text-base mb-3">{megaMenuData[item.label as keyof MegaMenuData].featured.title}</h4>
                            <button className="bg-gray-900 text-white px-4 py-2 text-xs font-medium tracking-wide uppercase hover:bg-gray-800 transition-colors duration-200">
                              Shop Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-6 space-y-4">
              {utilityLinks.map((link) => (
                <Link key={link.label} href={link.href}>
                  <div className="block text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-light">
                    {link.label}
                  </div>
                </Link>
              ))}
              <Link href="#">
                <div className="block text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-light">Account</div>
              </Link>
              <Link href="#">
                <div className="block text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-light">Help</div>
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          .nav-item::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 1px;
            background: linear-gradient(90deg, #fbbf24, #eab308);
            transition: width 0.3s ease;
          }
          .nav-item:hover::after {
            width: 100%;
          }
        `}</style>
      </header>

      {/* Mega Menu Dropdown */}
      {activeDropdown && megaMenuData[activeDropdown] && (
        <div 
          className={`fixed left-0 right-0 z-40 bg-white shadow-2xl border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
            scrolled ? 'top-12' : 'top-16'
          } ${visible ? 'translate-y-0' : '-translate-y-full'} ${
            isDropdownVisible 
              ? 'max-h-[600px] opacity-100 transform translate-y-0' 
              : 'max-h-0 opacity-0 transform -translate-y-4'
          }`}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          {/* Desktop Mega Menu */}
          <div className="hidden lg:block max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-4 gap-16">
              {/* Categories */}
              {megaMenuData[activeDropdown].categories.map((category, index) => (
                <div key={index} className="space-y-8">
                  <div className="relative overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-full h-56 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <h3 className="text-white font-medium text-xl tracking-wide uppercase">{category.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 pl-2">
                    {category.items.map((item, itemIndex) => (
                      <Link key={itemIndex} href="#" className="block text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200 font-light">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              {/* Featured Section */}
              <div className="space-y-8">
                <div className="relative overflow-hidden">
                  <img 
                    src={megaMenuData[activeDropdown].featured.image} 
                    alt={megaMenuData[activeDropdown].featured.title}
                    className="w-full h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 right-8">
                    <p className="text-gray-300 text-sm font-medium mb-3 tracking-wide uppercase">{megaMenuData[activeDropdown].featured.subtitle}</p>
                    <h3 className="text-white font-medium text-3xl mb-6 tracking-wide">{megaMenuData[activeDropdown].featured.title}</h3>
                    <button className="bg-white text-black px-8 py-3 text-sm font-medium tracking-wide uppercase hover:bg-gray-100 transition-colors duration-200">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Mega Menu */}
          <div className="lg:hidden px-6 py-10 bg-white">
            <div className="space-y-10">
              {megaMenuData[activeDropdown].categories.map((category, index) => (
                <div key={index} className="space-y-5">
                  <div className="flex items-center space-x-5">
                    <img 
                      src={category.image} 
                      alt={category.title}
                      className="w-18 h-18 object-cover"
                    />
                    <h3 className="font-medium text-xl text-gray-900 tracking-wide uppercase">{category.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 pl-23">
                    {category.items.map((item, itemIndex) => (
                      <Link key={itemIndex} href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-light">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Mobile Featured Section */}
              <div className="pt-8 border-t border-gray-200">
                <div className="relative overflow-hidden">
                  <img 
                    src={megaMenuData[activeDropdown].featured.image} 
                    alt={megaMenuData[activeDropdown].featured.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-gray-300 text-xs font-medium tracking-wide uppercase mb-2">{megaMenuData[activeDropdown].featured.subtitle}</p>
                    <h3 className="text-white font-medium text-xl mb-4 tracking-wide">{megaMenuData[activeDropdown].featured.title}</h3>
                    <button className="bg-white text-black px-6 py-2.5 text-sm font-medium tracking-wide uppercase hover:bg-gray-100 transition-colors duration-200">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}