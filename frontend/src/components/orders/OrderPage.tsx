'use client';

import { useEffect, useState } from 'react';
import { getUserOrders } from '@/lib/api/orders';
import { getAuthToken } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import RefundDetailsModal from '@/components/orders/RefundDetailsModal';

interface Order {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  payment?: {
    method: string;
    transactionId?: string;
  };
  items: {
    id: string;
    orderId: string;
    quantity: number;
    product: {
      name: string;
      price: number;
      images?: { url: string }[];
    };
  }[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.push('/login?redirect=/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await getUserOrders();
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleCancel = async (orderId: string) => {
    const confirm = window.confirm('Are you sure you want to cancel this order?');
    if (!confirm) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order/cancel/${orderId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error?.error || 'Something went wrong.');
      }

      const data = await res.json();
      toast.success(data.refund?.status === 'PROCESSED'
        ? 'Order cancelled and Razorpay refund processed.'
        : 'Order cancelled.');

      // Update UI
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'CANCELLED' } : order
        )
      );
    } catch (error: any) {
      console.error('Cancel failed:', error);
      toast.error(error.message || 'Failed to cancel order.');
    }
  };

  const handleReturnClick = (orderId: string) => {
    const confirm = window.confirm('Do you want to return this order?');
    if (!confirm) return;
    setSelectedOrderId(orderId);
    setShowRefundModal(true);
  };

const handleReturnAfterRefundDetails = async () => {
  if (!selectedOrderId) return;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/order/return/${selectedOrderId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Return failed:', errorData);
      throw new Error(errorData?.error || 'Something went wrong while processing return.');
    }

    toast.success('✅Return request submitted successfully');
    setShowRefundModal(false);
    window.location.reload();
  } catch (err: any) {
    toast.error(`Return failed: ${err.message || 'Unknown error'}`);
  }
};


  if (loading) return <p className="text-center mt-10">Loading your orders...</p>;

  if (!orders || orders.length === 0)
    return <p className="text-center mt-10">You haven't placed any orders yet.</p>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>

      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-xl p-4 shadow-sm bg-white space-y-2"
        >
          <div className="flex justify-between text-sm text-gray-500">
            <p>{new Date(order.createdAt).toLocaleDateString()}</p>
            <p>{order.payment?.method?.toUpperCase() || 'N/A'}</p>
          </div>

          <div className="text-lg font-semibold">
            ₹{order.total} –{' '}
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs ${
                order.status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : order.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
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

          <div className="space-y-1">
            {order.items?.map((item) => {
              const product = item.product;
              const imageUrl =
                product?.images?.[0]?.url ||
                'https://res.cloudinary.com/diwncnwls/image/upload/v1743091600/cld-sample-5.jpg';

              return (
                <div key={item.id} className="flex items-center gap-3">
                  <Image
                    src={imageUrl}
                    alt={product?.name || 'Product'}
                    width={50}
                    height={50}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{product?.name}</p>
                    <p className="text-xs text-gray-600">
                      Qty: {item.quantity} – ₹{product?.price}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {['PENDING', 'PROCESSING', 'PAID'].includes(order.status) && (
            <button
              onClick={() => handleCancel(order.id)}
              className="text-sm text-red-600 underline mt-2 cursor-pointer hover:text-red-800"
            >
              Cancel Order
            </button>
          )}

          {order.status === 'DELIVERED' && (
            <button
              onClick={() => handleReturnClick(order.id)}
              className="text-sm text-blue-600 underline mt-2 cursor-pointer hover:text-blue-800"
            >
              Return Order
            </button>
          )}
        </div>
      ))}

      {showRefundModal && selectedOrderId && (
        <RefundDetailsModal
          orderId={selectedOrderId}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedOrderId(null);
          }}
          onSuccess={handleReturnAfterRefundDetails}
        />
      )}
    </div>
  );
}
