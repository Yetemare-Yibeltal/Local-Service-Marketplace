'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  PhotoIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// TYPES
// ============================================================

interface Service {
  id: string;
  providerId: string;
  title: string;
  description: string;
  priceType: 'FIXED' | 'HOURLY';
  price: number;
  discountPrice: number | null;
  estimatedDurationMinutes: number | null;
  isActive: boolean;
  images: string[];
  category: string;
  subCategory: string | null;
  createdAt: string;
  updatedAt: string;
  bookingsCount?: number;
  revenue?: number;
}

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
}

interface ApiResponse {
  data: Service[];
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
// SCHEMA
// ============================================================

const serviceSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  priceType: z.enum(['FIXED', 'HOURLY']),
  price: z.number()
    .min(0, 'Price cannot be negative'),
  discountPrice: z.number()
    .min(0, 'Discount price cannot be negative')
    .optional()
    .nullable(),
  estimatedDurationMinutes: z.number()
    .int()
    .min(5, 'Duration must be at least 5 minutes')
    .max(1440, 'Duration cannot exceed 1440 minutes (24 hours)')
    .optional()
    .nullable(),
  category: z.string()
    .min(1, 'Category is required'),
  subCategory: z.string()
    .optional()
    .nullable(),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

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

async function getProviderServices(page: number = 1, limit: number = 10): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  return await fetchWithAuth(`/providers/services?${params.toString()}`);
}

async function createService(data: FormData): Promise<Service> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/providers/services`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create service');
  }

  const result = await response.json();
  return result.data;
}

async function updateService(serviceId: string, data: FormData): Promise<Service> {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_URL}/providers/services/${serviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update service');
  }

  const result = await response.json();
  return result.data;
}

async function deleteService(serviceId: string): Promise<void> {
  await fetchWithAuth(`/providers/services/${serviceId}`, {
    method: 'DELETE',
  });
}

async function toggleServiceStatus(serviceId: string, isActive: boolean): Promise<Service> {
  return await fetchWithAuth(`/providers/services/${serviceId}/toggle-status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
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
 * Status Badge Component
 */
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
      isActive
        ? 'bg-green-100 text-green-800'
        : 'bg-gray-100 text-gray-500'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

/**
 * Service Card Component
 */
