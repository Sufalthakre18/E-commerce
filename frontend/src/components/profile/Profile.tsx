'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { LucideLoader2, LogOut, ShoppingBag, HelpCircle, Ruler, Truck, RefreshCcw, Mail, Sparkles, ChevronDown } from 'lucide-react';
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
      <div className={`flex justify-center items-center min-h-screen bg-gradient-to-br from-white to-gray-50 ${inter.className}`}>
        <LucideLoader2 className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  if (!session || error) {
    toast.error(error?.message || 'Failed to load profile');
    router.push('/login?redirect=/profile');
    return null;
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-white to-gray-50 py-6 px-4 sm:px-6 lg:px-8 ${inter.className}`}>
      <div className="mt-4 max-w-3xl mx-auto space-y-4">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className={`${raleway.className} text-2xl font-semibold text-gray-900 mb-3 sm:mb-0`}>Your Profile</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors text-sm font-medium"
              data-formignore="true"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase font-medium">Name</p>
              <p className="text-sm text-gray-900">{user?.name || 'Not provided'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase font-medium">Email</p>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 uppercase font-medium">Role</p>
              <p className="text-sm text-gray-900 capitalize">{user?.role.name.toLowerCase()}</p>
            </div>
          </div>
        </div>

        {/* My Orders Button */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <button
            onClick={() => router.push('/orders')}
            className="w-full bg-black text-white py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors duration-200"
            data-formignore="true"
          >
            <ShoppingBag className="w-4 h-4" />
            My Orders
          </button>
        </div>

        {/* Policy Dropdowns */}
        <div className="space-y-3">
          {policyItems.map((item, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-4">
              <button
                onClick={() => handleToggleDropdown(item.title)}
                onTouchStart={() => handleTouchStart(item.title)}
                onTouchEnd={handleTouchEnd}
                className={`w-full flex items-center justify-between text-base font-semibold text-gray-900 ${
                  tappedButton === item.title ? 'text-red-700' : 'hover:text-red-700'
                } transition-colors duration-200`}
                data-formignore="true"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-indigo-600" />
                  <span className={raleway.className}>{item.title}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.title ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`transition-max-height duration-200 ease-in-out overflow-hidden ${
                  openDropdown === item.title ? 'max-h-32' : 'max-h-0'
                }`}
              >
                <div className="mt-3">
                  <p className="text-xs text-gray-600 leading-relaxed">{item.details}</p>
                  <Link
                    href={item.href}
                    className="inline-block mt-2 text-xs text-gray-800 hover:text-red-700 transition-colors duration-200"
                    data-formignore="true"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
}