
'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const HeaderWrapper = () => {
  const pathname = usePathname();
  const hideHeaderPages = ['/admin']; // Add more if needed
  const showHeader = !hideHeaderPages.includes(pathname);

  return showHeader ? <Header /> : null;
};

export default HeaderWrapper;
