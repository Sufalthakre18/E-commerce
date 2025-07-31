import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import { ReactQueryProvider } from '@/lib/react-query-provider';
import './globals.css';

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
          <Header />
          <main className="min-h-screen">{children}</main>
          
        </ReactQueryProvider>
      </body>
    </html>
  );
}