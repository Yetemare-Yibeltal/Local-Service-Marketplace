import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  UserGroupIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  StarIcon,
  HeartIcon,
  GlobeAltIcon,
  ClockIcon,
  CheckBadgeIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  SparklesIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon,
  HandRaisedIcon,
  LightBulbIcon,
  PresentationChartLineIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface StatItem {
  id: string;
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

interface ValueItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string | null;
}

interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface ImpactItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================================
// DATA
// ============================================================

const stats: StatItem[] = [
  {
    id: 'stat-1',
    label: 'Registered Users',
    value: '12,000+',
    description: 'Customers and professionals across Ethiopia',
    icon: <UserGroupIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-2',
    label: 'Active Providers',
    value: '550+',
    description: 'Verified professionals in 25+ service categories',
    icon: <BriefcaseIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-3',
    label: 'Jobs Completed',
    value: '6,200+',
    description: 'Successful service deliveries across the country',
    icon: <CheckBadgeIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-4',
    label: 'Average Rating',
    value: '4.8 ★',
    description: 'Based on thousands of customer reviews',
    icon: <StarIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-5',
    label: 'Cities Covered',
    value: '12',
    description: 'Major cities across Ethiopia including Addis Ababa, Bahir Dar, Hawassa, and more',
    icon: <MapPinIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-6',
    label: 'Customer Satisfaction',
    value: '97%',
    description: 'Percentage of customers who would recommend our service',
    icon: <HeartIcon className="w-6 h-6 text-blue-600" />,
  },
];

const values: ValueItem[] = [
  {
    id: 'value-1',
    title: 'Trust is Everything',
    description: 'We believe that trust is the foundation of every successful service relationship. Every provider on our platform is thoroughly vetted, every review is verified, and every transaction is transparent. We work tirelessly to create a marketplace where customers and providers can connect with complete confidence.',
    icon: <ShieldCheckIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-2',
    title: 'Quality Without Compromise',
    description: 'We are committed to connecting customers with professionals who take pride in their work. We encourage continuous improvement through honest feedback and maintain rigorous standards for all providers who join our platform.',
    icon: <StarSolidIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-3',
    title: 'Community Empowerment',
    description: 'Ethiopia is a country rich with talent and opportunity. Our platform is designed to empower local professionals to grow their businesses, reach more customers, and build sustainable livelihoods. When providers succeed, communities thrive.',
    icon: <HeartIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-4',
    title: 'Innovation for Ethiopia',
    description: 'We are building solutions that are designed specifically for the Ethiopian market. From supporting Ethiopian phone numbers and local payment methods to understanding the unique needs of Ethiopian customers, our platform is proudly Ethiopian-made.',
    icon: <LightBulbIcon className="w-8 h-8 text-blue-600" />,
  },
];

const features: FeatureItem[] = [
  {
    id: 'feature-1',
    title: 'Verified Professionals',
    description: 'Every provider undergoes a verification process including identity verification, reference checks, and portfolio review. Our verified badge gives customers peace of mind that they are hiring a legitimate professional.',
    icon: <ShieldCheckIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'feature-2',
    title: 'Transparent Pricing',
    description: 'Providers list their rates upfront, so customers know exactly what to expect. No hidden fees, no surprise charges. When you book through our platform, you know the price before you confirm the service.',
    icon: <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'feature-3',
    title: 'Real Reviews',
    description: 'All reviews on our platform come from verified bookings. This means every review is from a real customer who has actually used the service. This creates an honest and reliable review system that benefits everyone.',
    icon: <StarIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'feature-4',
    title: 'Easy Booking Process',
    description: 'Our platform is designed to make booking a service as simple and straightforward as possible. From search to confirmation, the entire process takes just minutes. No complicated forms or confusing steps.',
    icon: <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600" />,
  },
];

