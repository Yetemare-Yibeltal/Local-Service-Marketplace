'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// SCHEMA
// ============================================================

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};:'",.<>?/]/, 'Password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reset password');
    }

    const result = await response.json();
    return {
      success: true,
      message: result.data?.message || 'Password reset successfully',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
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
      <p className="text-xs text-gray-400 mt-1">
        Password must have at least 8 characters, uppercase, lowercase, number, and special character.
      </p>
    </div>
  );
}

/**
 * Token Validation Component (client-side only)
 */
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        setIsValidatingToken(false);
        return;
      }

      try {
        // Validate token by calling the API
        // If the API returns 400, the token is invalid
        const response = await fetch(`${API_URL}/auth/validate-reset-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError('The password reset link is invalid or has expired.');
        }
      } catch (error) {
        setTokenValid(false);
        setError('Unable to validate reset token. Please try again.');
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('No reset token provided');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await resetPassword(token, data.password);
      setSuccess(true);
      setSuccessMessage(result.message);

      // Redirect to login after 4 seconds
      setTimeout(() => {
        router.push('/login');
      }, 4000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidatingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="flex flex-col items-center">
              <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">Validating reset link...</h3>
              <p className="text-sm text-gray-500 mt-1">Please wait while we verify your request.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-card p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Invalid Reset Link</h3>
              <p className="text-gray-600 mb-6">{error || 'The password reset link is invalid or has expired.'}</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">🏪</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Market<span className="text-blue-600">Place</span></span>
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create New Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <span>{successMessage}</span>
                <p className="text-sm text-green-600 mt-1">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && !success && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Token Info */}
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <KeyIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                Resetting password for account
              </span>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Create a strong password"
                  disabled={success}
                  className={`block w-full pl-10 pr-10 py-2.5 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <PasswordStrength password={password || ''} />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm your password"
                  disabled={success}
                  className={`block w-full pl-10 pr-10 py-2.5 border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Resetting password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE WITH SUSPENSE
// ============================================================

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}