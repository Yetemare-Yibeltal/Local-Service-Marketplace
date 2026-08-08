'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  ClockIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useDebounce } from '@/hooks/useDebounce';

// ============================================================
// TYPES
// ============================================================

interface Category {
  id: string;
  name: string;
  nameAm: string | null;
  slug: string;
  icon: string | null;
  image: string | null;
}

interface Provider {
  id: string;
  businessName: string;
  businessLogo: string | null;
  category: string;
  averageRating: number;
  totalReviews: number;
  hourlyRate: number | null;
  isVerified: boolean;
  locationLat: number;
  locationLng: number;
  address: string;
  city: string;
  distance?: number;
}

// ============================================================
// API SERVICE FUNCTIONS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API_URL}/categories/active`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

async function fetchTopProviders(): Promise<Provider[]> {
  try {
    const response = await fetch(`${API_URL}/providers/top-rated?limit=6`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!response.ok) {
      throw new Error('Failed to fetch top providers');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching top providers:', error);
    return [];
  }
}

async function searchProviders(query: string, category?: string): Promise<Provider[]> {
  try {
    // Default location (Addis Ababa)
    const lat = 9.03;
    const lng = 38.74;

    const response = await fetch(`${API_URL}/providers/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lat,
        lng,
        radius: 20,
        query: query || undefined,
        category,
        isAvailable: true,
        isVerified: true,
        limit: 10,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to search providers');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error searching providers:', error);
    return [];
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Hero Section Component
 */
function HeroSection({ onSearch }: { onSearch: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      onSearch(searchQuery);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative container-custom py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Find Trusted Professionals
            <br />
            <span className="text-blue-200">In Your Neighborhood</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with verified plumbers, electricians, tutors, cleaners, and more. Book services with confidence.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-xl shadow-lg p-2">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 bg-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-blue-200 text-sm">Trusted Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">4.8</div>
              <div className="text-blue-200 text-sm">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">10k+</div>
              <div className="text-blue-200 text-sm">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-blue-200 text-sm">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Category Grid Component
 */
function CategoryGrid({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const handleCategoryClick = (categoryName: string) => {
    router.push(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading categories...</p>
      </div>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <p className="text-gray-600 mt-1">
              Find the right professional for your needs
            </p>
          </div>
          <Link
            href="/search"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center mb-3 transition-colors duration-200">
                {category.icon ? (
                  <span className="text-2xl">{category.icon}</span>
                ) : (
                  <BriefcaseIcon className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-900 text-center line-clamp-1">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Provider Card Component
 */
function ProviderCard({ provider }: { provider: Provider }) {
  return (
    <Link
      href={`/provider/${provider.id}`}
      className="block bg-white rounded-xl shadow-card hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {provider.businessLogo ? (
              <Image
                src={provider.businessLogo}
                alt={provider.businessName}
                width={56}
                height={56}
                className="rounded-full object-cover w-14 h-14"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {provider.businessName.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 truncate">
                {provider.businessName}
              </h3>
              {provider.isVerified && (
                <CheckBadgeIcon className="w-5 h-5 text-blue-500 flex-shrink-0" title="Verified Provider" />
              )}
            </div>
            <p className="text-sm text-gray-500">{provider.category}</p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <StarSolidIcon className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-gray-900">
                  {provider.averageRating.toFixed(1)}
                </span>
                <span className="text-xs text-gray-400">
                  ({provider.totalReviews})
                </span>
              </div>
              {provider.hourlyRate && (
                <span className="text-sm text-gray-600">
                  ETB {provider.hourlyRate}/hr
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * Top Providers Section
 */
function TopProvidersSection({ providers }: { providers: Provider[] }) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Top Rated Professionals
            </h2>
            <p className="text-gray-600 mt-1">
              Highly rated providers trusted by our community
            </p>
          </div>
          <Link
            href="/search"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            View all
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * How It Works Section
 */
function HowItWorksSection() {
  const steps = [
    {
      icon: SearchIcon,
      title: 'Search',
      description: 'Find the service you need in your area',
    },
    {
      icon: CompareIcon,
      title: 'Compare',
      description: 'Compare providers, ratings, and prices',
    },
    {
      icon: BookIcon,
      title: 'Book',
      description: 'Book your service with confidence',
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-gray-600 mt-2">
            Three simple steps to get the service you need
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-sm font-semibold text-blue-600 mb-1">
                Step {index + 1}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Icon components for How It Works
function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function CompareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories and providers on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesData, providersData] = await Promise.all([
          fetchCategories(),
          fetchTopProviders(),
        ]);
        setCategories(categoriesData);
        setProviders(providersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSearch = useCallback((query: string) => {
    // The search is handled by the hero section's form submission
    // which navigates to /search with the query
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <HeroSection onSearch={handleSearch} />
      <CategoryGrid categories={categories} />
      <TopProvidersSection providers={providers} />
      <HowItWorksSection />
    </main>
  );
}