'use client';

import { useEffect, useState } from 'react';
import { Trash } from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews`);
      setReviews(data);
    } catch (err: any) {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this review?");
    if (!confirmDelete) return;

    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
      });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Failed to delete review");
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) return <p>Loading reviews...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Reviews</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Product</th>
              <th className="p-3">User</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Comment</th>
              <th className="p-3">Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t">
                <td className="p-3">{review.product.name}</td>
                <td className="p-3">
                  {review.user.name} <br />
                  <span className="text-xs text-gray-500">{review.user.email}</span>
                </td>
                <td className="p-3">{review.rating} ⭐</td>
                <td className="p-3">{review.comment || '—'}</td>
                <td className="p-3 text-sm">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500">
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
