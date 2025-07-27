'use client';
import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import {
  Package, Hash, FileText, Tag, Upload, X, Check, AlertCircle,
  ArrowLeft, Sparkles, Image, IndianRupeeIcon, ChevronDown
} from 'lucide-react';
import { getAuthToken } from '@/lib/utils/auth';

const mockRouter = {
  push: (path: string) => {
    console.log(`Navigating to: ${path}`);
    alert(`Would navigate to: ${path}`);
  }
};

// Category interface
interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  subcategories?: Category[];
  _count?: {
    products: number;
  };
}

// ----- Enhanced Inputs -----
const FormInput = memo(({
  icon: Icon,
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error
}: any) => (
  <div className="group">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
      <div className="p-1 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md group-focus-within:from-indigo-200 group-focus-within:to-purple-200 transition-colors">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      {label} {required && <span className="text-red-500 text-lg">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-3 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:ring-4 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md
        ${error
          ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
          : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400 hover:border-gray-300'}`}
    />
    {error && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {error}
        </p>
      </div>
    )}
  </div>
));

const FormTextarea = memo(({
  icon: Icon,
  label,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  error
}: any) => (
  <div className="group">
    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
      <div className="p-1 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md group-focus-within:from-indigo-200 group-focus-within:to-purple-200 transition-colors">
        <Icon className="w-4 h-4 text-indigo-600" />
      </div>
      {label} {required && <span className="text-red-500 text-lg">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      rows={4}
      className={`w-full px-4 py-3 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-400 resize-none focus:ring-4 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md
        ${error
          ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
          : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400 hover:border-gray-300'}`}
    />
    {error && (
      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          {error}
        </p>
      </div>
    )}
  </div>
));

// Enhanced Category Select Component with hierarchical support
const FormSelect = memo(({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  error,
  loading = false
}: any) => {
  // Flatten categories to include subcategories
  const flattenCategories = (categories: Category[]): Array<{id: string, name: string, isSubcategory: boolean}> => {
    const flattened: Array<{id: string, name: string, isSubcategory: boolean}> = [];
    
    categories.forEach(category => {
      // Add main category
      flattened.push({
        id: category.id,
        name: category.name,
        isSubcategory: false
      });
      
      // Add subcategories if they exist
      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach(subcategory => {
          flattened.push({
            id: subcategory.id,
            name: `${category.name} → ${subcategory.name}`,
            isSubcategory: true
          });
        });
      }
    });
    
    return flattened;
  };

  const flatCategories = flattenCategories(options);

  return (
    <div className="group">
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
        <div className="p-1 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-md group-focus-within:from-indigo-200 group-focus-within:to-purple-200 transition-colors">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        {label} {required && <span className="text-red-500 text-lg">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={loading}
          className={`w-full px-4 py-3 border-2 rounded-xl bg-white text-gray-900 focus:ring-4 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer
            ${error
              ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
              : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400 hover:border-gray-300'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {loading ? 'Loading categories...' : placeholder}
          </option>
          {flatCategories.map((option) => (
            <option 
              key={option.id} 
              value={option.id}
              className={option.isSubcategory ? 'pl-4' : ''}
            >
              {option.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${loading ? 'animate-spin' : ''}`} />
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
});

// ----- Main Component -----
export default function AddProductPage() {
  const router = mockRouter;

  const [formData, setFormData] = useState({
    name: '', price: '', stock: '', description: '', categoryId: ''
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [sizes, setSizes] = useState<{ size: string; stock: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('❌ Failed to fetch categories:', err);
        setErrors(prev => ({ ...prev, categories: 'Failed to load categories' }));
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.stock || parseInt(formData.stock) < 0) newErrors.stock = 'Valid stock quantity is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.categoryId) newErrors.categoryId = 'Please select a category';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (!arr.length) return;
    const combined = [...files, ...arr].slice(0, 5);
    const allPreviews = combined.map(f => URL.createObjectURL(f));
    setFiles(combined);
    setPreviews(allPreviews);
  }, [files]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  }, [addFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const removeImage = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  const triggerFileDialog = () => fileInputRef.current?.click();

  const addSize = () => {
    setSizes(prev => [...prev, { size: '', stock: '' }]);
  };

  const updateSize = (index: number, key: 'size' | 'stock', value: string) => {
    setSizes(prev => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const removeSize = (index: number) => {
    setSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('description', formData.description);
      form.append('price', formData.price);
      form.append('stock', formData.stock);
      form.append('categoryId', formData.categoryId);
      
      if (sizes.length > 0) {
        form.append('sizes', JSON.stringify(
          sizes.map(s => ({ size: s.size, stock: parseInt(s.stock) }))
        ));
      }
      
      files.forEach(f => form.append('images', f));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: form
      });
      
      if (!res.ok) {
        let msg = 'Failed to create product';
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch { }
        throw new Error(msg);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setFormData({ name: '', price: '', stock: '', description: '', categoryId: '' });
        setFiles([]);
        setPreviews([]);
        setSizes([]);
        router.push('/admin/products');
      }, 1500);
    } catch (err: any) {
      setErrors({ general: err.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  }, [formData, files, sizes, validateForm, router]);

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center transform animate-pulse">
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-12 h-12 text-white animate-bounce" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-800" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Success!
          </h2>
          <p className="text-gray-600 text-lg">Product added successfully</p>
          <div className="mt-4 w-32 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Enhanced Header */}
        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 flex items-center justify-center lg:justify-start gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            Add New Product
          </h1>
          <p className="text-gray-600 text-lg">Create a new product listing with images and details</p>
        </div>

        {/* Enhanced Form Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Column - Form Fields */}
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Product Details
                  </h3>
                  <div className="space-y-4">
                    <FormInput
                      icon={Package}
                      label="Product Name"
                      name="name"
                      placeholder="Enter product name..."
                      value={formData.name}
                      onChange={handleChange}
                      required
                      error={errors.name}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        icon={IndianRupeeIcon}
                        label="Price"
                        name="price"
                        type="number"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        error={errors.price}
                      />
                      <FormInput
                        icon={Hash}
                        label="Stock"
                        name="stock"
                        type="number"
                        placeholder="0"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                        error={errors.stock}
                      />
                    </div>
                    <FormSelect
                      icon={Tag}
                      label="Category"
                      name="categoryId"
                      placeholder="-- Select Category --"
                      value={formData.categoryId}
                      onChange={handleChange}
                      options={categories}
                      loading={categoriesLoading}
                      required
                      error={errors.categoryId || errors.categories}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Description
                  </h3>
                  <FormTextarea
                    icon={FileText}
                    label="Product Description"
                    name="description"
                    placeholder="Describe your product in detail..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                    error={errors.description}
                  />
                </div>

                {/* Product Sizes Section */}
                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-yellow-600" />
                    Product Sizes
                    <button 
                      type="button" 
                      onClick={addSize} 
                      className="ml-auto px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                    >
                      Add Size
                    </button>
                  </h3>

                  {sizes.length === 0 && (
                    <p className="text-sm text-gray-500">No sizes added yet.</p>
                  )}

                  <div className="space-y-4">
                    {sizes.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-3 items-center">
                        <input
                          type="text"
                          placeholder="Size (e.g., M)"
                          value={s.size}
                          onChange={(e) => updateSize(idx, 'size', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={s.stock}
                          onChange={(e) => updateSize(idx, 'stock', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-gray-300 w-full focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => removeSize(idx)}
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Image Upload */}
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-green-600" />
                    Product Images
                    <span className="text-sm font-normal text-gray-500">(Max 5)</span>
                  </h3>

                  {/* Enhanced Upload Area */}
                  <div
                    className={`relative border-2 border-dashed p-8 text-center rounded-xl cursor-pointer transition-all duration-300 group
                      ${dragActive
                        ? 'border-indigo-400 bg-indigo-50 scale-105 shadow-lg'
                        : 'border-gray-300 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md'}`}
                    onClick={triggerFileDialog}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-3">
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${dragActive ? 'bg-indigo-100' : 'bg-white shadow-sm group-hover:bg-indigo-50'}`}>
                        <Upload className={`w-8 h-8 transition-colors ${dragActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                          {dragActive ? 'Drop your images here!' : 'Drag & drop images'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">or click to browse files</p>
                      </div>
                      <div className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full inline-block">
                        JPG, PNG, WebP up to 10MB each
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {/* Enhanced Image Previews */}
                  {previews.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Images</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {previews.map((src, idx) => (
                          <div key={idx} className="relative group">
                            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                              <img
                                src={src}
                                alt={`Preview ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200 group-hover:opacity-100 opacity-80"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                              {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {errors.general && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Enhanced Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none disabled:shadow-md
                    ${loading
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding Product...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Add Product
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}