const impactItems: ImpactItem[] = [
  {
    id: 'impact-1',
    title: 'Economic Empowerment',
    description: 'Our platform has helped over 550 service providers across Ethiopia build and grow their businesses. From plumbers and electricians in Addis Ababa to tutors and photographers in Bahir Dar, we are creating economic opportunities for skilled professionals.',
    icon: <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'impact-2',
    title: 'Access to Quality Services',
    description: 'We are making it easier for Ethiopian families and businesses to find reliable professionals. Whether you need a plumber for a repair, a tutor for your children, or an electrician for a renovation, we connect you with trusted professionals in your area.',
    icon: <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'impact-3',
    title: 'Building Trust',
    description: 'We are transforming the way Ethiopians hire services. By creating a transparent and accountable marketplace, we are building trust between customers and providers. This trust is the foundation of a stronger and more resilient service economy.',
    icon: <HandRaisedIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'impact-4',
    title: 'Supporting Local Talent',
    description: 'We believe in the talent and potential of Ethiopian professionals. Our platform showcases local expertise and connects talented individuals with opportunities that help them grow, learn, and succeed. Together, we are building a stronger future for Ethiopia.',
    icon: <AcademicCapIcon className="w-6 h-6 text-blue-600" />,
  },
];

const teamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Abebe Kebede',
    role: 'Co-Founder & Chief Executive Officer',
    bio: 'Abebe brings 12 years of experience in technology and business to Marketplace. A graduate of Addis Ababa University with a degree in Computer Science, he previously founded a successful tech startup before co-founding Marketplace. His vision is to make high-quality services accessible to every Ethiopian household.',
    image: null,
  },
  {
    id: 'member-2',
    name: 'Selam Tesfaye',
    role: 'Co-Founder & Chief Technology Officer',
    bio: 'Selam is a software engineer with a deep passion for using technology to solve local challenges. She holds a Master\'s degree in Software Engineering from Addis Ababa University. With over 8 years of experience building digital platforms, she leads our technology strategy and innovation.',
    image: null,
  },
  {
    id: 'member-3',
    name: 'Yonas Ayele',
    role: 'Head of Operations & Partnerships',
    bio: 'Yonas has extensive experience in operations management and business development across Ethiopia. He is responsible for building our network of providers, forging strategic partnerships, and ensuring that our platform delivers exceptional value to customers.',
    image: null,
  },
  {
    id: 'member-4',
    name: 'Meron Hailu',
    role: 'Head of Customer Experience',
    bio: 'Meron is dedicated to creating exceptional customer experiences. With a background in customer service and community engagement, she leads our efforts to build a responsive and supportive customer support system that is accessible to every user.',
    image: null,
  },
];

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Stats Section
 */
