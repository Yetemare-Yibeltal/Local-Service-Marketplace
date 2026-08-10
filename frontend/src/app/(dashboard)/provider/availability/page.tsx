'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  UserIcon,
  BriefcaseIcon,
  XMarkIcon,
  SaveIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

interface WorkingHours {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface ProviderProfile {
  id: string;
  businessName: string;
  isAvailable: boolean;
  workingHours: Record<string, { start: string; end: string }> | null;
  responseTime: number | null;
}

// ============================================================
// SCHEMA
// ============================================================

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
  workingHours: z.array(
    z.object({
      day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
      isAvailable: z.boolean(),
    })
  ),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

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

async function updateAvailability(isAvailable: boolean): Promise<ProviderProfile> {
  return await fetchWithAuth('/providers/availability', {
    method: 'PATCH',
    body: JSON.stringify({ isAvailable }),
  });
}

async function updateWorkingHours(workingHours: Record<string, { start: string; end: string }>): Promise<ProviderProfile> {
  return await fetchWithAuth('/providers/working-hours', {
    method: 'PUT',
    body: JSON.stringify({ workingHours }),
  });
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Day of Week Selector
 */
const DAYS = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

function DayScheduleRow({
  day,
  index,
  register,
  remove,
  errors,
  watch,
}: {
  day: { value: string; label: string };
  index: number;
  register: any;
  remove: (index: number) => void;
  errors: any;
  watch: any;
}) {
  const isAvailable = watch(`workingHours.${index}.isAvailable`);
  const startTime = watch(`workingHours.${index}.startTime`);
  const endTime = watch(`workingHours.${index}.endTime`);

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="w-24 font-medium text-gray-700">{day.label}</div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const current = watch(`workingHours.${index}.isAvailable`);
            register(`workingHours.${index}.isAvailable`).onChange({
              target: { value: !current, name: `workingHours.${index}.isAvailable` },
            });
          }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
            isAvailable ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isAvailable ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-xs text-gray-500">{isAvailable ? 'Open' : 'Closed'}</span>
      </div>

      {isAvailable && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">From</span>
            <input
              type="time"
              {...register(`workingHours.${index}.startTime`)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-28"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">To</span>
            <input
              type="time"
              {...register(`workingHours.${index}.endTime`)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-28"
            />
          </div>
        </>
      )}

      {errors.workingHours?.[index] && (
        <p className="text-xs text-red-500 w-full">
          {errors.workingHours[index].startTime?.message ||
            errors.workingHours[index].endTime?.message}
        </p>
      )}
    </div>
  );
}

/**
 * Availability Toggle Component
 */
function AvailabilityToggle({
  isAvailable,
  onChange,
  loading,
}: {
  isAvailable: boolean;
  onChange: (value: boolean) => void;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Availability Status</h3>
          <p className="text-sm text-gray-500 mt-1">
            {isAvailable
              ? 'You are currently available to accept bookings'
              : 'You are currently unavailable. Customers cannot book you.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Off</span>
            <button
              onClick={() => onChange(!isAvailable)}
              disabled={loading}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              } disabled:opacity-50`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                  isAvailable ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">On</span>
          </div>
          {loading && <ArrowPathIcon className="w-5 h-5 text-blue-600 animate-spin" />}
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isAvailable ? 'Available' : 'Unavailable'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ProviderAvailabilityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
    reset,
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      isAvailable: true,
      workingHours: DAYS.map((day) => ({
        day: day.value as any,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      })),
    },
  });

  // Load provider data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const profile = await getProviderProfile();
        setProvider(profile);
        setIsAvailable(profile.isAvailable);

        // Populate working hours
        if (profile.workingHours) {
          const hours = DAYS.map((day) => {
            const existing = profile.workingHours?.[day.value];
            return {
              day: day.value as any,
              startTime: existing?.start || '09:00',
              endTime: existing?.end || '17:00',
              isAvailable: !!existing,
            };
          });
          reset({
            isAvailable: profile.isAvailable,
            workingHours: hours,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load availability data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [reset]);

  // Handle availability toggle
  const handleToggle = async (value: boolean) => {
    setToggling(true);
    setError(null);
    try {
      const updated = await updateAvailability(value);
      setIsAvailable(updated.isAvailable);
      setValue('isAvailable', updated.isAvailable);
      setSuccess(`Availability updated to ${updated.isAvailable ? 'Available' : 'Unavailable'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update availability');
    } finally {
      setToggling(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: AvailabilityFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert working hours array to object
      const workingHoursObj: Record<string, { start: string; end: string }> = {};
      data.workingHours.forEach((item) => {
        if (item.isAvailable) {
          workingHoursObj[item.day] = {
            start: item.startTime,
            end: item.endTime,
          };
        }
      });

      // Update working hours
      await updateWorkingHours(workingHoursObj);

      // Also update availability if changed
      if (data.isAvailable !== isAvailable) {
        await updateAvailability(data.isAvailable);
        setIsAvailable(data.isAvailable);
      }

      setSuccess('Availability settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);

      // Reload data
      const profile = await getProviderProfile();
      setProvider(profile);
      setIsAvailable(profile.isAvailable);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  // Working hours watched value
  const workingHours = watch('workingHours');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="mt-2 text-gray-500">Loading availability settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Availability</h1>
            <p className="text-gray-600 mt-0.5">Manage your working hours and availability</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/provider"
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 hover:text-red-900"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Availability Toggle */}
        <AvailabilityToggle
          isAvailable={isAvailable}
          onChange={handleToggle}
          loading={toggling}
        />

        {/* Working Hours Form */}
        <div className="mt-6 bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">Weekly Schedule</h3>
              <p className="text-sm text-gray-500">Set your working hours for each day</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const allOpen = workingHours.every((h) => h.isAvailable);
                workingHours.forEach((_, index) => {
                  setValue(`workingHours.${index}.isAvailable`, !allOpen);
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {workingHours.every((h) => h.isAvailable) ? 'Close All' : 'Open All'}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {DAYS.map((day, index) => (
              <DayScheduleRow
                key={day.value}
                day={day}
                index={index}
                register={register}
                remove={() => {}}
                errors={errors}
                watch={watch}
              />
            ))}

            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SaveIcon className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const defaultHours = DAYS.map((day) => ({
                    day: day.value as any,
                    startTime: '09:00',
                    endTime: '17:00',
                    isAvailable: true,
                  }));
                  reset({ isAvailable, workingHours: defaultHours });
                }}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Current Status</p>
                <p className={`text-sm ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {isAvailable ? 'Accepting bookings' : 'Not accepting bookings'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <ClockIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Working Days</p>
                <p className="text-sm text-gray-600">
                  {workingHours.filter((h) => h.isAvailable).length} days open
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BriefcaseIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Response Time</p>
                <p className="text-sm text-gray-600">
                  {provider?.responseTime ? `${provider.responseTime} min` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
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