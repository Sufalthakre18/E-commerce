'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import { Toaster } from 'sonner';
import Header from '@/components/layout/Header';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-raleway">
        <ReactQueryProvider>
          <SessionProvider>
            <Header />
            <main>{children}</main>
            <Toaster />
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}