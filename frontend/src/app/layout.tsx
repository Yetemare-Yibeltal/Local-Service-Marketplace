import type { Metadata, Viewport } from 'next';
import { Inter, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

// ============================================================
// FONTS
// ============================================================

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const geistSans = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

// ============================================================
// METADATA
// ============================================================

export const metadata: Metadata = {
  title: {
    default: 'Local Service Provider Marketplace',
    template: '%s | Local Service Provider Marketplace',
  },
  description: 'Find trusted professionals in your neighborhood. Connect with verified plumbers, electricians, tutors, cleaners, and more.',
  keywords: [
    'service provider',
    'marketplace',
    'local services',
    'plumber',
    'electrician',
    'tutor',
    'cleaner',
    'Ethiopia',
    'Addis Ababa',
    'handyman',
    'mechanic',
    'photographer',
    'carpenter',
    'painter',
  ],
  authors: [
    {
      name: 'Local Service Provider Marketplace',
      url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    },
  ],
  creator: 'Local Service Provider Marketplace',
  publisher: 'Local Service Provider Marketplace',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Local Service Provider Marketplace',
    description: 'Find trusted professionals in your neighborhood. Connect with verified service providers.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Local Service Provider Marketplace',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Local Service Provider Marketplace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Service Provider Marketplace',
    description: 'Find trusted professionals in your neighborhood.',
    images: [`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/images/og-image.jpg`],
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/icons/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
  },
  category: 'marketplace',
  classification: 'Local Services, Marketplace',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563eb',
  colorScheme: 'light',
};

// ============================================================
// PROVIDERS
// ============================================================

/**
 * AuthProvider component - wraps the application with authentication context
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  // In a real implementation, this would use a proper auth context
  // For now, we'll just pass through children
  return <>{children}</>;
}

/**
 * ThemeProvider component - wraps the application with theme context
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  // In a real implementation, this would use a proper theme context
  // For now, we'll just pass through children
  return <>{children}</>;
}

/**
 * ToastProvider component - wraps the application with toast notifications
 */
function ToastProvider({ children }: { children: React.ReactNode }) {
  // In a real implementation, this would use a proper toast context
  // For now, we'll just pass through children
  return <>{children}</>;
}

// ============================================================
// ROOT LAYOUT
// ============================================================

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
        />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}