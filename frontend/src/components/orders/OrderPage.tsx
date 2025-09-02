'use client';

import { useEffect, useState } from 'react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Source_Sans_3,Bebas_Neue } from 'next/font/google';
import { Package, ChevronLeft, ChevronRight, Download, Clock } from 'lucide-react';
import Link from 'next/link';

const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });
const bebasNeue = Bebas_Neue({subsets: ['latin-ext'],weight: '400'});

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
    product: { name: string; price: number; images?: { url: string }[]; productType: 'physical' | 'digital' };
    downloadLinks?: { id: string; url: string; fileName?: string }[];
  }[];
}

interface TimeRemaining {
  [orderId: string]: {
    [fileId: string]: { minutes: number; seconds: number };
  };
}

// Helper function to calculate time remaining (1-hour window from createdAt)
const calculateTimeRemaining = (createdAt: string) => {
  const availableTime = new Date(createdAt).getTime();
  const expiryTime = availableTime + (60 * 60 * 1000); // 1 hour in milliseconds
  const now = Date.now();
  const remainingMs = expiryTime - now;

  if (remainingMs <= 0) return null;

  const minutes = Math.floor(remainingMs / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  return { minutes, seconds };
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({});
  const itemsPerPage = 5;
  const router = useRouter();

  // Update countdown timer every second for digital products
  useEffect(() => {
    const interval = setInterval(() => {
      const newTimeRemaining: TimeRemaining = {};

      orders.forEach((order) => {
        if (['PAID', 'DELIVERED'].includes(order.status)) {
          order.items.forEach((item) => {
            if (item.product.productType === 'digital' && item.downloadLinks) {
              item.downloadLinks.forEach((link) => {
                const remaining = calculateTimeRemaining(order.createdAt);
                if (remaining) {
                  if (!newTimeRemaining[order.id]) newTimeRemaining[order.id] = {};
                  newTimeRemaining[order.id][link.id] = {
                    minutes: remaining.minutes,
                    seconds: remaining.seconds,
                  };
                }
              });
            }
          });
        }
      });

      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [orders]);

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
        console.error('Fetch orders error:', err);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = orders.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDownload = async (orderId: string, fileId: string) => {
    try {
      setDownloadingFileId(fileId);
      const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/download/${orderId}/${fileId}`, {
        method: 'GET',
        responseType: 'blob',
      });

      const order = orders.find((o) => o.id === orderId);
      const item = order?.items.find((i) => i.downloadLinks?.some((l) => l.id === fileId));
      const fileName = item?.downloadLinks?.find((l) => l.id === fileId)?.fileName || 'download';

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${fileName}...`);
    } catch (err: any) {
      console.error('Download error:', err);
      const errorMessage = err.message.includes('not found')
        ? 'File not found. Please contact support.'
        : err.message.includes('Unauthorized')
          ? 'You are not authorized to download this file.'
          : err.message || 'Failed to download file';
      toast.error(errorMessage);
    } finally {
      setDownloadingFileId(null);
    }
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
    <div className="min-h-screen bg-gray-50 pt-16 pb-4 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className={`${bebasNeue.className} text-xl sm:text-2xl font-semibold text-gray-600 mb-2 text-center`}>
          My Orders
        </h1>
        <p className={`${sourceSansPro.className} text-sm text-gray-600 mb-2`}>
          Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
        </p>
        <div className="space-y-4">
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
                {order.items?.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 relative">
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
                      
                      <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                        Qty: {item.quantity} – ₹{(item.variant?.price || item.product?.price).toFixed(2)}
                      </p>
                      {item.product.productType === 'digital' &&
                        ['PAID', 'DELIVERED'].includes(order.status) &&
                        item.downloadLinks?.map((link) => {
                          const timeLeft = timeRemaining[order.id]?.[link.id];
                          const isExpired = !calculateTimeRemaining(order.createdAt);

                          return (
                            <div key={link.id} className="mt-2 relative">
                              {!isExpired ? (
                                <>
                                  <button
                                    onClick={() => handleDownload(order.id, link.id)}
                                    disabled={downloadingFileId === link.id}
                                    className={`${sourceSansPro.className} flex items-center gap-1 text-sm text-gray-900 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed`}
                                  >
                                    <Download className="w-4 h-4" />
                                    {downloadingFileId === link.id ? 'Downloading...' : `Download ${link.fileName || 'File'}`}
                                  </button>
                                  {timeLeft && (
                                    <span
                                      className={`${sourceSansPro.className} absolute top-[-20px] right-0 text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-full flex items-center gap-1`}
                                    >
                                      <Clock className="w-3 h-3" />
                                      {timeLeft.minutes}m {timeLeft.seconds}s
                                    </span>
                                  )}
                                </>
                              ) : (
                                <p className={`${sourceSansPro.className} text-xs text-red-600 font-medium`}>
                                  Download expired for {link.fileName || 'File'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/orders/${order.id}`}
                className={`${sourceSansPro.className} text-sm text-gray-900 font-medium mt-4 inline-block transition-colors  hover:text-gray-700`}
              >
                View Details
              </Link>
            </div>
          ))}
        </div>

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
                    page === pageNum ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
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