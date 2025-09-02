'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Source_Sans_3, Bebas_Neue } from 'next/font/google';
import { Package, Truck, Star, MapPin, CheckCircle, Clock, PackageX, ShoppingBag, Download } from 'lucide-react';
import Link from 'next/link';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import RefundDetailsModal from '@/components/orders/RefundDetailsModal';


// Premium fonts
const bebasNeue = Bebas_Neue({subsets: ['latin-ext'],weight: '400'});
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

interface Order {
  id: string;
  userId: string;
  addressId?: string;
  total: number;
  status: string;
  createdAt: string;
  user: { id: string; email: string; name: string };
  address?: any;
  items: any[];
  payment: any;
  refund?: any;
  refunddetail?: any;
  tracking?: { status: string; estimatedDelivery?: string; lastUpdate: string };
}

interface ReviewStatus {
  productId: string;
  hasReviewed: boolean;
  reviewId?: string;
  rating?: number;
  comment?: string;
}

interface DownloadInfo {
  [fileId: string]: {
    windowDaysLeft: number;
    expirySeconds: number;
  };
}

const calculateTimeRemaining = (downloadAvailableAt: string, downloadExpirySeconds: number) => {
  const availableTime = new Date(downloadAvailableAt).getTime();
  const expiryTime = availableTime + (downloadExpirySeconds * 1000);
  const now = Date.now();
  const remainingMs = expiryTime - now;
  if (remainingMs <= 0) return null;
  const minutes = Math.floor(remainingMs / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
  return { minutes, seconds, totalMs: remainingMs };
};

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showReturnOptions, setShowReturnOptions] = useState(false);
  const [photoPlan, setPhotoPlan] = useState<'email' | 'whatsapp'>('email');
  const [photoNotes, setPhotoNotes] = useState('');
  const [review, setReview] = useState({ productId: '', rating: 0, comment: '', reviewId: '' });
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus[]>([]);
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo>({});
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<{ [fileId: string]: { minutes: number; seconds: number } }>({});
  const router = useRouter();
  const { id } = useParams();

  // Support contact from env (client-side)
  const supportWhatsApp = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP) ? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP : '';
  const supportEmail = (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPPORT_EMAIL) ? process.env.NEXT_PUBLIC_SUPPORT_EMAIL : '';

  useEffect(() => {
    const interval = setInterval(() => {
      if (!order) return;
      const newTimeRemaining: { [fileId: string]: { minutes: number; seconds: number } } = {};
      order.items.forEach(item => {
        if (item.product.productType === 'digital' && item.downloadLinks) {
          item.downloadLinks.forEach((link: any) => {
            const remaining = calculateTimeRemaining(link.downloadAvailableAt, link.downloadExpirySeconds);
            if (remaining) {
              newTimeRemaining[link.id] = { minutes: remaining.minutes, seconds: remaining.seconds };
            }
          });
        }
      });
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Determine product types
  const hasDigitalProducts = order?.items?.some(item => item.product.productType === 'digital');
  const hasPhysicalProducts = order?.items?.some(item => item.product.productType === 'physical');
  const isOnlyDigital = Boolean(hasDigitalProducts && !hasPhysicalProducts);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/user/${id}`, {
          cache: 'no-store',
        });
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load order details');
        router.push('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, router]);

  useEffect(() => {
    if (!order?.items || !order?.userId) return;
    const fetchReviewStatus = async () => {
      try {
        const statusPromises = order.items.map(async (item: any) => {
          const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/reviews/product/${item.productId}`);
          const userReview = data.reviews.find((r: any) => r.userId === order.userId);
          return {
            productId: item.productId,
            hasReviewed: !!userReview,
            reviewId: userReview?.id,
            rating: userReview?.rating,
            comment: userReview?.comment || '',
          };
        });
        const statuses = await Promise.all(statusPromises);
        setReviewStatus(statuses);
      } catch (err) {
        console.error('Error fetching review status:', err);
      }
    };
    fetchReviewStatus();
  }, [order?.items, order?.userId]);

  useEffect(() => {
    if (!review.productId) return;
    const existingReview = reviewStatus.find((status) => status.productId === review.productId);
    if (existingReview?.hasReviewed) {
      setReview((prev) => ({
        ...prev,
        rating: existingReview.rating || 0,
        comment: existingReview.comment || '',
        reviewId: existingReview.reviewId || '',
      }));
    } else {
      setReview((prev) => ({ ...prev, rating: 0, comment: '', reviewId: '' }));
    }
  }, [review.productId, reviewStatus]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/cancel/${id}`, { method: 'POST' });
      toast.success('Order cancelled successfully');
      setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order');
    }
  };

  // Open return options modal
  const handleReturn = () => {
    if (!order) {
      toast.error('Order not loaded');
      return;
    }
    setPhotoPlan('email');
    setPhotoNotes('');
    setShowReturnOptions(true);
  };

  // Submit return (calls existing API)
  const handleReturnSubmit = async () => {
    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/return/${id}`, { method: 'POST' });
      toast.success('Return request submitted successfully');
      setShowRefundModal(false);
      setOrder((prev) => (prev ? { ...prev, status: 'RETURN_REQUESTED' } : null));

      // Client-side friendly reminder
      if (photoPlan === 'whatsapp') {
        const numberText = supportWhatsApp || 'your support WhatsApp number';
        toast(`Please send your photos/videos to ${numberText}. Mention Order ID: ${order?.id}`, { duration: 6000 });
      }
      if (photoPlan === 'email') {
        const emailText = supportEmail || 'your support email';
        toast(`Please send your photos/videos to ${emailText}. Mention Order ID: ${order?.id}`, { duration: 6000 });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit return');
    }
  };

  const handleReviewSubmit = async () => {
    if (!review.productId) { toast.error('Please select a product to review'); return; }
    if (review.rating === 0) { toast.error('Please select a rating'); return; }
    const existingReview = reviewStatus.find((status) => status.productId === review.productId);
    const isEditing = existingReview?.hasReviewed && review.reviewId;
    try {
      const url = isEditing ? `${process.env.NEXT_PUBLIC_API_URL}/reviews/${review.reviewId}` : `${process.env.NEXT_PUBLIC_API_URL}/reviews/`;
      const method = isEditing ? 'PUT' : 'POST';
      await fetchWrapper(url, { method, body: JSON.stringify({ productId: review.productId, rating: review.rating, comment: review.comment }) });
      toast.success(`Review ${isEditing ? 'updated' : 'submitted'} successfully`);
      if (!isEditing) {
        setReviewStatus((prev) => prev.map((status) => status.productId === review.productId ? { ...status, hasReviewed: true, rating: review.rating, comment: review.comment } : status));
      }
      setReview({ productId: '', rating: 0, comment: '', reviewId: '' });
    } catch (err) {
      toast.error(`Failed to ${isEditing ? 'update' : 'submit'} review`);
      console.error(err);
    }
  };

  const handleDownload = async (orderId: string, fileId: string, fileName?: string) => {
    try {
      setDownloadingFileId(fileId);
      const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/download/${orderId}/${fileId}`, { method: 'GET', responseType: 'blob' });
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Downloading ${fileName || 'File'}...`);
    } catch (err: any) {
      console.error('Download error:', err);
      const errorMessage = err.message?.includes('not found') ? 'File not found. Please contact support.' : err.message?.includes('Unauthorized') ? 'You are not authorized to download this file.' : err.message || 'Failed to download file';
      toast.error(errorMessage);
    } finally {
      setTimeout(() => setDownloadingFileId(null), 3000);
    }
  };

  const trackingSteps = [
    { status: 'PENDING', label: 'Order Placed', icon: <Package className="w-6 h-6" />, description: 'Your order has been placed.' },
    { status: 'PAID', label: 'Payment Confirmed', icon: <CheckCircle className="w-6 h-6" />, description: 'Payment has been successfully processed.' },
    { status: 'PROCESSING', label: 'Processing', icon: <Clock className="w-6 h-6" />, description: 'Your order is being prepared.' },
    { status: 'SHIPPED', label: 'Shipped', icon: <Truck className="w-6 h-6" />, description: 'Your order has been dispatched.' },
    { status: 'DELIVERED', label: 'Delivered', icon: <ShoppingBag className="w-6 h-6" />, description: 'Your order has been delivered.' },
    { status: 'CANCELLED', label: 'Cancelled', icon: <PackageX className="w-6 h-6" />, description: 'Your order has been cancelled.' },
    { status: 'RETURN_REQUESTED', label: 'Return Requested', icon: <Package className="w-6 h-6" />, description: 'Return request submitted.' },
    { status: 'RETURNED', label: 'Returned', icon: <Package className="w-6 h-6" />, description: 'Return has been completed.' },
  ];

  const getCurrentStepIndex = () => {
    if (order?.tracking?.status) return trackingSteps.findIndex((step) => step.status === order.status);
    return trackingSteps.findIndex((step) => step.status === order?.status) || 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className={`${sourceSansPro.className} text-gray-600 text-sm`}>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className={`${sourceSansPro.className} text-gray-600 text-sm`}>Order not found.</p>
      </div>
    );
  }

  // Helpers for links & clipboard
  const buildWhatsAppLink = (phone: string, msg: string) => {
    try { const clean = phone.replace(/[^\d+]/g, ''); return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`; } catch { return '#'; }
  };
  const buildMailToLink = (email: string, subject: string, body: string) => {
    try { return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; } catch { return '#'; }
  };
  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success('Copied to clipboard'); } catch { toast.error('Unable to copy. Please copy manually.'); }
  };

  // Template messages
  const returnTemplate = `Hi, I want to return my order.\nOrder ID: ${order.id}\nProduct: ${order.items.map(i => i.product.name).join(', ')}\nIssue: [brief]\nI am attaching 1-3 photos/videos.`;
  const waShort = `Hi, I want to return my order. Order ID: ${order.id}. Sending photos.`;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-4 sm:px-4 lg:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className={`${bebasNeue.className} text-xl sm:text-2xl font-semibold text-gray-600 mb-1 text-center`}>Order Details</h1>
        <Link href="/orders" className={`${sourceSansPro.className} text-sm text-gray-600 mb-2 inline-block transition-colors hover:text-gray-900`}>← Back to Orders</Link>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
          {/* Order header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2"><Package className="w-5 h-5 text-gray-700" /><p className={`${sourceSansPro.className} text-sm text-gray-600`}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
            <span className={`${sourceSansPro.className} px-3 py-1 rounded-full text-xs font-medium ${order.status === 'PAID' ? 'bg-green-100 text-green-700' : order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : order.status === 'RETURN_REQUESTED' ? 'bg-purple-100 text-purple-700' : order.status === 'DELIVERED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
          </div>

          <p className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Total: ₹{order.total.toFixed(2)}</p>
          <p className={`${sourceSansPro.className} text-sm text-gray-600`}>Payment: {order.payment?.method?.toUpperCase() || 'N/A'}{order.payment?.transactionId && ` (ID: ${order.payment.transactionId})`}</p>

          {/* Shipping */}
          {!isOnlyDigital && (
            <div className="space-y-4">
              <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Shipping Address</h2>
              {order.address ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2"><MapPin className="w-5 h-5 text-gray-700" /><p className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>{order.address.fullName}</p></div>
                  <p className={`${sourceSansPro.className} text-xs text-gray-600`}>{order.address.line1}{order.address.line2 && `, ${order.address.line2}`}, {order.address.city}, {order.address.state}, {order.address.country} - {order.address.postalCode}</p>
                  <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Phone: {order.address.phone}{order.address.altPhone && `, Alt: ${order.address.altPhone}`}</p>
                </div>
              ) : (<p className={`${sourceSansPro.className} text-xs text-gray-600`}>Address not available.</p>)}
            </div>
          )}

          {/* Items */}
          <div className="space-y-4">
            <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Items</h2>
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-4">
                <Image src={item.variant?.images?.[0]?.url || item.product?.images?.[0]?.url || 'https://res.cloudinary.com/diwncnwls/image/upload/v1743091600/cld-sample-5.jpg'} alt={item.product?.name || 'Product'} width={60} height={60} className="rounded-lg object-cover" loading="lazy" />
                <div className="flex-1">
                  <p className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>{item.product?.name}</p>
                  {item.variant && (<p className={`${sourceSansPro.className} text-xs text-gray-500 flex items-center gap-2`}>Color: {item.variant.color}<span className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.variant.colorCode }} /></p>)}
                  {item.size && (<p className={`${sourceSansPro.className} text-xs text-gray-500`}>Size: {item.size.size}</p>)}
                  <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Qty: {item.quantity} – ₹{(item.variant?.price || item.product?.price).toFixed(2)}</p>
                  <p className={`${sourceSansPro.className} text-xs text-gray-600`}>{item.product.productType === 'digital' ? 'Digital' : 'Physical'}</p>

                  {item.product.productType === 'digital' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="mb-2">
                        <p className={`${sourceSansPro.className} text-xs font-medium text-blue-800`}>Digital Download Information</p>
                        <p className={`${sourceSansPro.className} text-xs text-blue-600 mt-1`}>• Downloads are available for a short time after payment</p>
                        <p className={`${sourceSansPro.className} text-xs text-blue-600`}>• Contact support if there is any issue</p>
                      </div>

                      {['PAID', 'DELIVERED'].includes(order.status) && item.downloadLinks?.map((link: any) => {
                        const remaining = calculateTimeRemaining(link.downloadAvailableAt, link.downloadExpirySeconds);
                        const timeLeft = timeRemaining[link.id];
                        const isExpired = !remaining;
                        return (
                          <div key={link.id} className="mt-2">
                            {!isExpired ? (
                              <>
                                <button onClick={() => handleDownload(order.id, link.id, link.fileName)} disabled={downloadingFileId === link.id} className={`${sourceSansPro.className} flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 w-full justify-center`}>
                                  <Download className="w-4 h-4" />
                                  {downloadingFileId === link.id ? 'Downloading...' : `Download ${link.fileName || 'File'}`}
                                </button>
                                {timeLeft && (<div className="flex items-center gap-1 mt-1"><Clock className="w-3 h-3 text-orange-500" /><p className={`${sourceSansPro.className} text-xs text-orange-600`}>Time left: {timeLeft.minutes}m {timeLeft.seconds}s</p></div>)}
                              </>
                            ) : (
                              <div className="flex items-center gap-1"><PackageX className="w-4 h-4 text-red-500" /><p className={`${sourceSansPro.className} text-xs text-red-600`}>Download expired</p></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tracking */}
          {!isOnlyDigital && (
            <div className="space-y-4">
              <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Track Order</h2>
              {order.tracking || order.status ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="relative flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto">
                    {trackingSteps.filter(step => !['RETURN_REQUESTED', 'RETURNED'].includes(step.status)).map((step, index) => {
                      const isActive = index <= currentStepIndex && order.status !== 'CANCELLED';
                      const isCompleted = index < currentStepIndex && order.status !== 'CANCELLED';
                      const isCancelled = order.status === 'CANCELLED' && step.status === 'CANCELLED';
                      return (
                        <div key={step.status} className="flex-1 text-center">
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${isCompleted || isCancelled ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{step.icon}</div>
                            <p className={`${sourceSansPro.className} text-xs sm:text-sm mt-2 font-medium ${isActive || isCancelled ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
                            {(isActive || isCancelled) && <p className={`${sourceSansPro.className} text-xs text-gray-600 mt-1`}>{step.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(order.tracking || order.status) && (
                    <div className="mt-4">
                      <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Last Update: {order.tracking?.lastUpdate ? new Date(order.tracking.lastUpdate).toLocaleDateString('en-IN') : new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                      {order.tracking?.estimatedDelivery && <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Estimated Delivery: {new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN')}</p>}
                    </div>
                  )}
                </div>
              ) : (<p className={`${sourceSansPro.className} text-xs text-gray-600`}>Tracking not available.</p>)}
            </div>
          )}

          {/* If ALL products are digital => show non-returnable message */}
          {isOnlyDigital && (
            <p className={`${sourceSansPro.className} text-sm text-red-600 font-medium`}>Digital products are not returnable.</p>
          )}

          {/* Reviews */}
          {order.status === 'DELIVERED' && (
            <div className="space-y-4">
              <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>{review.reviewId ? 'Edit Review' : 'Write a Review'}</h2>
              <select value={review.productId} onChange={(e) => setReview(prev => ({ ...prev, productId: e.target.value }))} className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900`}>
                <option value="">Select a product to review</option>
                {order.items.map((item: any) => <option key={item.productId} value={item.productId}>{item.product.name}{reviewStatus.find(s => s.productId === item.productId)?.hasReviewed ? ' (Editing)' : ''}</option>)}
              </select>
              <div className="flex items-center gap-2">{[1,2,3,4,5].map(s => <Star key={s} className={`w-5 h-5 cursor-pointer ${review.rating >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setReview(prev => ({ ...prev, rating: s }))} />)}</div>
              <textarea value={review.comment} onChange={(e) => setReview(prev => ({ ...prev, comment: e.target.value }))} placeholder="Share your experience..." className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900`} rows={4} />
              <button onClick={handleReviewSubmit} className={`${sourceSansPro.className} bg-gray-900 text-white px-5 py-2 rounded-lg`}>{review.reviewId ? 'Update Review' : 'Submit Review'}</button>
            </div>
          )}
          <div className="flex gap-4">
            {['PENDING', 'PROCESSING', 'PAID'].includes(order.status) && <button onClick={handleCancel} className={`${sourceSansPro.className} text-sm text-red-600`}>Cancel Order</button>}
             {order.status === 'DELIVERED' && hasPhysicalProducts && <button onClick={handleReturn} className={`${sourceSansPro.className} text-sm text-blue-600`}>Return Order</button>}
          </div>
        </div>
      </div>

      {/* Return Options Modal */}
      {showReturnOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6 border border-gray-100">
            <h3 className={`${sourceSansPro.className} text-lg font-semibold mb-3`}>Return Options</h3>

            <p className={`${sourceSansPro.className} text-sm text-gray-700 mb-4`}>
              Please send photos via WhatsApp or Email before filling the return details.
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="radio" name="photoPlan" checked={photoPlan === 'email'} onChange={() => setPhotoPlan('email')} />
                <span className={`${sourceSansPro.className} text-sm`}>Send photos by Email</span>
              </label>

              <label className="flex items-center gap-2">
                <input type="radio" name="photoPlan" checked={photoPlan === 'whatsapp'} onChange={() => setPhotoPlan('whatsapp')} />
                <span className={`${sourceSansPro.className} text-sm`}>Send photos by WhatsApp</span>
              </label>

              {photoPlan === 'email' && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className={`${sourceSansPro.className} text-sm text-gray-700 mb-2`}>Email instructions:</p>
                  <textarea readOnly rows={3} className={`${sourceSansPro.className} w-full text-xs p-2 border rounded-md bg-white`} value={returnTemplate} />
                  <div className="flex gap-2 mt-2">
                    <button className={`${sourceSansPro.className} text-sm px-3 py-1 border rounded-md bg-white`} onClick={() => copyToClipboard(returnTemplate)}>Copy Template</button>
                    {supportEmail ? (
                      <a href={buildMailToLink(supportEmail, `Return request - Order ${order.id}`, returnTemplate)} target="_blank" rel="noreferrer" className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-md bg-green-600 text-white`}>Open Email</a>
                    ) : (
                      <button onClick={() => toast('Support email not set. Set NEXT_PUBLIC_SUPPORT_EMAIL in .env')} className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-md bg-yellow-500 text-white`}>Email not set</button>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className={`${sourceSansPro.className} text-xs text-gray-600`}>Optional — note filenames or "sent":</label>
                    <input type="text" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)} placeholder="e.g. img1.jpg, img2.jpg or 'sent via email'" className="w-full mt-1 p-2 border rounded-md text-sm" />
                  </div>
                </div>
              )}

              {photoPlan === 'whatsapp' && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                  <p className={`${sourceSansPro.className} text-sm text-gray-700 mb-2`}>WhatsApp instructions:</p>
                  <textarea readOnly rows={3} className={`${sourceSansPro.className} w-full text-xs p-2 border rounded-md bg-white`} value={returnTemplate.replace('I am attaching 1-3 photos/videos.', 'I am sending 1-3 photos/videos.')} />
                  <div className="flex gap-2 mt-2">
                    <button className={`${sourceSansPro.className} text-sm px-3 py-1 border rounded-md bg-white`} onClick={() => copyToClipboard(returnTemplate)}>Copy Template</button>
                    {supportWhatsApp ? (
                      <a href={buildWhatsAppLink(supportWhatsApp, waShort)} target="_blank" rel="noreferrer" className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-md bg-green-600 text-white`}>Open WhatsApp</a>
                    ) : (
                      <button onClick={() => toast('Support WhatsApp number not set. Set NEXT_PUBLIC_SUPPORT_WHATSAPP in .env')} className={`${sourceSansPro.className} text-sm px-3 py-1 rounded-md bg-yellow-500 text-white`}>WhatsApp not set</button>
                    )}
                  </div>
                  <div className="mt-2">
                    <label className={`${sourceSansPro.className} text-xs text-gray-600`}>Optional — note filenames or "sent":</label>
                    <input type="text" value={photoNotes} onChange={(e) => setPhotoNotes(e.target.value)} placeholder="e.g. img1.jpg, img2.jpg or 'sent via whatsapp'" className="w-full mt-1 p-2 border rounded-md text-sm" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setShowReturnOptions(false)} className={`${sourceSansPro.className} w-full sm:w-auto px-3 py-2 rounded-md border`}>Cancel</button>

              <button onClick={() => {
                if (photoPlan === 'email') {
                  if (supportEmail) {
                    window.open(buildMailToLink(supportEmail, `Return request - Order ${order.id}`, returnTemplate), '_blank');
                    toast('Email client opened. Attach photos and send.');
                  } else {
                    toast('Support email not set. Please copy the template and send manually.');
                  }
                } else {
                  if (supportWhatsApp) {
                    window.open(buildWhatsAppLink(supportWhatsApp, waShort), '_blank');
                    toast('WhatsApp opened. Please attach photos and send.');
                  } else {
                    toast('Support WhatsApp number not set. Copy template and send manually.');
                  }
                }
              }} className={`${sourceSansPro.className} w-full sm:w-auto px-3 py-2 rounded-md bg-green-600 text-white`}>Open {photoPlan === 'email' ? 'Email' : 'WhatsApp'}</button>

              <button onClick={() => { setShowReturnOptions(false); setShowRefundModal(true); toast('Proceeding. Please remember to send photos to support.'); }} className={`${sourceSansPro.className} w-full sm:w-auto px-3 py-2 rounded-md bg-blue-600 text-white`}>Proceed & I will send photos</button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && (
        <RefundDetailsModal
          orderId={order.id}
          onClose={() => setShowRefundModal(false)}
          onSuccess={handleReturnSubmit}
          // @ts-ignore
          clientPhotoPlan={photoPlan}
          // @ts-ignore
          clientPhotoNotes={photoNotes}
        />
      )}

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
