'use client';

import { useEffect, useState } from 'react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Source_Sans_3, Cinzel } from 'next/font/google';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Premium fonts
const cinzel = Cinzel({ subsets: ['latin'], weight: '600' });
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  payment?: { method: string; transactionId?: string };
  items: {
    id: string;
    orderId: string;
    quantity: number;
    size?: { id: string; size: string };
    variant?: { id: string; color: string; colorCode: string; price: number };
    product: { name: string; price: number; images?: { url: string }[] };
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/user`);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className={`${sourceSansPro.className} text-gray-600 text-sm`}>Loading your orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className={`${sourceSansPro.className} text-gray-600 text-sm`}>No orders placed yet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className={`${cinzel.className} text-3xl sm:text-4xl font-semibold text-gray-900 mb-8 text-center`}>
          Your Orders
        </h1>
        <p className={`${sourceSansPro.className} text-sm text-gray-600 mb-6`}>
          Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
        </p>
        <div className="space-y-6">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-700" />
                  <p className={`${sourceSansPro.className} text-sm text-gray-600`}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <p className={`${sourceSansPro.className} text-sm text-gray-600`}>
                  {order.payment?.method?.toUpperCase() || 'N/A'}
                </p>
              </div>
              <div className="flex justify-between items-center mb-4">
                <p className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>
                  ₹{order.total.toFixed(2)}
                </p>
                <span
                  className={`${sourceSansPro.className} inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'PAID'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-700'
                      : order.status === 'CANCELLED'

                      ? 'bg-red-100 text-red-700'
                      : order.status === 'RETURN_REQUESTED'
                      ? 'bg-purple-100 text-purple-700'
                      : order.status === 'DELIVERED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="space-y-4">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={item.product?.images?.[0]?.url || 'https://res.cloudinary.com/diwncnwls/image/upload/v1743091600/cld-sample-5.jpg'}
                      alt={item.product?.name || 'Product'}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover"
                      loading="lazy"
                    />
                    <div className="flex-1">
                      <p className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>
                        {item.product?.name}
                      </p>
                      {item.variant && (
                        <p className={`${sourceSansPro.className} text-xs text-gray-500 flex items-center gap-2`}>
                          Color: {item.variant.color}
                          <span
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: item.variant.colorCode }}
                          />
                        </p>
                      )}
                      <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                        Qty: {item.quantity} – ₹{(item.variant?.price || item.product?.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/orders/${order.id}`}
                className={`${sourceSansPro.className} text-sm text-gray-900 font-medium mt-4 inline-block transition-colors hover:text-gray-700`}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`${sourceSansPro.className} flex items-center gap-1 text-sm text-gray-600 px-4 py-2 rounded-lg transition-colors ${
                page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-lg transition-colors ${
                    page === pageNum
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`${sourceSansPro.className} flex items-center gap-1 text-sm text-gray-600 px-4 py-2 rounded-lg transition-colors ${
                page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}