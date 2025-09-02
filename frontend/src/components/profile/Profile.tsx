'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { LucideLoader2, LogOut, ShoppingBag, HelpCircle, Ruler, Truck, RefreshCcw, Mail, Sparkles, ChevronDown, User, Shield } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { removeAuthToken } from '@/lib/utils/auth';
import { useQuery } from '@tanstack/react-query';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import Link from 'next/link';
import { Inter, Raleway } from 'next/font/google';

const raleway = Raleway({ subsets: ['latin'], weight: ['600'], variable: '--font-raleway' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-inter' });

type User = {
  id: string;
  email: string;
  name: string | null;
  role: { name: string };
};

interface PolicyItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  details: string;
}

const policyItems: PolicyItem[] = [
  {
    title: 'Customer Care',
    href: '/customer-care',
    icon: HelpCircle,
    details: 'Our team is available 24/7. Reach us at support@yourstore.com or call +1-800-555-1234.',
  },
  {
    title: 'Size Guide',
    href: '/size-guide',
    icon: Ruler,
    details: 'Find the perfect fit with our detailed size charts for clothing and shoes.',
  },
  {
    title: 'Returns & Exchanges',
    href: '/returns-exchanges',
    icon: RefreshCcw,
    details: 'Return or exchange items within 30 days. Free return shipping on orders over $50.',
  },
  {
    title: 'Shipping Info',
    href: '/shipping-info',
    icon: Truck,
    details: 'Free standard shipping on orders over $100. Delivery in 3-7 business days.',
  },
  {
    title: 'Contact',
    href: '/contact',
    icon: Mail,
    details: 'Email us at contact@yourstore.com or use our live chat for instant support.',
  },
  {
    title: 'Care Instructions',
    href: '/care-instructions',
    icon: Sparkles,
    details: 'Machine wash cold, hang dry, or dry clean for delicate fabrics.',
  },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [tappedButton, setTappedButton] = useState<string | null>(null);

  // Fetch user details from /api/auth/me
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch user data');
      }
      return response.user;
    },
    enabled: !!session?.accessToken,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login to view your profile');
      router.push('/login?redirect=/profile');
    }
  }, [status, router]);

  const handleLogout = async () => {
    useCartStore.getState().clearCart();
    removeAuthToken();
    await signOut({ callbackUrl: '/login' });
  };

  const handleToggleDropdown = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  const handleTouchStart = (title: string) => {
    setTappedButton(title);
  };

  const handleTouchEnd = () => {
    setTimeout(() => setTappedButton(null), 200);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={`flex justify-center items-center min-h-screen bg-gray-50 ${inter.className}`}>
        <div className="flex flex-col items-center">
          <LucideLoader2 className="animate-spin h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session || error) {
    toast.error(error?.message || 'Failed to load profile');
    router.push('/login?redirect=/profile');
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-50 pb-12 ${inter.className}`}>
      <div className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="pt-18 pb-2">
          <div className="flex items-center justify-between mb-2">
            <h1 className={`${raleway.className} text-sm font-semibold text-gray-600`}>My Account</h1>
            <button
              onClick={handleLogout}
              className="flex  items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
              data-formignore="true"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-5">
          <div className="flex items-center mb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-medium text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          
        </div>

        {/* My Orders Button */}
        <div className="mb-5">
          <button
            onClick={() => router.push('/orders')}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:border-gray-300 transition-colors"
            data-formignore="true"
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mr-3">
                <ShoppingBag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-left">My Orders</h3>
    
              </div>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400 transform rotate-270" />
          </button>
        </div>

        {/* Policy Dropdowns */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-700 text-sm uppercase mb-2">Support & Information</h3>

          {policyItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                onClick={() => handleToggleDropdown(item.title)}
                onTouchStart={() => handleTouchStart(item.title)}
                onTouchEnd={handleTouchEnd}
                className={`w-full flex items-center justify-between p-4 ${tappedButton === item.title ? 'bg-gray-50' : 'hover:bg-gray-50'
                  } transition-colors duration-150`}
                data-formignore="true"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${openDropdown === item.title ? 'rotate-180' : ''
                    }`}
                />
              </button>
              <div
                className={`transition-all duration-200 ease-in-out overflow-hidden ${openDropdown === item.title ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="p-4 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 mb-2">{item.details}</p>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}