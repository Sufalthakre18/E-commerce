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
  deletedAt: string | null;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        setLoading(true);
        const json = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/refund-details`);
        setRefunds(json.data);
      } catch (err: any) {
        console.error('Failed to fetch refunds:', err);
      } finally {
        setLoading(false);
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
    // Update local state only - no API call
    setRefunds((prev) => 
      prev.map((r) => 
        r.orderId === orderId ? { ...r, processed: true } : r
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="mt-14 p-4 flex justify-center items-center">
        <div className="text-lg">Loading refund details...</div>
      </div>
    );
  }

  return (
    <div className="mt-14 p-4">
      <h2 className="text-2xl font-bold mb-6">Refund Details</h2>
      
      {refunds.length === 0 ? (
        <div className="bg-white rounded shadow p-8 text-center">
          <p className="text-gray-500">No refund details found.</p>
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {refunds.map((refund) => (
                  <tr key={refund.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/orders/${refund.orderId}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {refund.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{refund.fullName}</div>
                      <div className="text-sm text-gray-500">{refund.order.userId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{refund.order.total}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {/* Show UPI ID if present */}
                        {refund.upiId && (
                          <div className="mb-2">
                            <div className="font-medium">UPI ID:</div>
                            <div>{refund.upiId}</div>
                          </div>
                        )}
                        
                        {/* Show bank details if any of them are present */}
                        {(refund.accountNumber || refund.ifscCode || refund.bankName) && (
                          <div>
                            <div className="font-medium">Bank Account:</div>
                            {refund.accountNumber && <div>Account: {refund.accountNumber}</div>}
                            {refund.ifscCode && <div>IFSC: {refund.ifscCode}</div>}
                            {refund.bankName && <div>Bank: {refund.bankName}</div>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          refund.processed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {refund.processed ? 'Processed' : 'Pending'}
                        </span>
                        <span className="mt-1 text-xs text-gray-500">
                          Order: {refund.order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(refund.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!refund.processed && (
                          <button
                            onClick={() => markAsProcessed(refund.orderId)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Process
                          </button>
                        )}
                        <Link
                          href={`/admin/refunds/${refund.orderId}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => deleteRefund(refund.orderId)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="md:hidden">
            {refunds.map((refund) => (
              <div key={refund.id} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      <Link href={`/admin/orders/${refund.orderId}`} className="text-blue-600">
                        Order: {refund.orderId}
                      </Link>
                    </h3>
                    <p className="text-sm text-gray-500">Customer: {refund.fullName}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    refund.processed 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {refund.processed ? 'Processed' : 'Pending'}
                  </span>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">₹{refund.order.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(refund.createdAt)}</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Payment Info</p>
                  <div className="text-sm">
                    {/* Show UPI ID if present */}
                    {refund.upiId && (
                      <div className="mb-2">
                        <p className="font-medium">UPI ID:</p>
                        <p>{refund.upiId}</p>
                      </div>
                    )}
                    
                    {/* Show bank details if any of them are present */}
                    {(refund.accountNumber || refund.ifscCode || refund.bankName) && (
                      <div>
                        <p className="font-medium">Bank Account:</p>
                        {refund.accountNumber && <p>Account: {refund.accountNumber}</p>}
                        {refund.ifscCode && <p>IFSC: {refund.ifscCode}</p>}
                        {refund.bankName && <p>Bank: {refund.bankName}</p>}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-3">
                  {!refund.processed && (
                    <button
                      onClick={() => markAsProcessed(refund.orderId)}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                    >
                      Process
                    </button>
                  )}
                  <Link
                    href={`/admin/refunds/${refund.orderId}`}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => deleteRefund(refund.orderId)}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}