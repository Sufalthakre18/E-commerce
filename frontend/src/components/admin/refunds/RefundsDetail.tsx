'use client';

import { fetchWrapper } from '@/lib/api/fetchWrapper';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface RefundDetail {
  id: string;
  orderId: string;
  fullName: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  createdAt: string;
  processed: boolean;
  order: {
    id: string;
    userId: string;
    total: number;
    status: string;
  };
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<RefundDetail[]>([]);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const json = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/refund-details`);
        setRefunds(json.data);
      } catch (err: any) {
        console.error('Failed to fetch refunds:', err);
      }
    };

    fetchRefunds();
  }, []);

  const deleteRefund = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this refund detail?')) return;

    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/refund-details/${orderId}`, {
        method: 'DELETE',
      });
      setRefunds((prev) => prev.filter((r) => r.orderId !== orderId));
    } catch (err: any) {
      console.error('Failed to delete refund detail:', err);
      alert('Failed to delete refund detail.');
    }
  };

  const markAsProcessed = async (orderId: string) => {
    if (!confirm('Mark this refund as processed?')) return;

    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/refund-details/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setRefunds((prev) =>
        prev.map((refund) =>
          refund.orderId === orderId ? { ...refund, processed: true } : refund
        )
      );
    } catch (err: any) {
      console.error('Failed to mark as processed:', err);
      alert('Failed to update refund status.');
    }
  };

  return (
    <div className="mt-14 p-4">
      <h2 className="text-xl font-semibold mb-4">Refund Details</h2>

      <div className="w-full overflow-x-auto bg-white rounded shadow">
        <table className="min-w-[800px] w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 whitespace-nowrap">Order ID</th>
              <th className="p-3 whitespace-nowrap">User ID</th>
              <th className="p-3 whitespace-nowrap">Amount</th>
              <th className="p-3 whitespace-nowrap">UPI / Bank Info</th>
              <th className="p-3 whitespace-nowrap">Status</th>
              <th className="p-3 whitespace-nowrap">Created At</th>
              <th className="p-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {refunds.map((refund) => (
              <tr key={refund.id} className="border-t">
                <td className="p-3 whitespace-nowrap">
                  <Link
                    href={`/admin/refunds/${refund.orderId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {refund.orderId}
                  </Link>
                </td>
                <td className="p-3 whitespace-nowrap">{refund.order.userId}</td>
                <td className="p-3 whitespace-nowrap">₹{refund.order.total}</td>
                <td className="p-3 whitespace-nowrap">
                  {refund.upiId || `${refund.accountNumber} (${refund.bankName})`}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {refund.processed ? (
                    <span className="text-green-600 font-semibold">Processed</span>
                  ) : (
                    <span className="text-yellow-600 font-semibold">Unprocessed</span>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  {new Date(refund.createdAt).toLocaleDateString()}
                </td>
                <td className="p-3 flex flex-wrap gap-2">
                  {!refund.processed && (
                    <button
                      className="px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      onClick={() => markAsProcessed(refund.orderId)}
                    >
                      Mark as Processed
                    </button>
                  )}
                  <button
                    className="px-2 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                    onClick={() => deleteRefund(refund.orderId)}
                  >
                    Delete
                  </button>
                  <Link
                    href={`/admin/refunds/${refund.orderId}`}
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {refunds.length === 0 && (
              <tr>
                <td className="p-4 text-center" colSpan={7}>
                  No refund details found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
