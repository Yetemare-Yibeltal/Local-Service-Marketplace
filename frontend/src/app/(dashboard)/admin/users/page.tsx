'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface User {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN';
  profileImage: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  providerProfile?: {
    id: string;
    businessName: string;
    isVerified: boolean;
    averageRating: number;
    totalReviews: number;
    category: string;
  } | null;
}

interface ApiResponse {
  data: User[];
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

async function getAdminUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
  role?: string,
  isActive?: boolean
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (role) params.append('role', role);
  if (isActive !== undefined) params.append('isActive', isActive.toString());

  return await fetchWithAuth(`/admin/users?${params.toString()}`);
}

async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  return await fetchWithAuth(`/admin/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function deactivateUser(userId: string, reason?: string): Promise<User> {
  return await fetchWithAuth(`/admin/users/${userId}/deactivate`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

async function activateUser(userId: string): Promise<User> {
  return await fetchWithAuth(`/admin/users/${userId}/activate`, {
    method: 'POST',
  });
}

async function deleteUser(userId: string): Promise<void> {
  await fetchWithAuth(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Status Badge Component
 */
function StatusBadge({ isActive, isVerified }: { isActive: boolean; isVerified?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <CheckCircleIcon className="w-3 h-3" />
        ) : (
          <XCircleIcon className="w-3 h-3" />
        )}
        {isActive ? 'Active' : 'Inactive'}
      </span>
      {isVerified !== undefined && (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isVerified
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-500'
        }`}>
          <ShieldCheckIcon className="w-3 h-3" />
          {isVerified ? 'Verified' : 'Unverified'}
        </span>
      )}
    </div>
  );
}

/**
 * Role Badge Component
 */
function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    CUSTOMER: 'bg-purple-100 text-purple-800',
    PROVIDER: 'bg-blue-100 text-blue-800',
    ADMIN: 'bg-red-100 text-red-800',
  };

  const icons: Record<string, React.ReactNode> = {
    CUSTOMER: <UserIcon className="w-3 h-3" />,
    PROVIDER: <BriefcaseIcon className="w-3 h-3" />,
    ADMIN: <ShieldCheckIcon className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
      {icons[role] || null}
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </span>
  );
}

/**
 * User Row Component
 */
