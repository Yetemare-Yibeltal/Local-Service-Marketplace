'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ExclamationTriangleIcon,
  UserIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface Dispute {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  raisedBy: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  adminNotes: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    bookingNumber: string;
    scheduledDate: string;
    totalPrice: number;
    status: string;
    customer: {
      id: string;
      fullName: string;
      email: string;
      phone: string;
      profileImage: string | null;
    };
    provider: {
      id: string;
      businessName: string;
      businessLogo: string | null;
      category: string;
    };
  };
  disputeMessages: {
    id: string;
    senderId: string;
    senderRole: string;
    message: string;
    attachments: string[];
    isRead: boolean;
    createdAt: string;
  }[];
}

interface ApiResponse {
  data: Dispute[];
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

async function getAdminDisputes(
  page: number = 1,
  limit: number = 20,
  status?: string,
  search?: string
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);
  if (search) params.append('search', search);

  return await fetchWithAuth(`/admin/disputes?${params.toString()}`);
}

async function getDisputeDetails(disputeId: string): Promise<Dispute> {
  return await fetchWithAuth(`/admin/disputes/${disputeId}`);
}

async function resolveDispute(
  disputeId: string,
  resolution: string,
  status: 'RESOLVED' | 'CLOSED'
): Promise<Dispute> {
  return await fetchWithAuth(`/admin/disputes/${disputeId}/resolve`, {
    method: 'PUT',
    body: JSON.stringify({ resolution, status }),
  });
}

async function addDisputeMessage(
  disputeId: string,
  message: string
): Promise<any> {
  return await fetchWithAuth(`/admin/disputes/${disputeId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Status Badge Component
 */
function DisputeStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    OPEN: 'bg-red-100 text-red-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-500',
  };

  const labels: Record<string, string> = {
    OPEN: 'Open',
    UNDER_REVIEW: 'Under Review',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
  };

  const icons: Record<string, React.ReactNode> = {
    OPEN: <ExclamationTriangleIcon className="w-3 h-3" />,
    UNDER_REVIEW: <ClockIcon className="w-3 h-3" />,
    RESOLVED: <CheckCircleIcon className="w-3 h-3" />,
    CLOSED: <XCircleIcon className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
      {icons[status] || null}
      {labels[status] || status}
    </span>
  );
}

/**
 * Raised By Badge
 */
function RaisedByBadge({ raisedBy }: { raisedBy: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      raisedBy === 'CUSTOMER'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-purple-100 text-purple-800'
    }`}>
      {raisedBy === 'CUSTOMER' ? 'Customer' : 'Provider'}
    </span>
  );
}

/**
 * Dispute Row Component
 */
