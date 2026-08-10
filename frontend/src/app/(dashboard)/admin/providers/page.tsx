'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BriefcaseIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useDebounce } from '@/hooks/useDebounce';

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
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
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
  verificationDate: string | null;
  verificationNotes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profileImage: string | null;
  };
  services: {
    id: string;
    title: string;
    price: number;
    priceType: string;
  }[];
}

interface ApiResponse {
  data: Provider[];
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

async function getAdminProviders(
  page: number = 1,
  limit: number = 20,
  search?: string,
  category?: string,
  verificationStatus?: string,
  isAvailable?: boolean
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  if (verificationStatus) params.append('verificationStatus', verificationStatus);
  if (isAvailable !== undefined) params.append('isAvailable', isAvailable.toString());

  return await fetchWithAuth(`/admin/providers?${params.toString()}`);
}

async function getProviderDetails(providerId: string): Promise<Provider> {
  return await fetchWithAuth(`/admin/providers/${providerId}`);
}

async function verifyProvider(providerId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<Provider> {
  return await fetchWithAuth(`/admin/providers/${providerId}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

async function toggleProviderAvailability(providerId: string, isAvailable: boolean): Promise<Provider> {
  return await fetchWithAuth(`/admin/providers/${providerId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable }),
  });
}

async function deleteProvider(providerId: string): Promise<void> {
  await fetchWithAuth(`/admin/providers/${providerId}`, {
    method: 'DELETE',
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Verification Status Badge Component
 */
function VerificationBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  const labels: Record<string, string> = {
    PENDING: 'Pending',
    APPROVED: 'Verified',
    REJECTED: 'Rejected',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {status === 'APPROVED' ? (
        <CheckCircleIcon className="w-3 h-3" />
      ) : status === 'REJECTED' ? (
        <XCircleIcon className="w-3 h-3" />
      ) : (
        <ClockIcon className="w-3 h-3" />
      )}
      {labels[status] || status}
    </span>
  );
}

/**
 * Availability Badge Component
 */
function AvailabilityBadge({ isAvailable }: { isAvailable: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isAvailable
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800'
    }`}>
      {isAvailable ? 'Available' : 'Unavailable'}
    </span>
  );
}

/**
 * Provider Row Component
 */
function ProviderRow({
  provider,
  onView,
  onVerify,
  onToggle,
  onDelete,
}: {
  provider: Provider;
  onView: (provider: Provider) => void;
  onVerify: (provider: Provider) => void;
  onToggle: (provider: Provider) => void;
  onDelete: (provider: Provider) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(provider);
    } catch (error) {
      console.error('Error toggling provider:', error);
    } finally {
      setToggling(false);
    }
  };

  const createdAt = new Date(provider.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isPending = provider.verificationStatus === 'PENDING';

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          {provider.businessLogo ? (
            <Image
              src={provider.businessLogo}
              alt={provider.businessName}
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
            <span className="font-medium text-gray-900 truncate">{provider.businessName}</span>
            <VerificationBadge status={provider.verificationStatus} />
            <AvailabilityBadge isAvailable={provider.isAvailable} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              {provider.category}
            </span>
            <span className="flex items-center gap-1">
              <MapPinIcon className="w-3.5 h-3.5" />
              {provider.city}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {provider.user.fullName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              Joined {createdAt}
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <StarSolidIcon className="w-3.5 h-3.5 text-yellow-400" />
              {provider.averageRating.toFixed(1)} ({provider.totalReviews})
            </span>
            {provider.hourlyRate && (
              <span className="flex items-center gap-1 text-green-600">
                <CurrencyDollarIcon className="w-3.5 h-3.5" />
                ETB {provider.hourlyRate}/hr
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onView(provider)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        {isPending && (
          <button
            onClick={() => onVerify(provider)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Verify Provider"
          >
            <ShieldCheckIcon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
          title={provider.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
        >
          {toggling ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : provider.isAvailable ? (
            <XCircleIcon className="w-4 h-4" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(provider)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Provider"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Provider Details Modal
 */
function ProviderDetailsModal({
  provider,
  isOpen,
  onClose,
  onVerify,
}: {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
  onVerify: (providerId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => void;
}) {
  const [verificationNotes, setVerificationNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !provider) return null;

  const handleVerify = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await onVerify(provider.id, status, verificationNotes || undefined);
      onClose();
    } catch (error) {
      alert('Failed to verify provider');
    } finally {
      setLoading(false);
    }
  };

  const createdAt = new Date(provider.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPending = provider.verificationStatus === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">Provider Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Provider Info */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {provider.businessLogo ? (
                <Image
                  src={provider.businessLogo}
                  alt={provider.businessName}
                  width={64}
                  height={64}
                  className="rounded-lg object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900">{provider.businessName}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <VerificationBadge status={provider.verificationStatus} />
                <AvailabilityBadge isAvailable={provider.isAvailable} />
                {provider.isFeatured && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Featured</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">{provider.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="w-4 h-4" />
                  {provider.category}
                </span>
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-4 h-4" />
                  {provider.address}, {provider.city}
                </span>
                {provider.hourlyRate && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    ETB {provider.hourlyRate}/hr
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-4 h-4" />
                  {provider.yearsExperience} years exp
                </span>
                <span className="flex items-center gap-1">
                  <BriefcaseIcon className="w-4 h-4" />
                  {provider.completedJobs} jobs
                </span>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Owner Information</h4>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {provider.user.profileImage ? (
                  <Image
                    src={provider.user.profileImage}
                    alt={provider.user.fullName}
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
                <p className="font-medium text-gray-900">{provider.user.fullName}</p>
                <p className="text-sm text-gray-500">{provider.user.email}</p>
                <p className="text-sm text-gray-500">{provider.user.phone}</p>
              </div>
            </div>
          </div>

          {/* Services */}
          {provider.services.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Services ({provider.services.length})</h4>
              <div className="space-y-2">
                {provider.services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                    <span className="text-sm text-gray-700">{service.title}</span>
                    <span className="text-sm font-medium text-blue-600">
                      ETB {service.price} {service.priceType === 'HOURLY' ? '/hr' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification */}
          {isPending && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Verification Action</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about the verification decision..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify('REJECTED')}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify('APPROVED')}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                    Approve & Verify
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Joined</p>
                <p className="text-gray-900">{createdAt}</p>
              </div>
              <div>
                <p className="text-gray-400">Rating</p>
                <p className="text-gray-900">{provider.averageRating.toFixed(1)} ★ ({provider.totalReviews} reviews)</p>
              </div>
              <div>
                <p className="text-gray-400">Response Time</p>
                <p className="text-gray-900">{provider.responseTime ? `${provider.responseTime} min` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400">Completed Jobs</p>
                <p className="text-gray-900">{provider.completedJobs}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Delete Confirmation Modal
 */
function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  title: string;
  message: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminProvidersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [verificationFilter, setVerificationFilter] = useState(searchParams.get('verification') || '');
  const [availabilityFilter, setAvailabilityFilter] = useState(searchParams.get('availability') || '');

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Load providers
  const loadProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isAvailable = availabilityFilter === 'available' ? true : availabilityFilter === 'unavailable' ? false : undefined;
      const response = await getAdminProviders(
        page,
        limit,
        debouncedSearch || undefined,
        categoryFilter || undefined,
        verificationFilter || undefined,
        isAvailable
      );
      setProviders(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, categoryFilter, verificationFilter, availabilityFilter]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (categoryFilter) params.set('category', categoryFilter);
    if (verificationFilter) params.set('verification', verificationFilter);
    if (availabilityFilter) params.set('availability', availabilityFilter);
    router.push(`/dashboard/admin/providers?${params.toString()}`);
  }, [searchTerm, categoryFilter, verificationFilter, availabilityFilter, router]);

  // Handlers
  const handleViewProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetailsModal(true);
  };

  const handleVerifyProvider = async (providerId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    setModalLoading(true);
    try {
      await verifyProvider(providerId, status, notes);
      await loadProviders();
    } catch (error) {
      alert('Failed to verify provider');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleAvailability = async (provider: Provider) => {
    try {
      await toggleProviderAvailability(provider.id, !provider.isAvailable);
      await loadProviders();
    } catch (error) {
      alert('Failed to toggle provider availability');
    }
  };

  const handleDeleteProvider = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProvider) return;
    setModalLoading(true);
    try {
      await deleteProvider(selectedProvider.id);
      await loadProviders();
      setShowDeleteModal(false);
      setSelectedProvider(null);
    } catch (error) {
      alert('Failed to delete provider');
    } finally {
      setModalLoading(false);
    }
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setVerificationFilter('');
    setAvailabilityFilter('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} provider{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <button onClick={loadProviders} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
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
                placeholder="Search by business name, category, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {['Plumbing', 'Electrical', 'Cleaning', 'Tutoring', 'Photography', 'Mechanics', 'Carpentry', 'Painting'].map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Verification</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
          {(searchTerm || categoryFilter || verificationFilter || availabilityFilter) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading providers...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Providers List */}
        {!loading && !error && (
          <>
            {providers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">🏢</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No providers found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || categoryFilter || verificationFilter || availabilityFilter
                    ? 'No providers match your current filters. Try adjusting your search.'
                    : 'There are no providers registered on the platform yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Provider</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {providers.map((provider) => (
                    <ProviderRow
                      key={provider.id}
                      provider={provider}
                      onView={handleViewProvider}
                      onVerify={handleViewProvider}
                      onToggle={handleToggleAvailability}
                      onDelete={handleDeleteProvider}
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

      {/* Provider Details Modal */}
      <ProviderDetailsModal
        provider={selectedProvider}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProvider(null);
        }}
        onVerify={handleVerifyProvider}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProvider(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
        title="Delete Provider"
        message={`Are you sure you want to permanently delete provider "${selectedProvider?.businessName}"? This will also delete all associated services and data. This action cannot be undone.`}
      />
    </div>
  );
}