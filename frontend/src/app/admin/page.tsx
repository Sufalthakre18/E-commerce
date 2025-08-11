'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { LucideLoader2 } from 'lucide-react';
import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboardPage from '@/components/admin/dashboard/AdminDashboardPage';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      toast.error('Please login as admin');
      router.push('/login?redirect=/admin');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      toast.error('Access denied: Admins only');
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LucideLoader2 className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') return null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AdminLayout>
        <section>
        <AdminDashboardPage/>
      </section>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="mt-4 bg-red-600 text-white py-2 px-4 rounded-md"
      >
        Logout
      </button>
      <Toaster />
      </AdminLayout>
    </div>
  );
}