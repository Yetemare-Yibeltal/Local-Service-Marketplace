'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  TagIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  children?: Category[];
  childCount?: number;
}

interface ApiResponse {
  data: Category[];
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

const categorySchema = z.object({
  name: z.string()
    .min(2, 'Category name must be at least 2 characters')
    .max(50, 'Category name must not exceed 50 characters'),
  nameAm: z.string()
    .max(50, 'Amharic name must not exceed 50 characters')
    .optional()
    .nullable(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must not exceed 50 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .nullable(),
  icon: z.string()
    .max(50, 'Icon name must not exceed 50 characters')
    .optional()
    .nullable(),
  image: z.string()
    .url('Image must be a valid URL')
    .optional()
    .nullable(),
  parentId: z.string()
    .uuid('Invalid parent ID')
    .optional()
    .nullable(),
  displayOrder: z.number()
    .int()
    .min(0, 'Display order cannot be negative')
    .default(0),
  isActive: z.boolean().default(true),
});

type CategoryFormData = z.infer<typeof categorySchema>;

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

async function getCategories(
  page: number = 1,
  limit: number = 20,
  search?: string,
  isActive?: boolean,
  parentId?: string | null
): Promise<ApiResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (isActive !== undefined) params.append('isActive', isActive.toString());
  if (parentId !== undefined) params.append('parentId', parentId || '');

  return await fetchWithAuth(`/categories?${params.toString()}`);
}

async function getCategoryTree(): Promise<Category[]> {
  return await fetchWithAuth('/categories/tree');
}

async function getCategoryById(id: string): Promise<Category> {
  return await fetchWithAuth(`/categories/${id}`);
}

async function createCategory(data: CategoryFormData): Promise<Category> {
  return await fetchWithAuth('/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

async function updateCategory(id: string, data: Partial<CategoryFormData>): Promise<Category> {
  return await fetchWithAuth(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

async function deleteCategory(id: string, permanent: boolean = false): Promise<void> {
  const endpoint = permanent ? `/categories/${id}/permanent` : `/categories/${id}`;
  await fetchWithAuth(endpoint, {
    method: 'DELETE',
  });
}

async function bulkReorderCategories(updates: { id: string; displayOrder: number }[]): Promise<Category[]> {
  return await fetchWithAuth('/categories/bulk/order', {
    method: 'PUT',
    body: JSON.stringify({ categories: updates }),
  });
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
        : 'bg-red-100 text-red-800'
    }`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

/**
 * Category Row Component
 */
function CategoryRow({
  category,
  level = 0,
  onEdit,
  onDelete,
  onToggle,
  onViewChildren,
  hasChildren,
  isExpanded,
}: {
  category: Category;
  level?: number;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggle: (category: Category) => void;
  onViewChildren: (category: Category) => void;
  hasChildren: boolean;
  isExpanded: boolean;
}) {
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      await onToggle(category);
    } catch (error) {
      console.error('Error toggling category:', error);
    } finally {
      setToggling(false);
    }
  };

  const createdAt = new Date(category.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const paddingLeft = level * 24 + 8;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors px-2 rounded-lg">
      <div className="flex items-center gap-3 min-w-0 flex-1" style={{ paddingLeft: paddingLeft }}>
        <button
          onClick={() => onViewChildren(category)}
          className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded transition-colors"
          title={hasChildren ? (isExpanded ? 'Collapse' : 'Expand') : 'No children'}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </button>
        <div className="flex-shrink-0">
          {category.icon ? (
            <span className="text-lg">{category.icon}</span>
          ) : (
            <FolderIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-gray-900 truncate">{category.name}</span>
            {category.nameAm && (
              <span className="text-xs text-gray-400">({category.nameAm})</span>
            )}
            <StatusBadge isActive={category.isActive} />
            <span className="text-xs text-gray-400">#{category.displayOrder}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5" />
              {category.slug}
            </span>
            {category.parent && (
              <span className="flex items-center gap-1">
                <FolderOpenIcon className="w-3.5 h-3.5" />
                {category.parent.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="w-3.5 h-3.5" />
              {category.description ? 'Has description' : 'No description'}
            </span>
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {createdAt}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-4 flex-shrink-0">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Edit Category"
        >
          <PencilIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
          title={category.isActive ? 'Deactivate' : 'Activate'}
        >
          {toggling ? (
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
          ) : category.isActive ? (
            <EyeSlashIcon className="w-4 h-4" />
          ) : (
            <EyeIcon className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Category"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Category Form Modal
 */
function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSubmit,
  loading,
  parentCategories,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  loading: boolean;
  parentCategories: Category[];
  title: string;
}) {
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name || '',
      nameAm: category?.nameAm || '',
      slug: category?.slug || '',
      description: category?.description || '',
      icon: category?.icon || '',
      image: category?.image || '',
      parentId: category?.parentId || null,
      displayOrder: category?.displayOrder || 0,
      isActive: category?.isActive !== undefined ? category.isActive : true,
    },
  });

  const slugValue = watch('slug');
  const nameValue = watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!isEditing && nameValue && !slugValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setValue('slug', generatedSlug);
    }
  }, [nameValue, slugValue, isEditing, setValue]);

  useEffect(() => {
    if (isOpen && category) {
      reset({
        name: category.name,
        nameAm: category.nameAm || '',
        slug: category.slug,
        description: category.description || '',
        icon: category.icon || '',
        image: category.image || '',
        parentId: category.parentId || null,
        displayOrder: category.displayOrder || 0,
        isActive: category.isActive,
      });
    } else if (isOpen && !category) {
      reset({
        name: '',
        nameAm: '',
        slug: '',
        description: '',
        icon: '',
        image: '',
        parentId: null,
        displayOrder: 0,
        isActive: true,
      });
    }
  }, [isOpen, category, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g., Plumbing"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Amharic Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amharic Name (Optional)
              </label>
              <input
                type="text"
                {...register('nameAm')}
                placeholder="e.g., የቧንቧ ጥገና"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.nameAm && <p className="mt-1 text-sm text-red-600">{errors.nameAm.message}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('slug')}
                placeholder="e.g., plumbing"
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
              <p className="mt-1 text-xs text-gray-400">URL-friendly identifier. Auto-generated from name.</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Brief description of this category..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Category (Optional)
              </label>
              <select
                {...register('parentId')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None (Root Category)</option>
                {parentCategories
                  .filter((c) => !isEditing || c.id !== category?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              {errors.parentId && <p className="mt-1 text-sm text-red-600">{errors.parentId.message}</p>}
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                {...register('displayOrder', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.displayOrder && <p className="mt-1 text-sm text-red-600">{errors.displayOrder.message}</p>}
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Icon (Optional)
              </label>
              <input
                type="text"
                {...register('icon')}
                placeholder="e.g., fa-wrench"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">Font Awesome or emoji icon identifier</p>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (Optional)
              </label>
              <input
                type="url"
                {...register('image')}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>}
            </div>

            {/* Active Status */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <button
                  type="button"
                  onClick={() => setValue('isActive', !watch('isActive'))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    watch('isActive') ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      watch('isActive') ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
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
                {loading ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
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
  loading,
  category,
  hasChildren,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (permanent: boolean) => void;
  loading: boolean;
  category: Category | null;
  hasChildren: boolean;
}) {
  const [permanent, setPermanent] = useState(false);

  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-full">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Delete Category</h3>
        </div>
        <p className="text-gray-600 mb-2">
          Are you sure you want to delete <strong>{category.name}</strong>?
        </p>
        {hasChildren && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This category has children. They will be orphaned.
            </p>
          </div>
        )}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            Permanently delete (cannot be undone)
          </label>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(permanent)}
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<Category[]>([]);
  const [treeData, setTreeData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const debouncedSearch = useDebounce(searchTerm, 500);

  // Modals
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load categories
  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const response = await getCategories(
        page,
        limit,
        debouncedSearch || undefined,
        isActive
      );
      setCategories(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  const loadTreeData = useCallback(async () => {
    try {
      const data = await getCategoryTree();
      setTreeData(data);
    } catch (err) {
      console.error('Error loading category tree:', err);
    }
  }, []);

  const loadParentCategories = useCallback(async () => {
    try {
      const response = await getCategories(1, 100, undefined, true);
      setParentCategories(response.data);
    } catch (err) {
      console.error('Error loading parent categories:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadTreeData();
    loadParentCategories();
  }, [loadCategories, loadTreeData, loadParentCategories]);

  // Update URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (statusFilter) params.set('status', statusFilter);
    router.push(`/dashboard/admin/categories?${params.toString()}`);
  }, [searchTerm, statusFilter, router]);

  // Handlers
  const handleCreate = async (data: CategoryFormData) => {
    setModalLoading(true);
    try {
      await createCategory(data);
      setShowCreateModal(false);
      await Promise.all([loadCategories(), loadTreeData(), loadParentCategories()]);
    } catch (error) {
      alert('Failed to create category');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!selectedCategory) return;
    setModalLoading(true);
    try {
      await updateCategory(selectedCategory.id, data);
      setShowEditModal(false);
      setSelectedCategory(null);
      await Promise.all([loadCategories(), loadTreeData(), loadParentCategories()]);
    } catch (error) {
      alert('Failed to update category');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (permanent: boolean) => {
    if (!selectedCategory) return;
    setModalLoading(true);
    try {
      await deleteCategory(selectedCategory.id, permanent);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await Promise.all([loadCategories(), loadTreeData(), loadParentCategories()]);
    } catch (error) {
      alert('Failed to delete category');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggle = async (category: Category) => {
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      await Promise.all([loadCategories(), loadTreeData()]);
    } catch (error) {
      alert('Failed to toggle category status');
    }
  };

  const handleViewChildren = (category: Category) => {
    const key = category.id;
    if (expandedNodes.has(key)) {
      expandedNodes.delete(key);
    } else {
      expandedNodes.add(key);
    }
    setExpandedNodes(new Set(expandedNodes));
  };

  const hasChildren = (categoryId: string): boolean => {
    return treeData.some(c => c.parentId === categoryId);
  };

  const getChildren = (parentId: string, level: number = 0): React.ReactNode[] => {
    const children = treeData.filter(c => c.parentId === parentId);
    if (children.length === 0) return [];

    const result: React.ReactNode[] = [];
    children.sort((a, b) => a.displayOrder - b.displayOrder);

    children.forEach(child => {
      const isExpanded = expandedNodes.has(child.id);
      const hasChild = hasChildren(child.id);

      result.push(
        <CategoryRow
          key={child.id}
          category={child}
          level={level + 1}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onViewChildren={handleViewChildren}
          hasChildren={hasChild}
          isExpanded={isExpanded}
        />
      );

      if (isExpanded && hasChild) {
        result.push(...getChildren(child.id, level + 1));
      }
    });

    return result;
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
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
            <p className="text-gray-600 mt-0.5">
              {totalItems} categor{totalItems !== 1 ? 'ies' : 'y'} found
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white rounded-lg shadow-card p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tree
              </button>
            </div>
            <button
              onClick={() => {
                loadCategories();
                loadTreeData();
              }}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Refresh"
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, slug, or description..."
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
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {(searchTerm || statusFilter) && (
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
            <p className="mt-2 text-gray-500">Loading categories...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Categories List */}
        {!loading && !error && (
          <>
            {categories.length === 0 ? (
              <div className="bg-white rounded-xl shadow-card p-12 text-center">
                <div className="text-6xl mb-4">📂</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No categories found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {searchTerm || statusFilter
                    ? 'No categories match your current filters. Try adjusting your search.'
                    : 'Start by creating your first category.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setShowCreateModal(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Category
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-6">Category</div>
                    <div className="col-span-3">Status</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {categories.map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggle={handleToggle}
                      onViewChildren={handleViewChildren}
                      hasChildren={hasChildren(category.id)}
                      isExpanded={expandedNodes.has(category.id)}
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
            ) : (
              // Tree View
              <div className="bg-white rounded-xl shadow-card overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Hierarchy
                    </span>
                    <span className="text-xs text-gray-400">
                      {treeData.filter(c => !c.parentId).length} root categories
                    </span>
                  </div>
                </div>
                <div className="px-6 divide-y divide-gray-100">
                  {treeData
                    .filter(c => !c.parentId)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .map((category) => {
                      const hasChild = hasChildren(category.id);
                      const isExpanded = expandedNodes.has(category.id);

                      return (
                        <React.Fragment key={category.id}>
                          <CategoryRow
                            category={category}
                            level={0}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggle={handleToggle}
                            onViewChildren={handleViewChildren}
                            hasChildren={hasChild}
                            isExpanded={isExpanded}
                          />
                          {isExpanded && hasChild && getChildren(category.id, 0)}
                        </React.Fragment>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Category Modal */}
      <CategoryFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        category={null}
        onSubmit={handleCreate}
        loading={modalLoading}
        parentCategories={parentCategories}
        title="Create New Category"
      />

      {/* Edit Category Modal */}
      <CategoryFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSubmit={handleUpdate}
        loading={modalLoading}
        parentCategories={parentCategories}
        title="Edit Category"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={modalLoading}
        category={selectedCategory}
        hasChildren={selectedCategory ? hasChildren(selectedCategory.id) : false}
      />
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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