'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

interface Product {
  name: string;
  price: number;
}

interface Item {
  quantity: number;
  product: Product;
}

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: Item[];
}

export default function UserOrdersPage() {
  const { userId } = useParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/orders`);
        setOrders(data);
      } catch (err: any) {
        setError('Failed to load orders');
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchOrders();
  }, [userId]);

  const filtered = statusFilter
    ? orders.filter((order) => order.status === statusFilter)
    : orders;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-14 px-3 sm:px-0">
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-lg sm:text-xl font-semibold">User Orders</h2>
        <Link href="/admin/users" className="mt-6 text-blue-600 hover:underline text-sm sm:text-base self-start sm:self-auto">
          ← Back to Users
        </Link>
      </div>

      {/* Status Filter */}
      <div className="mb-3 sm:mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded w-full sm:w-auto text-sm sm:text-base"
        >
          <option value="">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
          <option value="RETURNED">RETURNED</option>
        </select>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filtered.map((order) => (
          <div key={order.id} className="p-3 sm:p-4 bg-white rounded shadow">
            <div className="flex flex-col lg:flex-row lg:justify-between gap-3 lg:gap-4">
              <div className="space-y-1 sm:space-y-0">
                <p className="text-sm sm:text-base"><strong>Order ID:</strong> <span className="break-all">{order.id}</span></p>
                <p className="text-sm sm:text-base"><strong>Total:</strong> ₹{order.total}</p>
                <p className="text-sm sm:text-base">
                  <strong>Status:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                    order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <strong>Placed:</strong> {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="lg:max-w-md">
                <p className="font-semibold mb-2 text-sm sm:text-base">Items:</p>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs sm:text-sm bg-gray-50 p-2 rounded">
                      <span className="flex-1">{item.product.name}</span>
                      <span className="ml-2 text-nowrap">
                        × {item.quantity} (₹{item.product.price})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm sm:text-base">No orders match this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
