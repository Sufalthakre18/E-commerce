// Updated frontend EditProductPage (fixed deletions to use database ids instead of publicIds)

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import Image from 'next/image';
import { toast } from 'sonner';
import { Loader2, X, Plus } from 'lucide-react';

// Define types
interface Size {
  id?: string;
  size: string;
  stock: number;
}

interface Variant {
  id?: string;
  color: string;
  colorCode: string;
  price: number;
  imageFiles?: File[];
  images?: Array<{ id: string; url: string; publicId: string }>;
  imagesToDelete?: string[];
  newImageIndices?: number[];
}

interface ProductImage {
  id: string;
  url: string;
  publicId: string;
}

interface DigitalFile {
  id: string;
  url: string;
  publicId: string;
  fileName: string;
}

interface FormDataType {
  name: string;
  price: number;
  stock: number;
  description: string;
  details: string;
  categoryId: string;
  productType: 'physical' | 'digital';
  type: string;
  sizes: Size[];
  variants: Variant[];
}

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  subcategories?: Category[];
}

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    details: '',
    categoryId: '',
    productType: 'physical',
    type: '',
    sizes: [],
    variants: [],
  });

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newDigitalFiles, setNewDigitalFiles] = useState<File[]>([]);
  const [existingDigitalFiles, setExistingDigitalFiles] = useState<DigitalFile[]>([]);
  const [digitalFilesToDelete, setDigitalFilesToDelete] = useState<string[]>([]);
  const [variantImages, setVariantImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`),
  });

  // Fetch product data
  const { data: productData, isLoading: productLoading } = useQuery<{
    data: {
      name: string;
      price: number;
      stock: number;
      description: string;
      details: string;
      categoryId: string;
      productType: 'physical' | 'digital';
      type: string;
      sizes: Size[];
      variants: Variant[];
      images: ProductImage[];
      digitalFiles: DigitalFile[];
    };
  }>({
    queryKey: ['product', id],
    queryFn: () => fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`),
    enabled: !!id,
  });

  useEffect(() => {
    if (productData?.data) {
      setFormData({
        name: productData.data.name || '',
        price: productData.data.price || 0,
        stock: productData.data.stock || 0,
        description: productData.data.description || '',
        details: productData.data.details || '',
        categoryId: productData.data.categoryId || '',
        productType: productData.data.productType || 'physical',
        type: productData.data.type || '',
        sizes: productData.data.sizes || [],
        variants: (productData.data.variants || []).map((v: Variant) => ({
          id: v.id,
          color: v.color || '',
          colorCode: v.colorCode || '#000000',
          price: v.price || productData.data.price || 0,
          images: v.images || [],
          imagesToDelete: [],
          imageFiles: [],
          newImageIndices: [],
        })),
      });
      setExistingImages(productData.data.images || []);
      setExistingDigitalFiles(productData.data.digitalFiles || []);
    }
  }, [productData]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (form: FormData) => {
      const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
        method: 'PUT',
        body: form,
      });
      console.log('Raw backend response:', response);
      return response;
    },
    onSuccess: () => {
      toast.success('Product updated successfully!');
      setTimeout(() => router.push('/admin/products'), 1500);
    },
    onError: (error: any) => {
      console.error('Update product error:', error);
      toast.error(error.message || 'Failed to update product. Check console for details.', { duration: 5000 });
    },
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const finalValue = type === 'number' ? parseFloat(value) || 0 : value;

      setFormData(prev => ({ ...prev, [name]: finalValue }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    },
    []
  );

  const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) newErrors.name = 'Product name is required';
  if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
  if (formData.productType === 'physical' && formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
  if (!formData.description.trim()) newErrors.description = 'Description is required';
  if (!formData.details.trim()) newErrors.details = 'Details is required';
  if (!formData.type.trim()) newErrors.type = 'Type is required';
  if (!formData.categoryId) newErrors.categoryId = 'Please select a category';

  formData.variants.forEach((variant, index) => {
    if (!variant.color.trim()) newErrors[`variant_${index}_color`] = `Color is required for variant ${index + 1}`;
    if (!variant.colorCode.trim()) newErrors[`variant_${index}_colorCode`] = `Color code is required for variant ${index + 1}`;
    if (variant.price <= 0) newErrors[`variant_${index}_price`] = `Price must be greater than 0 for variant ${index + 1}`;
  });

  formData.sizes.forEach((size, index) => {
    if (!size.size.trim()) newErrors[`size_${index}_size`] = `Size is required for size ${index + 1}`;
    if (size.stock < 0) newErrors[`size_${index}_stock`] = `Stock cannot be negative for size ${index + 1}`;
  });

  // Validate imagesToDelete and digitalFilesToDelete
  imagesToDelete.forEach((id, index) => {
    if (!id || typeof id !== 'string') {
      newErrors[`imageToDelete_${index}`] = `Invalid image ID for deletion at index ${index + 1}`;
    }
  });
  digitalFilesToDelete.forEach((id, index) => {
    if (!id || typeof id !== 'string') {
      newErrors[`digitalFileToDelete_${index}`] = `Invalid digital file ID for deletion at index ${index + 1}`;
    }
  });

  setErrors(newErrors);

  if (Object.keys(newErrors).length > 0) {
    console.log('Form validation errors:', newErrors);
    toast.error(
      <div>
        <p>Please fix the following form errors:</p>
        <ul className="list-disc pl-4">
          {Object.entries(newErrors).map(([key, message]) => (
            <li key={key} className="text-sm">{message}</li>
          ))}
        </ul>
      </div>,
      { duration: 5000 }
    );
    return false;
  }

  return true;
};

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'digital') => {
    const files = e.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      if (type === 'image') {
        const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
        if (!isValid) setErrors(prev => ({ ...prev, images: 'Please select valid image files under 5MB' }));
        return isValid;
      } else {
        const allowedTypes = ['application/pdf', 'application/zip', 'audio/mpeg'];
        const isValid = allowedTypes.includes(file.type) && file.size <= 50 * 1024 * 1024;
        if (!isValid) setErrors(prev => ({ ...prev, digitalFiles: 'Please select valid PDF, ZIP, or MP3 files under 50MB' }));
        return isValid;
      }
    });

    if (type === 'image') {
      setNewImages(prev => [...prev, ...validFiles]);
    } else {
      setNewDigitalFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeNewImage = (index: number) => {
    console.log('Removing new image at index:', index);
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (id: string) => {
    console.log('Removing existing image with id:', id);
    if (!id || typeof id !== 'string') {
      console.warn('Invalid id for image deletion:', id);
      toast.error('Cannot delete image: Invalid ID');
      return;
    }
    if (confirm('Are you sure you want to delete this image? This action is permanent.')) {
      setImagesToDelete(prev => [...prev, id]);
      setExistingImages(prev => prev.filter(img => img.id !== id));
    }
  };

  const removeNewDigitalFile = (index: number) => {
    console.log('Removing new digital file at index:', index);
    setNewDigitalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingDigitalFile = (id: string) => {
    console.log('Removing existing digital file with id:', id);
    if (!id || typeof id !== 'string') {
      console.warn('Invalid id for digital file deletion:', id);
      toast.error('Cannot delete digital file: Invalid ID');
      return;
    }
    if (confirm('Are you sure you want to delete this digital file? This action is permanent.')) {
      setDigitalFilesToDelete(prev => [...prev, id]);
      setExistingDigitalFiles(prev => prev.filter(file => file.id !== id));
    }
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: 0 }],
    }));
  };

  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size)),
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          color: '',
          colorCode: '#000000',
          price: formData.price || 0,
          imageFiles: [],
          images: [],
          imagesToDelete: [],
          newImageIndices: [],
        },
      ],
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)),
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          [`variant_${variantIndex}_images`]: 'Please select valid image files under 5MB',
        }));
      }
      return isValid;
    });

    if (validFiles.length === 0) return;

    setVariantImages(prev => [...prev, ...validFiles]);
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => {
        if (i === variantIndex) {
          const currentFiles = variant.imageFiles || [];
          const newIndices = validFiles.map((_, idx) => variantImages.length + idx);
          return {
            ...variant,
            imageFiles: [...currentFiles, ...validFiles],
            newImageIndices: [...(variant.newImageIndices || []), ...newIndices],
          };
        }
        return variant;
      }),
    }));

    e.target.value = '';
  };

  const removeVariantImage = (variantIndex: number, imageId: string) => {
    console.log('Removing variant image with id:', imageId);
    if (!imageId || typeof imageId !== 'string') {
      console.warn('Invalid id for variant image deletion:', imageId);
      toast.error('Cannot delete variant image: Invalid ID');
      return;
    }
    if (confirm('Are you sure you want to delete this variant image? This action is permanent.')) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map((variant, i) => {
          if (i === variantIndex) {
            return {
              ...variant,
              images: variant.images?.filter(img => img.id !== imageId) || [],
              imagesToDelete: [...(variant.imagesToDelete || []), imageId],
            };
          }
          return variant;
        }),
      }));
    }
  };

  const removeVariantNewImage = (variantIndex: number, imageIndex: number) => {
    console.log('Removing new variant image at index:', imageIndex);
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => {
        if (i === variantIndex) {
          return {
            ...variant,
            imageFiles: variant.imageFiles?.filter((_, idx) => idx !== imageIndex) || [],
            newImageIndices: variant.newImageIndices?.filter((_, idx) => idx !== imageIndex) || [],
          };
        }
        return variant;
      }),
    }));
    setVariantImages(prev => prev.filter((_, idx) => idx !== imageIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const form = new FormData();
    form.append('name', formData.name);
    form.append('price', formData.price.toString());
    form.append('stock', formData.stock.toString());
    form.append('description', formData.description);
    form.append('details', formData.details);
    form.append('categoryId', formData.categoryId);
    form.append('productType', formData.productType);
    form.append('type', formData.type);

    // Ensure sizes and variants are sent as valid JSON strings
    form.append('sizes', formData.sizes.length > 0 ? JSON.stringify(formData.sizes) : '[]');
    form.append('variants', formData.variants.length > 0 ? JSON.stringify(formData.variants.map(v => ({
      ...v,
      imageFiles: undefined, // Exclude File objects from JSON
    }))) : '[]');

    // Append deletion arrays with validation
    const uniqueImagesToDelete = [...new Set(imagesToDelete.filter(id => id && typeof id === 'string'))];
    uniqueImagesToDelete.forEach(id => form.append('imagesToDelete[]', id));
    const uniqueDigitalFilesToDelete = [...new Set(digitalFilesToDelete.filter(id => id && typeof id === 'string'))];
    uniqueDigitalFilesToDelete.forEach(id => form.append('digitalFilesToDelete[]', id));

    // Append file uploads
    newImages.forEach(file => form.append('images', file));
    newDigitalFiles.forEach(file => form.append('digitalFiles', file));
    variantImages.forEach(file => form.append('variantImages', file));

    // Log FormData contents for debugging
    console.log('FormData contents:');
    for (const [key, value] of form.entries()) {
      console.log(`${key}:`, value instanceof File ? value.name : value);
    }

    updateMutation.mutate(form);
  };

  const renderCategoryOptions = (cats: Category[], level = 0): React.ReactElement[] => {
    return cats.flatMap(cat => [
      <option key={cat.id} value={cat.id}>
        {'—'.repeat(level)} {cat.name}
      </option>,
      ...(cat.subcategories ? renderCategoryOptions(cat.subcategories, level + 1) : []),
    ]);
  };

  if (productLoading || categoriesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />
            <FormInput
              label="Price (₹)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              min="0"
              step="0.01"
              required
            />
            <FormInput
              label="Stock Quantity"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
              min="0"
              required={formData.productType === 'physical'}
              disabled={formData.productType === 'digital'}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Select Category</option>
                {renderCategoryOptions(categories)}
              </select>
              {errors.categoryId && <p className="text-sm text-red-600 mt-1">{errors.categoryId}</p>}
            </div>
            <FormInput
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              error={errors.type}
              required
            />
          </div>
          <div className="mt-6">
            <FormTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              error={errors.description}
              rows={4}
              required
            />
          </div>
          <div className="mt-6">
            <FormTextarea
              label="Details"
              name="details"
              value={formData.details}
              onChange={handleChange}
              error={errors.details}
              rows={4}
              required
            />
          </div>
        </div>

        {/* Sizes */}
        {formData.productType === 'physical' && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sizes & Stock</h3>
              <button
                type="button"
                onClick={addSize}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> Add Size
              </button>
            </div>
            <div className="space-y-4">
              {formData.sizes.map((size, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <FormInput
                    label="Size"
                    value={size.size}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSize(index, 'size', e.target.value)}
                    error={errors[`size_${index}_size`]}
                    placeholder="e.g., XL, L, M"
                  />
                  <FormInput
                    label="Stock"
                    type="number"
                    value={size.stock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                    error={errors[`size_${index}_stock`]}
                    min="0"
                    placeholder="Stock quantity"
                  />
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="mt-7 text-red-600 hover:text-red-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {formData.sizes.length === 0 && (
                <p className="text-gray-500 text-sm">No sizes added. Click "Add Size" to add sizes.</p>
              )}
            </div>
          </div>
        )}

        {/* Digital Files */}
        {formData.productType === 'digital' && (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Digital Files</h3>
            <div className="mb-4">
              <input
                type="file"
                multiple
                accept=".pdf,.zip,.mp3"
                onChange={(e) => handleFileChange(e, 'digital')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {errors.digitalFiles && <p className="text-sm text-red-600 mt-1">{errors.digitalFiles}</p>}
              <p className="text-xs text-gray-500 mt-1">Allowed: PDF, ZIP, MP3. Max 50MB per file.</p>
            </div>
            <div className="space-y-3">
              {existingDigitalFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{file.fileName}</span>
                  <button
                    type="button"
                    onClick={() => removeExistingDigitalFile(file.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {newDigitalFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeNewDigitalFile(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Variants */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Color Variants</h3>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add Variant
            </button>
          </div>
          <div className="space-y-6">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-800">Variant {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormInput
                    label="Color Name"
                    value={variant.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'color', e.target.value)}
                    error={errors[`variant_${index}_color`]}
                    placeholder="e.g., Red, Blue"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={variant.colorCode}
                        onChange={(e) => updateVariant(index, 'colorCode', e.target.value)}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={variant.colorCode}
                        onChange={(e) => updateVariant(index, 'colorCode', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="#000000"
                      />
                    </div>
                    {errors[`variant_${index}_colorCode`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_colorCode`]}</p>
                    )}
                  </div>
                  <FormInput
                    label="Variant Price (₹)"
                    type="number"
                    value={variant.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                    error={errors[`variant_${index}_price`]}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variant Images</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleVariantImageChange(index, e)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {errors[`variant_${index}_images`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_images`]}</p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-3">
                    {variant.images?.map((img) => (
                      <div key={img.id} className="relative group cursor-pointer">
                        <Image
                          src={img.url}
                          alt="Variant image"
                          width={80}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantImage(index, img.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {variant.imageFiles?.map((file, imgIndex) => (
                      <div key={imgIndex} className="relative group cursor-pointer">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt="New variant image"
                          width={80}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariantNewImage(index, imgIndex)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {formData.variants.length === 0 && (
              <p className="text-gray-500 text-sm">No variants added. Click "Add Variant" to add color variants.</p>
            )}
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Product Images</h3>
          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'image')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
            <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB per image</p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {existingImages.map((img) => (
              <div key={img.id} className="relative group cursor-pointer">
                <Image
                  src={img.url}
                  alt="Product image"
                  width={120}
                  height={120}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {newImages.map((file, i) => (
              <div key={i} className="relative group cursor-pointer">
                <Image
                  src={URL.createObjectURL(file)}
                  alt="New image"
                  width={120}
                  height={120}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                  New
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateMutation.isPending ? 'Updating Product...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

interface FormInputProps {
  label: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  type?: 'text' | 'number';
  required?: boolean;
  placeholder?: string;
  min?: string | number;
  step?: string | number;
  disabled?: boolean;
}

function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  placeholder,
  min,
  step,
  disabled,
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder={placeholder}
        min={min}
        step={step}
        disabled={disabled}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

interface FormTextareaProps {
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  rows?: number;
}

function FormTextarea({ label, name, value, onChange, error, required = false, rows = 4 }: FormTextareaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-vertical"
        rows={rows}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}