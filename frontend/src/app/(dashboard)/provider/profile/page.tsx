'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BriefcaseIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  StarIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  TagIcon,
  DocumentTextIcon,
  SaveIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

interface ProviderProfile {
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
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
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
    isActive: boolean;
  }[];
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
}

// ============================================================
// SCHEMA
// ============================================================

const profileSchema = z.object({
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  category: z.string()
    .min(1, 'Category is required'),
  subCategory: z.string().optional().nullable(),
  yearsExperience: z.number()
    .int()
    .min(0, 'Years experience cannot be negative')
    .max(50, 'Years experience cannot exceed 50'),
  hourlyRate: z.number()
    .min(0, 'Hourly rate cannot be negative')
    .nullable()
    .optional(),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must not exceed 500 characters'),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters'),
  subCity: z.string().nullable().optional(),
  locationLat: z.number()
    .min(-90)
    .max(90),
  locationLng: z.number()
    .min(-180)
    .max(180),
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

async function getProviderProfile(): Promise<ProviderProfile> {
  return await fetchWithAuth('/providers/profile');
}

async function updateProviderProfile(data: FormData): Promise<ProviderProfile> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/providers/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  const result = await response.json();
  return result.data;
}

async function getCategories(): Promise<Category[]> {
  try {
    return await fetchWithAuth('/categories/active');
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Verification Status Badge Component
 */
function VerificationBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: {
      label: 'Pending Verification',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <ClockIcon className="w-4 h-4" />,
    },
    APPROVED: {
      label: 'Verified ✓',
      color: 'bg-green-100 text-green-800',
      icon: <CheckCircleIcon className="w-4 h-4" />,
    },
    REJECTED: {
      label: 'Verification Rejected',
      color: 'bg-red-100 text-red-800',
      icon: <XCircleIcon className="w-4 h-4" />,
    },
  };

  const { label, color, icon } = config[status] || config.PENDING;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
      {icon}
      {label}
    </span>
  );
}

/**
 * Stat Card Component
 */
