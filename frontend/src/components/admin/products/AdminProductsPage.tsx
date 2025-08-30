'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/utils/auth';
import { Package, Plus, Search, Filter, TrendingUp, AlertCircle } from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: {
    id: string;
    name: string;
  };
  images: {
    id: string;
    url: string;
    publicId: string | null;
    productId: string;
  }[];
};

// Define expected API response type
type ApiResponse =
  | { success: true; data: Product[] }
  | { products: Product[]; total: number; page: number; limit: number };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`)
      .then((data: ApiResponse) => {
        // Extract products array from response
        const productArray = 'data' in data ? data.data : 'products' in data ? data.products : [];
        setProducts(Array.isArray(productArray) ? productArray : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product? This will permanently delete the product, its variants, images, and all related data.')) return;

    setDeleteLoading(id);
    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
        method: 'DELETE',
      });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert(`Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || product.category.name === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(products.map(p => p.category.name))];
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Product Management</h1>
              <p className="text-sm sm:text-base text-slate-600">Manage your product inventory</p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add Product</span>
              <span className="xs:hidden">Add</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6">
            <StatsCard icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Total Products" value={products.length} color="from-blue-500 to-blue-600" />
            <StatsCard icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Inventory Value" value={`₹${totalValue.toLocaleString()}`} color="from-green-500 to-teal-600" />
            <StatsCard icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Low Stock Items" value={lowStockCount} color="from-red-500 to-rose-600" />
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 outline-none text-sm sm:text-base"
              />
            </div>

            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-2 border rounded-lg text-sm sm:text-base"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit mx-auto sm:mx-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-sm ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-sm ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-slate-400 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-slate-500">No products found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} handleDelete={handleDelete} deleteLoading={deleteLoading} />
            ))}
          </div>
        ) : (
          <ProductTable products={filteredProducts} handleDelete={handleDelete} deleteLoading={deleteLoading} />
        )}
      </div>
    </div>
  );
}

// Components
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`p-3 sm:p-4 rounded-xl bg-gradient-to-r ${color} text-white`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm">{label}</p>
          <p className="text-base sm:text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, handleDelete, deleteLoading }: any) {
  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="h-32 sm:h-40 bg-slate-100">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex justify-center items-center h-full">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-slate-800 truncate text-sm sm:text-base">{product.name}</h3>
        <p className="text-xs sm:text-sm text-slate-600 truncate mt-1">{product.description}</p>
        <div className="flex justify-between items-center mt-2 sm:mt-3 text-xs sm:text-sm">
          <span className="font-bold text-blue-600">₹{product.price}</span>
          <span className={`px-2 py-1 rounded-full text-xs ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
            Stock: {product.stock}
          </span>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-4">
          <Link href={`/admin/products/edit/${product.id}`} className="text-xs sm:text-sm text-blue-600 hover:underline">Edit</Link>
          <button onClick={() => handleDelete(product.id)} disabled={deleteLoading === product.id} className="text-xs sm:text-sm text-red-600 hover:underline">
            {deleteLoading === product.id ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products, handleDelete, deleteLoading }: any) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border">
      <table className="min-w-full">
        <thead>
          <tr className="bg-slate-100 text-left text-xs sm:text-sm text-slate-600">
            <th className="p-2 sm:p-4 min-w-[200px]">Product</th>
            <th className="p-2 sm:p-4 hidden sm:table-cell">Category</th>
            <th className="p-2 sm:p-4">Price</th>
            <th className="p-2 sm:p-4">Stock</th>
            <th className="p-2 sm:p-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product: Product) => (
            <tr key={product.id} className="border-t">
              <td className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-xs sm:text-sm truncate">{product.name}</p>
                    <p className="text-xs text-slate-500 truncate sm:block hidden">{product.description}</p>
                    <p className="text-xs text-slate-500 sm:hidden">{product.category.name}</p>
                  </div>
                </div>
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm hidden sm:table-cell">{product.category.name}</td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium">₹{product.price}</td>
              <td className="p-2 sm:p-4">
                <span className={`px-1.5 sm:px-2 py-1 rounded-full text-xs ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {product.stock}
                </span>
              </td>
              <td className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <Link href={`/admin/products/edit/${product.id}`} className="text-blue-600 text-xs sm:text-sm hover:underline">Edit</Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteLoading === product.id}
                    className="text-red-600 text-xs sm:text-sm hover:underline text-left"
                  >
                    {deleteLoading === product.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <Link href={`/admin/products/${product.id}/reviews`} className="text-indigo-600 text-xs hover:underline">
                    View Reviews
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}