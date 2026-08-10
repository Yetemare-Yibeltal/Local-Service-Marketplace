'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Cog6ToothIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  BellIcon,
  RocketLaunchIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  DevicePhoneMobileIcon,
  CloudArrowUpIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
  isPublic: boolean;
}

type SettingsMap = Record<string, any>;

// ============================================================
// SCHEMAS
// ============================================================

const generalSettingsSchema = z.object({
  siteName: z.string().min(2, 'Site name must be at least 2 characters').max(100, 'Site name must not exceed 100 characters'),
  siteDescription: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description must not exceed 500 characters'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^(\+251|0)?[9][0-9]{8}$/, 'Invalid Ethiopian phone number'),
  address: z.string().min(5, 'Address must be at least 5 characters').max(200, 'Address must not exceed 200 characters'),
  timezone: z.string(),
  dateFormat: z.string(),
});

const paymentSettingsSchema = z.object({
  commissionRate: z.number().min(0, 'Commission rate cannot be negative').max(100, 'Commission rate cannot exceed 100%'),
  minPayoutAmount: z.number().min(0, 'Minimum payout cannot be negative'),
  platformFeeFixed: z.number().min(0, 'Platform fee cannot be negative'),
  enableTelebirr: z.boolean(),
  enableChapa: z.boolean(),
  currency: z.string().min(1, 'Currency is required'),
});

const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.string().transform(Number).pipe(z.number().min(1, 'Invalid port').max(65535, 'Invalid port')),
  smtpUser: z.string().email('Invalid email address'),
  smtpPass: z.string().min(1, 'Password is required'),
  fromEmail: z.string().email('Invalid email address'),
  fromName: z.string().min(1, 'From name is required'),
});

const notificationSettingsSchema = z.object({
  enableEmailNotifications: z.boolean(),
  enableSmsNotifications: z.boolean(),
  enablePushNotifications: z.boolean(),
  bookingReminderHours: z.number().min(1, 'Must be at least 1 hour').max(72, 'Maximum 72 hours'),
  maxRetryAttempts: z.number().min(1, 'Must be at least 1').max(10, 'Maximum 10 attempts'),
});

const featureSettingsSchema = z.object({
  enableUserRegistration: z.boolean(),
  enableProviderRegistration: z.boolean(),
  enableReviews: z.boolean(),
  enableDisputes: z.boolean(),
  enableAnalytics: z.boolean(),
  maintenanceMode: z.boolean(),
});

type GeneralSettingsData = z.infer<typeof generalSettingsSchema>;
type PaymentSettingsData = z.infer<typeof paymentSettingsSchema>;
type EmailSettingsData = z.infer<typeof emailSettingsSchema>;
type NotificationSettingsData = z.infer<typeof notificationSettingsSchema>;
type FeatureSettingsData = z.infer<typeof featureSettingsSchema>;

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

async function getSettings(): Promise<SystemSetting[]> {
  try {
    return await fetchWithAuth('/admin/settings');
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings if API fails
    return [];
  }
}

