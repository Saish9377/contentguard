import type { Metadata } from 'next';
import { ReadabilityClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/readability-checker`;
const TITLE = 'Readability Score Checker Free — Flesch & Grade Level';
const DESCRIPTION =
  'Check readability score free with Flesch-Kincaid, Gunning Fog, SMOG, and Coleman-Liau indexes. Get reading level, estimated reading time, and writing complexity analysis.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'readability score checker free',
    'readability checker',
    'Flesch Kincaid score',
    'reading level checker',
    'Gunning Fog index',
    'SMOG index checker',
    'reading ease score',
    'text complexity checker',
    'estimated reading time',
    'writing clarity tool free',
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    siteName: 'ContentGuard AI',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${BASE_URL}/og-image.png`],
  },
};

export default function ReadabilityCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Readability Score Checker — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free online readability score checker. Analyze Flesch Reading Ease, Flesch-Kincaid Grade Level, Gunning Fog, SMOG, and Coleman-Liau indexes with reading time estimates.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Flesch Reading Ease score',
      'Flesch-Kincaid Grade Level',
      'Gunning Fog Index',
      'SMOG Index',
      'Coleman-Liau Index',
      'Estimated reading time',
      'Reading level classification',
    ],
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
