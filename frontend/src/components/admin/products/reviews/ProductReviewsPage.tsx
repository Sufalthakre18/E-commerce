'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/utils/auth';

type Review = {
  id: string;
  rating: number;
  comment: string;
  user: {
    email: string;
  };
  createdAt: string;
};

export default function ProductReviewsPage() {
  const { productId } = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/product/${productId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error('Error loading reviews:', err))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return <div className="p-6">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return <div className="p-6 text-gray-600">No reviews for this product.</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Reviews for Product #{productId}</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 border rounded shadow-sm bg-white">
            <p className="text-sm text-gray-800"><strong>Rating:</strong> {review.rating} / 5</p>
            <p className="text-sm text-gray-700"><strong>Comment:</strong> {review.comment}</p>
            <p className="text-xs text-gray-500"><strong>User:</strong> {review.user.email}</p>
            <p className="text-xs text-gray-400"><strong>Date:</strong> {new Date(review.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
