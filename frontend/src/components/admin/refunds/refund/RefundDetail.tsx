'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

export default function RefundDetailPage() {
  const { orderId } = useParams();
  const [refund, setRefund] = useState<any>(null);

  useEffect(() => {
    if (!orderId) return;

    fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/refund-details/${orderId}`)
      .then((data) => setRefund(data.refund))
      .catch((err) => console.error(err));
  }, [orderId]);

  if (!refund) return <div>Loading...</div>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Refund Details</h2>
      <p><strong>Order ID:</strong> {refund.orderId}</p>
      <p><strong>Full Name:</strong> {refund.fullName}</p>
      <p><strong>UPI ID:</strong> {refund.upiId || 'N/A'}</p>
      <p><strong>Account Number:</strong> {refund.accountNumber || 'N/A'}</p>
      <p><strong>IFSC Code:</strong> {refund.ifscCode || 'N/A'}</p>
      <p><strong>Bank Name:</strong> {refund.bankName || 'N/A'}</p>
      <p><strong>Created At:</strong> {new Date(refund.createdAt).toLocaleString()}</p>
    </div>
  );
}