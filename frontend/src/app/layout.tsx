import { Inter } from 'next/font/google';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import './globals.css';
import { Toaster } from 'sonner';
import HeaderWrapper from '@/components/layout/HeaderWrapper';

const inter = Inter({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
     <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <HeaderWrapper/>
          <main className="min-h-screen">{children}</main>
          
        </ReactQueryProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}