function UserRow({
  user,
  onView,
  onEdit,
  onToggle,
  onDelete,
}: {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onToggle: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(user);
    } catch (error) {
      console.error('Error toggling user:', error);
    } finally {
      setToggling(false);
    }
  };

  const createdAt = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-shrink-0">
          {user.profileImage ? (
            <Image
              src={user.profileImage}
              alt={user.fullName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {user.fullName.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{user.fullName}</span>
            <RoleBadge role={user.role} />
            <StatusBadge isActive={user.isActive} isVerified={user.isEmailVerified && user.isPhoneVerified} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <EnvelopeIcon className="w-3.5 h-3.5" />
              {user.email}
            </span>
            <span className="flex items-center gap-1">
              <PhoneIcon className="w-3.5 h-3.5" />
              {user.phone}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              Joined {createdAt}
            </span>
            {user.providerProfile && (
              <span className="flex items-center gap-1 text-blue-600">
                <BriefcaseIcon className="w-3.5 h-3.5" />
                {user.providerProfile.businessName}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onView(user)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="View Details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(user)}
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
          title="Edit Role"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title={user.isActive ? 'Deactivate' : 'Activate'}
        >
          {toggling ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : user.isActive ? (
            <XCircleIcon className="w-4 h-4" />
          ) : (
            <CheckCircleIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(user)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete User"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * User Details Modal
 */
function UserDetailsModal({
  user,
  isOpen,
  onClose,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !user) return null;

  const createdAt = new Date(user.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const lastLogin = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">User Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt={user.fullName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-blue-600" />
                </div>
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-900">{user.fullName}</h4>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <RoleBadge role={user.role} />
                <StatusBadge isActive={user.isActive} />
                {user.isEmailVerified && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Email Verified</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">{user.email}</p>
              <p className="text-sm text-gray-500">{user.phone}</p>
              {user.bio && <p className="text-sm text-gray-600 mt-2">{user.bio}</p>}
            </div>
          </div>

          {/* Provider Profile */}
          {user.providerProfile && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Provider Profile</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{user.providerProfile.businessName}</p>
                <p className="text-sm text-gray-500">{user.providerProfile.category}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                    {user.providerProfile.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                  <span className="flex items-center gap-1">
                    <StarIcon className="w-4 h-4 text-yellow-400" />
                    {user.providerProfile.averageRating.toFixed(1)} ★
                  </span>
                  <span className="flex items-center gap-1">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-400" />
                    {user.providerProfile.totalReviews} reviews
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Member Since</p>
                <p className="text-gray-900">{createdAt}</p>
              </div>
              <div>
                <p className="text-gray-400">Last Login</p>
                <p className="text-gray-900">{lastLogin}</p>
              </div>
              <div>
                <p className="text-gray-400">Email Verified</p>
                <p className="text-gray-900">{user.isEmailVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-400">Phone Verified</p>
                <p className="text-gray-900">{user.isPhoneVerified ? 'Yes' : 'No'}</p>
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
 * Role Edit Modal
 */
function RoleEditModal({
  user,
  isOpen,
  onClose,
  onSave,
  saving,
}: {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, role: string) => void;
  saving: boolean;
}) {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'CUSTOMER');

  React.useEffect(() => {
    if (user) setSelectedRole(user.role);
  }, [user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Update User Role</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Change role for <strong>{user.fullName}</strong>
        </p>
        <div className="space-y-3">
          {['CUSTOMER', 'PROVIDER', 'ADMIN'].map((role) => (
            <label
              key={role}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedRole === role
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                value={role}
                checked={selectedRole === role}
                onChange={() => setSelectedRole(role)}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                selectedRole === role
                  ? 'border-blue-600 bg-blue-600'
                  : 'border-gray-300'
              }`}>
                {selectedRole === role && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {role.charAt(0) + role.slice(1).toLowerCase()}
                </p>
                <p className="text-xs text-gray-500">
                  {role === 'CUSTOMER' ? 'Can book services' :
                   role === 'PROVIDER' ? 'Can offer services' :
                   'Full system access'}
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(user.id, selectedRole)}
            disabled={saving || selectedRole === user.role}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
            {saving ? 'Saving...' : 'Save Role'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const response = await getAdminUsers(
        page,
        limit,
        debouncedSearch || undefined,
        roleFilter || undefined,
        isActive
      );
      setUsers(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    router.push(`/dashboard/admin/users?${params.toString()}`);
  }, [searchTerm, roleFilter, statusFilter, router]);

  // Handle actions
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleSaveRole = async (userId: string, role: string) => {
    setModalLoading(true);
    try {
      await updateUser(userId, { role: role as any });
      await loadUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      alert('Failed to update user role');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleUser = async (user: User) => {
    try {
      if (user.isActive) {
        const reason = prompt('Reason for deactivation (optional):');
        if (reason === null) return;
        await deactivateUser(user.id, reason || undefined);
      } else {
        await activateUser(user.id);
      }
      await loadUsers();
    } catch (error) {
      alert('Failed to toggle user status');
    }
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setModalLoading(true);
    try {
      await deleteUser(selectedUser.id);
      await loadUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      alert('Failed to delete user');
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
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} users found
            </p>
          </div>
          <button onClick={loadUsers} className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" title="Refresh">
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="CUSTOMER">Customer</option>
            <option value="PROVIDER">Provider</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || roleFilter || statusFilter) && (
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
            <p className="mt-2 text-gray-500">Loading users...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Users List */}
        {!loading && !error && (
          <>
            {users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || roleFilter || statusFilter
                    ? 'No users match your current filters. Try adjusting your search.'
                    : 'There are no users registered on the platform yet.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">User</div>
                    <div className="col-span-3">Role & Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {users.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onView={handleViewUser}
                      onEdit={handleEditRole}
                      onToggle={handleToggleUser}
                      onDelete={handleDeleteUser}
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

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedUser(null);
        }}
      />

      {/* Role Edit Modal */}
      <RoleEditModal
        user={selectedUser}
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveRole}
        saving={modalLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
        title="Delete User"
        message={`Are you sure you want to permanently delete user "${selectedUser?.fullName}"? This action cannot be undone.`}
      />
    </div>
  );
}

// ============================================================
// Reusable Delete Confirm Modal
// ============================================================

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
// Missing Icon
// ============================================================

function ChatBubbleLeftRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}