function StatsSection({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white rounded-2xl shadow-card p-6 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">{stat.icon}</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm font-medium text-gray-700">{stat.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.description}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Values Section
 */
function ValuesSection({ values }: { values: ValueItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {values.map((value) => (
        <div
          key={value.id}
          className="bg-white rounded-2xl shadow-card p-8 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 bg-blue-50 rounded-lg">{value.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{value.title}</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{value.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Features Section
 */
function FeaturesSection({ features }: { features: FeatureItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature) => (
        <div
          key={feature.id}
          className="bg-white rounded-xl shadow-card p-6 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">{feature.icon}</div>
            <div>
              <h4 className="font-semibold text-gray-900">{feature.title}</h4>
              <p className="text-gray-600 text-sm mt-1 leading-relaxed">{feature.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Impact Section
 */
function ImpactSection({ items }: { items: ImpactItem[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl shadow-card p-8 transition-shadow hover:shadow-lg border-l-4 border-blue-600"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">{item.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{item.title}</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Team Section
 */
function TeamSection({ members }: { members: TeamMember[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-white rounded-2xl shadow-card p-6 text-center transition-shadow hover:shadow-lg"
        >
          <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name}
                width={96}
                height={96}
                className="rounded-full object-cover w-24 h-24"
              />
            ) : (
              <span className="text-blue-600 font-bold text-3xl">
                {member.name.charAt(0)}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-gray-900">{member.name}</h4>
          <p className="text-sm text-blue-600 font-medium">{member.role}</p>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">{member.bio}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-20 md:py-28">
        <div className="container-custom max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-blue-100 mb-6">
            <SparklesIcon className="w-4 h-4" />
            <span>Proudly Ethiopian</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Building a Trusted Service Economy
            <br />
            <span className="text-blue-200">For Ethiopian Communities</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            We are on a mission to transform the way Ethiopians find, hire, and work with
            service professionals across the country. From Addis Ababa to Bahir Dar,
            we are connecting communities with quality service providers they can trust.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Story</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
          </div>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
            <p>
              Marketplace was born from a simple but powerful observation: across Ethiopia,
              millions of skilled professionals are ready to work, but connecting them with
              customers who need their services is often a frustrating and uncertain process.
            </p>
            <p>
              In 2024, our founding team saw this challenge firsthand. Friends and family
              would spend days, sometimes weeks, searching for a reliable plumber, a trusted
              electrician, or a qualified tutor in Addis Ababa. At the same time, talented
              professionals were struggling to find customers and build their businesses
              in a fragmented and informal market.
            </p>
            <p>
              We decided to build a solution that would make it easy for Ethiopians to find,
              compare, and book service providers with complete confidence. We wanted to
              create a platform where quality is recognized, trust is earned, and local talent
              is celebrated. That is how Marketplace was born.
            </p>
            <p>
              Today, Marketplace is Ethiopia&apos;s premier platform for connecting customers
              with verified service professionals. We have grown from a small team of
              passionate individuals to a vibrant community of thousands of users across
              the country. And we are just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The Problem We Solve</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              For too long, finding a reliable service professional in Ethiopia has been a challenge.
              Here is why we are changing that.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Time Lost</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                Ethiopians spend hours, sometimes days, searching for reliable service providers
                through word-of-mouth, social media, and random phone calls.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-7 h-7 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Unclear Pricing</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                Without transparent pricing, customers are often overcharged or face unexpected costs.
                Providers struggle to communicate their rates effectively.
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-card p-6 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="w-7 h-7 text-gray-500" />
              </div>
              <h3 className="font-semibold text-gray-900">Lack of Trust</h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                There is no reliable system to verify the quality of work, professionalism,
                or reliability of service providers in Ethiopia&apos;s informal service market.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <StarSolidIcon className="w-7 h-7 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                To make it easy for every Ethiopian to find trusted professionals in their
                community, while empowering skilled workers to build sustainable businesses
                through transparent and fair opportunities.
              </p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <LightBulbIcon className="w-7 h-7 text-blue-600" />
                <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                A future where every Ethiopian household has access to quality, reliable,
                and affordable services, and every skilled professional has the opportunity
                to thrive through meaningful work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Sets Us Apart</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              We are building more than just a marketplace. We are building a community
              built on trust, transparency, and quality service.
            </p>
          </div>
          <FeaturesSection features={features} />
        </div>
      </section>

      {/* Our Values */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Core Values</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              These are the principles that guide our decisions, our actions, and our relationships
              with customers and providers alike.
            </p>
          </div>
          <ValuesSection values={values} />
        </div>
      </section>

      {/* Our Impact */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Impact in Ethiopia</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Numbers tell a story of growth, connection, and community transformation.
            </p>
          </div>
          <StatsSection stats={stats} />
        </div>
      </section>

      {/* Community Impact Stories */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Making a Difference</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Every day, we see the positive impact of our platform on Ethiopian lives and
              communities. Here is how we are making a difference.
            </p>
          </div>
          <ImpactSection items={impactItems} />
        </div>
      </section>

      {/* Our Team */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Leadership Team</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              A team of passionate Ethiopians dedicated to building a platform that serves
              our community with excellence and integrity.
            </p>
          </div>
          <TeamSection members={teamMembers} />
        </div>
      </section>

      {/* Our Commitment */}
      <section className="py-16 bg-white">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Commitment to You</h2>
          <div className="w-16 h-1 bg-blue-600 mx-auto mb-8 rounded-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Verified Providers</h4>
              <p className="text-sm text-gray-500 mt-1">Every provider is verified before joining our platform.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <StarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Quality Guarantee</h4>
              <p className="text-sm text-gray-500 mt-1">We stand behind the quality of services on our platform.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <HeartIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Community First</h4>
              <p className="text-sm text-gray-500 mt-1">Your satisfaction is our priority. We are here to help.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-700 text-white">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Join Our Growing Community</h2>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Whether you are looking for a trusted professional or ready to offer your services,
            we are here to help you succeed. Join thousands of Ethiopians who have already
            discovered the power of Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Create Your Account
            </Link>
            <Link
              href="/search"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors border border-blue-500"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}