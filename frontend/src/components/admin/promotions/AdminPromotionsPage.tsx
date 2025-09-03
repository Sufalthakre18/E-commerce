'use client';
import { useEffect, useState } from 'react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { Trash, Plus } from 'lucide-react';

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
      alert('Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const handleCreate = async () => {
    try {
      await fetchWrapper(API_URL, {
        method: 'POST',
        body: JSON.stringify({ ...form, discount: parseFloat(form.discount) }),
      });
      fetchPromos();
      setForm({ code: '', description: '', discount: '', type: 'percentage', startsAt: '', endsAt: '' });
    } catch {
      alert('Failed to create promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo?')) return;
    try {
      await fetchWrapper(`${API_URL}/${id}`, { method: 'DELETE' });
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Failed to delete promo');
    }
  };

  const filteredPromos = promos
    .filter(promo => {
      const matchesSearch = promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (promo.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      if (statusFilter === 'active') return matchesSearch && promo.isActive;
      if (statusFilter === 'inactive') return matchesSearch && !promo.isActive;
      if (statusFilter === 'expired') return matchesSearch && new Date(promo.endsAt) < new Date();
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
    <div className="min-h-screen mt-14 bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
            <p className="text-gray-600 mt-1">Manage discount codes</p>
          </div>
          <div className="flex gap-2 mt-3 sm:mt-0">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Total: {promos.length}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Active: {activePromos}
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
              Expired: {expiredPromos}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Search promotions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded text-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border p-2 rounded text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border p-2 rounded text-sm"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="code">Sort by Code</option>
              <option value="discount">Sort by Discount</option>
              <option value="endDate">Sort by End Date</option>
            </select>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Create New Promotion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Code"
              className="border p-2 rounded text-sm"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
            <input
              placeholder="Description"
              className="border p-2 rounded text-sm"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="Discount"
              className="border p-2 rounded text-sm"
              value={form.discount}
              onChange={(e) => setForm({ ...form, discount: e.target.value })}
            />
            <select
              className="border p-2 rounded text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed</option>
            </select>
            <input
              type="datetime-local"
              className="border p-2 rounded text-sm"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            />
            <input
              type="datetime-local"
              className="border p-2 rounded text-sm"
              value={form.endsAt}
              onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
            />
          </div>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center gap-1"
          >
            <Plus size={16} />
            Create Promotion
          </button>
        </div>

        {/* Promotions List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : filteredPromos.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">No promotions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Discount</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Start</th>
                    <th className="p-3 text-left">End</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromos.map((promo) => {
                    const isExpired = new Date(promo.endsAt) < new Date();
                    return (
                      <tr key={promo.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{promo.code}</td>
                        <td className="p-3">{promo.description || '—'}</td>
                        <td className="p-3 font-semibold">{promo.discount}{promo.type === 'percentage' ? '%' : '₹'}</td>
                        <td className="p-3 capitalize">{promo.type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isExpired ? 'bg-yellow-100 text-yellow-800' :
                            promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {isExpired ? 'Expired' : (promo.isActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="p-3 text-xs">{new Date(promo.startsAt).toLocaleDateString()}</td>
                        <td className="p-3 text-xs">{new Date(promo.endsAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDelete(promo.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              {filteredPromos.map((promo) => {
                const isExpired = new Date(promo.endsAt) < new Date();
                return (
                  <div key={promo.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{promo.code}</h3>
                        <p className="text-gray-600 text-sm">{promo.description || 'No description'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isExpired ? 'bg-yellow-100 text-yellow-800' :
                          promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isExpired ? 'Expired' : (promo.isActive ? 'Active' : 'Inactive')}
                        </span>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="text-red-600"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Discount:</span>
                        <span className="ml-1 font-medium">{promo.discount}{promo.type === 'percentage' ? '%' : '₹'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 capitalize">{promo.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Start:</span>
                        <span className="ml-1">{new Date(promo.startsAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">End:</span>
                        <span className="ml-1">{new Date(promo.endsAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}