function DisputeRow({
  dispute,
  onView,
}: {
  dispute: Dispute;
  onView: (dispute: Dispute) => void;
}) {
  const createdAt = new Date(dispute.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          <div className={`p-2 rounded-lg ${
            dispute.status === 'OPEN' ? 'bg-red-100' :
            dispute.status === 'UNDER_REVIEW' ? 'bg-yellow-100' :
            dispute.status === 'RESOLVED' ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            <ExclamationTriangleIcon className={`w-5 h-5 ${
              dispute.status === 'OPEN' ? 'text-red-600' :
              dispute.status === 'UNDER_REVIEW' ? 'text-yellow-600' :
              dispute.status === 'RESOLVED' ? 'text-green-600' :
              'text-gray-500'
            }`} />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              Booking #{dispute.booking.bookingNumber}
            </span>
            <DisputeStatusBadge status={dispute.status} />
            <RaisedByBadge raisedBy={dispute.raisedBy} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <BriefcaseIcon className="w-3.5 h-3.5" />
              {dispute.booking.provider.businessName}
            </span>
            <span className="flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5" />
              {dispute.booking.customer.fullName}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {createdAt}
            </span>
            <span className="flex items-center gap-1 font-medium text-blue-600">
              <CurrencyDollarIcon className="w-3.5 h-3.5" />
              ETB {dispute.booking.totalPrice.toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate max-w-md mt-0.5">
            {dispute.reason}
          </p>
        </div>
      </div>
      <button
        onClick={() => onView(dispute)}
        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-4 flex-shrink-0"
        title="View Details"
      >
        <EyeIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Dispute Details Modal
 */
function DisputeDetailsModal({
  dispute,
  isOpen,
  onClose,
  onResolve,
  onAddMessage,
}: {
  dispute: Dispute | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (disputeId: string, resolution: string, status: 'RESOLVED' | 'CLOSED') => void;
  onAddMessage: (disputeId: string, message: string) => void;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [resolution, setResolution] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'RESOLVED' | 'CLOSED'>('RESOLVED');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  if (!isOpen || !dispute) return null;

  const handleResolve = async () => {
    if (!resolution.trim()) {
      alert('Please enter a resolution');
      return;
    }
    setLoading(true);
    try {
      await onResolve(dispute.id, resolution, selectedStatus);
    } catch (error) {
      alert('Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      await onAddMessage(dispute.id, newMessage);
      setNewMessage('');
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const createdAt = new Date(dispute.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isOpenStatus = dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              dispute.status === 'OPEN' ? 'bg-red-100' :
              dispute.status === 'UNDER_REVIEW' ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <ExclamationTriangleIcon className={`w-5 h-5 ${
                dispute.status === 'OPEN' ? 'text-red-600' :
                dispute.status === 'UNDER_REVIEW' ? 'text-yellow-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Dispute Details</h3>
              <p className="text-sm text-gray-500">Booking #{dispute.booking.bookingNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status & Info */}
          <div className="flex flex-wrap items-center gap-3">
            <DisputeStatusBadge status={dispute.status} />
            <RaisedByBadge raisedBy={dispute.raisedBy} />
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{createdAt}</span>
          </div>

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400">Customer</p>
                <p className="font-medium text-gray-900">{dispute.booking.customer.fullName}</p>
                <p className="text-sm text-gray-500">{dispute.booking.customer.email}</p>
                <p className="text-sm text-gray-500">{dispute.booking.customer.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Provider</p>
                <p className="font-medium text-gray-900">{dispute.booking.provider.businessName}</p>
                <p className="text-sm text-gray-500">{dispute.booking.provider.category}</p>
              </div>
            </div>
          </div>

          {/* Dispute Details */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Reason</h4>
            <p className="text-gray-700">{dispute.reason}</p>
            <h4 className="font-semibold text-gray-900 mt-3 mb-1">Description</h4>
            <p className="text-gray-700 whitespace-pre-line">{dispute.description}</p>
          </div>

          {/* Resolution */}
          {dispute.resolution && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-1">Resolution</h4>
              <p className="text-gray-700">{dispute.resolution}</p>
              {dispute.resolvedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Resolved on {new Date(dispute.resolvedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {dispute.adminNotes && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-1">Admin Notes</h4>
              <p className="text-gray-700">{dispute.adminNotes}</p>
            </div>
          )}

          {/* Messages Thread */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">Messages</h4>
            <div className="max-h-60 overflow-y-auto space-y-3">
              {dispute.disputeMessages.length === 0 ? (
                <p className="text-gray-500 text-sm">No messages yet</p>
              ) : (
                dispute.disputeMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      msg.senderRole === 'ADMIN'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-medium ${
                          msg.senderRole === 'ADMIN' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.senderRole === 'ADMIN' ? 'Admin' :
                           msg.senderRole === 'CUSTOMER' ? 'Customer' : 'Provider'}
                        </span>
                        <span className={`text-xs ${
                          msg.senderRole === 'ADMIN' ? 'text-blue-200' : 'text-gray-400'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {isOpenStatus && (
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {sendingMessage ? (
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  )}
                  Send
                </button>
              </div>
            )}
          </div>

          {/* Resolution Form */}
          {isOpenStatus && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Resolve Dispute</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Details</label>
                  <textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Enter resolution details..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as 'RESOLVED' | 'CLOSED')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <button
                  onClick={handleResolve}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                  {loading ? 'Resolving...' : 'Resolve Dispute'}
                </button>
              </div>
            </div>
          )}
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

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Load disputes
  const loadDisputes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminDisputes(
        page,
        limit,
        statusFilter || undefined,
        debouncedSearch || undefined
      );
      setDisputes(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, debouncedSearch]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchTerm) params.set('search', searchTerm);
    router.push(`/dashboard/admin/disputes?${params.toString()}`);
  }, [statusFilter, searchTerm, router]);

  // Handlers
  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setShowDetailsModal(true);
  };

  const handleResolveDispute = async (
    disputeId: string,
    resolution: string,
    status: 'RESOLVED' | 'CLOSED'
  ) => {
    try {
      await resolveDispute(disputeId, resolution, status);
      await loadDisputes();
      setShowDetailsModal(false);
      setSelectedDispute(null);
    } catch (error) {
      alert('Failed to resolve dispute');
    }
  };

  const handleAddMessage = async (disputeId: string, message: string) => {
    try {
      await addDisputeMessage(disputeId, message);
      // Refresh dispute details
      const updated = await getDisputeDetails(disputeId);
      setSelectedDispute(updated);
    } catch (error) {
      alert('Failed to send message');
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
    setStatusFilter('');
    setSearchTerm('');
    setPage(1);
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} dispute{totalItems !== 1 ? 's' : ''} found
            </p>
          </div>
          <button onClick={loadDisputes} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
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
                placeholder="Search by booking number or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {(statusFilter || searchTerm) && (
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
            <p className="mt-2 text-gray-500">Loading disputes...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Disputes List */}
        {!loading && !error && (
          <>
            {disputes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">⚖️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No disputes found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {statusFilter || searchTerm
                    ? 'No disputes match your current filters. Try adjusting your search.'
                    : 'There are no disputes reported on the platform.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Dispute</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {disputes.map((dispute) => (
                    <DisputeRow
                      key={dispute.id}
                      dispute={dispute}
                      onView={handleViewDispute}
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

      {/* Dispute Details Modal */}
      <DisputeDetailsModal
        dispute={selectedDispute}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedDispute(null);
        }}
        onResolve={handleResolveDispute}
        onAddMessage={handleAddMessage}
      />
    </div>
  );
}