'use client';

import { useEffect, useState } from 'react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { Trash } from 'lucide-react';

interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount: number;
  type: 'percentage' | 'fixed';
  isActive: boolean;
  startsAt: string;
  endsAt: string;
}

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount: '',
    type: 'percentage',
    startsAt: '',
    endsAt: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/promo`;

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const data = await fetchWrapper(API_URL);
      setPromos(data);
    } catch {
      setError('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreate = async () => {
    try {
      await fetchWrapper(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          discount: parseFloat(form.discount),
        }),
      });
      await fetchPromos();
      setForm({
        code: '',
        description: '',
        discount: '',
        type: 'percentage',
        startsAt: '',
        endsAt: '',
      });
    } catch {
      alert('Failed to create promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo?')) return;
    try {
      await fetchWrapper(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      setPromos((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert('Failed to delete promo');
    }
  };

  // Filter and sort promotions
  const filteredPromos = promos
    .filter((promo) => {
      const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promo.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      if (statusFilter === 'active') return matchesSearch && promo.isActive;
      if (statusFilter === 'inactive') return matchesSearch && !promo.isActive;
      if (statusFilter === 'expired') {
        return matchesSearch && new Date(promo.endsAt) < new Date();
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'code': return a.code.localeCompare(b.code);
        case 'discount': return b.discount - a.discount;
        case 'endDate': return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
        default: return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
      }
    });

  const activePromos = promos.filter(p => p.isActive).length;
  const expiredPromos = promos.filter(p => new Date(p.endsAt) < new Date()).length;

  return (
    <div className="px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h2 className="text-lg sm:text-xl font-semibold">Promotions</h2>
        <div className="flex gap-2 text-xs sm:text-sm">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Total: {promos.length}</span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Active: {activePromos}</span>
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Expired: {expiredPromos}</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <input
            type="text"
            placeholder="Search promotions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 border p-2 rounded text-sm sm:text-base"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border p-2 rounded text-sm sm:text-base"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded text-sm sm:text-base"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="code">Sort by Code</option>
            <option value="discount">Sort by Discount</option>
            <option value="endDate">Sort by End Date</option>
          </select>
        </div>
      </div>

      {/* Create Promo Form */}
      <div className="mb-4 sm:mb-6 space-y-3 bg-white p-3 sm:p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">Create New Promotion</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <input
            placeholder="Code"
            className="border p-2 rounded text-sm sm:text-base"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <input
            placeholder="Description"
            className="border p-2 rounded text-sm sm:text-base"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            type="number"
            placeholder="Discount"
            className="border p-2 rounded text-sm sm:text-base"
            value={form.discount}
            onChange={(e) => setForm({ ...form, discount: e.target.value })}
          />
          <select
            className="border p-2 rounded text-sm sm:text-base"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
          <input
            type="datetime-local"
            className="border p-2 rounded text-sm sm:text-base"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
          <input
            type="datetime-local"
            className="border p-2 rounded text-sm sm:text-base"
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded text-sm sm:text-base transition-colors w-full sm:w-auto"
        >
          Create Promotion
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm border rounded shadow bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Discount</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">End</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPromos.map((promo) => {
              const isExpired = new Date(promo.endsAt) < new Date();
              return (
                <tr key={promo.id} className={`border-t hover:bg-gray-50 ${isExpired ? 'opacity-60' : ''}`}>
                  <td className="p-2 font-medium">{promo.code}</td>
                  <td className="p-2">{promo.description || '—'}</td>
                  <td className="p-2 font-semibold">{promo.discount}{promo.type === 'percentage' ? '%' : '₹'}</td>
                  <td className="p-2 capitalize">{promo.type}</td>
                  <td className="p-2">
                    {isExpired ? '⏰ Expired' : (promo.isActive ? '✅ Active' : '❌ Inactive')}
                  </td>
                  <td className="p-2 text-xs">{new Date(promo.startsAt).toLocaleString()}</td>
                  <td className="p-2 text-xs">{new Date(promo.endsAt).toLocaleString()}</td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredPromos.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center p-6 text-gray-500">
                  {searchTerm || statusFilter !== 'all' ? 'No promotions match your filters.' : 'No promotions found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="lg:hidden space-y-3">
        {filteredPromos.map((promo) => {
          const isExpired = new Date(promo.endsAt) < new Date();
          return (
            <div key={promo.id} className={`bg-white rounded-lg shadow-sm border p-3 sm:p-4 ${isExpired ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{promo.code}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{promo.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    isExpired ? 'bg-gray-100 text-gray-800' :
                    promo.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isExpired ? 'Expired' : (promo.isActive ? 'Active' : 'Inactive')}
                  </span>
                  <button
                    onClick={() => handleDelete(promo.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-500">Discount:</span>
                  <span className="ml-1 font-medium">{promo.discount}
                    {promo.type === 'percentage' ? '%' : '₹'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-1 capitalize">{promo.type}</span>
                </div>
                <div>
                  <span className="text-gray-500">Starts:</span>
                  <span className="ml-1">{new Date(promo.startsAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Ends:</span>
                  <span className="ml-1">{new Date(promo.endsAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filteredPromos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm sm:text-base">
              {searchTerm || statusFilter !== 'all' ? 'No promotions match your filters.' : 'No promotions found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}