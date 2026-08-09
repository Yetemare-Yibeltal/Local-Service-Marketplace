'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CreditCardIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

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

interface BookingRequest {
  providerId: string;
  serviceId?: string;
  scheduledDate: string;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
}

interface BookingResponse {
  id: string;
  bookingNumber: string;
  status: string;
  scheduledDate: string;
  address: string;
  totalPrice: number;
  depositAmount: number;
  customerId: string;
  providerId: string;
  createdAt: string;
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

async function fetchService(id: string): Promise<Service | null> {
  try {
    const response = await fetch(`${API_URL}/providers/services/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch service');
    }
    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}

async function fetchServices(providerId: string): Promise<Service[]> {
  try {
    const response = await fetch(`${API_URL}/providers/services?providerId=${providerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch services');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

async function createBooking(data: BookingRequest, token: string): Promise<BookingResponse> {
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
 * Booking Summary Component
 */
function BookingSummary({
  provider,
  service,
  selectedDate,
  address,
  specialNotes,
  totalPrice,
  depositAmount,
  isLoading,
}: {
  provider: Provider | null;
  service: Service | null;
  selectedDate: string;
  address: string;
  specialNotes?: string;
  totalPrice: number;
  depositAmount?: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) return null;

  const formattedDate = selectedDate
    ? new Date(selectedDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Not selected';

  const formattedTime = selectedDate
    ? new Date(selectedDate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not selected';

  return (
    <div className="bg-gray-50 rounded-xl p-6 space-y-4 sticky top-24">
      <h4 className="font-semibold text-gray-900 text-lg">Booking Summary</h4>

      {/* Provider */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {provider.businessLogo ? (
            <Image
              src={provider.businessLogo}
              alt={provider.businessName}
              width={48}
              height={48}
              className="rounded-full object-cover w-12 h-12"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">
                {provider.businessName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">{provider.businessName}</p>
            {provider.isVerified && (
              <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500">{provider.category}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-sm text-gray-600">
              {provider.averageRating.toFixed(1)} ({provider.totalReviews} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Service */}
      {service && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-500">Service</p>
          <p className="font-medium text-gray-900">{service.title}</p>
          {service.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
          )}
          {service.estimatedDurationMinutes && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              ~{service.estimatedDurationMinutes} minutes
            </p>
          )}
        </div>
      )}

      {/* Date & Time */}
      <div className="border-t border-gray-200 pt-3">
        <p className="text-sm text-gray-500">Date & Time</p>
        <p className="font-medium text-gray-900">{formattedDate}</p>
        <p className="text-sm text-gray-600">{formattedTime}</p>
      </div>

      {/* Address */}
      {address && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-500">Service Address</p>
          <p className="font-medium text-gray-900">{address}</p>
        </div>
      )}

      {/* Special Notes */}
      {specialNotes && (
        <div className="border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-500">Special Notes</p>
          <p className="text-sm text-gray-600">{specialNotes}</p>
        </div>
      )}

      {/* Price */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">ETB {totalPrice.toFixed(2)}</span>
        </div>
        {depositAmount && depositAmount > 0 && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-500">Deposit (10%)</span>
            <span className="font-medium text-gray-900">ETB {depositAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-300">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="text-xl font-bold text-blue-600">
            ETB {totalPrice.toFixed(2)}
          </span>
        </div>
        {service?.priceType === 'HOURLY' && (
          <p className="text-xs text-gray-400 mt-1">* Estimated based on hourly rate</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheckIcon className="w-4 h-4 text-green-500" />
          <span>Secure booking. No payment required now.</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Available Time Slots Component
 */
function TimeSlotPicker({
  selectedDate,
  onTimeSelect,
  selectedTime,
}: {
  selectedDate: string;
  onTimeSelect: (time: string) => void;
  selectedTime: string;
}) {
  // Generate time slots from 8:00 AM to 6:00 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  if (!selectedDate) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Time <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
        {timeSlots.map((time) => (
          <button
            key={time}
            type="button"
            onClick={() => onTimeSelect(time)}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
              selectedTime === time
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700'
            }`}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function BookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const providerId = searchParams.get('provider');
  const serviceId = searchParams.get('service');

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [address, setAddress] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  // Load provider and service data
  useEffect(() => {
    const loadData = async () => {
      if (!providerId) {
        setError('Provider is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [providerData, allServices] = await Promise.all([
          fetchProvider(providerId),
          fetchServices(providerId),
        ]);

        if (!providerData) {
          setError('Provider not found');
          setLoading(false);
          return;
        }

        setProvider(providerData);
        setServices(allServices);

        // If serviceId is provided, find and select it
        if (serviceId) {
          const foundService = allServices.find((s) => s.id === serviceId);
          if (foundService) {
            setSelectedService(foundService);
            setTotalPrice(foundService.price);
            setDepositAmount(foundService.price * 0.1);
          }
        } else {
          // No specific service, use hourly rate
          if (providerData.hourlyRate) {
            setTotalPrice(providerData.hourlyRate);
            setDepositAmount(providerData.hourlyRate * 0.1);
          }
        }
      } catch (error) {
        setError('Failed to load provider information');
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [providerId, serviceId]);

  // Update price when service changes
  const handleServiceChange = (serviceId: string) => {
    const found = services.find((s) => s.id === serviceId);
    if (found) {
      setSelectedService(found);
      setTotalPrice(found.price);
      setDepositAmount(found.price * 0.1);
      setCustomPrice(null);
      setUseCustomPrice(false);
    }
  };

  // Handle custom price
  const handleCustomPriceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setCustomPrice(numValue);
      setTotalPrice(numValue);
      setDepositAmount(numValue * 0.1);
      setUseCustomPrice(true);
    }
  };

  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setSelectedTime(''); // Reset time when date changes
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Combine date and time
  const getFullDateTime = () => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const fullDateTime = getFullDateTime();
    if (!fullDateTime) {
      setError('Please select both date and time');
      return;
    }

    if (!address.trim()) {
      setError('Please enter your service address');
      return;
    }

    // Check authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push(`/login?redirect=/booking?provider=${providerId}&service=${serviceId}`);
      return;
    }

    setSubmitting(true);

    try {
      const bookingData: BookingRequest = {
        providerId: providerId!,
        serviceId: selectedService?.id,
        scheduledDate: fullDateTime,
        address: address.trim(),
        specialNotes: specialNotes.trim() || undefined,
        totalPrice: totalPrice,
        depositAmount: depositAmount,
      };

      const result = await createBooking(bookingData, token);

      setSuccess(true);

      // Redirect to booking confirmation
      router.push(`/dashboard/bookings/${result.bookingNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  // Get tomorrow's date for min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom max-w-6xl">
          <div className="bg-white rounded-2xl shadow-card p-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !provider) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  const fullDateTime = getFullDateTime();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <Link
          href={provider ? `/provider/${provider.id}` : '/search'}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          Back to {provider ? provider.businessName : 'Search'}
        </Link>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Complete Your Booking
            </h1>
            <p className="text-gray-600">
              Fill in the details below to book your service with {provider?.businessName}
            </p>
          </div>

          {/* Form */}
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Form Fields */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Service Selection */}
                  {services.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Service
                      </label>
                      <select
                        value={selectedService?.id || ''}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a service</option>
                        {services.filter(s => s.isActive).map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.title} - ETB {service.price} {service.priceType === 'HOURLY' ? '/hr' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        required
                        min={minDate}
                        value={selectedDate}
                        onChange={handleDateChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Available from tomorrow onwards
                    </p>
                  </div>

                  {/* Time Selection */}
                  <TimeSlotPicker
                    selectedDate={selectedDate}
                    onTimeSelect={handleTimeSelect}
                    selectedTime={selectedTime}
                  />

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your full address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Special Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Notes (Optional)
                    </label>
                    <textarea
                      placeholder="Any special instructions or requirements..."
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCardIcon className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-400 text-center">
                    By confirming, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>

                {/* Right Column - Booking Summary */}
                <div className="lg:col-span-1">
                  <BookingSummary
                    provider={provider}
                    service={selectedService}
                    selectedDate={fullDateTime || ''}
                    address={address}
                    specialNotes={specialNotes}
                    totalPrice={totalPrice}
                    depositAmount={depositAmount}
                    isLoading={loading}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}