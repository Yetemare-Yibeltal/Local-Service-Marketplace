'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  DocumentTextIcon,
  UserIcon,
  BriefcaseIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

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

async function getCustomerBookings(
  status?: string,
  page: number = 1,
  limit: number = 10,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  return await fetchWithAuth(`/bookings/customer?${params.toString()}`);
}

async function cancelBooking(bookingId: string, reason: string): Promise<any> {
  return await fetchWithAuth(`/bookings/${bookingId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

async function getBookingDetails(bookingId: string): Promise<Booking> {
  return await fetchWithAuth(`/bookings/${bookingId}`);
}

// ============================================================
// STATUS CONFIG
// ============================================================

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: ClockIcon,
    actions: ['cancel'],
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircleIcon,
    actions: ['view', 'cancel'],
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-purple-100 text-purple-800',
    icon: ArrowPathIcon,
    actions: ['view'],
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircleIcon,
    actions: ['view', 'review'],
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircleIcon,
    actions: ['view'],
  },
  DISPUTED: {
    label: 'Disputed',
    color: 'bg-orange-100 text-orange-800',
    icon: ExclamationTriangleIcon,
    actions: ['view'],
  },
};

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
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
  onReview,
}: {
  booking: Booking;
  onView: (booking: Booking) => void;
  onCancel: (booking: Booking) => void;
  onReview: (booking: Booking) => void;
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

  const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0">
            {booking.provider.businessLogo ? (
              <Image
                src={booking.provider.businessLogo}
                alt={booking.provider.businessName}
                width={48}
                height={48}
                className="rounded-lg object-cover w-12 h-12"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-blue-600" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/provider/${booking.provider.id}`}
                className="font-medium text-gray-900 hover:text-blue-600 transition-colors truncate"
              >
                {booking.provider.businessName}
              </Link>
              <StatusBadge status={booking.status} />
              {booking.provider.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  <CheckCircleIcon className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{booking.bookingNumber}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formattedDate} at {formattedTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5" />
                {booking.address}
              </span>
              {booking.service && (
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="w-3.5 h-3.5" />
                  {booking.service.title}
                </span>
              )}
              <span className="flex items-center gap-1 font-medium text-blue-600">
                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                ETB {booking.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onView(booking)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          {statusConfig.actions.includes('cancel') && booking.status !== 'CANCELLED' && (
            <button
              onClick={() => onCancel(booking)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cancel Booking"
            >
              <XCircleIcon className="w-4 h-4" />
            </button>
          )}
          {statusConfig.actions.includes('review') && !booking.review && (
            <button
              onClick={() => onReview(booking)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
              title="Leave Review"
            >
              <StarIcon className="w-4 h-4" />
            </button>
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
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <option value="">All {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/**
 * Booking Details Modal
 */
function BookingDetailsModal({
  booking,
  isOpen,
  onClose,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}) {
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

  const statusConfig = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.color.replace('text-', 'bg-').replace('bg-', '')}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Booking Details</h3>
              <p className="text-sm text-gray-500">{booking.bookingNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider */}
          <div className="flex items-start gap-4">
            {booking.provider.businessLogo ? (
              <Image
                src={booking.provider.businessLogo}
                alt={booking.provider.businessName}
                width={56}
                height={56}
                className="rounded-lg object-cover w-14 h-14"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-blue-100 flex items-center justify-center">
                <BriefcaseIcon className="w-7 h-7 text-blue-600" />
              </div>
            )}
            <div>
              <Link
                href={`/provider/${booking.provider.id}`}
                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {booking.provider.businessName}
              </Link>
              <p className="text-sm text-gray-500">{booking.provider.category}</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-0.5">
                  <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {booking.provider.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">({booking.provider.totalReviews})</span>
                </div>
                {booking.provider.isVerified && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                    <CheckCircleIcon className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Service */}
          {booking.service && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Service</h4>
              <p className="text-gray-900 font-medium">{booking.service.title}</p>
              <p className="text-sm text-gray-600">{booking.service.description}</p>
              <p className="text-sm text-gray-500 mt-1">
                {booking.service.priceType === 'HOURLY' ? 'Hourly' : 'Fixed'} · ETB {booking.service.price.toFixed(2)}
              </p>
            </div>
          )}

          {/* Schedule */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Schedule</h4>
            <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm text-gray-900">{formattedDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm text-gray-900">{formattedTime}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-medium text-gray-700">Service Address</h4>
            <p className="text-sm text-gray-900">{booking.address}</p>
          </div>

          {/* Special Notes */}
          {booking.specialNotes && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Special Notes</h4>
              <p className="text-sm text-gray-600">{booking.specialNotes}</p>
            </div>
          )}

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

          {/* Timestamps */}
          <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>
              <span className="block">Created</span>
              {new Date(booking.createdAt).toLocaleString()}
            </div>
            {booking.confirmedAt && (
              <div>
                <span className="block">Confirmed</span>
                {new Date(booking.confirmedAt).toLocaleString()}
              </div>
            )}
            {booking.completedAt && (
              <div>
                <span className="block">Completed</span>
                {new Date(booking.completedAt).toLocaleString()}
              </div>
            )}
            {booking.cancelledAt && (
              <div>
                <span className="block">Cancelled</span>
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

          {/* Review */}
          {booking.review && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-medium text-gray-700">Your Review</h4>
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
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Close
          </button>
          {booking.status === 'COMPLETED' && !booking.review && (
            <Link
              href={`/provider/${booking.provider.id}/review?booking=${booking.id}`}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Leave Review
            </Link>
          )}
          {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
            <button
              onClick={() => {
                // Trigger cancel flow from parent
                onClose();
                // Parent will handle cancel
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Cancel Booking
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Cancel Booking Modal
 */
function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (bookingId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }
    setLoading(true);
    try {
      await onConfirm(booking.id, reason);
      onClose();
    } catch (error) {
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Cancel Booking</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Are you sure you want to cancel this booking with <strong>{booking.provider.businessName}</strong>?
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for cancellation..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Keep Booking
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CustomerBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Load bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCustomerBookings(
        statusFilter || undefined,
        page,
        limit,
        'createdAt',
        'desc'
      );
      setBookings(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, limit]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    // Update URL
    const params = new URLSearchParams(searchParams);
    if (value) params.set('status', value);
    else params.delete('status');
    router.push(`/dashboard/customer/bookings?${params.toString()}`);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View booking details
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Cancel booking
  const handleCancelBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCancelModal(true);
  };

  // Confirm cancellation
  const handleConfirmCancel = async (bookingId: string, reason: string) => {
    await cancelBooking(bookingId, reason);
    loadBookings();
  };

  // Review booking
  const handleReviewBooking = (booking: Booking) => {
    router.push(`/provider/${booking.provider.id}/review?booking=${booking.id}`);
  };

  // Status filter options
  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'DISPUTED', label: 'Disputed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-0.5">View and manage all your service bookings</p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Book New Service
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <FilterDropdown
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={handleStatusFilterChange}
          />
          {statusFilter && (
            <button
              onClick={() => handleStatusFilterChange('')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
          <div className="ml-auto text-sm text-gray-500">
            {totalItems} bookings found
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading your bookings...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
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
                  You haven't made any bookings yet. Start exploring services and find the right professional for your needs.
                </p>
                <Link
                  href="/search"
                  className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium"
                >
                  Find a service →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    onView={handleViewBooking}
                    onCancel={handleCancelBooking}
                    onReview={handleReviewBooking}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const p = i + 1;
                  // Show limited pages with ellipsis
                  if (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 1
                  ) {
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          p === page
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  } else if (
                    (p === 2 && page > 3) ||
                    (p === totalPages - 1 && page < totalPages - 2)
                  ) {
                    return <span key={p} className="px-2">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
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
      />

      {/* Cancel Booking Modal */}
      <CancelBookingModal
        booking={selectedBooking}
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}