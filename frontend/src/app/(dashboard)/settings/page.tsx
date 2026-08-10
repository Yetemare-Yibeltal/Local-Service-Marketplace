'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  LanguageIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  WalletIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// SCHEMAS
// ============================================================

const profileSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+251|0)?[9][0-9]{8}$/, 'Please enter a valid Ethiopian phone number (e.g., 0912345678)'),
  email: z.string()
    .email('Please enter a valid email address'),
  bio: z.string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string()
    .min(6, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  smsEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  bookingUpdates: z.boolean(),
  promotionalEmails: z.boolean(),
  providerUpdates: z.boolean(),
  systemAlerts: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type NotificationPreferencesData = z.infer<typeof notificationPreferencesSchema>;

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

async function getUserProfile(): Promise<any> {
  return await fetchWithAuth('/users/profile');
}

async function updateProfile(data: any): Promise<any> {
  return await fetchWithAuth('/users/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function changePassword(data: { currentPassword: string; newPassword: string }): Promise<any> {
  return await fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function getNotificationPreferences(): Promise<any> {
  return await fetchWithAuth('/notifications/preferences');
}

async function updateNotificationPreferences(data: any): Promise<any> {
  return await fetchWithAuth('/notifications/preferences', {
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

async function deactivateAccount(reason: string): Promise<any> {
  return await fetchWithAuth('/users/deactivate', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

async function deleteAccount(): Promise<any> {
  return await fetchWithAuth('/users', {
    method: 'DELETE',
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Password Strength Indicator Component
 */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { level: 0, label: 'None', color: 'bg-gray-200' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/.test(password)) score++;

    const levels = [
      { level: 0, label: 'None', color: 'bg-gray-200' },
      { level: 1, label: 'Weak', color: 'bg-red-500' },
      { level: 2, label: 'Fair', color: 'bg-yellow-500' },
      { level: 3, label: 'Good', color: 'bg-blue-500' },
      { level: 4, label: 'Strong', color: 'bg-green-500' },
      { level: 5, label: 'Very Strong', color: 'bg-green-600' },
    ];

    return levels[score] || levels[0];
  };

  const strength = getStrength();

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
            style={{ width: `${(strength.level / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gray-500 min-w-16">{strength.label}</span>
      </div>
      <p className="text-xs text-gray-400 mt-0.5">
        Must have at least 8 characters, uppercase, lowercase, number, and special character.
      </p>
    </div>
  );
}

/**
 * Toggle Switch Component
 */
function ToggleSwitch({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
          enabled ? 'bg-blue-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy' | 'danger'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    bookingUpdates: true,
    promotionalEmails: false,
    providerUpdates: true,
    systemAlerts: true,
  });

  // Form states
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // React Hook Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      bio: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watchPassword('newPassword');

  // Load user data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profileData, prefData] = await Promise.all([
          getUserProfile(),
          getNotificationPreferences().catch(() => ({
            emailEnabled: true,
            smsEnabled: true,
            pushEnabled: true,
            bookingUpdates: true,
            promotionalEmails: false,
            providerUpdates: true,
            systemAlerts: true,
          })),
        ]);

        setUser(profileData);
        setProfileImage(profileData?.profileImage || null);

        // Reset profile form
        resetProfile({
          fullName: profileData?.fullName || '',
          phone: profileData?.phone || '',
          email: profileData?.email || '',
          bio: profileData?.bio || '',
        });

        setPreferences({
          emailEnabled: prefData?.emailEnabled !== undefined ? prefData.emailEnabled : true,
          smsEnabled: prefData?.smsEnabled !== undefined ? prefData.smsEnabled : true,
          pushEnabled: prefData?.pushEnabled !== undefined ? prefData.pushEnabled : true,
          bookingUpdates: prefData?.bookingUpdates !== undefined ? prefData.bookingUpdates : true,
          promotionalEmails: prefData?.promotionalEmails !== undefined ? prefData.promotionalEmails : false,
          providerUpdates: prefData?.providerUpdates !== undefined ? prefData.providerUpdates : true,
          systemAlerts: prefData?.systemAlerts !== undefined ? prefData.systemAlerts : true,
        });
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resetProfile]);

  // Profile update handler
  const onProfileSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const result = await updateProfile(data);
      setUser(result);
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Password change handler
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setSaving(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      resetPassword();
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Notification preferences update handler
  const onPreferencesSubmit = async () => {
    setSaving(true);
    setPrefError(null);
    setPrefSuccess(null);

    try {
      await updateNotificationPreferences(preferences);
      setPrefSuccess('Notification preferences updated successfully!');
      setTimeout(() => setPrefSuccess(null), 5000);
    } catch (error) {
      setPrefError(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setSaving(true);
    try {
      const result = await uploadAvatar(file);
      setProfileImage(result.profileImage);
      setProfileSuccess('Avatar updated successfully!');
      setTimeout(() => setProfileSuccess(null), 5000);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setSaving(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Account deactivation handler
  const handleDeactivateAccount = async () => {
    try {
      await deactivateAccount(deactivationReason || 'User requested deactivation');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/login?deactivated=true');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to deactivate account');
    }
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      router.push('/login?deleted=true');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-4 sticky top-24">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <LockClosedIcon className="w-5 h-5" />
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'notifications'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BellIcon className="w-5 h-5" />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('privacy')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'privacy'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ShieldCheckIcon className="w-5 h-5" />
                  Privacy
                </button>
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'danger'
                      ? 'bg-red-50 text-red-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  Danger
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                      {profileImage ? (
                        <Image
                          src={profileImage}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-blue-600 font-bold text-3xl">
                          {user?.fullName?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Click the pencil icon to change your avatar</p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...registerProfile('fullName')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        profileErrors.fullName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      {...registerProfile('email')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-400">Email cannot be changed. Contact support for assistance.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      {...registerProfile('phone')}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        profileErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      {...registerProfile('bio')}
                      rows={4}
                      placeholder="Tell us a bit about yourself..."
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                        profileErrors.bio ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {profileErrors.bio && (
                      <p className="mt-1 text-sm text-red-600">{profileErrors.bio.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {watchProfile('bio')?.length || 0} / 500 characters
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>

                {passwordSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...registerPassword('currentPassword')}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        {...registerPassword('newPassword')}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                    )}
                    <PasswordStrength password={newPassword || ''} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        {...registerPassword('confirmPassword')}
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Notification Preferences</h2>

                {prefSuccess && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{prefSuccess}</span>
                  </div>
                )}
                {prefError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                    <span>{prefError}</span>
                  </div>
                )}

                <div className="space-y-1 divide-y divide-gray-100">
                  <div className="pb-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Channel Preferences</h4>
                    <ToggleSwitch
                      enabled={preferences.emailEnabled}
                      onChange={(val) => setPreferences({ ...preferences, emailEnabled: val })}
                      label="Email Notifications"
                      description="Receive notifications via email"
                    />
                    <ToggleSwitch
                      enabled={preferences.smsEnabled}
                      onChange={(val) => setPreferences({ ...preferences, smsEnabled: val })}
                      label="SMS Notifications"
                      description="Receive notifications via SMS"
                    />
                    <ToggleSwitch
                      enabled={preferences.pushEnabled}
                      onChange={(val) => setPreferences({ ...preferences, pushEnabled: val })}
                      label="Push Notifications"
                      description="Receive notifications in your browser"
                    />
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Notification Types</h4>
                    <ToggleSwitch
                      enabled={preferences.bookingUpdates}
                      onChange={(val) => setPreferences({ ...preferences, bookingUpdates: val })}
                      label="Booking Updates"
                      description="Status changes, confirmations, and reminders"
                    />
                    <ToggleSwitch
                      enabled={preferences.promotionalEmails}
                      onChange={(val) => setPreferences({ ...preferences, promotionalEmails: val })}
                      label="Promotional Emails"
                      description="News, updates, and special offers"
                    />
                    <ToggleSwitch
                      enabled={preferences.providerUpdates}
                      onChange={(val) => setPreferences({ ...preferences, providerUpdates: val })}
                      label="Provider Updates"
                      description="New providers and service recommendations"
                    />
                    <ToggleSwitch
                      enabled={preferences.systemAlerts}
                      onChange={(val) => setPreferences({ ...preferences, systemAlerts: val })}
                      label="System Alerts"
                      description="Important system and security notifications"
                    />
                  </div>
                </div>

                <button
                  onClick={onPreferencesSubmit}
                  disabled={saving}
                  className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Privacy Settings</h2>

                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <GlobeAltIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Your profile is visible to all users. You can control what information is shown.
                        </p>
                        <Link
                          href="/dashboard/profile"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          Manage Profile Visibility →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <DocumentDuplicateIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Data Export</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Download a copy of your personal data in JSON format.
                        </p>
                        <button
                          className="mt-2 px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={async () => {
                            try {
                              const data = await fetchWithAuth('/users/data-export');
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `marketplace-data-${new Date().toISOString().split('T')[0]}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            } catch (error) {
                              alert('Failed to export data');
                            }
                          }}
                        >
                          Export My Data
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheckIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Privacy Policy</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Review how we collect, use, and protect your personal data.
                        </p>
                        <Link
                          href="/privacy"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                          target="_blank"
                        >
                          Read Privacy Policy →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900">Active Sessions</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          You are currently logged in on this device. No other active sessions detected.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Danger Tab */}
            {activeTab === 'danger' && (
              <div className="bg-white rounded-xl shadow-card p-6 md:p-8">
                <h2 className="text-xl font-bold text-red-600 mb-6">Danger Zone</h2>

                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-red-800">Deactivate Account</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Temporarily deactivate your account. Your data will be preserved and you can reactivate later.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeactivationModal(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        Deactivate
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-red-800">Delete Account</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Permanently delete your account and all associated data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-800">
                          <strong>Warning:</strong> These actions are irreversible. Please proceed with caution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deactivation Modal */}
      {showDeactivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeactivationModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Deactivate Account</h3>
              <button
                onClick={() => setShowDeactivationModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to deactivate your account? Your data will be preserved but you won't be able to access your account until you reactivate.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
              <textarea
                value={deactivationReason}
                onChange={(e) => setDeactivationReason(e.target.value)}
                placeholder="Why are you deactivating your account?"
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivationModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-600">Delete Account</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-medium">⚠️ This action is permanent and cannot be undone.</p>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to permanently delete your account? All your data, including bookings, reviews, and personal information, will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition-colors"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}