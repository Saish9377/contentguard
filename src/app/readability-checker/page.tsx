import type { Metadata } from 'next';
import { ReadabilityClient } from './client';

export const metadata: Metadata = {
  title: 'Free Readability Checker — Flesch Score & Reading Level | ContentGuard',
  description: "Analyze your content's readability score, reading level, and complexity. Get estimated reading time and improve your writing clarity for free.",
  keywords: 'free readability checker, readability checker, readability score, reading level checker, check text complexity, Flesch reading ease',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/readability-checker',
  },
  openGraph: {
    title: 'Free Readability Checker — Flesch Score & Reading Level | ContentGuard',
    description: "Analyze your content's readability score, reading level, and complexity. Get estimated reading time and improve your writing clarity for free.",
    url: 'https://contentguard.saishshinde2030.workers.dev/readability-checker',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Readability Checker — Flesch Score & Reading Level | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Readability Checker — Flesch Score & Reading Level | ContentGuard',
    description: "Analyze your content's readability score, reading level, and complexity. Get estimated reading time and improve your writing clarity for free.",
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function ReadabilityCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free Readability Checker — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/readability-checker',
    'description': 'Free online readability checker. Get Flesch Reading Ease score, reading level, and estimated reading time.',
    'applicationCategory': 'UtilitiesApplication',
    'operatingSystem': 'Web',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReadabilityClient />
    </>
  );
}