function ServiceCard({
  service,
  onEdit,
  onDelete,
  onToggle,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onToggle: (service: Service) => void;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(service);
    } catch (error) {
      console.error('Error toggling service:', error);
    } finally {
      setToggling(false);
    }
  };

  const priceDisplay = service.priceType === 'HOURLY'
    ? `ETB ${service.price}/hr`
    : `ETB ${service.price}`;

  const duration = service.estimatedDurationMinutes
    ? `${service.estimatedDurationMinutes} min`
    : null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 group">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Image */}
        <div className="flex-shrink-0">
          {service.images && service.images.length > 0 ? (
            <Image
              src={service.images[0]}
              alt={service.title}
              width={80}
              height={80}
              className="rounded-lg object-cover w-20 h-20"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{service.title}</h3>
            <StatusBadge isActive={service.isActive} />
          </div>
          <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
            <span className="font-medium text-blue-600">{priceDisplay}</span>
            {service.discountPrice && (
              <span className="text-sm text-gray-400 line-through">
                ETB {service.discountPrice}
              </span>
            )}
            {duration && (
              <span className="flex items-center gap-1 text-gray-500">
                <ClockIcon className="w-4 h-4" />
                {duration}
              </span>
            )}
            <span className="text-gray-400 text-xs">{service.category}</span>
            {service.bookingsCount !== undefined && (
              <span className="text-gray-400 text-xs">
                {service.bookingsCount} bookings
              </span>
            )}
            {service.revenue !== undefined && service.revenue > 0 && (
              <span className="text-green-600 text-xs">
                ETB {service.revenue.toFixed(2)} earned
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(service)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Service"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
            title={service.isActive ? 'Deactivate' : 'Activate'}
          >
            {toggling ? (
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
            ) : service.isActive ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onDelete(service)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Service"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Service Form Modal Component
 */
function ServiceFormModal({
  isOpen,
  onClose,
  service,
  onSubmit,
  categories,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSubmit: (data: FormData) => Promise<void>;
  categories: Category[];
  loading: boolean;
}) {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!service;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setValue,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: service?.title || '',
      description: service?.description || '',
      priceType: (service?.priceType as 'FIXED' | 'HOURLY') || 'FIXED',
      price: service?.price || 0,
      discountPrice: service?.discountPrice || null,
      estimatedDurationMinutes: service?.estimatedDurationMinutes || null,
      category: service?.category || '',
      subCategory: service?.subCategory || null,
    },
  });

  // Reset form when service changes or modal opens
  useEffect(() => {
    if (isOpen && service) {
      reset({
        title: service.title,
        description: service.description,
        priceType: service.priceType,
        price: service.price,
        discountPrice: service.discountPrice,
        estimatedDurationMinutes: service.estimatedDurationMinutes,
        category: service.category,
        subCategory: service.subCategory,
      });
      // Reset image previews
      setImagePreviews(service.images || []);
      setImageFiles([]);
    } else if (isOpen && !service) {
      reset({
        title: '',
        description: '',
        priceType: 'FIXED',
        price: 0,
        discountPrice: null,
        estimatedDurationMinutes: null,
        category: '',
        subCategory: null,
      });
      setImagePreviews([]);
      setImageFiles([]);
    }
  }, [isOpen, service, reset]);

  const priceType = watch('priceType');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== newFiles.length) {
      alert('Some files were skipped. Please use images under 5MB.');
    }

    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onFormSubmit = async (data: ServiceFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('priceType', data.priceType);
    formData.append('price', data.price.toString());
    if (data.discountPrice) formData.append('discountPrice', data.discountPrice.toString());
    if (data.estimatedDurationMinutes) formData.append('estimatedDurationMinutes', data.estimatedDurationMinutes.toString());
    formData.append('category', data.category);
    if (data.subCategory) formData.append('subCategory', data.subCategory);
    imageFiles.forEach((file) => {
      formData.append('images', file);
    });

    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="e.g., Fix Leaky Pipe"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Describe your service in detail..."
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
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
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
            </div>

            {/* Sub-category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub-Category (Optional)
              </label>
              <input
                type="text"
                {...register('subCategory')}
                placeholder="e.g., Residential Plumbing"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  priceType === 'FIXED'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    value="FIXED"
                    {...register('priceType')}
                    className="sr-only"
                  />
                  <TagIcon className={`w-5 h-5 ${priceType === 'FIXED' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${priceType === 'FIXED' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Fixed Price
                  </span>
                </label>
                <label className={`flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                  priceType === 'HOURLY'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}>
                  <input
                    type="radio"
                    value="HOURLY"
                    {...register('priceType')}
                    className="sr-only"
                  />
                  <ClockIcon className={`w-5 h-5 ${priceType === 'HOURLY' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`font-medium ${priceType === 'HOURLY' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Hourly Rate
                  </span>
                </label>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (ETB) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('price', { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
            </div>

            {/* Discount Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Price (Optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('discountPrice', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">Leave empty for no discount</p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (minutes) (Optional)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                {...register('estimatedDurationMinutes', { valueAsNumber: true })}
                placeholder="e.g., 120"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.estimatedDurationMinutes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.estimatedDurationMinutes && (
                <p className="mt-1 text-sm text-red-600">{errors.estimatedDurationMinutes.message}</p>
              )}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Images (Optional)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload images</p>
                <p className="text-xs text-gray-400">Max 5 images, up to 5MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Saving...' : (isEditing ? 'Update Service' : 'Create Service')}
              </button>
            </div>
          </form>
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
  service,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  service: Service | null;
  loading: boolean;
}) {
  if (!isOpen || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Delete Service</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{service.title}</strong>? This action cannot be undone.
        </p>
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

export default function ProviderServicesPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
    loadCategories();
  }, []);

  // Load services
  const loadServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProviderServices(page, limit);
      setServices(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle create
  const handleCreate = async (formData: FormData) => {
    setModalLoading(true);
    try {
      await createService(formData);
      setShowCreateModal(false);
      await loadServices();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create service');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (service: Service) => {
    setSelectedService(service);
    setShowEditModal(true);
  };

  const handleUpdate = async (formData: FormData) => {
    if (!selectedService) return;
    setModalLoading(true);
    try {
      await updateService(selectedService.id, formData);
      setShowEditModal(false);
      setSelectedService(null);
      await loadServices();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update service');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle delete
  const handleDelete = (service: Service) => {
    setSelectedService(service);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;
    setModalLoading(true);
    try {
      await deleteService(selectedService.id);
      setShowDeleteModal(false);
      setSelectedService(null);
      await loadServices();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete service');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle toggle status
  const handleToggle = async (service: Service) => {
    try {
      await toggleServiceStatus(service.id, !service.isActive);
      await loadServices();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to toggle service status');
    }
  };

  // Refresh
  const handleRefresh = () => {
    loadServices();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-0.5">
              Manage your service listings
              {totalItems > 0 && ` · ${totalItems} service${totalItems !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Service
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-gray-500">Loading your services...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Services List */}
        {!loading && !error && (
          <>
            {services.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  You haven't added any services. Start by creating your first service listing.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Service
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
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
          </>
        )}
      </div>

      {/* Create Modal */}
      <ServiceFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        service={null}
        onSubmit={handleCreate}
        categories={categories}
        loading={modalLoading}
      />

      {/* Edit Modal */}
      <ServiceFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
        onSubmit={handleUpdate}
        categories={categories}
        loading={modalLoading}
      />

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedService(null);
        }}
        onConfirm={handleConfirmDelete}
        service={selectedService}
        loading={modalLoading}
      />
    </div>
  );
}