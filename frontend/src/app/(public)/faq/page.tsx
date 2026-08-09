'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isPublished: boolean;
}

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

// ============================================================
// API CONSTANTS
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// ============================================================
// API FUNCTIONS
// ============================================================

async function fetchFAQItems(): Promise<FAQItem[]> {
  try {
    const response = await fetch(`${API_URL}/faq?isPublished=true`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch FAQ items');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    return [];
  }
}

async function fetchFAQCategories(): Promise<FAQCategory[]> {
  try {
    const response = await fetch(`${API_URL}/faq/categories`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch FAQ categories');
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    return [];
  }
}

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Category Icon Component
 */
function CategoryIcon({ categoryName }: { categoryName: string }) {
  const icons: Record<string, React.ReactNode> = {
    'Getting Started': <UserGroupIcon className="w-6 h-6" />,
    'Booking Process': <CalendarIcon className="w-6 h-6" />,
    'Payments': <CurrencyDollarIcon className="w-6 h-6" />,
    'Provider Verification': <ShieldCheckIcon className="w-6 h-6" />,
    'Disputes': <ScaleIcon className="w-6 h-6" />,
    'Privacy': <LockClosedIcon className="w-6 h-6" />,
    'Technical': <Cog6ToothIcon className="w-6 h-6" />,
    'default': <QuestionMarkCircleIcon className="w-6 h-6" />,
  };

  // Try exact match, then partial match, else default
  const iconKey = Object.keys(icons).find(key => categoryName?.includes(key)) || 'default';
  return icons[iconKey] || icons.default;
}

/**
 * FAQ Item Component
 */
function FAQItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0 bg-gray-50 border-t border-gray-100">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {item.answer}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Category Section Component
 */
function CategorySection({
  category,
  items,
  searchQuery,
  openItems,
  onToggle,
}: {
  category: FAQCategory;
  items: FAQItem[];
  searchQuery: string;
  openItems: Set<string>;
  onToggle: (id: string) => void;
}) {
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  if (filteredItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <CategoryIcon categoryName={category.name} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
          <p className="text-sm text-gray-500">{category.description}</p>
        </div>
        <span className="ml-auto text-sm text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
          {filteredItems.length}
        </span>
      </div>

      <div className="space-y-3 pl-2">
        {filteredItems.map((item) => (
          <FAQItem
            key={item.id}
            item={item}
            isOpen={openItems.has(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Search Bar Component
 */
function SearchBar({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for answers..."
        className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white shadow-sm"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

/**
 * Contact Support Card Component
 */
function ContactSupportCard() {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-center text-white">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
        <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">Still Need Help?</h3>
      <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
        Our support team is here to assist you with any questions or concerns.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <a
          href="/contact"
          className="px-6 py-2.5 bg-white text-blue-700 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
        >
          <EnvelopeIcon className="w-4 h-4" />
          Contact Us
        </a>
        <a
          href="tel:+251911234567"
          className="px-6 py-2.5 bg-blue-700 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <PhoneIcon className="w-4 h-4" />
          Call Us
        </a>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function FAQPage() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Load FAQ data
  useEffect(() => {
    async function loadFAQ() {
      setLoading(true);
      try {
        const [itemsData, categoriesData] = await Promise.all([
          fetchFAQItems(),
          fetchFAQCategories(),
        ]);
        setFaqItems(itemsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading FAQ:', error);
      } finally {
        setLoading(false);
      }
    }

    loadFAQ();
  }, []);

  // Toggle FAQ item
  const toggleItem = useCallback((id: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Open all matching items when searching
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const matchingIds = faqItems
        .filter(
          (item) =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((item) => item.id);
      setOpenItems(new Set(matchingIds));
    } else {
      setOpenItems(new Set());
    }
  }, [searchQuery, faqItems]);

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (!searchQuery && !activeCategory) return faqItems;
    return faqItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !activeCategory || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [faqItems, searchQuery, activeCategory]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, FAQItem[]>);
  }, [filteredItems]);

  // Get category details
  const getCategoryDetails = useCallback(
    (categoryName: string) => {
      return categories.find((c) => c.name === categoryName) || {
        id: categoryName,
        name: categoryName,
        description: '',
        icon: 'default',
        count: 0,
      };
    },
    [categories]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setOpenItems(new Set());
  }, []);

  // Set category filter
  const setCategory = useCallback((category: string | null) => {
    setActiveCategory(category);
    setOpenItems(new Set());
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FAQ...</p>
        </div>
      </div>
    );
  }

  const totalItems = faqItems.length;
  const totalCategories = categories.length;
  const filteredCount = filteredItems.length;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm text-blue-700 mb-4">
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span>Help Center</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about Marketplace. Search by keyword or browse by category.
          </p>
          {!loading && (
            <p className="text-sm text-gray-400 mt-2">
              {totalItems} answers across {totalCategories} categories
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={clearSearch}
          />
        </div>

        {/* Category Navigation */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          <button
            onClick={() => setCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              !activeCategory
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCategory(category.name)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="w-4 h-4">
                <CategoryIcon categoryName={category.name} />
              </span>
              {category.name}
              <span className="text-xs opacity-70">({category.count})</span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="text-center text-sm text-gray-500 mb-4">
            {filteredCount} {filteredCount === 1 ? 'result' : 'results'} found for "{searchQuery}"
          </div>
        )}

        {/* FAQ Content */}
        {filteredCount === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-card">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We couldn't find any answers matching your search. Try different keywords or browse categories.
            </p>
            <button
              onClick={clearSearch}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(itemsByCategory).map(([categoryName, items]) => {
              const category = getCategoryDetails(categoryName);
              return (
                <CategorySection
                  key={categoryName}
                  category={category}
                  items={items}
                  searchQuery={searchQuery}
                  openItems={openItems}
                  onToggle={toggleItem}
                />
              );
            })}
          </div>
        )}

        {/* Contact Support Section */}
        <div className="mt-12">
          <ContactSupportCard />
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Missing Icons (used above)
// ============================================================

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function ScaleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L2.25 4.97z" />
    </svg>
  );
}

function LockClosedIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function Cog6ToothIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

// ============================================================
// EXPORTS
// ============================================================

export default FAQPage;