'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, User, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';

type DropdownKey = 'MEN' | 'WOMEN' | 'HOME' | null;

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

// Mock user authentication state for demonstration
// In a real application, this would come from a global state management library or API call
const mockUser = {
  isLoggedIn: true,
  isAdmin: true,
};

// ===============================================
// === Header Component
// ===============================================

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);
  const [visible, setVisible] = useState<boolean>(true);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [isHoveringDropdown, setIsHoveringDropdown] = useState<boolean>(false);
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
  const [pulseBadge, setPulseBadge] = useState<boolean>(false);
  const [cartItemCount, setCartItemCount] = useState<number>(0);
  const { totalItems } = useCartStore();

  useEffect(() => {
    setCartItemCount(totalItems());
    const unsubscribe = useCartStore.subscribe((state) => {
      const newCount = state.totalItems();
      setCartItemCount(newCount);
      if (newCount > cartItemCount) {
        setPulseBadge(true);
        setTimeout(() => setPulseBadge(false), 300);
      }
    });
    return unsubscribe;
  }, [totalItems, cartItemCount]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
    if (!isMenuOpen) {
      setActiveDropdown(null);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isMobile = window.innerWidth < 1024;

      if (currentScrollY > 200 && activeDropdown) {
        setActiveDropdown(null);
        setIsHoveringDropdown(false);
        setIsDropdownVisible(false);
      }

      if (isMobile && isMenuOpen) {
        setVisible(true);
      } else {
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
    { label: 'MEN', href: '#', className: 'text-gray-900 hover:text-gray-700' },
    { label: 'WOMEN', href: '#', className: 'text-gray-900 hover:text-gray-700' },
    { label: 'HOME', href: '#', className: 'text-gray-900 hover:text-gray-700' },
  ], []);

  const handleMouseEnter = (label: string): void => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    if (megaMenuData[label as keyof MegaMenuData]) {
      setActiveDropdown(label as DropdownKey);
      setIsHoveringDropdown(true);
      setTimeout(() => {
        setIsDropdownVisible(true);
      }, 50);
    }
  };

  const handleMouseLeave = useCallback((): void => {
    setIsHoveringDropdown(false);
    const timeout = setTimeout(() => {
      if (!isHoveringDropdown) {
        setIsDropdownVisible(false);
        setTimeout(() => {
          setActiveDropdown(null);
        }, 300);
      }
    }, 200);
    setDropdownTimeout(timeout);
  }, [isHoveringDropdown]);

  const handleDropdownMouseEnter = (): void => {
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout);
      setDropdownTimeout(null);
    }
    setIsHoveringDropdown(true);
  };

  const handleDropdownMouseLeave = useCallback((): void => {
    setIsHoveringDropdown(false);
    const timeout = setTimeout(() => {
      setIsDropdownVisible(false);
      setTimeout(() => {
        setActiveDropdown(null);
      }, 300);
    }, 200);
    setDropdownTimeout(timeout);
  }, []);

  const handleMobileDropdownToggle = (label: string): void => {
    if (activeDropdown === label) {
      setActiveDropdown(null);
    } else if (megaMenuData[label as keyof MegaMenuData]) {
      setActiveDropdown(label as DropdownKey);
    }
  };

  // User links based on authentication status
  const userLinks = useMemo(() => {
    if (mockUser.isLoggedIn && mockUser.isAdmin) {
      return (
        <>
          <Link href="/admin" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
            Admin Dashboard
          </Link>
          <Link href="/logout" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
            Logout
          </Link>
        </>
      );
    }
    if (mockUser.isLoggedIn) {
      return (
        <>
          <Link href="/profile" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
            Profile
          </Link>
          <Link href="/logout" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
            Logout
          </Link>
        </>
      );
    }
    return (
      <>
        <Link href="/login" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
          Login
        </Link>
        <Link href="/register" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
          Register
        </Link>
      </>
    );
  }, []);

  const desktopUserLinks = useMemo(() => {
    if (mockUser.isLoggedIn && mockUser.isAdmin) {
      return (
        <>
          <Link href="/admin" title="Admin Dashboard">
            <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Admin</span>
          </Link>
          <Link href="/logout" title="Logout">
            <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Logout</span>
          </Link>
        </>
      );
    }
    if (mockUser.isLoggedIn) {
      return (
        <>
          <Link href="/profile" title="Profile">
            <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Profile</span>
          </Link>
          <Link href="/logout" title="Logout">
            <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Logout</span>
          </Link>
        </>
      );
    }
    return (
      <>
        <Link href="/login" title="Login">
          <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Login</span>
        </Link>
        <Link href="/register" title="Register">
          <span className="p-2 text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-raleway font-light">Register</span>
        </Link>
      </>
    );
  }, []);

  return (
    <div className="relative">
      <header
        className={`fixed top-0 left-0 right-0 z-50 mx-auto max-w-[2560px] rounded-b-2xl px-2.5 lg:px-8 transition-all duration-300 ease-in-out ${visible ? 'translate-y-0' : '-translate-y-full'
          } ${scrolled ? 'py-2 bg-white shadow-md' : 'py-3 bg-transparent'}`}
      >
        {/* Mobile Header */}
        <div className="relative flex h-12 items-center justify-between lg:hidden">
          <button
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-900 hover:text-gray-600 transition-colors duration-200"
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
          
          <Link href="/" title="LUXE" className="absolute inset-0 mx-auto flex max-w-[120px] items-center justify-center lg:relative">
            <span className="text-2xl font-cinzel font-light text-gray-900 tracking-wider hover:text-gray-700 transition-colors duration-200 cursor-pointer">
              LUXE
            </span>
          </Link>
          
          <div className="flex items-center">
            <Link href="/cart" title="View Cart">
              <button type="button" className="relative flex items-center p-2 text-gray-900 hover:text-gray-700 rounded-md transition-colors duration-200" aria-label="View Cart">
                <ShoppingBag className="size-6" />
                <span
                  className={`absolute -top-1 -right-1 flex ${cartItemCount > 9 ? 'size-5' : 'size-4'} items-center justify-center rounded-full bg-red-700 text-[10px] font-raleway font-medium text-white transition-all duration-300 ${cartItemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} ${pulseBadge ? 'animate-pulse-cart' : ''}`}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="relative hidden h-14 items-center justify-between lg:flex">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 shrink-0 items-center">
              <Link href="/" title="LUXE">
                <span className="text-3xl font-cinzel font-light text-gray-900 tracking-wider hover:text-gray-700 transition-colors duration-200 cursor-pointer">
                  LUXE
                </span>
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
                    <span className={`relative text-sm font-raleway font-light tracking-[0.2em] uppercase transition-colors duration-200 nav-item cursor-pointer ${item.className}`}>
                      {item.label}
                    </span>
                  </Link>
                </div>
              ))}
            </nav>

            <div className="flex flex-1 items-center justify-end gap-6">
              <ul className="flex items-center gap-4">
                {desktopUserLinks}
              </ul>

              <div className="flex items-center gap-3">
                <Link href="#" title="Search">
                  <span className="p-2 text-gray-800 hover:text-red-700 rounded-md transition-colors duration-200 cursor-pointer" aria-label="Search">
                    {/* Add a search icon here if needed */}
                  </span>
                </Link>
                <Link href="/cart" title="View Cart">
                  <button type="button" className="relative flex items-center p-2 text-gray-800 hover:text-red-700 rounded-md transition-colors duration-200" aria-label="View Cart">
                    <ShoppingBag className="size-5" />
                    <span
                      className={`absolute -top-1 -right-1 flex ${cartItemCount > 9 ? 'size-5' : 'size-4'} items-center justify-center rounded-full bg-red-700 text-[10px] font-raleway font-medium text-white transition-all duration-300 ${cartItemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'} ${pulseBadge ? 'animate-pulse-cart' : ''}`}
                    >
                      {cartItemCount > 99 ? '99+' : cartItemCount}
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu (Full-screen overlay) */}
        <div className={`fixed inset-0 z-40 bg-white transition-transform duration-500 ease-in-out lg:hidden ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-12 items-center justify-between px-2.5">
            <button
              className="p-2"
              onClick={toggleMenu}
              aria-label="Close menu"
            >
              <X className="size-6 text-gray-900" />
            </button>
            <Link href="/" title="LUXE" onClick={toggleMenu}>
              <span className="text-2xl font-cinzel font-light text-gray-900 tracking-wider">LUXE</span>
            </Link>
            <div className="p-2 w-10"></div> {/* Spacer for alignment */}
          </div>
          <div className="overflow-y-auto h-[calc(100vh-48px)] py-8 px-6 bg-stone-100">
            <div className="space-y-6">
              {navigationItems.map((item) => (
                <div key={item.label} className="border-b border-gray-200">
                  <button
                    onClick={() => handleMobileDropdownToggle(item.label)}
                    className="w-full py-4 text-left text-lg font-cinzel font-normal uppercase tracking-wide flex items-center justify-between text-gray-900"
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
                  {activeDropdown === item.label && megaMenuData[item.label as keyof MegaMenuData] && (
                    <div className="py-4 space-y-6">
                      {megaMenuData[item.label as keyof MegaMenuData].categories.map((category, index) => (
                        <div key={index}>
                          <h4 className="text-sm font-raleway font-medium uppercase tracking-wider text-gray-500 mb-4">{category.title}</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {category.items.map((subItem, subIndex) => (
                              <Link key={subIndex} href="#" className="text-sm text-gray-700 hover:text-red-700 transition-colors duration-200 font-raleway font-light" onClick={toggleMenu}>
                                {subItem}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 space-y-4 font-raleway font-light">
                {userLinks}
                <Link href="#" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
                  Our Stores
                </Link>
                <Link href="#" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
                  About
                </Link>
                <Link href="#" className="block text-sm text-gray-800 hover:text-red-700 transition-colors duration-200">
                  Concierge
                </Link>
              </div>
            </div>
          </div>
        </div>
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
          <div className="hidden lg:block max-w-7xl mx-auto px-8 py-16">
            <div className="grid grid-cols-4 gap-16">
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
                      <h3 className="text-white font-cinzel font-medium text-xl tracking-wide uppercase">{category.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 pl-2">
                    {category.items.map((item, itemIndex) => (
                      <Link key={itemIndex} href="#" className="block text-sm text-slate-600 hover:text-slate-900 transition-colors duration-200 font-raleway font-light">
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
                    <p className="text-gray-300 text-sm font-raleway font-medium tracking-wide uppercase mb-3">{megaMenuData[activeDropdown].featured.subtitle}</p>
                    <h3 className="text-white font-cinzel font-medium text-3xl mb-6 tracking-wide">{megaMenuData[activeDropdown].featured.title}</h3>
                    <button className="bg-white text-black px-8 py-3 text-sm font-raleway font-medium tracking-wide uppercase hover:bg-gray-100 transition-colors duration-200">
                      Shop Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .nav-item::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 1px;
          background: linear-gradient(90deg, #991b1b, #b91c1c);
          transition: width 0.3s ease;
        }
        .nav-item:hover::after {
          width: 100%;
        }
        @keyframes pulse-cart {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-pulse-cart {
          animation: pulse-cart 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}