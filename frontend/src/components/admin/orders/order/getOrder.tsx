
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  Phone,
  User,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { OrderStepTracker } from './OrderStepTracker';

const OrderDetailPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${id}`);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'pending':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            <Package className="absolute inset-0 m-auto w-5 h-5 text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-800 mb-2">Order not found</p>
          <p className="text-slate-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors duration-200 hover:translate-x-1 transform"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="overflow-x-auto text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Package className="w-8 h-8 text-blue-600" />
                Order #{order.id}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Placed on {new Date(order.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-bold text-slate-800">₹{order.total}</p>
              <p className="text-sm text-slate-500">{order.items?.length || 0} items</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-1 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Shipping Address</h2>
              </div>

              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{order.address?.fullName}</span>
                </div>
                <p className="ml-6">{order.address?.line1}</p>
                {order.address?.line2 && <p className="ml-6">{order.address.line2}</p>}
                <p className="ml-6">{order.address?.city}, {order.address?.state} - {order.address?.postalCode}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{order.address?.phone}</span>
                </div>
                {order.address?.altPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-300" />
                    <span className="text-slate-500">{order.address.altPhone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">Payment Info</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status</span>
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(order.payment?.status)}`}>
                    {getPaymentStatusIcon(order.payment?.status)}
                    {order.payment?.status || 'N/A'}
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Method</span>
                  <span className="text-sm font-medium text-slate-800">{order.payment?.method || 'N/A'}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Transaction ID</span>
                  <span className="text-sm font-mono text-slate-800">{order.payment?.transactionId || '—'}</span>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingId && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-800">Tracking Info</h2>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Tracking ID</span>
                    <span className="text-sm font-mono text-slate-800">{order.trackingId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Provider</span>
                    <span className="text-sm font-medium text-slate-800">{order.logisticsProvider || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Items & Refund */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">Order Items</h2>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item: any) => (
                  <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors duration-150">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-1">{item.product.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span>Quantity: {item.quantity}</span>
                          <span>Size: {item.size?.size || '—'}</span>
                          <span>•</span>
                          <span>Category: {item.product.category?.name || '—'}</span>
                          {item.variant && (
                            <>
                              <span>•</span>
                              <span>Color: {item.variant.color}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-800">₹{item.product.price * item.quantity}</p>
                        <p className="text-sm text-slate-500">₹{item.product.price} each</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-slate-700">Order Total</span>
                  <span className="text-2xl font-bold text-slate-800">₹{order.total}</span>
                </div>
              </div>
            </div>

            {/* Refund Section */}
            {order.refund && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-amber-800">Refund Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-amber-700 font-medium">Refund Amount:</span>
                    <p className="text-amber-800 font-semibold">₹{order.refund.amount}</p>
                  </div>
                  <div>
                    <span className="text-amber-700 font-medium">Deduction:</span>
                    <p className="text-amber-800 font-semibold">₹{order.refund.deduction}</p>
                  </div>
                  <div>
                    <span className="text-amber-700 font-medium">Status:</span>
                    <p className="text-amber-800 font-semibold">{order.refund.status}</p>
                  </div>
                  {order.refund.transactionId && (
                    <div>
                      <span className="text-amber-700 font-medium">Transaction ID:</span>
                      <p className="text-amber-800 font-mono text-xs">{order.refund.transactionId}</p>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-amber-700 font-medium">Reason:</span>
                  <p className="text-amber-800 mt-1">{order.refund.reason}</p>
                </div>
              </div>
            )}
            {order.status && <OrderStepTracker status={order.status} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