async function updateSetting(key: string, value: any, description?: string): Promise<SystemSetting> {
  return await fetchWithAuth(`/admin/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value, description }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

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
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
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

/**
 * Tab Navigation Component
 */
function TabNav({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string; icon: React.ReactNode }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  return (
    <div className="flex overflow-x-auto gap-1 bg-gray-100 rounded-xl p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Save Button Component
 */
function SaveButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
      {loading ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AdminSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [activeTab, setActiveTab] = useState('general');

  // Form states for each tab
  const generalForm = useForm<GeneralSettingsData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      siteName: 'Service Marketplace',
      siteDescription: 'Connecting customers with trusted professionals in Ethiopia',
      contactEmail: 'support@marketplace.com',
      contactPhone: '+251911234567',
      address: 'Bole, Rwanda Street, Addis Ababa, Ethiopia',
      timezone: 'Africa/Addis_Ababa',
      dateFormat: 'DD/MM/YYYY',
    },
  });

  const paymentForm = useForm<PaymentSettingsData>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      commissionRate: 5,
      minPayoutAmount: 100,
      platformFeeFixed: 0,
      enableTelebirr: true,
      enableChapa: false,
      currency: 'ETB',
    },
  });

  const emailForm = useForm<EmailSettingsData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPass: '',
      fromEmail: 'noreply@marketplace.com',
      fromName: 'Marketplace',
    },
  });

  const notificationForm = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      enablePushNotifications: true,
      bookingReminderHours: 24,
      maxRetryAttempts: 3,
    },
  });

  const featureForm = useForm<FeatureSettingsData>({
    resolver: zodResolver(featureSettingsSchema),
    defaultValues: {
      enableUserRegistration: true,
      enableProviderRegistration: true,
      enableReviews: true,
      enableDisputes: true,
      enableAnalytics: true,
      maintenanceMode: false,
    },
  });

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError(null);
      try {
        const data = await getSettings();
        const map: SettingsMap = {};
        data.forEach((s) => {
          map[s.key] = s.value;
        });
        setSettings(map);

        // Populate forms with loaded values or defaults
        generalForm.reset({
          siteName: map['siteName'] || 'Service Marketplace',
          siteDescription: map['siteDescription'] || 'Connecting customers with trusted professionals in Ethiopia',
          contactEmail: map['contactEmail'] || 'support@marketplace.com',
          contactPhone: map['contactPhone'] || '+251911234567',
          address: map['address'] || 'Bole, Rwanda Street, Addis Ababa, Ethiopia',
          timezone: map['timezone'] || 'Africa/Addis_Ababa',
          dateFormat: map['dateFormat'] || 'DD/MM/YYYY',
        });

        paymentForm.reset({
          commissionRate: map['commissionRate'] !== undefined ? Number(map['commissionRate']) : 5,
          minPayoutAmount: map['minPayoutAmount'] !== undefined ? Number(map['minPayoutAmount']) : 100,
          platformFeeFixed: map['platformFeeFixed'] !== undefined ? Number(map['platformFeeFixed']) : 0,
          enableTelebirr: map['enableTelebirr'] ?? true,
          enableChapa: map['enableChapa'] ?? false,
          currency: map['currency'] || 'ETB',
        });

        emailForm.reset({
          smtpHost: map['smtpHost'] || 'smtp.gmail.com',
          smtpPort: map['smtpPort'] || 587,
          smtpUser: map['smtpUser'] || '',
          smtpPass: map['smtpPass'] || '',
          fromEmail: map['fromEmail'] || 'noreply@marketplace.com',
          fromName: map['fromName'] || 'Marketplace',
        });

        notificationForm.reset({
          enableEmailNotifications: map['enableEmailNotifications'] ?? true,
          enableSmsNotifications: map['enableSmsNotifications'] ?? true,
          enablePushNotifications: map['enablePushNotifications'] ?? true,
          bookingReminderHours: map['bookingReminderHours'] || 24,
          maxRetryAttempts: map['maxRetryAttempts'] || 3,
        });

        featureForm.reset({
          enableUserRegistration: map['enableUserRegistration'] ?? true,
          enableProviderRegistration: map['enableProviderRegistration'] ?? true,
          enableReviews: map['enableReviews'] ?? true,
          enableDisputes: map['enableDisputes'] ?? true,
          enableAnalytics: map['enableAnalytics'] ?? true,
          maintenanceMode: map['maintenanceMode'] ?? false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [generalForm, paymentForm, emailForm, notificationForm, featureForm]);

  // Save handler for current tab
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let updates: { key: string; value: any }[] = [];

      // Get current form data based on active tab
      if (activeTab === 'general') {
        const data = generalForm.getValues();
        const isValid = await generalForm.trigger();
        if (!isValid) {
          setError('Please fix validation errors before saving.');
          setSaving(false);
          return;
        }
        updates = [
          { key: 'siteName', value: data.siteName },
          { key: 'siteDescription', value: data.siteDescription },
          { key: 'contactEmail', value: data.contactEmail },
          { key: 'contactPhone', value: data.contactPhone },
          { key: 'address', value: data.address },
          { key: 'timezone', value: data.timezone },
          { key: 'dateFormat', value: data.dateFormat },
        ];
      } else if (activeTab === 'payment') {
        const data = paymentForm.getValues();
        const isValid = await paymentForm.trigger();
        if (!isValid) {
          setError('Please fix validation errors before saving.');
          setSaving(false);
          return;
        }
        updates = [
          { key: 'commissionRate', value: data.commissionRate },
          { key: 'minPayoutAmount', value: data.minPayoutAmount },
          { key: 'platformFeeFixed', value: data.platformFeeFixed },
          { key: 'enableTelebirr', value: data.enableTelebirr },
          { key: 'enableChapa', value: data.enableChapa },
          { key: 'currency', value: data.currency },
        ];
      } else if (activeTab === 'email') {
        const data = emailForm.getValues();
        const isValid = await emailForm.trigger();
        if (!isValid) {
          setError('Please fix validation errors before saving.');
          setSaving(false);
          return;
        }
        updates = [
          { key: 'smtpHost', value: data.smtpHost },
          { key: 'smtpPort', value: data.smtpPort },
          { key: 'smtpUser', value: data.smtpUser },
          { key: 'smtpPass', value: data.smtpPass },
          { key: 'fromEmail', value: data.fromEmail },
          { key: 'fromName', value: data.fromName },
        ];
      } else if (activeTab === 'notifications') {
        const data = notificationForm.getValues();
        const isValid = await notificationForm.trigger();
        if (!isValid) {
          setError('Please fix validation errors before saving.');
          setSaving(false);
          return;
        }
        updates = [
          { key: 'enableEmailNotifications', value: data.enableEmailNotifications },
          { key: 'enableSmsNotifications', value: data.enableSmsNotifications },
          { key: 'enablePushNotifications', value: data.enablePushNotifications },
          { key: 'bookingReminderHours', value: data.bookingReminderHours },
          { key: 'maxRetryAttempts', value: data.maxRetryAttempts },
        ];
      } else if (activeTab === 'features') {
        const data = featureForm.getValues();
        const isValid = await featureForm.trigger();
        if (!isValid) {
          setError('Please fix validation errors before saving.');
          setSaving(false);
          return;
        }
        updates = [
          { key: 'enableUserRegistration', value: data.enableUserRegistration },
          { key: 'enableProviderRegistration', value: data.enableProviderRegistration },
          { key: 'enableReviews', value: data.enableReviews },
          { key: 'enableDisputes', value: data.enableDisputes },
          { key: 'enableAnalytics', value: data.enableAnalytics },
          { key: 'maintenanceMode', value: data.maintenanceMode },
        ];
      }

      // Save each setting
      for (const update of updates) {
        await updateSetting(update.key, update.value);
        // Update local settings map
        setSettings((prev) => ({ ...prev, [update.key]: update.value }));
      }

      setSuccess('All settings saved successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'general', label: 'General', icon: <Cog6ToothIcon className="w-4 h-4" /> },
    { id: 'payment', label: 'Payment', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
    { id: 'email', label: 'Email', icon: <EnvelopeIcon className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-4 h-4" /> },
    { id: 'features', label: 'Features', icon: <RocketLaunchIcon className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600 mt-0.5">Configure platform-wide settings</p>
          </div>
          <SaveButton loading={saving} onClick={handleSave} />
        </div>

        {/* Error/Success Messages */}
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

        {/* Tabs */}
        <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6 bg-white rounded-xl shadow-card p-6 md:p-8">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...generalForm.register('siteName')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    generalForm.formState.errors.siteName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {generalForm.formState.errors.siteName && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.siteName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...generalForm.register('siteDescription')}
                  rows={3}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    generalForm.formState.errors.siteDescription ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {generalForm.formState.errors.siteDescription && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.siteDescription.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...generalForm.register('contactEmail')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    generalForm.formState.errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {generalForm.formState.errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.contactEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...generalForm.register('contactPhone')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    generalForm.formState.errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {generalForm.formState.errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.contactPhone.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...generalForm.register('address')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    generalForm.formState.errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {generalForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-red-600">{generalForm.formState.errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    {...generalForm.register('timezone')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Africa/Addis_Ababa">Africa/Addis_Ababa</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select
                    {...generalForm.register('dateFormat')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commission Rate (%) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...paymentForm.register('commissionRate', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    paymentForm.formState.errors.commissionRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {paymentForm.formState.errors.commissionRate && (
                  <p className="mt-1 text-sm text-red-600">{paymentForm.formState.errors.commissionRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Payout Amount (ETB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...paymentForm.register('minPayoutAmount', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    paymentForm.formState.errors.minPayoutAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {paymentForm.formState.errors.minPayoutAmount && (
                  <p className="mt-1 text-sm text-red-600">{paymentForm.formState.errors.minPayoutAmount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform Fixed Fee (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...paymentForm.register('platformFeeFixed', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    paymentForm.formState.errors.platformFeeFixed ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {paymentForm.formState.errors.platformFeeFixed && (
                  <p className="mt-1 text-sm text-red-600">{paymentForm.formState.errors.platformFeeFixed.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  {...paymentForm.register('currency')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ETB">ETB (Ethiopian Birr)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <ToggleSwitch
                  enabled={paymentForm.watch('enableTelebirr')}
                  onChange={(val) => paymentForm.setValue('enableTelebirr', val)}
                  label="Enable Telebirr"
                  description="Allow customers to pay using Telebirr mobile money"
                />
                <ToggleSwitch
                  enabled={paymentForm.watch('enableChapa')}
                  onChange={(val) => paymentForm.setValue('enableChapa', val)}
                  label="Enable Chapa"
                  description="Allow customers to pay using Chapa payment gateway"
                />
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Email Settings</h2>
              <p className="text-sm text-gray-500 mb-4">Configure SMTP settings for sending transactional emails</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...emailForm.register('smtpHost')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.smtpHost ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.smtpHost && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.smtpHost.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Port <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...emailForm.register('smtpPort')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.smtpPort ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.smtpPort && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.smtpPort.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...emailForm.register('smtpUser')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.smtpUser ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.smtpUser && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.smtpUser.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  {...emailForm.register('smtpPass')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.smtpPass ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.smtpPass && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.smtpPass.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...emailForm.register('fromEmail')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.fromEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.fromEmail && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.fromEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...emailForm.register('fromName')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    emailForm.formState.errors.fromName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {emailForm.formState.errors.fromName && (
                  <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.fromName.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notification Settings</h2>

              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                <ToggleSwitch
                  enabled={notificationForm.watch('enableEmailNotifications')}
                  onChange={(val) => notificationForm.setValue('enableEmailNotifications', val)}
                  label="Email Notifications"
                  description="Enable sending email notifications to users"
                />
                <ToggleSwitch
                  enabled={notificationForm.watch('enableSmsNotifications')}
                  onChange={(val) => notificationForm.setValue('enableSmsNotifications', val)}
                  label="SMS Notifications"
                  description="Enable sending SMS notifications to users"
                />
                <ToggleSwitch
                  enabled={notificationForm.watch('enablePushNotifications')}
                  onChange={(val) => notificationForm.setValue('enablePushNotifications', val)}
                  label="Push Notifications"
                  description="Enable in-app push notifications"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Reminder Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...notificationForm.register('bookingReminderHours', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    notificationForm.formState.errors.bookingReminderHours ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {notificationForm.formState.errors.bookingReminderHours && (
                  <p className="mt-1 text-sm text-red-600">{notificationForm.formState.errors.bookingReminderHours.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Retry Attempts <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...notificationForm.register('maxRetryAttempts', { valueAsNumber: true })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    notificationForm.formState.errors.maxRetryAttempts ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {notificationForm.formState.errors.maxRetryAttempts && (
                  <p className="mt-1 text-sm text-red-600">{notificationForm.formState.errors.maxRetryAttempts.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Feature Settings */}
          {activeTab === 'features' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Feature Flags</h2>
              <p className="text-sm text-gray-500 mb-4">Enable or disable platform features globally</p>

              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                <ToggleSwitch
                  enabled={featureForm.watch('enableUserRegistration')}
                  onChange={(val) => featureForm.setValue('enableUserRegistration', val)}
                  label="User Registration"
                  description="Allow new users to create accounts"
                />
                <ToggleSwitch
                  enabled={featureForm.watch('enableProviderRegistration')}
                  onChange={(val) => featureForm.setValue('enableProviderRegistration', val)}
                  label="Provider Registration"
                  description="Allow new providers to register on the platform"
                />
                <ToggleSwitch
                  enabled={featureForm.watch('enableReviews')}
                  onChange={(val) => featureForm.setValue('enableReviews', val)}
                  label="Reviews"
                  description="Enable customer reviews and ratings"
                />
                <ToggleSwitch
                  enabled={featureForm.watch('enableDisputes')}
                  onChange={(val) => featureForm.setValue('enableDisputes', val)}
                  label="Disputes"
                  description="Enable dispute resolution system"
                />
                <ToggleSwitch
                  enabled={featureForm.watch('enableAnalytics')}
                  onChange={(val) => featureForm.setValue('enableAnalytics', val)}
                  label="Analytics"
                  description="Enable analytics and reporting features"
                />
              </div>

              <div className="pt-2 border-t-2 border-red-200">
                <ToggleSwitch
                  enabled={featureForm.watch('maintenanceMode')}
                  onChange={(val) => featureForm.setValue('maintenanceMode', val)}
                  label="Maintenance Mode"
                  description="Put the platform in maintenance mode (only administrators can access)"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Button */}
        <div className="mt-6 flex justify-end">
          <SaveButton loading={saving} onClick={handleSave} />
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link
            href="/dashboard/admin"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}