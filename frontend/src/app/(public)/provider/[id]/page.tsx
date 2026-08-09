'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  StarIcon as StarSolidIcon,
  CheckBadgeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ChevronLeftIcon,
  UserIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  HeartIcon as HeartOutlineIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface Provider {
  id: string;
  userId: string;
  businessName: string;
  businessLogo: string | null;
  description: string;
  category: string;
  subCategory: string | null;
  yearsExperience: number;
  hourlyRate: number | null;
  isAvailable: boolean;
  isVerified: boolean;
  averageRating: number;
  totalReviews: number;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  subCity: string | null;
  workingHours: any;
  completedJobs: number;
  responseTime: number | null;
  isFeatured: boolean;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  services: Service[];
}

interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  discountPrice: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  images: string[];
  category: string;
  subCategory: string | null;
}

interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  comment: string;
  images: string[];
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer: {
    id: string;
    fullName: string;
    profileImage: string | null;
  };
  reviewResponses: ReviewResponse[];
}

interface ReviewResponse {
  id: string;
  reviewId: string;
  providerId: string;
  response: string;
  createdAt: string;
}

interface BookingRequest {
  serviceId?: string;
  scheduledDate: string;
  address: string;
  specialNotes?: string;
  totalPrice: number;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function fetchProvider(id: string): Promise<Provider | null> {
  try {
    const response = await fetch(`${API_URL}/providers/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch provider');
    }
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching provider:', error);
    return null;
  }
}

async function fetchProviderReviews(
  providerId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ data: Review[]; pagination: any; stats: any }> {
  try {
    const response = await fetch(
      `${API_URL}/reviews/provider/${providerId}?page=${page}&limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }
    const result = await response.json();
    return {
      data: result.data || [],
      pagination: result.pagination || { page: 1, limit: 10, totalItems: 0, totalPages: 0 },
      stats: result.stats || { averageRating: 0, totalReviews: 0 },
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { data: [], pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0 }, stats: { averageRating: 0, totalReviews: 0 } };
  }
}

async function createBooking(data: BookingRequest, token: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create booking');
    }
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Star Rating Component
 */
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <StarSolidIcon key={`full-${i}`} className={`w-${size} h-${size} text-yellow-400`} />
      ))}
      {hasHalfStar && (
        <div className="relative w-4 h-4">
          <StarSolidIcon className="w-4 h-4 text-yellow-400 absolute left-0 top-0 overflow-hidden" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          <StarSolidIcon className="w-4 h-4 text-gray-300 absolute left-0 top-0" style={{ clipPath: 'inset(0 0 0 50%)' }} />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarSolidIcon key={`empty-${i}`} className={`w-${size} h-${size} text-gray-300`} />
      ))}
    </div>
  );
}

/**
 * Service Card Component
 */
