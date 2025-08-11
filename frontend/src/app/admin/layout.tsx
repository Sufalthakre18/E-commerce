import { Inter } from 'next/font/google';
import { ReactQueryProvider } from '@/lib/react-query-provider';


const inter = Inter({
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={inter.className}> {/* ⬅️ apply font here */}
      <ReactQueryProvider>
        
        <main>{children}</main>
      </ReactQueryProvider>
    </div>
  );
}
