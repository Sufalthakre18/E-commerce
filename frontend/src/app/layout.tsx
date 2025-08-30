'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { Toaster } from 'sonner';
import Header from '@/components/layout/Header';
import './globals.css';
import { usePathname } from 'next/navigation';


const noHeaderRoutes = ['/admin', '/cart'];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname= usePathname();
  return (
    <html lang="en">
      <body className="font-raleway">
        <ReactQueryProvider>
          <SessionProvider>
            {!noHeaderRoutes.includes(pathname) && <Header />}
            <main>{children}</main>
            <Toaster />
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}