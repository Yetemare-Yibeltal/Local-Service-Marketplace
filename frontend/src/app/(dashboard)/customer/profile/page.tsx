'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  StarIcon,
  BriefcaseIcon,
  MapPinIcon,
  ClockIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  profileImage: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  favoriteProviders: number;
}

// ============================================================
// SCHEMA
// ============================================================

const profileSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+251|0)?[9][0-9]{8}$/, 'Please enter a valid Ethiopian phone number (e.g., 0912345678)'),
  bio: z.string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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

async function getUserProfile(): Promise<UserProfile> {
  return await fetchWithAuth('/users/profile');
}

async function getUserStats(): Promise<UserStats> {
  return await fetchWithAuth('/bookings/customer/stats');
}

async function updateProfile(data: Partial<ProfileFormData>): Promise<UserProfile> {
  return await fetchWithAuth('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function uploadAvatar(file: File): Promise<{ profileImage: string }> {
  const formData = new FormData();
  formData.append('avatar', file);

  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/users/profile/avatar`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Avatar upload failed');
  }

  const result = await response.json();
  return result.data;
}

async function getFavoriteCount(): Promise<{ total: number }> {
  return await fetchWithAuth('/providers/favorites/count');
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-card p-4 text-center">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{title}</p>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function CustomerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      bio: '',
    },
  });

  const bioValue = watch('bio');

  // Load profile data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, statsData, favData] = await Promise.all([
          getUserProfile(),
          getUserStats(),
          getFavoriteCount().catch(() => ({ total: 0 })),
        ]);

        setProfile(profileData);
        setStats(statsData);
        setProfileImage(profileData.profileImage);
        setFavoriteCount(favData.total);

        reset({
          fullName: profileData.fullName,
          phone: profileData.phone,
          bio: profileData.bio || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reset]);

  // Handle profile update
  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProfile({
        fullName: data.fullName,
        phone: data.phone,
        bio: data.bio,
      });

      setProfile(updated);
      setProfileImage(updated.profileImage);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSaving(true);
    try {
      const result = await uploadAvatar(file);
      setProfileImage(result.profileImage);
      setSuccess('Avatar updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        phone: profile.phone,
        bio: profile.bio || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-2 text-gray-600">Failed to load profile</p>
          <Link href="/dashboard" className="mt-4 text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-0.5">Manage your personal information</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Cover Area */}
          <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 relative" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={profile.fullName}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-3xl">
                        {profile.fullName.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                  disabled={saving}
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Name & Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900 truncate">
                    {profile.fullName}
                  </h2>
                  {profile.isEmailVerified && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <CheckCircleIcon className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    {profile.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4" />
                    {profile.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    Member since {memberSince}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit(onSubmit)}
                      disabled={saving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {saving ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard
            title="Total Bookings"
            value={stats?.totalBookings || 0}
            icon={<CalendarIcon className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={stats?.completedBookings || 0}
            icon={<CheckCircleIcon className="w-5 h-5" />}
            color="green"
          />
          <StatCard
            title="Total Spent"
            value={`ETB ${(stats?.totalSpent || 0).toFixed(2)}`}
            icon={<CurrencyDollarIcon className="w-5 h-5" />}
            color="purple"
          />
          <StatCard
            title="Favorites"
            value={favoriteCount}
            icon={<StarIcon className="w-5 h-5" />}
            color="yellow"
          />
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">About Me</h3>
          {isEditing ? (
            <div>
              <textarea
                {...register('bio')}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bio && (
                <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {bioValue?.length || 0} / 500 characters
              </p>
            </div>
          ) : (
            <p className="text-gray-600">{profile.bio || 'No bio added yet.'}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Link
            href="/dashboard/customer/bookings"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-blue-50 rounded-lg">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">My Bookings</p>
              <p className="text-xs text-gray-500">View all bookings</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/dashboard/customer/favorites"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-red-50 rounded-lg">
              <HeartIcon className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Favorites</p>
              <p className="text-xs text-gray-500">{favoriteCount} saved providers</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-gray-50 rounded-lg">
              <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Settings</p>
              <p className="text-xs text-gray-500">Account preferences</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>

          <Link
            href="/search"
            className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-card hover:shadow-lg transition-shadow"
          >
            <div className="p-2 bg-green-50 rounded-lg">
              <PlusIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Find Services</p>
              <p className="text-xs text-gray-500">Book new service</p>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-gray-400 ml-auto" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}