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
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

// ============================================================
// TYPES
// ============================================================

interface StatItem {
  id: string;
  label: string;
  value: string;
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

// ============================================================
// DATA
// ============================================================

const stats: StatItem[] = [
  {
    id: 'stat-1',
    label: 'Active Users',
    value: '10,000+',
    icon: <UserGroupIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-2',
    label: 'Trusted Providers',
    value: '500+',
    icon: <BriefcaseIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-3',
    label: 'Completed Jobs',
    value: '5,000+',
    icon: <CheckBadgeIcon className="w-6 h-6 text-blue-600" />,
  },
  {
    id: 'stat-4',
    label: 'Average Rating',
    value: '4.8 ★',
    icon: <StarIcon className="w-6 h-6 text-blue-600" />,
  },
];

const values: ValueItem[] = [
  {
    id: 'value-1',
    title: 'Trust & Transparency',
    description: 'We believe in building trust through transparent pricing, verified providers, and honest reviews.',
    icon: <ShieldCheckIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-2',
    title: 'Quality Service',
    description: 'We are committed to connecting customers with the highest quality professionals in their area.',
    icon: <StarSolidIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-3',
    title: 'Community First',
    description: 'We believe in empowering local communities by creating opportunities for skilled professionals.',
    icon: <HeartIcon className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'value-4',
    title: 'Innovation',
    description: 'We continuously innovate to make finding and booking services faster, easier, and more reliable.',
    icon: <ArrowPathIcon className="w-8 h-8 text-blue-600" />,
  },
];

const teamMembers: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Abebe Kebede',
    role: 'CEO & Founder',
    bio: 'Passionate about connecting people with quality services. 10+ years of experience in tech and business.',
    image: null,
  },
  {
    id: 'member-2',
    name: 'Selam Tesfaye',
    role: 'CTO',
    bio: 'Tech enthusiast with a vision to transform the service industry through innovative digital solutions.',
    image: null,
  },
  {
    id: 'member-3',
    name: 'Yonas Ayele',
    role: 'Head of Operations',
    bio: 'Ensuring seamless experiences for both customers and providers with a focus on operational excellence.',
    image: null,
  },
  {
    id: 'member-4',
    name: 'Meron Hailu',
    role: 'Head of Customer Experience',
    bio: 'Dedicated to creating exceptional experiences and building lasting relationships with our community.',
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white rounded-xl shadow-card p-6 text-center transition-shadow hover:shadow-lg"
        >
          <div className="flex justify-center mb-3">{stat.icon}</div>
          <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
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
          className="bg-white rounded-xl shadow-card p-6 transition-shadow hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-blue-50 rounded-lg">{value.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{value.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{value.description}</p>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {members.map((member) => (
        <div
          key={member.id}
          className="bg-white rounded-xl shadow-card p-6 text-center transition-shadow hover:shadow-lg"
        >
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name}
                width={80}
                height={80}
                className="rounded-full object-cover w-20 h-20"
              />
            ) : (
              <span className="text-blue-600 font-bold text-2xl">
                {member.name.charAt(0)}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-gray-900">{member.name}</h4>
          <p className="text-sm text-blue-600 font-medium">{member.role}</p>
          <p className="text-sm text-gray-500 mt-2">{member.bio}</p>
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
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="container-custom max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            About Marketplace
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Connecting Ethiopians with trusted professionals in their community.
            Built to simplify the way you find, book, and pay for services.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12">
        <div className="container-custom max-w-4xl">
          <div className="bg-white rounded-2xl shadow-card p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">For Customers</h3>
                <p className="text-gray-600">
                  We make it easy to find trusted professionals in your neighborhood.
                  With transparent pricing, verified reviews, and easy booking, you can
                  get the service you need with confidence.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">For Providers</h3>
                <p className="text-gray-600">
                  We empower local professionals to grow their business, reach more customers,
                  and build their reputation. Join thousands of providers who trust us to
                  connect them with quality opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Our Impact</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4">
              Numbers that reflect our commitment to connecting communities
            </p>
          </div>
          <StatsSection stats={stats} />
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Our Values</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4">
              Principles that guide everything we do
            </p>
          </div>
          <ValuesSection values={values} />
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 bg-white">
        <div className="container-custom max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Team</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mt-3 rounded-full" />
            <p className="text-gray-600 mt-4">
              Dedicated professionals building the future of local services
            </p>
          </div>
          <TeamSection members={teamMembers} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="container-custom max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-8">
            Whether you need a service or want to offer one, we&apos;re here to help.
            Join our community today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Join Marketplace
            </Link>
            <Link
              href="/search"
              className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-colors"
            >
              Find Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}