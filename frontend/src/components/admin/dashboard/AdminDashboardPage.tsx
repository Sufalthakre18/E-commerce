'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Eye,
  Activity,
  DollarSign
} from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard-overview'],
  queryFn: async () => {
    return await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/overview`);
  },
});


  if (isLoading) return (
    <div className="flex items-center justify-center min-h-96">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-200 rounded-full animate-spin border-t-slate-600"></div>
        <span className="text-sm sm:text-base text-slate-500">Loading dashboard...</span>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="text-center py-8">
      <div className="text-red-500 text-sm sm:text-base">Error loading dashboard</div>
    </div>
  );

  // Calculate growth percentages (mock data - you can replace with real calculations)
  const revenueGrowth = 12;
  const ordersGrowth = 8;
  const customersGrowth = 15;
  const targetProgress = Math.round((data.totalRevenue / data.monthlyTarget) * 100);

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-6 py-6 bg-slate-50 min-h-screen">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-slate-800">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Last updated: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`₹${data.totalRevenue.toLocaleString()}`}
          growth={revenueGrowth}
          icon={<DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-slate-800"
        />
        <StatCard 
          title="Total Orders" 
          value={data.totalOrders.toLocaleString()}
          growth={ordersGrowth}
          icon={<ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-slate-700"
        />
        <StatCard 
          title="Total Customers" 
          value={data.totalCustomers.toLocaleString()}
          growth={customersGrowth}
          icon={<Users className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-slate-600"
        />
        <StatCard 
          title="Monthly Target" 
          value={`₹${data.monthlyTarget.toLocaleString()}`}
          growth={targetProgress}
          icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
          color="bg-slate-600"
          isTarget={true}
        />
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
       
        {/* Target Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              Monthly Progress
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base text-slate-600">Revenue Target</span>
                <span className="text-sm sm:text-base font-semibold text-slate-800">{targetProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 sm:h-4">
                <div 
                  className="bg-slate-800 h-3 sm:h-4 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-lg sm:text-xl font-bold text-slate-800">
                    ₹{data.totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">Current</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-lg sm:text-xl font-bold text-slate-800">
                    ₹{data.monthlyTarget.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">Target</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-medium flex items-center gap-2 text-slate-800">
            <TrendingUp className="w-5 h-5 text-slate-600" />
            Top Performing Products
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.topProducts?.slice(0, 3).map((product: { name: string; quantitySold: number }, index: number) => (
              <div
                key={index}
                className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                      index === 0 ? 'bg-slate-700' : index === 1 ? 'bg-slate-600' : 'bg-slate-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg sm:text-xl font-bold text-slate-800">
                      {product.quantitySold}
                    </div>
                    <div className="text-xs text-slate-500">units sold</div>
                  </div>
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-800 truncate" title={product.name}>
                  {product.name}
                </div>
              </div>
            ))}
          </div>
          {(!data.topProducts || data.topProducts.length === 0) && (
            <div className="text-center py-8 text-slate-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm sm:text-base">No product data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100">
        <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-slate-100">
          <h2 className="text-lg sm:text-xl font-medium flex items-center gap-2 text-slate-800">
            <Eye className="w-5 h-5 text-slate-600" />
            Recent Orders
          </h2>
          <span className="text-xs sm:text-sm text-slate-500">{data.recentOrders.length} orders</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-600">Customer</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-600">Amount</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-600">Status</th>
                <th className="p-3 sm:p-4 text-xs sm:text-sm font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order: any, index: number) => (
                <tr key={order.id} className={`border-t hover:bg-slate-50 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}`}>
                  <td className="p-3 sm:p-4 text-sm sm:text-base text-slate-700">{order.user}</td>
                  <td className="p-3 sm:p-4 text-sm sm:text-base font-semibold text-slate-800">₹{order.total.toLocaleString()}</td>
                  <td className="p-3 sm:p-4">
                    <OrderStatus status={order.status} />
                  </td>
                  <td className="p-3 sm:p-4 text-xs sm:text-sm text-slate-500">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden p-4 space-y-3">
          {data.recentOrders.map((order: any) => (
            <div key={order.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-medium text-sm text-slate-700">{order.user}</div>
                  <div className="text-xs text-slate-500">{new Date(order.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm text-slate-800">₹{order.total.toLocaleString()}</div>
                  <OrderStatus status={order.status} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function StatCard({ 
  title, 
  value, 
  growth, 
  icon, 
  color, 
  isTarget = false 
}: { 
  title: string; 
  value: string | number; 
  growth: number;
  icon: React.ReactNode;
  color: string;
  isTarget?: boolean;
}) {
  const isPositive = growth > 0;
  const GrowthIcon = isPositive ? ArrowUpRight : ArrowDownRight;
  
  return (
    <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-slate-100 hover:shadow transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`${color} text-white p-2 sm:p-3 rounded-md flex items-center justify-center`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs sm:text-sm ${
          isTarget ? 'text-slate-700' : isPositive ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {!isTarget && <GrowthIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
          {growth}%
        </div>
      </div>
      <div className="text-xs sm:text-sm text-slate-500 mb-1">{title}</div>
      <div className="text-lg sm:text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}



// Order Status Component
function OrderStatus({ status, size = "default" }: { status: string; size?: "sm" | "default" }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return 'bg-emerald-50 text-emerald-800';
      case 'pending': return 'bg-amber-50 text-amber-700';
      case 'cancelled': return 'bg-rose-50 text-rose-700';
      case 'processing': return 'bg-slate-50 text-slate-800';
      default: return 'bg-slate-50 text-slate-800';
    }
  };

  const sizeClass = size === "sm" ? "px-2 py-1 text-xs" : "px-2 sm:px-3 py-1 text-xs sm:text-sm";

  return (
    <span className={`${getStatusColor(status)} ${sizeClass} rounded-full font-medium`}>{status}</span>
  );
}
