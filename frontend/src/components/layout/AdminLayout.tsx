'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  RefreshCw, 
  Folder, 
  Users, 
  Star, 
  Tag, 
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Refunds', path: '/admin/refunds', icon: RefreshCw },
  { name: 'Categories', path: '/admin/categories', icon: Folder },
  { name: 'Users', path: '/admin/users', icon: Users },
  { name: 'Reviews', path: '/admin/reviews', icon: Star },
  { name: 'Promotions', path: '/admin/promotions', icon: Tag },
  { name: 'Logout', path: '/admin/logout', icon: LogOut }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          <button 
            onClick={closeSidebar}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                  ${item.name === 'Logout' ? 'mt-auto border-t border-gray-200 pt-4' : ''}
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <LayoutDashboard className="w-4 h-4" />
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span className="font-medium text-gray-900 capitalize">
                  {pathname.split('/').pop() || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900">Welcome back!</div>
                <div className="text-xs text-gray-500">Admin Dashboard</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-full">
            <div className="p-4 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}