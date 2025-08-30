'use client'

import { getAuthToken } from '@/lib/utils/auth'
import { fetchWrapper } from '@/lib/api/fetchWrapper'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  parentId: string | null
  subcategories: Category[]
}

interface Size {
  size: string
  stock: number
}

interface Variant {
  color: string
  colorCode?: string
  price?: number
  images: File[]
}

export default function AddProductPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    details: '',
    price: '',
    stock: '',
    categoryId: '',
    type: '',
    productType: 'physical'
  })

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [digitalFiles, setDigitalFiles] = useState<File[]>([])
  const [digitalFilePreviews, setDigitalFilePreviews] = useState<string[]>([])

  const [sizes, setSizes] = useState<Size[]>([{ size: '', stock: 0 }])
  const [variants, setVariants] = useState<Variant[]>([])

  useEffect(() => {
    fetchCategories()
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url))
      digitalFilePreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      toast.error('Failed to fetch categories')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateImageFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(`${file.name} exceeds 10MB limit`);
      return false;
    }
    const allowedTypes = ['image/png', 'image/jpeg'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(file.type) && allowedExtensions.includes(extension);
  }

  const validateDigitalFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error(`${file.name} exceeds 50MB limit`);
      return false;
    }
    const allowedTypes = ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'audio/mpeg'];
    const allowedExtensions = ['.pdf', '.zip', '.mp3'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(file.type) && allowedExtensions.includes(extension);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFilesArray = Array.from(e.target.files);
      const validFiles = newFilesArray.filter(validateImageFile);
      const invalidFiles = newFilesArray.length - validFiles.length;

      if (images.length + validFiles.length > 20) {
        toast.error('Maximum 20 images allowed');
        return;
      }

      if (invalidFiles > 0) {
        toast.error('Some files were rejected. Only PNG and JPEG are allowed.');
      }

      setImages(prevImages => [...prevImages, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      e.target.value = '';
    }
  }

  const handleDigitalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFilesArray = Array.from(e.target.files);
      const validFiles = newFilesArray.filter(validateDigitalFile);
      const invalidFiles = newFilesArray.length - validFiles.length;

      if (digitalFiles.length + validFiles.length > 10) {
        toast.error('Maximum 10 digital files allowed');
        return;
      }

      if (invalidFiles > 0) {
        toast.error('Some files were rejected. Only PDF, ZIP, and MP3 are allowed.');
      }

      setDigitalFiles(prevFiles => [...prevFiles, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setDigitalFilePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      e.target.value = '';
    }
  }

  const addSize = () => {
    setSizes([...sizes, { size: '', stock: 0 }]);
  }

  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };
    setSizes(updated);
  }

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  }

  const addVariant = () => {
    setVariants([...variants, { color: '', colorCode: '', price: undefined, images: [] }]);
  }

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  }

  const removeImage = (index: number) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    setVariants(prevVariants =>
      prevVariants.map(variant => ({
        ...variant,
        images: variant.images.filter((_, i) => i !== index)
      }))
    );
  }

  const removeDigitalFile = (index: number) => {
    setDigitalFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    if (digitalFilePreviews[index]) {
      URL.revokeObjectURL(digitalFilePreviews[index]);
    }
    setDigitalFilePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  }

  const toggleImageForVariant = (variantIndex: number, imageIndex: number) => {
    const updated = [...variants];
    const image = images[imageIndex];
    const currentImages = updated[variantIndex].images;

    if (currentImages.includes(image)) {
      updated[variantIndex].images = currentImages.filter(img => img !== image);
    } else {
      updated[variantIndex].images = [...currentImages, image];
    }
    setVariants(updated);
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('Valid stock quantity is required');
      return false;
    }
    if (!formData.categoryId) {
      toast.error('Category is required');
      return false;
    }
    if (!formData.productType) {
      toast.error('Product type (digital/physical) is required');
      return false;
    }
    if (formData.productType === 'digital' && digitalFiles.length === 0) {
      toast.error('At least one digital file is required for digital products');
      return false;
    }
    return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      digitalFiles.forEach(file => {
        formDataToSend.append('digitalFiles', file);
      });

      const validSizes = sizes.filter(s => s.size.trim() && s.stock >= 0);
      if (validSizes.length > 0) {
        formDataToSend.append('sizes', JSON.stringify(validSizes));
      }

      const validVariants = variants.filter(v => v.color.trim());
      if (validVariants.length > 0) {
        validVariants.forEach((variant, index) => {
          const imageIndices = variant.images.map(img => images.indexOf(img));
          formDataToSend.append(`variants[${index}][color]`, variant.color);
          if (variant.colorCode) formDataToSend.append(`variants[${index}][colorCode]`, variant.colorCode);
          if (variant.price) formDataToSend.append(`variants[${index}][price]`, variant.price.toString());
          formDataToSend.append(`variants[${index}][imageIndices]`, JSON.stringify(imageIndices));
        });
      }

      const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        body: formDataToSend
      });

      console.log('Backend Response:', response);
      toast.success('Product added successfully!');
      setFormData({ name: '', description: '', details: '', price: '', stock: '', categoryId: '', type: '', productType: 'physical' });
      setImages([]);
      setImagePreviews([]);
      setDigitalFiles([]);
      setDigitalFilePreviews([]);
      setSizes([{ size: '', stock: 0 }]);
      setVariants([]);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error adding product');
    } finally {
      setLoading(false);
    }
  }

  const renderCategoryOptions = (cats: Category[], level = 0): React.ReactElement[] => {
    const options: React.ReactElement[] = [];
    cats.forEach(cat => {
      options.push(
        <option key={cat.id} value={cat.id}>
          {'—'.repeat(level)} {cat.name}
        </option>
      );
      if (cat.subcategories && cat.subcategories.length > 0) {
        options.push(...renderCategoryOptions(cat.subcategories, level + 1));
      }
    });
    return options;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 font-[Source_Sans_3]">
            Add New Product
          </h1>
          <p className="text-gray-600 font-[Source_Sans_3]">Create a new product with variants, sizes, and images</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center font-[Source_Sans_3]">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Base Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Product Type</label>
                <select
                  name="productType"
                  value={formData.productType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                  required
                >
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                  required
                >
                  <option value="">Select Category</option>
                  {renderCategoryOptions(categories)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Type</label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                  placeholder="Enter product type (e.g., Shirt, Ebook)"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Total Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-[Source_Sans_3]"
                  placeholder="Available quantity"
                  required
                />
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none font-[Source_Sans_3]"
                placeholder="Describe your product..."
              />
            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700 font-[Source_Sans_3]">Details</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none font-[Source_Sans_3]"
                placeholder="Describe your product details as •"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center font-[Source_Sans_3]">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
              Product Images
            </h2>

            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors duration-200">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <label className="cursor-pointer">
                    <span className="text-purple-600 font-semibold hover:text-purple-700">Click to add images</span>
                    <span className="text-gray-500"> or drag and drop</span>
                    <input
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-400 mt-2 font-[Source_Sans_3]">PNG, JPG, JPEG up to 10MB each</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 font-[Source_Sans_3]">
                  {images.length} of 20 images uploaded
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(images.length / 20) * 100}%` }}
                  ></div>
                </div>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-100 group-hover:border-purple-300 transition-all duration-200"
                      />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium font-[Source_Sans_3]">
                        {index}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {formData.productType === 'digital' && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center font-[Source_Sans_3]">
                <span className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
                Digital Files
              </h2>

              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-teal-300 transition-colors duration-200">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-teal-600 font-semibold hover:text-teal-700">Click to add digital files</span>
                      <span className="text-gray-500"> or drag and drop</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.zip,.mp3"
                        onChange={handleDigitalFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-400 mt-2 font-[Source_Sans_3]">PDF, ZIP, MP3 up to 50MB each</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 font-[Source_Sans_3]">
                    {digitalFiles.length} of 10 digital files uploaded
                  </span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(digitalFiles.length / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {digitalFilePreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {digitalFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-100 group-hover:border-teal-300 transition-all duration-200">
                          <span className="text-gray-600 font-[Source_Sans_3] truncate px-2">{file.name}</span>
                        </div>
                        <div className="absolute top-2 left-2 bg-teal-600 text-white text-xs px-2 py-1 rounded-full font-medium font-[Source_Sans_3]">
                          {index}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDigitalFile(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
                          title="Remove file"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center font-[Source_Sans_3]">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">{formData.productType === 'digital' ? '4' : '3'}</span>
              Sizes & Stock
              <span className="ml-2 text-sm font-normal text-gray-500 font-[Source_Sans_3]">(Optional)</span>
            </h2>

            <div className="space-y-4">
              {sizes.map((size, index) => (
                <div key={index} className="flex gap-4 items-center p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Size (S, M, L, XL)"
                      value={size.size}
                      onChange={(e) => updateSize(index, 'size', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-[Source_Sans_3]"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={size.stock}
                      onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-[Source_Sans_3]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSize(index)}
                    className="w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addSize}
                className="w-full py-3 border-2 border-dashed border-green-200 text-green-600 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex items-center justify-center font-[Source_Sans_3]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Size
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center font-[Source_Sans_3]">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">{formData.productType === 'digital' ? '5' : '4'}</span>
              Color Variants
              <span className="ml-2 text-sm font-normal text-gray-500 font-[Source_Sans_3]">(Optional)</span>
            </h2>

            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 font-[Source_Sans_3]">Color Name</label>
                      <input
                        type="text"
                        placeholder="Red, Blue, Black..."
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[Source_Sans_3]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 font-[Source_Sans_3]">Color Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="#FF0000"
                          value={variant.colorCode || ''}
                          onChange={(e) => updateVariant(index, 'colorCode', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[Source_Sans_3]"
                        />
                        {variant.colorCode && (
                          <div
                            className="w-10 h-10 rounded-lg border border-gray-200"
                            style={{ backgroundColor: variant.colorCode }}
                          ></div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 font-[Source_Sans_3]">Price Override</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          placeholder="Different price"
                          value={variant.price || ''}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || undefined)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-[Source_Sans_3]"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 font-[Source_Sans_3]">Assign Images</label>
                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {imagePreviews.map((preview, imageIndex) => (
                          <div key={imageIndex} className="relative">
                            <button
                              type="button"
                              onClick={() => toggleImageForVariant(index, imageIndex)}
                              className={`w-full h-16 rounded-lg border-2 transition-all duration-200 ${
                                variant.images.includes(images[imageIndex])
                                  ? 'border-orange-500 ring-2 ring-orange-200'
                                  : 'border-gray-200 hover:border-orange-300'
                              }`}
                            >
                              <img
                                src={preview}
                                alt={`Image ${imageIndex}`}
                                className="w-full h-full object-cover rounded-md"
                              />
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold font-[Source_Sans_3]">
                                {imageIndex}
                              </div>
                              {variant.images.includes(images[imageIndex]) && (
                                <div className="absolute inset-0 bg-orange-500 bg-opacity-20 rounded-md flex items-center justify-center">
                                  <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-200 font-[Source_Sans_3]">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Upload images first to assign them to variants</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600 font-[Source_Sans_3]">
                      Selected images: {variant.images.length > 0
                        ? variant.images.map((_, i) => `#${images.indexOf(variant.images[i])}`).join(', ')
                        : 'None selected'
                      }
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200 font-[Source_Sans_3]"
                  >
                    Remove Variant
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariant}
                className="w-full py-4 border-2 border-dashed border-orange-200 text-orange-600 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center justify-center font-[Source_Sans_3]"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Color Variant
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-[Source_Sans_3]"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Product...
                </div>
              ) : (
                'Create Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}