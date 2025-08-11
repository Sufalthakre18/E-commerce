'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { LucideLoader2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { removeAuthToken } from '@/lib/utils/auth';
import { useQuery } from '@tanstack/react-query';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: { name: string };
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
    enabled: !!session?.accessToken, // Only fetch if session and token exist
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LucideLoader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!session || error) {
    toast.error(error?.message || 'Failed to load profile');
    router.push('/login?redirect=/profile');
    return null;
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p>Name: {user?.name || 'Not provided'}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role.name}</p>
      <button
        onClick={handleLogout}
        className="mt-4 bg-red-600 text-white py-2 px-4 rounded-md"
      >
        Logout
      </button>
      <Toaster />
    </div>
  );
}