function ServiceCard({ service, providerId }: { service: Service; providerId: string }) {
  const router = useRouter();

  const handleBookNow = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/booking?provider=${providerId}&service=${service.id}`);
  };

  const formattedPrice = service.priceType === 'HOURLY'
    ? `ETB ${service.price}/hr`
    : `ETB ${service.price}`;

  const duration = service.estimatedDurationMinutes
    ? `${service.estimatedDurationMinutes} min`
    : null;

  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow p-5 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{service.title}</h4>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="text-lg font-bold text-blue-600">{formattedPrice}</span>
            {service.discountPrice && (
              <span className="text-sm text-gray-400 line-through">
                ETB {service.discountPrice}
              </span>
            )}
            {duration && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {duration}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleBookNow}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

/**
 * Review Card Component
 */
function ReviewCard({ review }: { review: Review }) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="border-b border-gray-100 last:border-0 py-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {review.reviewer.profileImage ? (
            <Image
              src={review.reviewer.profileImage}
              alt={review.reviewer.fullName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="font-medium text-gray-900">{review.reviewer.fullName}</span>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={review.rating} size={4} />
                <span className="text-xs text-gray-400">{formattedDate}</span>
              </div>
            </div>
            {review.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <ShieldCheckIcon className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-gray-700 text-sm mt-2">{review.comment}</p>

          {/* Review Images */}
          {review.images && review.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {review.images.slice(0, 3).map((img, idx) => (
                <Image
                  key={idx}
                  src={img}
                  alt={`Review image ${idx + 1}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
              {review.images.length > 3 && (
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                  +{review.images.length - 3}
                </div>
              )}
            </div>
          )}

          {/* Provider Response */}
          {review.reviewResponses && review.reviewResponses.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-blue-300">
              {review.reviewResponses.map((response) => (
                <div key={response.id} className="text-sm">
                  <span className="font-medium text-blue-600">Provider replied:</span>
                  <p className="text-gray-600 mt-0.5">{response.response}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Booking Modal Component
 */
function BookingModal({
  isOpen,
  onClose,
  provider,
  service,
  onBookingSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
  service?: Service;
  onBookingSuccess: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingRequest>({
    serviceId: service?.id,
    scheduledDate: '',
    address: '',
    specialNotes: '',
    totalPrice: service?.price || 0,
  });

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push('/login?redirect=/provider/' + provider.id);
        return;
      }

      // Convert to ISO string with time
      const scheduledDate = new Date(formData.scheduledDate);
      // Set time to 9:00 AM by default
      scheduledDate.setHours(9, 0, 0, 0);

      const bookingData = {
        providerId: provider.id,
        serviceId: service?.id,
        scheduledDate: scheduledDate.toISOString(),
        address: formData.address,
        specialNotes: formData.specialNotes,
        totalPrice: formData.totalPrice,
      };

      const result = await createBooking(bookingData, token);
      onBookingSuccess();
      onClose();
      router.push(`/dashboard/bookings/${result.bookingNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Book Service</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600">
            Booking with <span className="font-semibold text-gray-900">{provider.businessName}</span>
          </p>
          {service && (
            <p className="text-sm text-gray-500">Service: {service.title}</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              min={minDate}
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              placeholder="Enter your address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Notes (Optional)
            </label>
            <textarea
              placeholder="Any special instructions..."
              value={formData.specialNotes || ''}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Price:</span>
              <span className="font-bold text-blue-600">ETB {formData.totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [selectedService, setSelectedService] = useState<Service | undefined>();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Load provider data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [providerData, reviewsData] = await Promise.all([
          fetchProvider(id),
          fetchProviderReviews(id),
        ]);
        setProvider(providerData);
        setReviews(reviewsData.data);
        setReviewStats(reviewsData.stats);
      } catch (error) {
        console.error('Error loading provider data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadData();
    }
  }, [id]);

  const handleBookNow = (service?: Service) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const handleBookingSuccess = () => {
    // Refresh provider data to update completed jobs
    fetchProvider(id).then(setProvider);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="bg-white rounded-xl shadow-card p-8 animate-pulse">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-gray-200"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Provider Not Found</h2>
          <p className="text-gray-600 mb-4">The provider you're looking for doesn't exist.</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Back Button */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back to Search
        </Link>

        {/* Provider Profile Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Logo */}
              <div className="flex-shrink-0">
                {provider.businessLogo ? (
                  <Image
                    src={provider.businessLogo}
                    alt={provider.businessName}
                    width={100}
                    height={100}
                    className="rounded-full object-cover w-24 h-24 md:w-28 md:h-28 border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-blue-100 flex items-center justify-center border-4 border-gray-100">
                    <span className="text-blue-600 font-bold text-3xl">
                      {provider.businessName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        {provider.businessName}
                      </h1>
                      {provider.isVerified && (
                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-sm font-medium">
                          <CheckBadgeIcon className="w-4 h-4" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{provider.category}</p>
                  </div>

                  <button
                    onClick={toggleFavorite}
                    className={`p-2.5 rounded-full border transition-colors ${
                      isFavorite
                        ? 'border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isFavorite ? (
                      <HeartSolidIcon className="w-6 h-6" />
                    ) : (
                      <HeartOutlineIcon className="w-6 h-6" />
                    )}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <StarRating rating={provider.averageRating} size={5} />
                    <span className="font-medium text-gray-900">
                      {provider.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">
                      ({provider.totalReviews} reviews)
                    </span>
                  </div>

                  {provider.hourlyRate && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <CurrencyDollarIcon className="w-5 h-5" />
                      <span>ETB {provider.hourlyRate}/hr</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-gray-600">
                    <BriefcaseIcon className="w-5 h-5" />
                    <span>{provider.completedJobs} jobs completed</span>
                  </div>

                  {provider.responseTime !== null && (
                    <div className="flex items-center gap-1 text-green-600">
                      <ClockIcon className="w-5 h-5" />
                      <span>~{provider.responseTime} min response</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 px-6 md:px-8 py-6">
            <h3 className="font-semibold text-gray-900 mb-2">About</h3>
            <p className="text-gray-600 whitespace-pre-line">
              {provider.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPinIcon className="w-5 h-5 text-gray-400" />
                {provider.address}, {provider.city}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserIcon className="w-5 h-5 text-gray-400" />
                {provider.yearsExperience}+ years experience
              </div>
            </div>
          </div>

          {/* Services Section */}
          {provider.services && provider.services.length > 0 && (
            <div className="border-t border-gray-100 px-6 md:px-8 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Services</h3>
                <span className="text-sm text-gray-500">
                  {provider.services.filter(s => s.isActive).length} services
                </span>
              </div>

              <div className="space-y-3">
                {provider.services.filter(s => s.isActive).map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    providerId={provider.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="border-t border-gray-100 px-6 md:px-8 py-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900">Ready to book?</p>
                <p className="text-sm text-gray-600">
                  {provider.isAvailable ? (
                    'Available now'
                  ) : (
                    'Currently unavailable'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleBookNow()}
                  disabled={!provider.isAvailable}
                  className={`px-6 py-2.5 font-medium rounded-lg transition-colors ${
                    provider.isAvailable
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Book Now
                </button>
                <a
                  href={`tel:${provider.user.phone}`}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <PhoneIcon className="w-4 h-4" />
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden mt-6">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Reviews</h3>
                <p className="text-gray-600 text-sm">
                  {reviewStats.totalReviews} reviews • {reviewStats.averageRating.toFixed(1)} average rating
                </p>
              </div>
              <Link
                href={`/provider/${provider.id}/reviews`}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                View all
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No reviews yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {reviews.slice(0, 5).map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        provider={provider}
        service={selectedService}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
}