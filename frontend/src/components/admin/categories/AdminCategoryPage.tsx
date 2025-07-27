'use client'

import { getAuthToken } from "@/lib/utils/auth";
import React, { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  _count: {
    products: number;
  };
  subcategories?: Category[];
}

const AdminCategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("❌ Failed to fetch categories:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async () => {
    if (!newCategory.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: newCategory,
          ...(parentCategoryId ? { parentId: parentCategoryId } : {})
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Failed to create category:", errorData);
        throw new Error("Failed to create");
      }


      setNewCategory("");
      setParentCategoryId(null);
      fetchCategories();
    } catch (err) {
      console.error("❌ Failed to create category:", err);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: editingCategory.name,
          parentId: editingCategory.parentId ?? null
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("❌ Failed to update category:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete");

      fetchCategories();
    } catch (err) {
      console.error("❌ Failed to delete category:", err);
    }
  };

  const renderCategoryList = (catList: Category[], depth: number = 0) => {
    return catList.map((cat) => (
      <li key={cat.id} className="border p-3 rounded mb-2">
        <div className="flex justify-between items-center">
          <div>
            <p className={`font-medium`} style={{ marginLeft: `${depth * 12}px` }}>
              {cat.name}
            </p>
            <p className="text-sm text-gray-600">
              {cat._count.products} product{cat._count.products !== 1 && "s"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingCategory(cat)}
              className="bg-yellow-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="bg-red-600 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </div>
        </div>
        {cat.subcategories && cat.subcategories.length > 0 && (
          <ul className="ml-4 mt-2 border-l pl-4">
            {renderCategoryList(cat.subcategories, depth + 1)}
          </ul>
        )}
      </li>
    ));
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📁 Manage Categories</h1>

      {/* Add New */}
      <div className="flex flex-col gap-2 mb-4">
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <select
          value={parentCategoryId || ""}
          onChange={(e) => setParentCategoryId(e.target.value || null)}
          className="border rounded px-3 py-2"
        >
          <option value="">Top-level</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Category
        </button>
      </div>

      {/* Edit Mode */}
      {editingCategory && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">✏️ Edit Category</h2>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={editingCategory.name}
              onChange={(e) =>
                setEditingCategory({ ...editingCategory, name: e.target.value })
              }
              className="border rounded px-3 py-2"
            />
            <select
              value={editingCategory.parentId || ""}
              onChange={(e) =>
                setEditingCategory({
                  ...editingCategory,
                  parentId: e.target.value || null,
                })
              }
              className="border rounded px-3 py-2"
            >
              <option value="">Top-level</option>
              {categories
                .filter((cat) => cat.id !== editingCategory.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditingCategory(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <ul className="space-y-2">{renderCategoryList(categories)}</ul>
    </div>
  );
};

export default AdminCategoryPage;
