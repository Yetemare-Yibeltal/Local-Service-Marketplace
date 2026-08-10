'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  providerId: string;
  serviceId: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  scheduledDate: string;
  address: string;
  specialNotes: string | null;
  totalPrice: number;
  depositAmount: number;
  confirmedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  provider: {
    id: string;
    userId: string;
    businessName: string;
    businessLogo: string | null;
    category: string;
    averageRating: number;
    totalReviews: number;
    isVerified: boolean;
  };
  service: {
    id: string;
    title: string;
    description: string;
    price: number;
    priceType: string;
  } | null;
  review: {
    id: string;
    rating: number;
    comment: string;
  } | null;
  payment: {
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
  } | null;
}

interface ApiResponse {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No authentication token found');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  return result.data;
}

async function getAdminBookings(
  page: number = 1,
  limit: number = 20,
  status?: string,
  providerId?: string,
  customerId?: string,
  search?: string,
  startDate?: string,
  endDate?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  if (providerId) params.append('providerId', providerId);
  if (customerId) params.append('customerId', customerId);
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return await fetchWithAuth(`/bookings/admin?${params.toString()}`);
}

async function getBookingDetails(bookingId: string): Promise<Booking> {
  return await fetchWithAuth(`/bookings/${bookingId}`);
}

async function cancelBooking(bookingId: string, reason: string): Promise<void> {
  await fetchWithAuth(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <ClockIcon className="w-3 h-3" />,
    },
    CONFIRMED: {
      label: 'Confirmed',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <CheckCircleIcon className="w-3 h-3" />,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <ArrowPathIcon className="w-3 h-3" />,
    },
    COMPLETED: {
      label: 'Completed',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <CheckCircleIcon className="w-3 h-3" />,
    },
    CANCELLED: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircleIcon className="w-3 h-3" />,
    },
    DISPUTED: {
      label: 'Disputed',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: <ExclamationTriangleIcon className="w-3 h-3" />,
    },
  };

  const { label, color, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {icon}
      {label}
    </span>
  );
}

/**
 * Booking Row Component
 */
