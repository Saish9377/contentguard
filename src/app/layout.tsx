import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { APP_NAME, APP_DESCRIPTION, APP_URL } from '@/lib/constants';
import { ThemeProvider, ThemeInitScript } from '@/components/layout/ThemeProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} — Free AI Content Detector & Plagiarism Checker`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: [
    'AI content detector',
    'plagiarism checker',
    'AI detector free',
    'plagiarism checker free',
    'grammar checker',
    'readability analyzer',
    'citation generator',
    'AI writing detector',
    'content originality checker',
    'free AI content checker',
    'ChatGPT detector',
    'detect AI text',
  ],
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
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
    type: 'website',
    locale: 'en_US',
    url: APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Free AI Content Detector & Plagiarism Checker`,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} — Free AI Content Detector & Plagiarism Checker`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Free AI Content Detector & Plagiarism Checker`,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: APP_NAME,
              description: APP_DESCRIPTION,
              url: APP_URL,
              applicationCategory: 'UtilitiesApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'AI Content Detection',
                'Plagiarism Checking',
                'Grammar Analysis',
                'Readability Analysis',
                'Citation Generation',
                'PDF Report Export',
                'AI Text Humanizer',
                'Word Counter',
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>
          <Toaster position="top-center" richColors />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
