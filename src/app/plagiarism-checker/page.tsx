import type { Metadata } from 'next';
import { PlagiarismClient } from './client';

export const metadata: Metadata = {
  title: 'Free Plagiarism Checker — Detect Copied Content Instantly | ContentGuard',
  description: 'Check your text for plagiarism online for free. Get detailed similarity reports with exact match, partial match, and unique content scores. No signup needed.',
  keywords: 'free plagiarism checker, check plagiarism online, check plagiarism online free, similarity checker, check plagiarism free, plagiarism checker online free',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/plagiarism-checker',
  },
  openGraph: {
    title: 'Free Plagiarism Checker — Detect Copied Content Instantly | ContentGuard',
    description: 'Check your text for plagiarism online for free. Get detailed similarity reports with exact match, partial match, and unique content scores. No signup needed.',
    url: 'https://contentguard.saishshinde2030.workers.dev/plagiarism-checker',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Plagiarism Checker — Detect Copied Content Instantly | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Plagiarism Checker — Detect Copied Content Instantly | ContentGuard',
    description: 'Check your text for plagiarism online for free. Get detailed similarity reports with exact match, partial match, and unique content scores. No signup needed.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function PlagiarismCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free Plagiarism Checker — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/plagiarism-checker',
    'description': 'Free online plagiarism checker. Check text similarity against billions of web sources with detailed reports.',
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
      <PlagiarismClient />
    </>
  );
}
