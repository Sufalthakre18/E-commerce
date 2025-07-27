'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/utils/auth';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    description: '',
    category: '',
  });
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
      const data = await res.json();
      setFormData({
        name: data.name,
        price: data.price.toString(),
        stock: data.stock.toString(),
        description: data.description,
        category: data.category?.name || '',
      });
      setExistingImages(data.images || []);
    };
    if (id) fetchProduct();
  }, [id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setNewImages(prev => [...prev, ...Array.from(files)]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imgId: string) => {
    setImagesToDelete(prev => [...prev, imgId]);
    setExistingImages(prev => prev.filter(img => img.id !== imgId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('price', formData.price);
      form.append('stock', formData.stock);
      form.append('description', formData.description);
      form.append('category', formData.category);
      imagesToDelete.forEach(id => form.append('imagesToDelete', id));
      newImages.forEach(file => form.append('images', file));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: form,
      });

      if (!res.ok) throw new Error('Failed to update product');

      setSuccess(true);
      setTimeout(() => router.push('/admin/products'), 2000);
    } catch (err: any) {
      setErrors({ general: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex justify-center items-center h-screen text-green-700">
        <div className="text-center">
          <div className="text-2xl font-semibold">Product updated successfully!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <button onClick={() => router.push('/admin/products')} className="mb-4 text-sm underline">
        ← Back to Products
      </button>

      <h2 className="text-xl font-bold mb-4">Edit Product</h2>

      {errors.general && <div className="text-red-600 mb-4">{errors.general}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <SimpleInput label="Name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
        <SimpleInput label="Price" name="price" value={formData.price} type="number" onChange={handleChange} error={errors.price} />
        <SimpleInput label="Stock" name="stock" value={formData.stock} type="number" onChange={handleChange} error={errors.stock} />
        <SimpleInput label="Category" name="category" value={formData.category} onChange={handleChange} />
        <SimpleTextarea label="Description" name="description" value={formData.description} onChange={handleChange} error={errors.description} />

        <div>
          <label className="block text-sm font-medium mb-1">Product Images</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {existingImages.map((img) => (
              <div key={img.id}>
                <img src={img.url} className="h-20 w-full object-cover rounded" />
                <button type="button" onClick={() => removeExistingImage(img.id)} className="text-xs text-red-600 underline">
                  Remove
                </button>
              </div>
            ))}
            {newImages.map((file, i) => (
              <div key={i}>
                <img src={URL.createObjectURL(file)} className="h-20 w-full object-cover rounded" />
                <button type="button" onClick={() => removeNewImage(i)} className="text-xs text-red-600 underline ">
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}

function SimpleInput({ label, name, value, onChange, error, type = 'text' }: any) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full border px-2 py-1 rounded"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function SimpleTextarea({ label, name, value, onChange, error }: any) {
  return (
    <div>
      <label className="block text-sm mb-1">{label}</label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full border px-2 py-1 rounded"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