function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-4 text-center border border-gray-100">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      description: '',
      category: '',
      subCategory: '',
      yearsExperience: 0,
      hourlyRate: 0,
      address: '',
      city: '',
      subCity: '',
      locationLat: 9.03,
      locationLng: 38.74,
    },
  });

  // Load profile and categories
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [profileData, categoriesData] = await Promise.all([
          getProviderProfile(),
          getCategories(),
        ]);

        setProfile(profileData);
        setCategories(categoriesData);
        setLogoPreview(profileData.businessLogo);

        reset({
          businessName: profileData.businessName,
          description: profileData.description,
          category: profileData.category,
          subCategory: profileData.subCategory || '',
          yearsExperience: profileData.yearsExperience,
          hourlyRate: profileData.hourlyRate || 0,
          address: profileData.address,
          city: profileData.city,
          subCity: profileData.subCity || '',
          locationLat: profileData.locationLat,
          locationLng: profileData.locationLng,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reset]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setIsEditing(true);
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();

      // Append all text fields
      formData.append('businessName', data.businessName);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (data.subCategory) formData.append('subCategory', data.subCategory);
      formData.append('yearsExperience', data.yearsExperience.toString());
      if (data.hourlyRate) formData.append('hourlyRate', data.hourlyRate.toString());
      formData.append('address', data.address);
      formData.append('city', data.city);
      if (data.subCity) formData.append('subCity', data.subCity);
      formData.append('locationLat', data.locationLat.toString());
      formData.append('locationLng', data.locationLng.toString());

      // Append logo if changed
      if (logoFile) {
        formData.append('businessLogo', logoFile);
      }

      const updatedProfile = await updateProviderProfile(formData);
      setProfile(updatedProfile);
      setLogoPreview(updatedProfile.businessLogo);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 5000);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    if (profile) {
      reset({
        businessName: profile.businessName,
        description: profile.description,
        category: profile.category,
        subCategory: profile.subCategory || '',
        yearsExperience: profile.yearsExperience,
        hourlyRate: profile.hourlyRate || 0,
        address: profile.address,
        city: profile.city,
        subCity: profile.subCity || '',
        locationLat: profile.locationLat,
        locationLng: profile.locationLng,
      });
      setLogoPreview(profile.businessLogo);
      setLogoFile(null);
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom max-w-7xl text-center py-12">
          <p className="text-gray-500">No profile data available</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isVerified = profile.isVerified;
  const verificationStatus = profile.verificationStatus || 'PENDING';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Provider Profile</h1>
            <p className="text-gray-600 mt-0.5">Manage your business information</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/provider"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
            {!isEditing && (
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

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-700 relative" />

          {/* Profile Info */}
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
              {/* Logo */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                  {logoPreview ? (
                    <Image
                      src={logoPreview}
                      alt={profile.businessName}
                      width={96}
                      height={96}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                      <BriefcaseIcon className="w-10 h-10 text-blue-600" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* Name & Actions */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  {isEditing ? (
                    <input
                      type="text"
                      {...register('businessName')}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none px-1"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-gray-900 truncate">
                      {profile.businessName}
                    </h2>
                  )}
                  {isVerified ? (
                    <span className="inline-flex items-center gap-0.5 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <ShieldCheckIcon className="w-3 h-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                      <ClockIcon className="w-3 h-3" />
                      Pending
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    {profile.user.fullName}
                  </span>
                  <span className="flex items-center gap-1">
                    <EnvelopeIcon className="w-4 h-4" />
                    {profile.user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <PhoneIcon className="w-4 h-4" />
                    {profile.user.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-gray-100 pt-6">
              <StatCard
                label="Completed Jobs"
                value={profile.completedJobs || 0}
                icon={<CheckCircleIcon className="w-5 h-5 text-green-600 mx-auto" />}
              />
              <StatCard
                label="Average Rating"
                value={`${(profile.averageRating || 0).toFixed(1)} ★`}
                icon={<StarSolidIcon className="w-5 h-5 text-yellow-400 mx-auto" />}
              />
              <StatCard
                label="Total Reviews"
                value={profile.totalReviews || 0}
                icon={<StarIcon className="w-5 h-5 text-blue-600 mx-auto" />}
              />
              <StatCard
                label="Years Experience"
                value={profile.yearsExperience || 0}
                icon={<ClockIcon className="w-5 h-5 text-purple-600 mx-auto" />}
              />
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Business Details</h3>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <select
                  {...register('category')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">{profile.category}</p>
              )}
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            {/* Sub-category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Category (Optional)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  {...register('subCategory')}
                  placeholder="e.g., Residential Plumbing"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profile.subCategory || 'Not specified'}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe your business and services..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              ) : (
                <p className="text-gray-700 whitespace-pre-line">{profile.description}</p>
              )}
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Years Experience & Hourly Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years Experience <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    max="50"
                    {...register('yearsExperience', { valueAsNumber: true })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.yearsExperience ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.yearsExperience} years</p>
                )}
                {errors.yearsExperience && <p className="mt-1 text-sm text-red-600">{errors.yearsExperience.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (ETB)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min="0"
                    step="1"
                    {...register('hourlyRate', { valueAsNumber: true })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.hourlyRate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.hourlyRate ? `ETB ${profile.hourlyRate}/hr` : 'Not set'}</p>
                )}
                {errors.hourlyRate && <p className="mt-1 text-sm text-red-600">{errors.hourlyRate.message}</p>}
              </div>
            </div>

            {/* Address & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="e.g., Bole, Rwanda Street"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.address}</p>
                )}
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('city')}
                    placeholder="e.g., Addis Ababa"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                ) : (
                  <p className="text-gray-900">{profile.city}</p>
                )}
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>
            </div>

            {/* Sub-city & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sub-City (Optional)
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('subCity')}
                    placeholder="e.g., Bole"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.subCity || 'N/A'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.000001"
                    {...register('locationLat', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.locationLat.toFixed(6)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.000001"
                    {...register('locationLng', { valueAsNumber: true })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profile.locationLng.toFixed(6)}</p>
                )}
              </div>
            </div>

            {/* Services Section */}
            {profile.services && profile.services.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Your Services</h4>
                <div className="space-y-2">
                  {profile.services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-sm text-gray-700">{service.title}</span>
                      <span className="text-sm font-medium text-blue-600">
                        ETB {service.price} {service.priceType === 'HOURLY' ? '/hr' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/provider/services"
                  className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Manage Services →
                </Link>
              </div>
            )}

            {/* Verification Status */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">Verification Status</h4>
              <VerificationBadge status={verificationStatus} />
              {profile.verificationNotes && (
                <p className="mt-2 text-sm text-gray-600">Note: {profile.verificationNotes}</p>
              )}
            </div>

            {/* Submit / Cancel Buttons */}
            {isEditing && (
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25L7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
    </svg>
  );
}