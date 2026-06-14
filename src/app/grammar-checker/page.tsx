import type { Metadata } from 'next';
import { GrammarClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/grammar-checker`;
const TITLE = 'Free Grammar Checker Online — Fix Errors Instantly';
const DESCRIPTION =
  'Free grammar checker online: fix grammar, spelling, and punctuation errors with smart AI suggestions. Real-time analysis with error severity ratings. No account required.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free grammar checker online',
    'grammar checker',
    'spell check online free',
    'punctuation checker',
    'fix grammar mistakes',
    'grammar error detector',
    'English grammar check',
    'sentence correction tool',
    'proofreading tool free',
    'writing grammar tool',
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

export default function GrammarCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Grammar Checker Online — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free online grammar checker. Detect and fix grammar, spelling, punctuation, and style errors with intelligent suggestions and severity ratings.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Grammar error detection',
      'Spell check',
      'Punctuation correction',
      'Style suggestions',
      'Error severity ratings',
      'Smart correction recommendations',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GrammarClient />
    </>
  );
}
