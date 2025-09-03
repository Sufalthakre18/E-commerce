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
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    useEffect(() => {
        fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/`)
            .then(setUsers)
            .catch((err) => console.error('Error fetching users:', err));
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

    return (
        <div className="mt-14 px-3 sm:px-0">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Users</h2>

            {/* Filters */}
            <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
                <input
                    type="text"
                    placeholder="Search by name/email"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full sm:w-64 text-sm sm:text-base"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="border px-3 py-2 rounded w-full sm:w-auto text-sm sm:text-base"
                >
                    <option value="">All Roles</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                </select>
            </div>

            {/* Table - Desktop */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full bg-white rounded shadow text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Name</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Role</th>
                            <th className="p-3">Joined</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map((user) => (
                            <tr key={user.id} className="border-t hover:bg-gray-50">
                                <td className="p-3">{user.name}</td>
                                <td className="p-3">{user.email}</td>
                                <td className="p-3">{user.role.name}</td>
                                <td className="p-3">
                                    {new Intl.DateTimeFormat('en-GB', {
                                        dateStyle: 'medium',
                                    }).format(new Date(user.createdAt))}
                                </td>
                                <td className="p-3">
                                    <Link
                                        href={`/admin/users/${user.id}/orders`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        View Orders
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Cards - Mobile */}
            <div className="sm:hidden space-y-3">
                {paginated.map((user) => (
                    <div key={user.id} className="bg-white rounded shadow p-3 border">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="font-medium text-sm">{user.name}</h3>
                                <p className="text-xs text-gray-600">{user.email}</p>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {user.role.name}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                                Joined: {new Intl.DateTimeFormat('en-GB', {
                                    dateStyle: 'short',
                                }).format(new Date(user.createdAt))}
                            </span>
                            <Link
                                href={`/admin/users/${user.id}/orders`}
                                className="text-blue-600 hover:underline text-xs"
                            >
                                View Orders
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center sm:justify-end mt-4 gap-2">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 text-xs sm:text-sm"
                >
                    Prev
                </button>
                <span className="px-2 py-1 text-xs sm:text-sm">{currentPage} / {totalPages || 1}</span>
                <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1 border rounded disabled:opacity-50 text-xs sm:text-sm"
                >
                    Next
                </button>
            </div>
        </div>
    );
}