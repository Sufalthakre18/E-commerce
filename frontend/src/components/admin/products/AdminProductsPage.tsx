'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuthToken } from '@/lib/utils/auth';
import { Package, Plus, Search, Filter, TrendingUp, AlertCircle, Edit, Trash2, Eye } from 'lucide-react';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import Pagination from '@/components/ui/productsui/Pagination'; // Import the pagination component

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
  | { success: true; data: Product[]; pagination?: { total: number; page: number; limit: number; totalPages: number } }
  | { products: Product[]; total: number; page: number; limit: number; totalPages: number };

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchProducts = () => {
    setLoading(true);
    
    // Build query parameters
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    if (selectedCategory !== 'all') {
      params.append('category', selectedCategory);
    }
    
    fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products?${params.toString()}`)
      .then((data: ApiResponse) => {
        // Extract products array from response
        const productArray = 'data' in data ? data.data : 'products' in data ? data.products : [];
        setProducts(Array.isArray(productArray) ? productArray : []);
        
        // Extract pagination info
        if ('pagination' in data && data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalProducts(data.pagination.total);
        } else if ('totalPages' in data) {
          setTotalPages(data.totalPages);
          setTotalProducts(data.total);
        } else {
          // Fallback if pagination info is not available
          setTotalPages(1);
          setTotalProducts(productArray.length);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
        setLoading(false);
      });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product? This will permanently delete the product, its variants, images, and all related data.')) return;
    setDeleteLoading(id);
    try {
      await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
        method: 'DELETE',
      });
      // If we're on the last page and it's the only item, go to previous page
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchProducts(); // Refresh current page
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert(`Failed to delete product: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleteLoading(null);
    }
  }

  const filteredProducts = products; // No need to filter on client side anymore

  const categories = [...new Set(products.map(p => p.category.name))];
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock < 10).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="w-16 h-16 border-4 border-indigo-200 rounded-full animate-spin border-t-indigo-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-14 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-1 sm:mb-2">Product Management</h1>
              <p className="text-sm sm:text-base text-indigo-700">Manage your product inventory</p>
            </div>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all text-sm sm:text-base shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add Product</span>
              <span className="xs:hidden">Add</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 mt-4 sm:mt-6">
            <StatsCard icon={<Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Total Products" value={totalProducts} color="from-indigo-500 to-indigo-600" />
            <StatsCard icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Inventory Value" value={`₹${totalValue.toLocaleString()}`} color="from-emerald-500 to-teal-600" />
            <StatsCard icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />} label="Low Stock Items" value={lowStockCount} color="from-amber-500 to-orange-600" />
          </div>
        </div>
        {/* Controls */}
        <div className="bg-white border border-indigo-100 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none text-sm sm:text-base bg-indigo-50/50"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-8 py-2 border border-indigo-200 rounded-lg text-sm sm:text-base appearance-none bg-indigo-50/50 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-1 bg-indigo-100 rounded-lg p-1 w-fit mx-auto sm:mx-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-sm ${viewMode === 'grid' ? 'bg-white shadow text-indigo-700' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-sm ${viewMode === 'table' ? 'bg-white shadow text-indigo-700' : 'text-indigo-600 hover:text-indigo-800'}`}
            >
              Table
            </button>
          </div>
        </div>
        {/* Product List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-indigo-100 shadow-sm">
            <Package className="w-8 h-8 sm:w-10 sm:h-10 mx-auto text-indigo-400 mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-indigo-600">No products found</p>
          </div>
        ) : viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} handleDelete={handleDelete} deleteLoading={deleteLoading} />
              ))}
            </div>
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </>
        ) : (
          <>
            <ProductTable products={filteredProducts} handleDelete={handleDelete} deleteLoading={deleteLoading} />
            <Pagination 
              currentPage={currentPage} 
              totalPages={totalPages} 
              onPageChange={handlePageChange} 
            />
          </>
        )}
      </div>
    </div>
  );
}

// Components remain the same...
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  return (
    <div className={`p-3 sm:p-4 rounded-xl bg-gradient-to-r ${color} text-white shadow-md hover:shadow-lg transition-all`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-white/20 p-1.5 sm:p-2 rounded-lg flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm opacity-90">{label}</p>
          <p className="text-base sm:text-lg font-bold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, handleDelete, deleteLoading }: any) {
  return (
    <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
      <div className="h-32 sm:h-40 bg-gradient-to-br from-indigo-100 to-purple-100">
        {product.images[0] ? (
          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex justify-center items-center h-full">
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-bold text-indigo-900 truncate text-sm sm:text-base">{product.name}</h3>
        <p className="text-xs sm:text-sm text-indigo-700 truncate mt-1">{product.description}</p>
        <div className="flex justify-between items-center mt-2 sm:mt-3 text-xs sm:text-sm">
          <span className="font-bold text-indigo-600">₹{product.price}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
            Stock: {product.stock}
          </span>
        </div>
        <div className="flex gap-2 mt-3 sm:mt-4">
          <Link href={`/admin/products/edit/${product.id}`} className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1">
            <Edit className="w-3 h-3" />
            <span>Edit</span>
          </Link>
          <button onClick={() => handleDelete(product.id)} disabled={deleteLoading === product.id} className="text-xs sm:text-sm text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            <span>{deleteLoading === product.id ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductTable({ products, handleDelete, deleteLoading }: any) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl border border-indigo-100 shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-left text-xs sm:text-sm text-indigo-700">
            <th className="p-2 sm:p-4 min-w-[200px] font-semibold">Product</th>
            <th className="p-2 sm:p-4 hidden sm:table-cell font-semibold">Category</th>
            <th className="p-2 sm:p-4 font-semibold">Price</th>
            <th className="p-2 sm:p-4 font-semibold">Stock</th>
            <th className="p-2 sm:p-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product: Product) => (
            <tr key={product.id} className="border-t border-indigo-50 hover:bg-indigo-50/50 transition-colors">
              <td className="p-2 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-indigo-900 text-xs sm:text-sm truncate">{product.name}</p>
                    <p className="text-xs text-indigo-600 truncate sm:block hidden">{product.description}</p>
                    <p className="text-xs text-indigo-600 sm:hidden">{product.category.name}</p>
                  </div>
                </div>
              </td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm text-indigo-700 hidden sm:table-cell">{product.category.name}</td>
              <td className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-indigo-900">₹{product.price}</td>
              <td className="p-2 sm:p-4">
                <span className={`px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium ${product.stock < 10 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {product.stock}
                </span>
              </td>
              <td className="p-2 sm:p-4">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <Link href={`/admin/products/edit/${product.id}`} className="text-indigo-600 text-xs sm:text-sm hover:text-indigo-800 hover:underline flex items-center gap-1">
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={deleteLoading === product.id}
                    className="text-rose-600 text-xs sm:text-sm hover:text-rose-800 hover:underline flex items-center gap-1 text-left"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{deleteLoading === product.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                  <Link href={`/admin/products/${product.id}/reviews`} className="text-purple-600 text-xs hover:text-purple-800 hover:underline flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>Reviews</span>
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