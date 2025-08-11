'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { getAuthToken } from '@/lib/utils/auth';
import {
  Package,
  User,
  Truck,
  RefreshCw,
  Download,
  Filter,
  X,
  Calendar,
  IndianRupeeIcon,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

// Types
type OrderItem = {
  id: string;
  quantity: number;
  size?: { size: string };
  product: {
    name: string;
    price: number;
  };
  variant?: {
    id: string;
    color: string;
    colorCode: string;
    price: number;
  };
};

type Address = {
  fullName: string;
  phone: string;
  altPhone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

type Status = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'RETURN_REQUESTED';

type Order = {
  id: string;
  user: { name: string };
  items: OrderItem[];
  status: Status;
  total: number;
  createdAt: string;
  address: Address | null;
};

interface ApiResponse {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
}

const statusOptions: (Status | 'ALL')[] = [
  'ALL',
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
  'RETURN_REQUESTED',
];

const statusColors: { [key in Status]: string } = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  RETURNED: 'bg-gray-100 text-gray-800 border-gray-200',
  RETURN_REQUESTED: 'bg-orange-100 text-orange-800 border-orange-200',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterInputs, setFilterInputs] = useState({
    status: 'ALL' as Status | 'ALL',
    productName: '',
    from: '',
    to: '',
    minTotal: '',
    maxTotal: '',
  });
  const [filters, setFilters] = useState(filterInputs);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        const { status, productName, from, to, minTotal, maxTotal } = filters;
        const queryParams = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(status !== 'ALL' && { status }),
          ...(productName.trim() && { productName }),
          ...(from && { from }),
          ...(to && { to }),
          ...(minTotal && { minTotal }),
          ...(maxTotal && { maxTotal }),
        });

        const data: ApiResponse = await fetchWrapper(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/orders?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (Array.isArray(data.data)) {
          setOrders(data.data);
          setTotalPages(data.totalPages || 1);
        } else {
          throw new Error('Invalid response structure: Expected data array');
        }
      } catch (err: any) {
        console.error('Failed to fetch orders:', err.message, err.stack);
        const errorMessage = err.message.includes('404')
          ? 'Orders endpoint not found. Please check the backend configuration.'
          : err.message.includes('text/html')
          ? 'Invalid response from server. Expected JSON data.'
          : err.message || 'Failed to load orders. Please try again later.';
        setError(errorMessage);
        setOrders([]);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, filters]);

  const handlePrevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (page < totalPages) setPage((p) => p + 1);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = filters.status === 'ALL' || order.status === filters.status;
      const searchText = filters.productName.trim().toLowerCase();
      const matchesProductOrOrderId =
        searchText === '' ||
        order.id.toLowerCase().includes(searchText) ||
        order.items.some((item) => item.product.name.toLowerCase().includes(searchText));
      const orderDate = new Date(order.createdAt);
      const fromDate = filters.from ? new Date(filters.from) : null;
      const toDate = filters.to ? new Date(filters.to) : null;
      const matchesDate = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);
      const matchesTotalMin = !filters.minTotal || order.total >= Number(filters.minTotal);
      const matchesTotalMax = !filters.maxTotal || order.total <= Number(filters.maxTotal);

      return matchesStatus && matchesProductOrOrderId && matchesDate && matchesTotalMin && matchesTotalMax;
    });
  }, [orders, filters]);

  const handleStatusUpdate = async (orderId: string, newStatus: Status) => {
    try {
      const token = getAuthToken();
      const result = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      );
      toast.success('Status updated successfully');
    } catch (err: any) {
      console.error('Status update failed:', err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleConfirmReturn = async (orderId: string) => {
    try {
      const token = getAuthToken();
      const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/return/confirm/${orderId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? { ...order, status: 'RETURNED' as Status } : order))
      );
      toast.success(data.message || 'Return confirmed');
    } catch (err: any) {
      console.error('Failed to confirm return:', err);
      toast.error(err.message || 'Failed to confirm return');
    }
  };

  const exportToCSV = () => {
    if (!filteredOrders.length) {
      toast.error('No orders to export');
      return;
    }
    const header = [
      'Order ID',
      'User',
      'Phone',
      'Alt Phone',
      'Address',
      'Items (Name × Qty × Size × Variant)',
      'Status',
      'Total (₹)',
      'Date',
    ];
    const rows = filteredOrders.map((order) => {
      const address = order.address;
      const formattedAddress = address
        ? `${address.fullName}, ${address.line1}, ${address.line2}, ${address.city}, ${address.state}, ${address.postalCode}, ${address.country}`
        : 'N/A';
      const itemList = order.items
        .map((item) => {
          const sizeLabel = item.size?.size ? ` (${item.size.size})` : '';
          const variantLabel = item.variant ? ` (${item.variant.color} ₹${item.variant.price})` : '';
          return `${item.product.name}${sizeLabel} ×${item.quantity}${variantLabel}`;
        })
        .join(' | ');

      return [
        order.id,
        order.user.name,
        address?.phone || 'N/A',
        address?.altPhone || 'N/A',
        `"${formattedAddress}"`,
        `"${itemList}"`,
        order.status,
        order.total,
        new Date(order.createdAt).toLocaleString(),
      ];
    });

    const csvContent = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-100 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-50 rounded-xl border"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              setError(null);
              setPage(1);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    filters.status !== 'ALL' ||
    filters.productName ||
    filters.from ||
    filters.to ||
    filters.minTotal ||
    filters.maxTotal;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
              <p className="text-sm text-gray-500 mt-0.5">{filteredOrders.length} orders found</p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!filteredOrders.length}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  Active
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4 lg:space-y-0 lg:grid lg:grid-cols-6 lg:gap-4">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilterInputs((prev) => ({ ...prev, status: e.target.value as Status | 'ALL' }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Search */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Product</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filterInputs.productName}
                  onChange={(e) => setFilterInputs((prev) => ({ ...prev, productName: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Date From */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filterInputs.from}
                  onChange={(e) => setFilterInputs((prev) => ({ ...prev, from: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filterInputs.to}
                  onChange={(e) => setFilterInputs((prev) => ({ ...prev, to: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Min Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Min Amount</label>
              <div className="relative">
                <IndianRupeeIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="₹0"
                  value={filterInputs.minTotal}
                  onChange={(e) => setFilterInputs((prev) => ({ ...prev, minTotal: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Max Amount */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Max Amount</label>
              <div className="relative">
                <IndianRupeeIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  placeholder="₹999999"
                  value={filterInputs.maxTotal}
                  onChange={(e) => setFilterInputs((prev) => ({ ...prev, maxTotal: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              onClick={() => {
                const cleared = {
                  status: 'ALL' as Status | 'ALL',
                  productName: '',
                  from: '',
                  to: '',
                  minTotal: '',
                  maxTotal: '',
                };
                setFilterInputs(cleared);
                setFilters(cleared);
                setPage(1);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
            <button
              onClick={() => {
                setPage(1);
                setFilters(filterInputs);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200 cursor-pointer group"
                key={order.id}
              >
                <div className="p-5">
                  <Link href={`/admin/orders/${order.id}`}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg group-hover:from-indigo-200 group-hover:to-purple-200 transition-colors">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.user.name}</h3>
                          <p className="text-sm text-gray-500">Order #{order.id.slice(-8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500 mb-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">
                              {item.product.name} × {item.quantity}
                              {item.size?.size && ` (${item.size.size})`}
                              {item.variant && ` (${item.variant.color})`}
                            </span>
                            <span className="font-medium text-gray-900">
                              ₹{(item.variant?.price ? item.variant.price * item.quantity : item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200 flex justify-between text-sm font-semibold">
                          <span>Total</span>
                          <span className="text-indigo-600">₹{order.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    {order.address && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-xs font-medium text-blue-700 mb-1">Delivery Address</div>
                        <div className="text-sm text-blue-900">
                          {order.address.line1}, {order.address.line2}, {order.address.city}, {order.address.state},{' '}
                          {order.address.country} {order.address.postalCode}
                        </div>
                        <div className="text-sm text-blue-800 mt-1">
                          📞 {order.address.phone} {order.address.altPhone && `/ ${order.address.altPhone}`}
                        </div>
                      </div>
                    )}
                  </Link>
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      {order.status === 'RETURNED' ? (
                        <span className="text-sm text-gray-500 italic">Status update disabled</span>
                      ) : (
                        <select
                          value={order.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(order.id, e.target.value as Status);
                          }}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {statusOptions
                            .filter((s) => s !== 'ALL')
                            .map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>

                    {order.status === 'RETURN_REQUESTED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleConfirmReturn(order.id);
                        }}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-pink-700 text-sm font-medium flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Confirm Return
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-6">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="text-sm text-gray-500">...</span>}
            </div>

            <button
              onClick={handleNextPage}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
