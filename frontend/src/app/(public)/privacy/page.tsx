import React from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  EyeIcon,
  LockClosedIcon,
  UserIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ServerIcon,
  DevicePhoneMobileIcon,
  ScaleIcon,
  KeyIcon,
  TrashIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

interface Section {
  id: string;
  title: string;
  content: string | string[];
}

// ============================================================
// DATA
// ============================================================

const sections: Section[] = [
  {
    id: 'section-1',
    title: '1. Introduction',
    content: [
      'At Local Service Provider Marketplace, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.',
      'We are committed to protecting your personal data and ensuring that your privacy is respected. This policy applies to all users of our website and mobile application.',
      'By using our platform, you consent to the collection and use of your information as described in this Privacy Policy. If you do not agree with our policies, please do not use our platform.',
    ],
  },
  {
    id: 'section-2',
    title: '2. Information We Collect',
    content: [
      'We collect various types of information to provide and improve our services:',
      'Personal Information: When you create an account, we collect your full name, email address, phone number, and profile information. For providers, we also collect business name, description, service categories, pricing, and location details.',
      'Usage Data: We automatically collect information about how you interact with our platform, including pages visited, time spent, search queries, and booking history.',
      'Device Information: We collect information about the device you use to access our platform, including IP address, browser type, operating system, and device identifiers.',
      'Location Data: With your consent, we collect precise location data to show nearby providers and services. You can disable location tracking in your device settings.',
      'Communication Data: We collect information from your communications with us and other users, including messages, feedback, and support inquiries.',
    ],
  },
  {
    id: 'section-3',
    title: '3. How We Use Your Information',
    content: [
      'We use the information we collect for the following purposes:',
      'Service Delivery: To connect customers with providers, process bookings, and facilitate service delivery.',
      'Account Management: To create and manage your account, verify your identity, and provide customer support.',
      'Personalization: To personalize your experience, recommend relevant services and providers, and improve our platform.',
      'Communication: To send you booking confirmations, reminders, updates, and promotional materials (with your consent).',
      'Security: To protect our platform, detect fraud, and enforce our Terms of Service.',
      'Analytics: To analyze usage trends, improve our services, and develop new features.',
      'Legal Compliance: To comply with applicable laws and regulations, respond to legal requests, and protect our rights.',
    ],
  },
  {
    id: 'section-4',
    title: '4. How We Share Your Information',
    content: [
      'We may share your information in the following circumstances:',
      'With Providers: When you book a service, we share your name, contact information, and service address with the provider to facilitate the service.',
      'With Customers: When you provide services, we share your business information and profile with customers who view your listing.',
      'Service Providers: We may share your information with third-party service providers who assist us in operating our platform, processing payments, and sending communications.',
      'Legal Obligations: We may disclose your information if required by law, regulation, or legal process.',
      'Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.',
      'With Your Consent: We may share your information with third parties if you explicitly consent to such sharing.',
    ],
  },
  {
    id: 'section-5',
    title: '5. Data Security',
    content: [
      'We implement appropriate technical and organizational measures to protect your personal data:',
      'Encryption: We use industry-standard encryption to protect data during transmission and storage.',
      'Access Control: We restrict access to personal data to authorized personnel who need it to perform their duties.',
      'Security Monitoring: We monitor our systems for potential vulnerabilities and security incidents.',
      'Data Minimization: We collect only the data necessary for the purposes described in this policy.',
      'Security Training: Our team receives regular training on data protection and security best practices.',
      'Incident Response: We have procedures in place to respond to data breaches and security incidents.',
    ],
  },
  {
    id: 'section-6',
    title: '6. Your Rights',
    content: [
      'You have the following rights regarding your personal data:',
      'Access: You have the right to access the personal data we hold about you.',
      'Correction: You have the right to correct inaccurate or incomplete data.',
      'Deletion: You have the right to request deletion of your personal data, subject to legal obligations.',
      'Restriction: You have the right to restrict processing of your personal data in certain circumstances.',
      'Objection: You have the right to object to processing of your personal data.',
      'Data Portability: You have the right to receive your personal data in a structured, commonly used format.',
      'Withdrawal of Consent: You have the right to withdraw consent for processing of your personal data at any time.',
      'To exercise these rights, please contact us at privacy@marketplace.com.',
    ],
  },
  {
    id: 'section-7',
    title: '7. Cookies and Tracking Technologies',
    content: [
      'We use cookies and similar tracking technologies to enhance your experience on our platform:',
      'Essential Cookies: These cookies are necessary for the functioning of our platform and cannot be disabled.',
      'Performance Cookies: These cookies help us understand how users interact with our platform, allowing us to improve performance.',
      'Functionality Cookies: These cookies remember your preferences and enhance your user experience.',
      'Analytics Cookies: These cookies help us analyze usage patterns and improve our services.',
      'You can manage your cookie preferences through your browser settings. However, disabling certain cookies may affect the functionality of our platform.',
    ],
  },
  {
    id: 'section-8',
    title: '8. Data Retention',
    content: [
      'We retain your personal data for as long as necessary to fulfill the purposes for which it was collected:',
      'Account Data: We retain account data for the duration of your account and for a reasonable period after account closure to comply with legal obligations.',
      'Booking Data: We retain booking data for up to 7 years to comply with Ethiopian legal and tax requirements.',
      'Communication Data: We retain communication data for as long as necessary to resolve disputes and provide customer support.',
      'Analytics Data: We retain anonymized analytics data for longer periods to improve our services.',
      'We periodically review and delete data that is no longer necessary for the purposes for which it was collected.',
    ],
  },
  {
    id: 'section-9',
    title: '9. Children\'s Privacy',
    content: [
      'Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal data from children.',
      'If we become aware that we have collected personal data from a child without verification of parental consent, we will take steps to delete that information.',
      'If you believe we have collected personal data from a child, please contact us at privacy@marketplace.com.',
    ],
  },
  {
    id: 'section-10',
    title: '10. International Data Transfers',
    content: [
      'Your data may be transferred to, stored, and processed in countries outside Ethiopia where our service providers operate.',
      'We ensure that any international data transfers are subject to appropriate safeguards to protect your personal data.',
      'By using our platform, you consent to the transfer of your data to countries that may have different data protection laws than Ethiopia.',
    ],
  },
  {
    id: 'section-11',
    title: '11. Third-Party Services',
    content: [
      'Our platform may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties.',
      'When you use third-party services, the processing of your data will be governed by their privacy policies.',
      'We encourage you to review the privacy policies of any third-party services you use.',
    ],
  },
  {
    id: 'section-12',
    title: '12. Changes to This Privacy Policy',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.',
      'We will notify you of significant changes through our platform or via email.',
      'Your continued use of our platform after changes are made constitutes your acceptance of the updated policy.',
      'If you do not agree to the updated policy, you should discontinue using our platform.',
    ],
  },
  {
    id: 'section-13',
    title: '13. Contact Information',
    content: [
      'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:',
      'Email: privacy@marketplace.com',
      'Phone: +251 911 234 567',
      'Address: Bole, Rwanda Street, Addis Ababa, Ethiopia',
      'Data Protection Officer: We have appointed a Data Protection Officer to oversee our data protection practices. You may contact our DPO at dpo@marketplace.com.',
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Privacy Section Component
 */
function PrivacySection({ section }: { section: Section }) {
  return (
    <div id={section.id} className="scroll-mt-24">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
      {Array.isArray(section.content) ? (
        <div className="space-y-3">
          {section.content.map((paragraph, index) => {
            // Check if paragraph starts with a bullet or is a list item
            if (paragraph.startsWith('•') || paragraph.startsWith('-') || paragraph.match(/^\d/)) {
              return (
                <div key={index} className="flex items-start gap-2 text-gray-700 leading-relaxed ml-4">
                  <span className="text-blue-600 font-bold">•</span>
                  <p>{paragraph.replace(/^[•\-]\s*/, '')}</p>
                </div>
              );
            }
            return (
              <p key={index} className="text-gray-700 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-700 leading-relaxed">{section.content}</p>
      )}
    </div>
  );
}

/**
 * Table of Contents Component
 */
function TableOfContents({ sections }: { sections: Section[] }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
      <h3 className="font-semibold text-gray-900 mb-4">Table of Contents</h3>
      <ul className="space-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Key Privacy Principles Component
 */
function KeyPrinciples() {
  const principles = [
    {
      icon: <LockClosedIcon className="w-6 h-6 text-blue-600" />,
      title: 'Data Security',
      description: 'Your data is protected with industry-standard encryption and security measures.',
    },
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-blue-600" />,
      title: 'Transparency',
      description: 'We are transparent about what data we collect and how we use it.',
    },
    {
      icon: <UserIcon className="w-6 h-6 text-blue-600" />,
      title: 'User Control',
      description: 'You have control over your data and can access, modify, or delete it.',
    },
    {
      icon: <GlobeAltIcon className="w-6 h-6 text-blue-600" />,
      title: 'Ethiopian Compliance',
      description: 'We comply with Ethiopian data protection laws and international standards.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {principles.map((principle, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-card p-5 text-center transition-shadow hover:shadow-lg"
        >
          <div className="flex justify-center mb-3">{principle.icon}</div>
          <h4 className="font-semibold text-gray-900 text-sm">{principle.title}</h4>
          <p className="text-xs text-gray-500 mt-1">{principle.description}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm text-blue-700 mb-4">
            <ShieldCheckIcon className="w-4 h-4" />
            <span>Privacy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your personal data.
          </p>
          <p className="text-sm text-gray-400 mt-2">Last Updated: August 2026</p>
        </div>

        {/* Key Principles */}
        <div className="mb-12">
          <KeyPrinciples />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <TableOfContents sections={sections} />
          </div>

          {/* Privacy Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-card p-8 md:p-10">
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                <InformationCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Your Privacy Matters</p>
                  <p className="text-sm text-blue-700">
                    We are committed to protecting your privacy and handling your data with care.
                    This policy explains how we do that.
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-8 divide-y divide-gray-100">
                {sections.map((section) => (
                  <div key={section.id} className="pt-8 first:pt-0">
                    <PrivacySection section={section} />
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600">
                    By using Marketplace, you acknowledge that you have read and understood
                    our Privacy Policy and consent to our data practices.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    If you have any questions about this policy, please contact us at{' '}
                    <a href="mailto:privacy@marketplace.com" className="text-blue-600 hover:underline">
                      privacy@marketplace.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
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