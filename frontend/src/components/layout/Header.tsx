'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCartStore } from '@/store/cart';
import { ShoppingBag, X, LogOut, Package } from 'lucide-react';
import { Source_Sans_3, Cinzel } from 'next/font/google';
import { removeAuthToken } from '@/lib/utils/auth';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'] });
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

type DropdownKey = 'APPAREL' | 'HOME' | 'CREATIVE' | 'EDUCORE' | null;

interface Category {
  title: string;
  items: string[];
  image: string;
  href: string;
}

interface Featured {
  title: string;
  subtitle: string;
  image: string;
}

interface MegaMenuSection {
  categories: Category[];
  featured?: Featured[];
}

type MegaMenuData = {
  [K in Exclude<DropdownKey, null>]: MegaMenuSection;
};

export default function Header() {
  const { data: session } = useSession();
  const { totalItems } = useCartStore();
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
  const [isClient, setIsClient] = useState<boolean>(false); // Track client-side rendering
  const [isClosing, setIsClosing] = useState<boolean>(false); // For smooth closing animation

  useEffect(() => {
    setIsClient(true); // Set to true after component mounts on client
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

  // Close mobile menu when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (isMenuOpen) {
        closeMobileMenu();
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isMenuOpen]);

  const toggleMenu = useCallback(() => {
    if (isMenuOpen) {
      closeMobileMenu();
    } else {
      setIsMenuOpen(true);
      setIsClosing(false);
    }
  }, [isMenuOpen]);

  const closeMobileMenu = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMenuOpen(false);
      setIsClosing(false);
      setActiveDropdown(null); // Reset dropdown when closing menu
    }, 300); // Match this with the CSS transition duration
  }, []);

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
    APPAREL: {
      categories: [
        {
          title: 'Man',
          items: ["Oversized Tees", "Polo Tees", "Hoodies", "Tank tops", "Shorts", "Caps"],
          image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?w=300&h=200&fit=crop',
          href: '/apparel/man',
        },
        {
          title: 'Woman',
          items: ["Oversized Tees", "Hoodies", "Tote bags", "Caps"],
          image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=200&fit=crop',
          href: '/apparel/woman',
        },
      ]
    },
    HOME: {
      categories: [
        {
          title: 'All Décor',
          items: ["Canvas Prints", "Posters", "Acrylic Posters", "Framed Art", "Stickers", "Coasters", "Notepads"],
          image: 'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=300&h=200&fit=crop',
          href: '/home/decor',
        },
        {
          title: 'Stationary',
          items: ["Notebooks", "Journals", "Phone Cases"],
          image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=300&h=200&fit=crop',
          href: '/home/stationary'
        },
      ],
    },
    CREATIVE: {
      categories: [
        {
          title: 'Design Assets & Mockups',
          items: ['Vectors', 'Icons', 'Mockups', 'Patterns', 'Textures', 'Fonts'],
          image: 'https://images.unsplash.com/photo-1529059997563-6c3d0b6c0b98?w=300&h=200&fit=crop',
          href: '/digitaltools/asset'
        },
        {
          title: 'Templates & Marketing Kits',
          items: ['Website Templates', 'Email Templates', 'Social Media Kits', 'Presentation Templates', 'Brochures'],
          image: 'https://images.unsplash.com/photo-1529059997563-6c3d0b6c0b98?w=300&h=200&fit=crop',
          href: '/digitaltools/kits'
        },
        {
          title: 'Audio & Media Packs',
          items: ['Sound Effects', 'Music Tracks', 'Stock Video', 'Animations', 'Podcast Kits'],
          image: 'https://images.unsplash.com/photo-1529059997563-6c3d0b6c0b98?w=300&h=200&fit=crop',
          href: '/digitaltools/packs'
        },
      ],
    },
    EDUCORE: {
      categories: [
        {
          title: 'Study Planners & Trackers',
          items: ['Weekly Planners', 'Daily Trackers', 'Habit Trackers', 'Focus Timers', 'Progress Dashboards'],
          image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=300&h=200&fit=crop',
          href: '/educore/study'
        },
        {
          title: 'Exam Prep Resources',
          items: ['Practice Tests', 'Flashcards', 'Cheat Sheets', 'Revision Schedules', 'Answer Explanations'],
          image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=300&h=200&fit=crop',
          href: '/educore/resources'
        },
        {
          title: 'Gamified Learning Packs',
          items: ['Math Games', 'Language Quests', 'Reward Systems', 'Level-based Courses', 'Interactive Challenges'],
          image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=300&h=200&fit=crop',
          href: '/educore/gamified'
        },
      ],
    },
  };

  const navigationItems = useMemo(
    () => [
      { label: 'APPAREL', title: 'Apparel', href: '/apparel', className: 'text-gray-900 hover:text-gray-700' },
      { label: 'HOME', title: 'Home', href: '/home', className: 'text-gray-900 hover:text-gray-700' },
      { label: 'CREATIVE', title: 'Creative & Business', href: '/digitaltools', className: 'text-gray-900 hover:text-gray-700' },
      { label: 'EDUCORE', title: 'EDUCORE', href: '/educore', className: 'text-gray-900 hover:text-gray-700' },
    ],
    []
  );

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

  const handleLogout = async () => {
    useCartStore.getState().clearCart();
    removeAuthToken();
    await signOut({ callbackUrl: '/login' });
  };

  const userLinks = useMemo(() => {
    if (session) {
      return (
        <>
          <Link href="/profile" onClick={closeMobileMenu} className={`block text-sm ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200`}>
            Profile
          </Link>
          <Link href="/orders" onClick={closeMobileMenu} className={`block text-sm ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200`}>
            Orders
          </Link>
          <button
            onClick={handleLogout}
            className={`block text-sm ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200 flex items-center gap-2`}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </>
      );
    }
    return (
      <>
        <Link href="/login" onClick={closeMobileMenu} className={`block text-sm ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200`}>
          Login
        </Link>
      </>
    );
  }, [session, closeMobileMenu]);

  const desktopUserLinks = useMemo(() => {
    if (session) {
      return (
        <>
          <Link href="/profile" title="Profile">
            <span className={`p-2 ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-light`}>Profile</span>
          </Link>
          <Link href="/orders" title="my orders">
            <button
              type="button"
              className="relative flex items-center p-2 text-gray-800 hover:text-red-700 rounded-md transition-colors duration-200"
            >
              <Package className="size-5" />
            </button>
          </Link>
        </>
      );
    }
    return (
      <>
        <Link href="/login" title="Login">
          <span className={`p-2 ${sourceSansPro.className} text-gray-800 hover:text-red-700 transition-colors duration-200 cursor-pointer text-sm font-light`}>Login</span>
        </Link>
      </>
    );
  }, [session]);

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
            aria-label={isMenuOpen ? 'Close main menu' : 'Open main menu'}
            data-formignore="true"
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
          <Link href="/" title="Your Store" onClick={closeMobileMenu} className="absolute inset-0 mx-auto flex max-w-[120px] items-center justify-center lg:relative">
            <span className={`${cinzel.className} text-2xl font-semibold text-gray-900 tracking-wider hover:text-gray-700 transition-colors duration-200 cursor-pointer`}>
              Your Store
            </span>
          </Link>
          <div className="flex items-center">
            <Link href="/cart" title="View Cart" onClick={closeMobileMenu}>
              {isClient ? (
                <button
                  type="button"
                  className="relative flex items-center p-2 text-gray-900 hover:text-red-700 rounded-md transition-colors duration-200"
                  aria-label="View Cart"
                  data-formignore="true"
                >
                  <ShoppingBag className="size-6" />
                  <span
                    className={`absolute -top-1 -right-1 flex ${cartItemCount > 9 ? 'size-5' : 'size-4'} items-center justify-center rounded-full bg-red-700 text-[10px] text-white transition-all duration-300 ${cartItemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                      } ${pulseBadge ? 'animate-pulse-cart' : ''}`}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  className="relative flex items-center p-2 text-gray-900 hover:text-red-700 rounded-md transition-colors duration-200"
                  aria-label="View Cart"
                  data-formignore="true"
                >
                  <ShoppingBag className="size-6" />
                </button>
              )}
            </Link>
          </div>
        </div>
        {/* Desktop Header */}
        <div className="relative hidden h-14 items-center justify-between lg:flex">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 shrink-0 items-center">
              <Link href="/" title="Your Store">
                <span className={`${cinzel.className} text-3xl font-semibold text-gray-900 tracking-wider hover:text-gray-700 transition-colors duration-200 cursor-pointer`}>
                  Your Store
                </span>
              </Link>
            </div>
            <nav className="flex flex-2 justify-center gap-10" role="navigation">
              {navigationItems.map((item) => (
                <div key={item.label} className="relative" onMouseEnter={() => handleMouseEnter(item.label)} onMouseLeave={handleMouseLeave}>
                  <Link href={item.href}>
                    <span className={`relative text-sm ${sourceSansPro.className} font-light tracking-[0.2em] uppercase transition-colors duration-200 nav-item cursor-pointer ${item.className}`}>
                      {item.title}
                    </span>
                  </Link>
                </div>
              ))}
            </nav>
            <div className="flex flex-1 items-center justify-end gap-6">
              <ul className="flex items-center gap-4">{desktopUserLinks}</ul>
              <div className="flex items-center gap-3">
                <Link href="/cart" title="View Cart">
                  {isClient ? (
                    <button
                      type="button"
                      className="relative flex items-center p-2 text-gray-800 hover:text-red-700 rounded-md transition-colors duration-200"
                      aria-label="View Cart"
                      data-formignore="true"
                    >
                      <ShoppingBag className="size-5" />
                      <span
                        className={`absolute -top-1 -right-1 flex ${cartItemCount > 9 ? 'size-5' : 'size-4'} items-center justify-center rounded-full bg-red-700 text-[10px] text-white transition-all duration-300 ${cartItemCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                          } ${pulseBadge ? 'animate-pulse-cart' : ''}`}
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="relative flex items-center p-2 text-gray-800 hover:text-red-700 rounded-md transition-colors duration-200"
                      aria-label="View Cart"
                      data-formignore="true"
                    >
                      <ShoppingBag className="size-5" />
                    </button>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile Menu (Full-screen overlay) */}
        <div
          className={`fixed inset-0 z-40 bg-white transition-transform duration-500 ease-in-out lg:hidden ${isMenuOpen && !isClosing ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="flex h-12 items-center justify-between px-2.5">
            <button className="p-2" onClick={toggleMenu} aria-label="Close menu" data-formignore="true">
              <X className="size-6 text-gray-900" />
            </button>
            <Link href="/" title="Your Store" onClick={closeMobileMenu}>
              <span className={`${cinzel.className} text-2xl font-semibold text-gray-900 tracking-wider`}>Your Store</span>
            </Link>
            <div className="p-2 w-10"></div> {/* Spacer for alignment */}
          </div>
          <div className="overflow-y-auto h-[calc(100vh-48px)] py-8 px-6 bg-stone-100/93">
            <div className="space-y-6">
              {navigationItems.map((item) => (
                <div key={item.label} className="border-b border-gray-200">
                  <div className="flex items-center justify-between py-4">
                    <Link 
                      href={item.href} 
                      onClick={closeMobileMenu}
                      className="text-l font-normal uppercase tracking-wide text-gray-900"
                      style={{ fontFamily: cinzel.style.fontFamily }}
                    >
                      {item.title}
                    </Link>
                    {megaMenuData[item.label as keyof MegaMenuData] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMobileDropdownToggle(item.label);
                        }}
                        className="p-1"
                        data-formignore="true"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform duration-200 text-gray-600 ${activeDropdown === item.label ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  {activeDropdown === item.label && megaMenuData[item.label as keyof MegaMenuData] && (
                    <div className="py-4 space-y-6">
                      {megaMenuData[item.label as keyof MegaMenuData].categories.map((category, index) => (
                        <div key={index}>
                          <Link href={category.href} onClick={closeMobileMenu}>
                            <h4 className={`text-lg ${sourceSansPro.className} font-medium uppercase border-b-1 tracking-wider text-gray-500 mb-4`}>{category.title}</h4>
                          </Link>
                          <div className="grid grid-cols-2 gap-4">
                            {category.items.map((subItem, subIndex) => (
                              <Link
                                key={subIndex}
                                href="#"
                                className={`text-xs ${sourceSansPro.className} text-gray-700 hover:text-red-700 transition-colors duration-200 font-light`}
                                onClick={closeMobileMenu}
                              >
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
              <div className={`pt-4 space-y-4 ${sourceSansPro.className} font-light`}>{userLinks}</div>
            </div>
          </div>
        </div>
      </header>
      {/* Mega Menu Dropdown */}
      {activeDropdown && megaMenuData[activeDropdown] && (
        <div
          className={`fixed left-0 right-0 z-40 bg-stone-100/95 shadow-2xl border-t border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${scrolled ? 'top-12' : 'top-16'
            } ${visible ? 'translate-y-0' : '-translate-y-full'} ${isDropdownVisible ? 'max-h-[600px] opacity-100 transform translate-y-0' : 'max-h-0 opacity-0 transform -translate-y-4'
            }`}
          onMouseEnter={handleDropdownMouseEnter}
          onMouseLeave={handleDropdownMouseLeave}
        >
          <div className="hidden lg:block max-w-7xl mx-auto px-8 py-10">
            <div className="grid grid-cols-4 gap-16">
              {megaMenuData[activeDropdown].categories.map((category, index) => (
                <div key={index} className="space-y-8">
                  <div className="relative overflow-hidden">
                    <img src={category.image} alt={category.title} className="w-full h-56 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-6 left-6">
                      <Link href={category.href}><h3 className={`text-white ${cinzel.className} font-medium text-xl tracking-wide uppercase`}>{category.title}</h3></Link>
                    </div>
                  </div>
                  <div className="space-y-3 pl-2">
                    {category.items.map((item, itemIndex) => (
                      <Link
                        key={itemIndex}
                        href="#"
                        className={`block text-sm ${sourceSansPro.className} text-slate-600 hover:text-slate-900 transition-colors duration-200 font-light`}
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

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