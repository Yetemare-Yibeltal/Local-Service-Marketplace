'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ============================================================
// SCHEMA
// ============================================================

const contactSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  phone: z.string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return /^(\+251|0)?[9][0-9]{8}$/.test(val);
      },
      { message: 'Please enter a valid Ethiopian phone number (e.g., 0912345678)' }
    ),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function submitContactForm(data: ContactFormData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || '',
        subject: data.subject.trim(),
        message: data.message.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to send message');
    }

    const result = await response.json();
    return {
      success: true,
      message: result.data?.message || 'Thank you for your message. We will get back to you soon.',
    };
  } catch (error) {
    console.error('Contact form error:', error);
    throw error;
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Contact Info Card Component
 */
function ContactInfoCard({
  icon,
  title,
  details,
}: {
  icon: React.ReactNode;
  title: string;
  details: string[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 transition-shadow hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">{icon}</div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          {details.map((detail, index) => (
            <p key={index} className="text-sm text-gray-600 mt-0.5">{detail}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitContactForm(data);
      setSuccess(true);
      setSuccessMessage(result.message);
      reset();

      // Auto-clear success after 10 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 10000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Get in Touch</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have a question, suggestion, or feedback? We would love to hear from you.
            Our team is here to help.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <ContactInfoCard
            icon={<EnvelopeIcon className="w-6 h-6 text-blue-600" />}
            title="Email Us"
            details={['support@marketplace.com', 'We respond within 24 hours']}
          />
          <ContactInfoCard
            icon={<PhoneIcon className="w-6 h-6 text-blue-600" />}
            title="Call Us"
            details={['+251 911 234 567', 'Monday to Friday, 8:00 AM - 6:00 PM']}
          />
          <ContactInfoCard
            icon={<MapPinIcon className="w-6 h-6 text-blue-600" />}
            title="Visit Us"
            details={['Bole, Rwanda Street', 'Addis Ababa, Ethiopia']}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

              {/* Success Message */}
              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg flex items-start gap-3">
                  <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Message Sent!</p>
                    <p className="text-sm text-green-600 mt-0.5">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      {...register('fullName')}
                      placeholder="Your full name"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.fullName ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="your@email.com"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      {...register('phone')}
                      placeholder="0912345678"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">We will only use this to contact you if needed</p>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="subject"
                      type="text"
                      {...register('subject')}
                      placeholder="What is your message about?"
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.subject ? 'border-red-500' : 'border-gray-300'
                      } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                  </div>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    placeholder="Describe your question, feedback, or concern in detail..."
                    rows={6}
                    className={`block w-full px-4 py-2.5 border ${
                      errors.message ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none`}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Minimum 10 characters. Maximum 5,000 characters.
                  </p>
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
                      Sending...
                    </>
                  ) : (
                    <>
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-card p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Links</h3>

              <div className="space-y-4">
                <Link
                  href="/about"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <span>About Us</span>
                </Link>

                <Link
                  href="/faq"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <span>FAQ</span>
                </Link>

                <Link
                  href="/terms"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <DocumentTextIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <span>Terms of Service</span>
                </Link>

                <Link
                  href="/privacy"
                  className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                    <GlobeAltIcon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <span>Privacy Policy</span>
                </Link>

                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href="/register"
                    className="block w-full text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Join Marketplace
                  </Link>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-2xl shadow-card p-6 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <ClockIcon className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Business Hours</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Monday - Friday</span>
                  <span className="text-gray-900 font-medium">8:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Saturday</span>
                  <span className="text-gray-900 font-medium">9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sunday</span>
                  <span className="text-gray-400">Closed</span>
                </div>
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-green-600 font-medium">Within 24 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}