'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  role: { name: string };
  orderCount: number;
  recentOrder: {
    id: string;
    name?: string;
    status?: string;
  } | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/auth/list`);
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role.name === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'medium',
    }).format(new Date(dateString));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="mt-14 px-3 sm:px-0 flex justify-center items-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="mt-14 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Users</h2>
        <div className="text-sm text-gray-500 mt-2 sm:mt-0">
          Showing {filtered.length} user{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recent Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                    {user.role.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">{user.orderCount}</span>
                    <span className="ml-1 text-gray-400">orders</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.recentOrder ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        <Link href={`/admin/orders/${user.recentOrder.id}`} className="text-blue-600 hover:text-blue-900">
                          {user.recentOrder.id}
                        </Link>
                      </div>
                      {user.recentOrder.name && (
                        <div className="text-sm text-gray-500">{user.recentOrder.name}</div>
                      )}
                      {user.recentOrder.status && (
                        <span className={`mt-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getOrderStatusColor(user.recentOrder.status)}`}>
                          {user.recentOrder.status}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No orders</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards - Mobile */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {paginated.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                  {user.role.name}
                </span>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Orders</p>
                  <p className="text-lg font-semibold">{user.orderCount}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Recent Order</p>
                {user.recentOrder ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/admin/orders/${user.recentOrder.id}`} className="text-blue-600 hover:text-blue-900 font-medium">
                          {user.recentOrder.id}
                        </Link>
                        {user.recentOrder.name && (
                          <p className="text-sm text-gray-500 mt-1">{user.recentOrder.name}</p>
                        )}
                      </div>
                      {user.recentOrder.status && (
                        <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(user.recentOrder.status)}`}>
                          {user.recentOrder.status}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No orders</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {paginated.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-gray-500">
            {search || roleFilter
              ? "No users match your search criteria."
              : "Get started by adding a new user."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 bg-white px-4 py-3 rounded-lg shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, filtered.length)}
                </span>{' '}
                of <span className="font-medium">{filtered.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}