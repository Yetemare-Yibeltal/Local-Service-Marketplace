import React from 'react';
import Link from 'next/link';
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
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
      'Welcome to Local Service Provider Marketplace. By using our platform, you agree to these Terms of Service. Please read them carefully.',
      'These Terms of Service govern your use of our website and mobile application, including all features, functionalities, and services provided through the platform.',
      'By accessing or using our platform, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use our platform.',
    ],
  },
  {
    id: 'section-2',
    title: '2. Definitions',
    content: [
      '"Platform" refers to the Local Service Provider Marketplace website and mobile application.',
      '"Customer" refers to any individual or entity seeking to hire services through our platform.',
      '"Provider" refers to any individual or entity offering services through our platform.',
      '"Booking" refers to any confirmed arrangement between a Customer and a Provider through our platform.',
      '"Service" refers to any professional service listed and offered on our platform.',
      '"Content" refers to any information, text, images, or materials posted on our platform.',
    ],
  },
  {
    id: 'section-3',
    title: '3. User Accounts',
    content: [
      'To use our platform, you must create an account and provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials.',
      'You agree to notify us immediately of any unauthorized use of your account or any other security breach. We are not liable for any loss or damage arising from your failure to protect your account.',
      'We reserve the right to suspend or terminate accounts that violate these Terms of Service or are used for fraudulent or illegal activities.',
      'You must be at least 18 years old to create an account on our platform.',
    ],
  },
  {
    id: 'section-4',
    title: '4. Provider Requirements and Responsibilities',
    content: [
      'Providers must maintain accurate and complete profiles, including business name, description, service categories, pricing, and availability.',
      'Providers are responsible for delivering services as described in their profiles. Services must be performed with professional skill, care, and diligence.',
      'Providers must comply with all applicable laws and regulations in Ethiopia related to their services and business operations.',
      'Providers are required to respond to booking requests in a timely manner and honor confirmed bookings. Repeated cancellation or failure to respond may result in account suspension.',
      'Providers may be required to undergo verification processes to confirm their identity and credentials.',
    ],
  },
  {
    id: 'section-5',
    title: '5. Customer Responsibilities',
    content: [
      'Customers must provide accurate information when requesting services, including service address, contact details, and any special requirements.',
      'Customers are responsible for being available at the scheduled service time. Failure to be available may result in cancellation fees.',
      'Customers must treat providers with respect and provide a safe working environment. Unacceptable behavior may result in account suspension.',
      'Customers are responsible for reviewing provider profiles and verifying that the provider meets their needs before booking.',
    ],
  },
  {
    id: 'section-6',
    title: '6. Booking and Cancellation Policy',
    content: [
      'Customers may request services through the platform by selecting a provider, service, date, and time.',
      'Providers have the right to accept or decline booking requests based on their availability and preferences.',
      'Once a booking is confirmed by the provider, it becomes a binding agreement between the Customer and Provider.',
      'Customers may cancel a booking up to 24 hours before the scheduled service time without penalty. Cancellations made less than 24 hours before the scheduled time may incur a cancellation fee.',
      'Providers may cancel a booking due to emergencies or unforeseen circumstances. Providers who cancel repeatedly may face account penalties.',
      'If a provider fails to show up for a confirmed booking, customers may request a full refund and file a complaint.',
    ],
  },
  {
    id: 'section-7',
    title: '7. Payment Terms',
    content: [
      'Pricing for services is displayed on provider profiles and booking pages. Customers agree to pay the price shown at the time of booking.',
      'Payment is processed through our platform or directly between the Customer and Provider, as specified during booking.',
      'For transactions processed through our platform, we may charge a service fee. The total amount due will be clearly displayed before booking confirmation.',
      'Providers are responsible for paying any applicable taxes on their earnings. We do not assume liability for provider tax obligations.',
    ],
  },
  {
    id: 'section-8',
    title: '8. Reviews and Ratings',
    content: [
      'Customers may submit reviews and ratings for providers after a booking is completed.',
      'Reviews must be honest, accurate, and based on genuine experiences. Reviews should not contain offensive, defamatory, or inappropriate content.',
      'Providers may respond to reviews submitted about their services. Responses must be professional and respectful.',
      'We reserve the right to remove reviews that violate these guidelines or are found to be fraudulent.',
      'Reviews and ratings are used to help other users make informed decisions. We do not guarantee the accuracy or completeness of any review.',
    ],
  },
  {
    id: 'section-9',
    title: '9. Dispute Resolution',
    content: [
      'We encourage Customers and Providers to resolve disputes directly through open communication.',
      'If a dispute cannot be resolved directly, Customers may file a complaint through our platform. We will review the complaint and take appropriate action.',
      'Disputes may be escalated to formal mediation or legal proceedings if necessary. We are not liable for the outcome of any dispute between Customers and Providers.',
      'We are not responsible for resolving disputes related to service quality, payment, or any other matter between Customers and Providers.',
    ],
  },
  {
    id: 'section-10',
    title: '10. Intellectual Property',
    content: [
      'All content on our platform, including text, images, logos, and trademarks, is the property of Marketplace and protected by Ethiopian and international copyright laws.',
      'You may not reproduce, distribute, or create derivative works from our content without our express written permission.',
      'Users retain ownership of content they post on our platform. By posting content, you grant us a license to use, display, and distribute that content for the purpose of operating our platform.',
    ],
  },
  {
    id: 'section-11',
    title: '11. Disclaimer of Warranties',
    content: [
      'Our platform is provided "as is" and "as available" without warranties of any kind, either express or implied.',
      'We do not guarantee that the platform will be uninterrupted, error-free, or free of viruses or other harmful components.',
      'We do not endorse or guarantee the quality, safety, or legality of services provided by providers on our platform.',
      'We are not responsible for any loss or damage arising from the use of our platform or services provided through our platform.',
    ],
  },
  {
    id: 'section-12',
    title: '12. Limitation of Liability',
    content: [
      'To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to the use of our platform.',
      'Our total liability to you for any claim arising from your use of our platform shall not exceed the amount you have paid to us in the twelve months preceding the claim.',
      'We are not responsible for any loss or damage arising from the actions or omissions of Providers or Customers.',
      'Some jurisdictions do not allow limitations on liability, so the above limitations may not apply to you.',
    ],
  },
  {
    id: 'section-13',
    title: '13. Indemnification',
    content: [
      'You agree to indemnify and hold us harmless from any claims, losses, liabilities, damages, costs, and expenses arising from your use of our platform, violation of these Terms of Service, or infringement of any rights of another party.',
      'We reserve the right to assume the exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with our defense of such claims.',
    ],
  },
  {
    id: 'section-14',
    title: '14. Termination',
    content: [
      'We may terminate or suspend your account at any time for violation of these Terms of Service, fraudulent or illegal activities, or any other reason we deem appropriate.',
      'Upon termination, you will lose access to your account and may not be able to use our platform.',
      'Sections related to liability, indemnification, and dispute resolution shall survive termination.',
    ],
  },
  {
    id: 'section-15',
    title: '15. Changes to Terms',
    content: [
      'We may update these Terms of Service from time to time. We will notify users of significant changes through our platform or email.',
      'Your continued use of our platform after changes are made constitutes your acceptance of the updated terms.',
      'If you do not agree to the updated terms, you must discontinue using our platform.',
    ],
  },
  {
    id: 'section-16',
    title: '16. Governing Law',
    content: [
      'These Terms of Service shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia.',
      'Any disputes arising from these Terms of Service shall be subject to the exclusive jurisdiction of the courts of Addis Ababa, Ethiopia.',
    ],
  },
  {
    id: 'section-17',
    title: '17. Contact Information',
    content: [
      'If you have any questions about these Terms of Service, please contact us at:',
      'Email: legal@marketplace.com',
      'Phone: +251 911 234 567',
      'Address: Bole, Rwanda Street, Addis Ababa, Ethiopia',
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================

/**
 * Terms Section Component
 */
function TermsSection({ section }: { section: Section }) {
  return (
    <div id={section.id} className="scroll-mt-24">
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{section.title}</h3>
      {Array.isArray(section.content) ? (
        <div className="space-y-3">
          {section.content.map((paragraph, index) => (
            <p key={index} className="text-gray-700 leading-relaxed">
              {paragraph}
            </p>
          ))}
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

// ============================================================
// MAIN PAGE
// ============================================================

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full text-sm text-blue-700 mb-4">
            <ScaleIcon className="w-4 h-4" />
            <span>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please read these terms carefully before using our platform. By using Marketplace,
            you agree to be bound by these terms.
          </p>
          <p className="text-sm text-gray-400 mt-2">Last Updated: August 2026</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <TableOfContents sections={sections} />
          </div>

          {/* Terms Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-card p-8 md:p-10">
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                <CheckCircleIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Important Notice</p>
                  <p className="text-sm text-blue-700">
                    These Terms of Service are a legally binding agreement between you and Marketplace.
                    Please read them carefully before using our platform.
                  </p>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-8 divide-y divide-gray-100">
                {sections.map((section) => (
                  <div key={section.id} className="pt-8 first:pt-0">
                    <TermsSection section={section} />
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-gray-50 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-600">
                    By using Marketplace, you acknowledge that you have read, understood,
                    and agree to be bound by these Terms of Service.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    If you have any questions, please contact us at{' '}
                    <a href="mailto:legal@marketplace.com" className="text-blue-600 hover:underline">
                      legal@marketplace.com
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