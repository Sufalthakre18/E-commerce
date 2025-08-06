'use client'

import { getAuthToken } from '@/lib/utils/auth'
import { useState, useEffect } from 'react'

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
  imageIndices: number[]
}

export default function AddProductPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    details: '',
    price: '',
    stock: '',
    categoryId: '',
    type: ''
  })

  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [sizes, setSizes] = useState<Size[]>([{ size: '', stock: 0 }])
  const [variants, setVariants] = useState<Variant[]>([])

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/category`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  //Add new images instead of replacing
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFilesArray = Array.from(e.target.files)


      setImages(prevImages => [...prevImages, ...newFilesArray])

      const newPreviews = newFilesArray.map(file => URL.createObjectURL(file))
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews])


      e.target.value = ''
    }
  }

  const addSize = () => {
    setSizes([...sizes, { size: '', stock: 0 }])
  }

  const updateSize = (index: number, field: keyof Size, value: string | number) => {
    const updated = [...sizes]
    updated[index] = { ...updated[index], [field]: value }
    setSizes(updated)
  }

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index))
  }

  const addVariant = () => {
    setVariants([...variants, { color: '', colorCode: '', imageIndices: [] }])
  }

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }

  const removeImage = (index: number) => {

    setImages(prevImages => prevImages.filter((_, i) => i !== index))

    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index])
    }
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index))

    setVariants(prevVariants =>
      prevVariants.map(variant => ({
        ...variant,
        imageIndices: variant.imageIndices
          .filter(i => i !== index)
          .map(i => i > index ? i - 1 : i)
      }))
    )
  }

  const toggleImageForVariant = (variantIndex: number, imageIndex: number) => {
    const updated = [...variants]
    const currentIndices = updated[variantIndex].imageIndices

    if (currentIndices.includes(imageIndex)) {

      updated[variantIndex].imageIndices = currentIndices.filter(i => i !== imageIndex)
    } else {

      updated[variantIndex].imageIndices = [...currentIndices, imageIndex]
    }

    setVariants(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })

      images.forEach(image => {
        formDataToSend.append('images', image)
      })

      const validSizes = sizes.filter(s => s.size.trim())
      if (validSizes.length > 0) {
        formDataToSend.append('sizes', JSON.stringify(validSizes))
      }

      const validVariants = variants.filter(v => v.color.trim())
      if (validVariants.length > 0) {
        formDataToSend.append('variants', JSON.stringify(validVariants))
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: formDataToSend
      });

      if (response.ok) {
        alert('Product added successfully!')

        setFormData({ name: '', description: '', price: '', stock: '', categoryId: '', type: '', details: '' })
        setImages([])
        setImagePreviews([])
        setSizes([{ size: '', stock: 0 }])
        setVariants([])
      } else {
        alert('Failed to add product')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error adding product')
    } finally {
      setLoading(false)
    }
  }

  const renderCategoryOptions = (cats: Category[], level = 0): React.ReactElement[] => {
    const options: React.ReactElement[] = []

    cats.forEach(cat => {
      options.push(
        <option key={cat.id} value={cat.id}>
          {'—'.repeat(level)} {cat.name}
        </option>
      )

      if (cat.subcategories && cat.subcategories.length > 0) {
        options.push(...renderCategoryOptions(cat.subcategories, level + 1))
      }
    })

    return options
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Add New Product</h1>
          <p className="text-gray-600">Create a new product with variants, sizes, and images</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
              Basic Information
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Base Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="0.00"
                    step="0"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Product Type</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"></span>
                  <input
                    type="string"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter product type"

                    required
                  />
                </div>
              </div>
             

            </div>

            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe your product..."
              />
            </div>
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Details</label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Describe your product details as •"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Total Stock</label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Available quantity"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Category</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="">Select Category</option>
                  {renderCategoryOptions(categories)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
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
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-400 mt-2">PNG, JPG, WEBP up to 10MB each</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">
                  {images.length} of 20 images uploaded
                </span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(images.length / 20) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-100 group-hover:border-purple-300 transition-all duration-200"
                      />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium">
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

          {/* Sizes Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">3</span>
              Sizes & Stock
              <span className="ml-2 text-sm font-normal text-gray-500">(Optional)</span>
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={size.stock}
                      onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="w-full py-3 border-2 border-dashed border-green-200 text-green-600 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Size
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">4</span>
              Color Variants
              <span className="ml-2 text-sm font-normal text-gray-500">(Optional)</span>
            </h2>

            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Color Name</label>
                      <input
                        type="text"
                        placeholder="Red, Blue, Black..."
                        value={variant.color}
                        onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Color Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="#FF0000"
                          value={variant.colorCode || ''}
                          onChange={(e) => updateVariant(index, 'colorCode', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      <label className="block text-sm font-medium text-gray-700">Price Override</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          placeholder="Different price"
                          value={variant.price || ''}
                          onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || undefined)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Assign Images</label>

                    {imagePreviews.length > 0 ? (
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {imagePreviews.map((preview, imageIndex) => (
                          <div key={imageIndex} className="relative">
                            <button
                              type="button"
                              onClick={() => toggleImageForVariant(index, imageIndex)}
                              className={`w-full h-16 rounded-lg border-2 transition-all duration-200 ${variant.imageIndices.includes(imageIndex)
                                  ? 'border-orange-500 ring-2 ring-orange-200'
                                  : 'border-gray-200 hover:border-orange-300'
                                }`}
                            >
                              <img
                                src={preview}
                                alt={`Image ${imageIndex}`}
                                className="w-full h-full object-cover rounded-md"
                              />
                              <div className="absolute -top-2 -left-2 w-6 h-6 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {imageIndex}
                              </div>
                              {variant.imageIndices.includes(imageIndex) && (
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
                      <div className="text-center py-8 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <svg className="mx-auto w-12 h-12 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p>Upload images first to assign them to variants</p>
                      </div>
                    )}

                    <div className="text-sm text-gray-600">
                      Selected images: {variant.imageIndices.length > 0
                        ? variant.imageIndices.map(i => `#${i}`).join(', ')
                        : 'None selected'
                      }
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                  >
                    Remove Variant
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={addVariant}
                className="w-full py-4 border-2 border-dashed border-orange-200 text-orange-600 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 flex items-center justify-center"
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
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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