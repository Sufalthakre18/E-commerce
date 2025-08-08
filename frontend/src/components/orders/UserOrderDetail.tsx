'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Source_Sans_3, Cinzel } from 'next/font/google';
import { Package, Truck, Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/utils/auth';
import RefundDetailsModal from '@/components/orders/RefundDetailsModal';

// Premium fonts
const cinzel = Cinzel({ subsets: ['latin'], weight: '600' });
const sourceSansPro = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'] });

interface Order {
    id: string;
    userId: string;
    addressId?: string;
    total: number;
    status: string;
    createdAt: string;
    user: { id: string; email: string; name: string };
    address?: {
        id: string;
        fullName: string;
        phone: string;
        altPhone?: string;
        line1: string;
        line2?: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
        isDefault: boolean;
    };
    items: {
        id: string;
        orderId: string;
        productId: string;
        variantId?: string;
        sizeId?: string;
        quantity: number;
        product: {
            id: string;
            name: string;
            price: number;
            images?: { id: string; url: string; publicId: string; productId: string }[];
            category: { id: string; name: string; parentId?: string };
        };
        size?: { id: string; size: string; stock: number; productId: string };
        variant?: {
            id: string;
            color: string;
            colorCode: string;
            price: number;
            productId: string;
            images?: { id: string; url: string; publicId: string; variantId: string }[];
        };
    }[];
    payment: {
        id: string;
        orderId: string;
        amount: number;
        method: string;
        status: string;
        transactionId?: string;
        createdAt: string;
    };
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

export default function OrderDetailsPage() {
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [review, setReview] = useState({ productId: '', rating: 0, comment: '', reviewId: '' });
    const [reviewStatus, setReviewStatus] = useState<ReviewStatus[]>([]);
    const router = useRouter();
    const { id } = useParams();

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login?redirect=/orders');
            return;
        }

        const fetchOrder = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/user/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store',
                });
                if (!res.ok) throw new Error('Failed to fetch order');
                const data = await res.json();
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
        const token = getAuthToken();
        if (!token) return;

        const fetchReviewStatus = async () => {
            try {
                const statusPromises = order.items.map(async (item) => {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews/product/${item.productId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error(`Failed to fetch reviews for ${item.productId}`);
                    const data = await res.json();
                    const userReview = data.reviews.find((review: any) => review.userId === order.userId);
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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/cancel/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || 'Something went wrong');
            }
            toast.success('Order cancelled successfully');
            setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        } catch (err: any) {
            toast.error(err.message || 'Failed to cancel order');
        }
    };

    const handleReturn = () => {
        if (!window.confirm('Do you want to return this order?')) return;
        setShowRefundModal(true);
    };

    const handleReturnSubmit = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/return/${id}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${getAuthToken()}` },
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || 'Something went wrong');
            }
            toast.success('Return request submitted successfully');
            setShowRefundModal(false);
            setOrder((prev) => (prev ? { ...prev, status: 'RETURN_REQUESTED' } : null));
        } catch (err: any) {
            toast.error(err.message || 'Failed to submit return');
        }
    };

    const handleReviewSubmit = async () => {
        if (!review.productId) {
            toast.error('Please select a product to review');
            return;
        }
        if (review.rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        const existingReview = reviewStatus.find((status) => status.productId === review.productId);
        const isEditing = existingReview?.hasReviewed && review.reviewId;

        try {
            const url = isEditing
                ? `${process.env.NEXT_PUBLIC_API_URL}/reviews/${review.reviewId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/reviews/`;
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getAuthToken()}`,
                },
                body: JSON.stringify({
                    productId: review.productId,
                    rating: review.rating,
                    comment: review.comment,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error?.error || `Failed to ${isEditing ? 'update' : 'submit'} review`);
            }

            toast.success(`Review ${isEditing ? 'updated' : 'submitted'} successfully`);
            if (!isEditing) {
                setReviewStatus((prev) =>
                    prev.map((status) =>
                        status.productId === review.productId
                            ? { ...status, hasReviewed: true, rating: review.rating, comment: review.comment }
                            : status,
                    ),
                );
            }
            setReview({ productId: '', rating: 0, comment: '', reviewId: '' });
        } catch (err) {
            toast.error(`Failed to ${isEditing ? 'update' : 'submit'} review`);
            console.error(err);
        }
    };

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

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/orders"
                    className={`${sourceSansPro.className} text-sm text-gray-600 mb-6 inline-block transition-colors hover:text-gray-900`}
                >
                    ← Back to Orders
                </Link>
                <h1 className={`${cinzel.className} text-3xl sm:text-4xl font-semibold text-gray-900 mb-8 text-center`}>
                    Order Details
                </h1>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
                    {/* Order Info */}
                    <div className="flex justify-between items-center">
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
                        <span
                            className={`${sourceSansPro.className} px-3 py-1 rounded-full text-xs font-medium ${order.status === 'PAID'
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
                    <p className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>
                        Total: ₹{order.total.toFixed(2)}
                    </p>
                    <p className={`${sourceSansPro.className} text-sm text-gray-600`}>
                        Payment: {order.payment?.method?.toUpperCase() || 'N/A'}
                        {order.payment?.transactionId && ` (ID: ${order.payment.transactionId})`}
                    </p>

                    {/* Shipping Address */}
                    <div className="space-y-4">
                        <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Shipping Address</h2>
                        {order.address ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-5 h-5 text-gray-700" />
                                    <p className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>
                                        {order.address.fullName}
                                    </p>
                                </div>
                                <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                    {order.address.line1}
                                    {order.address.line2 && `, ${order.address.line2}`}, {order.address.city}, {order.address.state},{' '}
                                    {order.address.country} - {order.address.postalCode}
                                </p>
                                <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                    Phone: {order.address.phone}
                                    {order.address.altPhone && `, Alt: ${order.address.altPhone}`}
                                </p>
                            </div>
                        ) : (
                            <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Address not available.</p>
                        )}
                    </div>

                    {/* Items */}
                    <div className="space-y-4">
                        <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Items</h2>
                        {order.items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                                <Image
                                    src={
                                        item.variant?.images?.[0]?.url ||
                                        item.product?.images?.[0]?.url ||
                                        'https://res.cloudinary.com/diwncnwls/image/upload/v1743091600/cld-sample-5.jpg'
                                    }
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
                                    {item.size && (
                                        <p className={`${sourceSansPro.className} text-xs text-gray-500`}>Size: {item.size.size}</p>
                                    )}
                                    <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                        Qty: {item.quantity} – ₹{(item.variant?.price || item.product?.price).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Tracking */}
                    <div className="space-y-4">
                        <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>Track Order</h2>
                        {order.tracking ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <Truck className="w-5 h-5 text-gray-700" />
                                    <p className={`${sourceSansPro.className} text-sm font-medium text-gray-900`}>
                                        {order.tracking.status}
                                    </p>
                                </div>
                                <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                    Last Update: {new Date(order.tracking.lastUpdate).toLocaleDateString('en-IN')}
                                </p>
                                {order.tracking.estimatedDelivery && (
                                    <p className={`${sourceSansPro.className} text-xs text-gray-600`}>
                                        Estimated Delivery:{' '}
                                        {new Date(order.tracking.estimatedDelivery).toLocaleDateString('en-IN')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className={`${sourceSansPro.className} text-xs text-gray-600`}>Tracking not available.</p>
                        )}
                    </div>

                    {/* Review Submission */}
                    {order.status === 'DELIVERED' && (
                        <div className="space-y-4">
                            <h2 className={`${sourceSansPro.className} text-lg font-semibold text-gray-900`}>
                                {review.reviewId ? 'Edit Review' : 'Write a Review'}
                            </h2>
                            <select
                                value={review.productId}
                                onChange={(e) => setReview((prev) => ({ ...prev, productId: e.target.value }))}
                                className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-2 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 outline-none`}
                            >
                                <option value="">Select a product to review</option>
                                {order.items.map((item) => {
                                    const hasReviewed = reviewStatus.find((status) => status.productId === item.productId)?.hasReviewed;
                                    return (
                                        <option key={item.productId} value={item.productId}>
                                            {item.product.name} {hasReviewed ? '(Editing)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 cursor-pointer ${review.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                            }`}
                                        onClick={() => setReview((prev) => ({ ...prev, rating: star }))}
                                    />
                                ))}
                            </div>
                            <textarea
                                value={review.comment}
                                onChange={(e) => setReview((prev) => ({ ...prev, comment: e.target.value }))}
                                placeholder="Share your experience..."
                                className={`${sourceSansPro.className} w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-1 focus:ring-gray-400 outline-none`}
                                rows={4}
                            />
                            <button
                                onClick={handleReviewSubmit}
                                className={`${sourceSansPro.className} bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-800`}
                            >
                                {review.reviewId ? 'Update Review' : 'Submit Review'}
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        {['PENDING', 'PROCESSING', 'PAID'].includes(order.status) && (
                            <button
                                onClick={handleCancel}
                                className={`${sourceSansPro.className} text-sm text-red-600 font-medium transition-colors hover:text-red-700`}
                            >
                                Cancel Order
                            </button>
                        )}
                        {order.status === 'DELIVERED' && (
                            <button
                                onClick={handleReturn}
                                className={`${sourceSansPro.className} text-sm text-blue-600 font-medium transition-colors hover:text-blue-700`}
                            >
                                Return Order
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {showRefundModal && (
                <RefundDetailsModal
                    orderId={order.id}
                    onClose={() => setShowRefundModal(false)}
                    onSuccess={handleReturnSubmit}
                />
            )}
        </div>
    );
}