function BookingRow({
  booking,
  onView,
  onCancel,
}: {
  booking: Booking;
  onView: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
}) {
  const scheduledDate = new Date(booking.scheduledDate);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          {booking.provider.businessLogo ? (
            <Image
              src={booking.provider.businessLogo}
              alt={booking.provider.businessName}
              width={40}
              height={40}
              className="rounded-lg object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BriefcaseIcon className="w-5 h-5 text-blue-600" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {booking.bookingNumber}
            </span>
            <StatusBadge status={booking.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              {booking.provider.businessName}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {booking.customer.fullName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formattedDate} at {formattedTime}
            </span>
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <CurrencyDollarIcon className="w-3.5 h-3.5" />
              ETB {booking.totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate max-w-md">{booking.address}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onView(booking)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        {canCancel && (
          <button
            onClick={() => onCancel(booking)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel Booking"
          >
            <XCircleIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Booking Details Modal
 */
function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
  onCancel,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onCancel: (booking: Booking) => void;
}) {
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const scheduledDate = new Date(booking.scheduledDate);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const canCancel = ['PENDING', 'CONFIRMED'].includes(booking.status);

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }
    setLoading(true);
    try {
      await onCancel(booking);
      onClose();
    } catch (error) {
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
      setShowCancelForm(false);
      setCancelReason('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Booking Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Info */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Booking Number</p>
              <p className="text-lg font-bold text-gray-900">{booking.bookingNumber}</p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Customer */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Customer</h4>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-shrink-0">
                {booking.customer.profileImage ? (
                  <Image
                    src={booking.customer.profileImage}
                    alt={booking.customer.fullName}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{booking.customer.fullName}</p>
                <p className="text-sm text-gray-500">{booking.customer.email}</p>
                <p className="text-sm text-gray-500">{booking.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Provider */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Provider</h4>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-shrink-0">
                {booking.provider.businessLogo ? (
                  <Image
                    src={booking.provider.businessLogo}
                    alt={booking.provider.businessName}
                    width={40}
                    height={40}
                    className="rounded-lg object-cover w-10 h-10"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <BriefcaseIcon className="w-5 h-5 text-blue-600" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{booking.provider.businessName}</p>
                <p className="text-sm text-gray-500">{booking.provider.category}</p>
              </div>
            </div>
          </div>

          {/* Service */}
          {booking.service && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Service</h4>
              <p className="font-medium text-gray-900">{booking.service.title}</p>
              <p className="text-sm text-gray-600">{booking.service.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                {booking.service.priceType === 'HOURLY' ? 'Hourly' : 'Fixed'} · ETB {booking.service.price.toFixed(2)}
              </p>
            </div>
          )}

          {/* Schedule & Address */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Schedule & Location</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm text-gray-900">{formattedTime}</p>
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-400">Address</p>
              <p className="text-sm text-gray-900">{booking.address}</p>
            </div>
            {booking.specialNotes && (
              <div className="mt-2">
                <p className="text-xs text-gray-400">Special Notes</p>
                <p className="text-sm text-gray-600">{booking.specialNotes}</p>
              </div>
            )}
          </div>

          {/* Payment */}
          {booking.payment && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Payment</h4>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="text-sm font-medium text-gray-900">ETB {booking.payment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Method</p>
                  <p className="text-sm text-gray-900">{booking.payment.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    booking.payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                    booking.payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {booking.payment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          {booking.review && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Review</h4>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <StarSolidIcon
                    key={i}
                    className={`w-4 h-4 ${i < booking.review!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">{booking.review.comment}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <span className="block font-medium text-gray-600">Created</span>
              {new Date(booking.createdAt).toLocaleString()}
            </div>
            {booking.confirmedAt && (
              <div>
                <span className="block font-medium text-gray-600">Confirmed</span>
                {new Date(booking.confirmedAt).toLocaleString()}
              </div>
            )}
            {booking.completedAt && (
              <div>
                <span className="block font-medium text-gray-600">Completed</span>
                {new Date(booking.completedAt).toLocaleString()}
              </div>
            )}
            {booking.cancelledAt && (
              <div>
                <span className="block font-medium text-gray-600">Cancelled</span>
                {new Date(booking.cancelledAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          {booking.cancellationReason && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Cancellation Reason</h4>
              <p className="text-sm text-red-600">{booking.cancellationReason}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex flex-wrap justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>

          {canCancel && !showCancelForm && (
            <button
              onClick={() => setShowCancelForm(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel Booking
            </button>
          )}

          {canCancel && showCancelForm && (
            <div className="w-full space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please provide a reason for cancellation..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCancelForm(false);
                    setCancelReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'Processing...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Filter Dropdown Component
 */
function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [providerId, setProviderId] = useState(searchParams.get('providerId') || '');
  const [customerId, setCustomerId] = useState(searchParams.get('customerId') || '');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: searchParams.get('startDate') || '',
    end: searchParams.get('endDate') || '',
  });

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminBookings(
        page,
        limit,
        statusFilter || undefined,
        providerId || undefined,
        customerId || undefined,
        debouncedSearch || undefined,
        dateRange.start || undefined,
        dateRange.end || undefined
      );
      setBookings(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, providerId, customerId, debouncedSearch, dateRange]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchTerm) params.set('search', searchTerm);
    if (providerId) params.set('providerId', providerId);
    if (customerId) params.set('customerId', customerId);
    if (dateRange.start) params.set('startDate', dateRange.start);
    if (dateRange.end) params.set('endDate', dateRange.end);
    router.push(`/dashboard/admin/bookings?${params.toString()}`);
  }, [statusFilter, searchTerm, providerId, customerId, dateRange, router]);

  // Handlers
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleCancelBooking = async (booking: Booking) => {
    // This will be handled inside the modal
  };

  const handleConfirmCancel = async (booking: Booking) => {
    // Cancel logic is handled in modal
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setStatusFilter('');
    setSearchTerm('');
    setProviderId('');
    setCustomerId('');
    setDateRange({ start: '', end: '' });
    setPage(1);
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'DISPUTED', label: 'Disputed' },
  ];

  const isFiltered = statusFilter || searchTerm || providerId || customerId || dateRange.start || dateRange.end;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} booking{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <button onClick={loadBookings} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by booking number or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <FilterDropdown
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
          />
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Start Date"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="End Date"
          />
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Summary Cards */}
        {!loading && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'PENDING').length}
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {bookings.filter(b => b.status === 'IN_PROGRESS').length}
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'COMPLETED').length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'CANCELLED').length}
              </p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading bookings...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <>
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {isFiltered
                    ? 'No bookings match your current filters. Try adjusting your search.'
                    : 'There are no bookings on the platform yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Booking</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <BookingRow
                      key={booking.id}
                      booking={booking}
                      onView={handleViewBooking}
                      onCancel={handleCancelBooking}
                    />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    {[...Array(Math.min(totalPages, 7))].map((_, i) => {
                      let p: number;
                      if (totalPages <= 7) {
                        p = i + 1;
                      } else if (page <= 4) {
                        p = i + 1;
                      } else if (page >= totalPages - 3) {
                        p = totalPages - 6 + i;
                      } else {
                        p = page - 3 + i;
                      }
                      if (p > totalPages) return null;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`px-4 py-2 rounded-lg border transition-colors min-w-[40px] ${
                            p === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    {totalPages > 7 && page < totalPages - 3 && (
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {totalPages}
                      </button>
                    )}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBooking(null);
        }}
        onCancel={handleConfirmCancel}
      />
    </div>
  );
}