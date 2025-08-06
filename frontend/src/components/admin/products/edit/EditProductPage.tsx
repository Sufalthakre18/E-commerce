'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getAuthToken } from '@/lib/utils/auth';
import Image from 'next/image';

type Size = {
  id?: string;
  size: string;
  stock: number;
};

type Variant = {
  id?: string;
  color: string;
  colorCode: string;
  price: number;
  imageFiles?: File[]; // Changed to array
  existingImages?: Array<{ id: string; url: string; }>;
  imagesToDelete?: string[];
};

type ProductImage = {
  id: string;
  url: string;
  publicId: string;
};

type FormDataType = {
  name: string;
  price: number;
  stock: number;
  description: string;
  details: string;
  categoryId: string;
  sizes: Size[];
  variants: Variant[];
  type: string;
};

type Category = {
  id: string;
  name: string;
  parentId?: string |null;
  subcategories?: Category[];
};

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    details: '',
    categoryId: '',
    sizes: [],
    variants: [],
    type:''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  
useEffect(() => {
  const fetchCategories = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/category`,
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();   
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };
  fetchCategories();
}, []);

  // Fetch product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setFetchLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);

        if (!res.ok) throw new Error('Failed to fetch product');

        const data = await res.json();

        setFormData({
          name: data.name || '',
          price: data.price || 0,
          stock: data.stock || 0,
          description: data.description || '',
          details: data.details || '',
          categoryId: data.categoryId || '',
          sizes: data.sizes || [],
          type: data.type || '',
          variants: (data.variants || []).map((v: any) => ({
            id: v.id,
            color: v.color || '',
            colorCode: v.colorCode || '#000000',
            price: v.price || 0,
            imageFiles: [], // Initialize as empty array
            existingImages: v.images || [],
            imagesToDelete: [],
          })),
        });

        setExistingImages(data.images || []);
      } catch (error) {
        setErrors({ general: 'Failed to load product data' });
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.stock < 0) newErrors.stock = 'Stock cannot be negative';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.details.trim()) newErrors.details = 'details is required';
    if (!formData.type.trim()) newErrors.type = 'Type is required';

    if (!formData.categoryId) newErrors.categoryId = 'Please select a category';

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.color.trim()) newErrors[`variant_${index}_color`] = 'Color is required';
      if (!variant.colorCode.trim()) newErrors[`variant_${index}_colorCode`] = 'Color code is required';
      if (variant.price <= 0) newErrors[`variant_${index}_price`] = 'Variant price must be greater than 0';
    });

    // Validate sizes
    formData.sizes.forEach((size, index) => {
      if (!size.size.trim()) newErrors[`size_${index}_size`] = 'Size is required';
      if (size.stock < 0) newErrors[`size_${index}_stock`] = 'Size stock cannot be negative';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024; // 5MB limit
      if (!isValid) {
        setErrors(prev => ({ ...prev, images: 'Please select valid image files under 5MB' }));
      }
      return isValid;
    });

    setNewImages(prev => [...prev, ...validFiles]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imgId: string) => {
    setImagesToDelete(prev => [...prev, imgId]);
    setExistingImages(prev => prev.filter(img => img.id !== imgId));
  };

  // Size management
  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, { size: '', stock: 0 }]
    }));
  };

  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.map((size, i) =>
        i === index ? { ...size, [field]: value } : size
      )
    }));
  };

  const removeSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index)
    }));
  };

  // Variant management
  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        color: '',
        colorCode: '#000000',
        price: formData.price,
        imageFiles: [], // Properly initialize as empty array
        existingImages: [],
        imagesToDelete: [],
      }]
    }));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const removeVariantImage = (variantIndex: number, imageId: string) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => {
        if (i === variantIndex) {
          return {
            ...variant,
            existingImages: variant.existingImages?.filter(img => img.id !== imageId) || [],
            imagesToDelete: [...(variant.imagesToDelete || []), imageId],
          };
        }
        return variant;
      })
    }));
  };

  // New function to handle multiple variant image uploads
  const handleVariantImageChange = (variantIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log(`Selecting ${files.length} files for variant ${variantIndex}`);

    const validFiles = Array.from(files).filter(file => {
      const isValid = file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        console.log(`Invalid file: ${file.name}`);
        setErrors(prev => ({ 
          ...prev, 
          [`variant_${variantIndex}_images`]: 'Please select valid image files under 5MB' 
        }));
      }
      return isValid;
    });

    console.log(`${validFiles.length} valid files after filtering`);

    if (validFiles.length === 0) return;

    // Clear any previous error for this variant's images
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`variant_${variantIndex}_images`];
      return newErrors;
    });

    setFormData(prev => {
      console.log('Current formData variants:', prev.variants.length);
      console.log(`Current variant ${variantIndex} imageFiles:`, prev.variants[variantIndex]?.imageFiles?.length || 0);
      
      const newVariants = prev.variants.map((variant, i) => {
        if (i === variantIndex) {
          const currentFiles = variant.imageFiles || [];
          const newFiles = [...currentFiles, ...validFiles];
          console.log(`Adding ${validFiles.length} files to existing ${currentFiles.length} files = ${newFiles.length} total`);
          
          return {
            ...variant,
            imageFiles: newFiles
          };
        }
        return variant;
      });

      return {
        ...prev,
        variants: newVariants
      };
    });

    // Clear the input
    e.target.value = '';
  };

  // Function to remove a new variant image
  const removeVariantNewImage = (variantIndex: number, imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => {
        if (i === variantIndex) {
          return {
            ...variant,
            imageFiles: variant.imageFiles?.filter((_, idx) => idx !== imageIndex) || []
          };
        }
        return variant;
      })
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrors(prev => ({ ...prev, general: 'Please fix the errors above' }));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const form = new FormData();

      // Basic product data
      form.append('name', formData.name);
      form.append('price', formData.price.toString());
      form.append('stock', formData.stock.toString());
      form.append('description', formData.description);
      form.append('details', formData.details);
      form.append('categoryId', formData.categoryId);
      form.append('type', formData.type);

      // Sizes
      form.append('sizes', JSON.stringify(formData.sizes));

      // Variants - FIXED: Include existing images to preserve them
      const variantsData = formData.variants.map(variant => ({
        id: variant.id,
        color: variant.color,
        colorCode: variant.colorCode,
        price: variant.price,
        imagesToDelete: variant.imagesToDelete || [],
        existingImages: variant.existingImages || [], 
      }));
      form.append('variants', JSON.stringify(variantsData));

      let variantImageCounter = 0;
      formData.variants.forEach((variant, variantIndex) => {
        if (variant.imageFiles && variant.imageFiles.length > 0) {
          variant.imageFiles.forEach((file) => {
            form.append('variantImages', file);
            form.append('variantImageIndexes', variantIndex.toString());
            variantImageCounter++;
          });
        }
      });

      console.log(`Uploading ${variantImageCounter} variant images total`);

      imagesToDelete.forEach(id => form.append('imagesToDelete', id));
      newImages.forEach(file => form.append('images', file));

      for (let [key, value] of form.entries()) {
        if (key === 'variants') {
          console.log(key, JSON.parse(value as string));
        } else if (key === 'variantImages') {
          console.log(key, (value as File).name);
        } else {
          console.log(key, value);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: form,
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'Failed to update product');
      }

      setSuccess(true);
      setTimeout(() => router.push('/admin/products'), 1500);

    } catch (err: any) {
      setErrors({ general: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center h-screen text-green-700">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">✅ Product updated successfully!</div>
          <p className="text-sm text-gray-600">Redirecting to products list...</p>
        </div>
      </div>
    );
  }

  const renderCategoryOptions = (
    cats: Category[],
    level = 0
  ): React.ReactElement[] => {
    return cats.flatMap(cat => [
      <option key={cat.id} value={cat.id}>
        {`${"—".repeat(level)} ${cat.name}`}
      </option>,
      ...(cat.subcategories
        ? renderCategoryOptions(cat.subcategories, level + 1)
        : []),
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back to Products
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {renderCategoryOptions(categories)}
              </select>
               {errors.categoryId && <p>{errors.categoryId}</p>}
            </div>
          </div>

          <div className="mt-4">
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
          <div className="mt-4">
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
          <div className="mt-4">
            <FormTextarea
              label="Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              error={errors.type}
              rows={1}
              required
            />
          </div>
        </div>

        {/* Sizes */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sizes & Stock</h3>
            <button
              type="button"
              onClick={addSize}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              + Add Size
            </button>
          </div>

          <div className="space-y-3">
            {formData.sizes.map((size, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Size (e.g., XL, L, M)"
                    value={size.size}
                    onChange={(e) => updateSize(index, 'size', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors[`size_${index}_size`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`size_${index}_size`]}</p>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Stock"
                    value={size.stock}
                    onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="0"
                  />
                  {errors[`size_${index}_stock`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`size_${index}_stock`]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeSize(index)}
                  className="text-red-600 hover:text-red-800 p-2"
                >
                  ✕
                </button>
              </div>
            ))}
            {formData.sizes.length === 0 && (
              <p className="text-gray-500 text-sm">No sizes added. Click "Add Size" to add sizes.</p>
            )}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Color Variants</h3>
            <button
              type="button"
              onClick={addVariant}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              + Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg bg-white">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-800">Variant {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove Variant
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Red, Blue"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {errors[`variant_${index}_color`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_color`]}</p>
                    )}
                  </div>

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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant Price (₹)</label>
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="0"
                      step="0.01"
                    />
                    {errors[`variant_${index}_price`] && (
                      <p className="text-sm text-red-600 mt-1">{errors[`variant_${index}_price`]}</p>
                    )}
                  </div>
                </div>

                {/* Variant Images - Updated to handle multiple images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Variant Images</label>

                  {/* Existing Images */}
                  {variant.existingImages && variant.existingImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {variant.existingImages.map((img) => (
                          <div key={img.id} className="relative group">
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
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Images Preview */}
                  {variant.imageFiles && variant.imageFiles.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 mb-2">New Images to Upload:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {variant.imageFiles.map((file, imgIndex) => (
                          <div key={imgIndex} className="relative group">
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
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                            <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                              New
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Input */}
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
                  <p className="text-xs text-gray-500 mt-1">You can select multiple images. Maximum 5MB per image.</p>
                  
                  {/* Debug info - remove this in production */}
                  <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-100 rounded">
                    <strong>Debug:</strong> 
                    Existing: {variant.existingImages?.length || 0} | 
                    New: {variant.imageFiles?.length || 0} | 
                    Total: {(variant.existingImages?.length || 0) + (variant.imageFiles?.length || 0)}
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
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Product Images</h3>

          <div className="mb-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {errors.images && <p className="text-sm text-red-600 mt-1">{errors.images}</p>}
            <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB per image</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {/* Existing Images */}
            {existingImages.map((img) => (
              <div key={img.id} className="relative group">
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
                <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                  Existing
                </span>
              </div>
            ))}

            {/* New Images */}
            {newImages.map((file, i) => (
              <div key={i} className="relative group">
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
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
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
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {loading ? 'Updating Product...' : 'Update Product'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Reusable Form Components
function FormInput({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  ...props
}: any) {
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
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function FormTextarea({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  ...props
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
        {...props}
      />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}