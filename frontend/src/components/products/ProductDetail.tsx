'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Star, Share2, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Plus, Minus, ShoppingBag, Zap, ChevronDown } from 'lucide-react';
import { Cinzel, Unica_One, Raleway, Source_Sans_3 } from 'next/font/google';
import { useCartStore } from '@/store/cart';
import { toast } from 'sonner';
import { fetchWrapper } from '@/lib/api/fetchWrapper';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['600'], variable: '--font-cinzel' });
const unica = Unica_One({ subsets: ['latin'], weight: ['400'], variable: '--font-unica' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400'], variable: '--font-raleway' });
const sourceSans = Source_Sans_3({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-source-sans' });

interface ProductImage {
  id: string;
  url: string;
  publicId: string;
}

interface ProductVariant {
  id: string;
  color: string;
  colorCode: string;
  price: number;
  images: ProductImage[];
}

interface ProductSize {
  id: string;
  size: string;
  stock: number;
}

interface Review {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface Product {
  id: string;
  name: string;
  description: string;
  details: string | null;
  price: number;
  stock: number;
  type: string;
  productType: string; // Added to support digital/physical distinction
  images: ProductImage[];
  sizes: ProductSize[];
  variants: ProductVariant[];
}

interface ProductDetailProps {
  product: Product;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, total: 0 });
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const { addToCart } = useCartStore();

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);

  const [touchStart, setTouchStart] = useState(0);

  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const isDigital = product.productType === 'digital';

  const fetchReviews = async () => {
    try {
      const reviewData = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/reviews/product/${product.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
      });
      setReviews(reviewData.reviews || []);
      setReviewStats({
        averageRating: reviewData.averageRating || 0,
        total: reviewData.total || 0,
      });
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
      setReviewStats({ averageRating: 0, total: 0 });
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [product.id]);

  const nextImage = () => {
    const images = selectedVariant?.images || product.images;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    scrollToThumbnail(nextIndex);
  };

  const prevImage = () => {
    const images = selectedVariant?.images || product.images;
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prevIndex);
    scrollToThumbnail(prevIndex);
  };

  const scrollToThumbnail = (index: number) => {
    if (thumbnailsRef.current) {
      const thumbnailElement = thumbnailsRef.current.children[index] as HTMLElement;
      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchEnd - touchStart;
    const swipeThreshold = 50;

    if (swipeDistance > swipeThreshold) {
      prevImage();
    } else if (swipeDistance < -swipeThreshold) {
      nextImage();
    }
  };

  const currentImages = selectedVariant?.images || product.images || [];

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setCurrentImageIndex(0); // Reset image index when variant changes
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const handleAddToCart = () => {
    if (!isDigital && product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error('Please select a size before adding to cart.');
      return;
    }
    const itemPrice = selectedVariant?.price || product.price;

    const selectedSizeObject = product.sizes?.find((s) => s.size === selectedSize);

    const cartItem = {
      id: product.id,
      name: product.name,
      price: itemPrice,
      quantity: quantity,
      image: currentImages[0]?.url || product.images[0]?.url || '',
      sizeId: isDigital ? null : selectedSizeObject?.id || null,
      sizeLabel: isDigital ? 'N/A' : selectedSize || 'N/A',
      variantId: product.productType === 'digital' ? null : selectedVariant?.id || null,
      color: selectedVariant?.color || 'N/A',
      productType: product.productType,
    };

    addToCart(cartItem);
    toast.success(`${quantity} of ${product.name} ${isDigital ? '(Digital)' : `(${selectedSize || 'N/A'})`} added to cart!`);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-light text-gray-900">Product Data Missing</h2>
          <p className="text-gray-600">There was an issue loading the product details. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${unica.variable} font-unica`}>
      <div className="max-w-7xl mx-auto px-4 py-4 lg:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col pt-8 lg:pt-0 lg:px-6 lg:flex-row">
            <div className="lg:flex-1 order-1 lg:order-2">
              <div
                className="relative aspect-[3.5/5] bg-gray-50 overflow-hidden group"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={currentImages[currentImageIndex]?.url}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-700 ${isImageZoomed ? 'scale-110' : 'hover:scale-105'}`}
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                />
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        prevImage();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-100 shadow-lg"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        nextImage();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-slate-100 shadow-lg"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </>
                )}
                {currentImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {currentImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentImageIndex(index);
                          scrollToThumbnail(index);
                        }}
                        className={`w-1 h-1 rounded-full transition-colors ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="lg:pt-6">
              <nav className="lg:py-5 text-sm text-gray-700 border-b border-gray-200 capitalize">
                <div
                  className={`${sourceSans.className} max-w-7xl mx-auto`}
                  style={{
                    fontSize: '.7625rem',
                    fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  Home / {isDigital ? 'Digital Products' : 'Clothing'} / {product.type || 'Products'} / {product.name}
                </div>
              </nav>
              <h1 className={`lg:px-8 py-1 text-3xl font-light text-gray-900 tracking-tight ${cinzel.className}`}>
                {product.name || 'Product Name'}
              </h1>
              <p
                className={`${sourceSans.className} lg:px-8 text-gray-700 leading-relaxed capitalize`}
                style={{
                  fontSize: '.7625rem',
                  fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
                  fontWeight: 400,
                }}
              >
                {product.description || 'No description available'}
              </p>
              <div className="lg:px-8 flex items-baseline space-x-3">
                <span className={`${unica.className} text-lg font- text-gray-900`}>
                  {formatPrice(selectedVariant?.price || product.price)}
                </span>
                {isDigital && (
                  <span className="text-sm text-blue-600 flex items-center">
                    <Zap className="w-4 h-4 mr-1" />
                    Digital Download
                  </span>
                )}
              </div>
            </div>
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 lg:px-8">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
                  Color: {selectedVariant?.color || 'Select Color'}
                </h3>
                <div className="flex space-x-4">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => handleVariantChange(variant)}
                      className={`relative w-7 h-6 rounded-xl border-2 transition-all ${
                        selectedVariant?.id === variant.id ? 'border-gray-400 scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: variant.colorCode }}
                    >
                      {selectedVariant?.id === variant.id && (
                        <div className="absolute -inset-1 rounded-xl border-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isDigital && product.sizes && product.sizes.length > 0 && (
              <div className="space-y-4 lg:px-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Size</h3>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.size)}
                      disabled={size.stock === 0}
                      className={`h-12 border rounded-lg text-sm font-medium transition-all ${
                        selectedSize === size.size
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : size.stock === 0
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size.size}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isDigital && (
              <div className="space-y-4 lg:px-8">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Download Information</h3>
                <p className={`${sourceSans.className} text-sm text-gray-600`}>
                  This is a digital product. After purchase, you’ll receive an email with download links and access them from your orders page.
                </p>
              </div>
            )}
            <div className="space-y-4 lg:px-8">
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Quantity</h3>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10}
                    className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span
                  className={`${sourceSans.className} text-sm text-gray-600`}
                  style={{
                    fontSize: '.7625rem',
                    fontFamily: '"Source Sans Pro", Helvetica, Arial, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  {isDigital ? 'Available for download' : `${product.stock || 0} in stock`}
                </span>
              </div>
            </div>
            <div className="space-y-4 lg:px-8">
              <button
                onClick={handleAddToCart}
                className="w-full bg-black text-white py-4 rounded-lg font-medium text-lg hover:bg-gray-900 transition-colors flex items-center justify-center space-x-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 py-6 border-t border-gray-200">
              <div className="text-center">
                <Truck className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <span className="text-xs text-gray-600 font-medium">{isDigital ? 'Instant Download' : 'Free Shipping'}</span>
              </div>
              <div className="text-center">
                <RotateCcw className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <span className="text-xs text-gray-600 font-medium">{isDigital ? 'Non-Returnable' : 'Free Returns'}</span>
              </div>
              <div className="text-center">
                <Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <span className="text-xs text-gray-600 font-medium">{isDigital ? 'Secure Download' : '2 Year Warranty'}</span>
              </div>
            </div>
            <div className="border-t border-gray-200">
              <button
                onClick={() => setDetailsOpen(!detailsOpen)}
                className="w-full flex justify-between items-center py-4 text-left font-medium text-gray-900"
              >
                <span>PRODUCT DETAILS</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${detailsOpen ? 'rotate-180' : ''}`} />
              </button>
              {detailsOpen && (
                <div className={`${sourceSans.className} prose prose-sm max-w-none text-gray-600`}>
                  <div
                    dangerouslySetInnerHTML={{ __html: product.details ? product.details.replace(/\r\n/g, '<br />') : 'No details available.' }}
                  />
                </div>
              )}
            </div>
            {reviews.length > 0 && (
              <div className="border-t border-gray-200">
                <button
                  onClick={() => setReviewsOpen(!reviewsOpen)}
                  className="w-full flex justify-between items-center py-4 text-left font-medium text-gray-900"
                >
                  <span>REVIEWS ({reviews.length})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${reviewsOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="lg:px-8 flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(reviewStats.averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {reviewStats.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : 'No reviews'}
                    {reviewStats.total > 0 && ` (${reviewStats.total} reviews)`}
                  </span>
                </div>
                {reviewsOpen && (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {review.user.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{review.user.name}</p>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`${sourceSans.className} text-gray-600`}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!isDigital && (
              <div className="border-t border-gray-200">
                <button
                  onClick={() => setShippingOpen(!shippingOpen)}
                  className="w-full flex justify-between items-center py-4 text-left font-medium text-gray-900"
                >
                  <span>SHIPPING & RETURNS</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${shippingOpen ? 'rotate-180' : ''}`} />
                </button>
                {shippingOpen && (
                  <div className={`${sourceSans.className} grid grid-cols-1 md:grid-cols-2 gap-8 py-4`}>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Shipping Options</h3>
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Standard Shipping</span>
                            <span className="text-green-600 font-medium">FREE</span>
                          </div>
                          <p className="text-sm text-gray-600">5-7 business days</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Express Shipping</span>
                            <span className="font-medium">$12.99</span>
                          </div>
                          <p className="text-sm text-gray-600">2-3 business days</p>
                        </div>
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Next Day Delivery</span>
                            <span className="font-medium">$24.99</span>
                          </div>
                          <p className="text-sm text-gray-600">Next business day</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Return Policy</h3>
                      <div className="space-y-4 text-gray-600">
                        <p>We offer free returns within 30 days of purchase.</p>
                        <ul className="space-y-2">
                          <li>• Items must be in original condition</li>
                          <li>• Tags must be attached</li>
                          <li>• Return shipping is free</li>
                          <li>• Refunds processed within 5-7 business days</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;