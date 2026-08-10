'use client';

import React, { useState, useEffect, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  dismissible?: boolean;
}

export interface ToastOptions {
  duration?: number;
  dismissible?: boolean;
}

export interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
  showSuccess: (message: string, options?: ToastOptions) => string;
  showError: (message: string, options?: ToastOptions) => string;
  showWarning: (message: string, options?: ToastOptions) => string;
  showInfo: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// ============================================================
// CONTEXT
// ============================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// ============================================================
// TOAST CONTAINER COMPONENT
// ============================================================

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in-right ${getBgColor(toast.type)}`}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className={`flex-1 text-sm font-medium ${getTextColor(toast.type)}`}>
            {toast.message}
          </div>
          {toast.dismissible && (
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 transition-colors"
              aria-label="Dismiss notification"
            >
              <XMarkIcon className={`w-4 h-4 ${getTextColor(toast.type)}`} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// PROVIDER COMPONENT
// ============================================================

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const generateId = useCallback(() => {
    setIdCounter((prev) => prev + 1);
    return `toast-${Date.now()}-${idCounter}`;
  }, [idCounter]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((
    message: string,
    type: ToastType = 'info',
    options: ToastOptions = {}
  ): string => {
    const id = generateId();
    const duration = options.duration ?? 5000;
    const dismissible = options.dismissible ?? true;

    setToasts((prev) => [...prev, { id, type, message, duration, dismissible }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [generateId, removeToast]);

  const showSuccess = useCallback((message: string, options?: ToastOptions): string => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message: string, options?: ToastOptions): string => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message: string, options?: ToastOptions): string => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message: string, options?: ToastOptions): string => {
    return showToast(message, 'info', options);
  }, [showToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value = useMemo<ToastContextType>(() => ({
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  }), [
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    clearAll,
  ]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default useToast;