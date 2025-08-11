'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

interface RefundDetailsModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RefundDetailsModal({
  orderId,
  onClose,
  onSuccess,
}: RefundDetailsModalProps) {
  const [fullName, setFullName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/order/refund-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          fullName,
          upiId,
          accountNumber,
          ifscCode,
          bankName,
        }),
      });
      toast.success('✅ Refund details saved successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Refund detail save error:', err);
      if (err.message.includes('409')) {
        toast.warning('⚠️ Refund details already saved for this order.');
      } else {
        toast.error(`❌ ${err.message || 'Something went wrong'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Enter Refund Details</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />

        <input
          type="text"
          placeholder="UPI ID (optional)"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <hr className="my-2" />
        <p className="text-sm text-gray-600">OR provide bank details:</p>

        <input
          type="text"
          placeholder="Account Number"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="IFSC Code"
          value={ifscCode}
          onChange={(e) => setIfscCode(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />
        <input
          type="text"
          placeholder="Bank Name"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="text-sm text-gray-600" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
          >
            {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
