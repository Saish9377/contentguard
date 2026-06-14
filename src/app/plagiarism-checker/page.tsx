import type { Metadata } from 'next';
import { PlagiarismClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/plagiarism-checker`;
const TITLE = 'Free Plagiarism Checker — Detect Copied Content Online';
const DESCRIPTION =
  'Check plagiarism free online with detailed similarity reports. Get Unique%, Exact Match%, and Partial Match% scores with source links. No signup — instant results.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free plagiarism checker',
    'plagiarism checker online',
    'check plagiarism free',
    'plagiarism detector',
    'similarity checker',
    'duplicate content checker',
    'check for plagiarism',
    'plagiarism checker for students',
    'essay plagiarism checker',
    'originality checker free',
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

export default function PlagiarismCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Plagiarism Checker — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free plagiarism checker online. Scan text against billions of web and academic sources. Get exact match, partial match, and unique content scores.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Web source matching',
      'Academic source checking',
      'Exact match detection',
      'Partial match detection',
      'Originality score',
      'Source URL citations',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlagiarismClient />
    </>
  );
}
