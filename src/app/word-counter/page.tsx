import type { Metadata } from 'next';
import { WordCounterClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/word-counter`;
const TITLE = 'Free Word Counter Online — Characters, Sentences & More';
const DESCRIPTION =
  'Free word counter online with character count, sentence analysis, reading time, speaking time, and vocabulary density. Real-time stats for essays, articles & social posts.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free word counter online',
    'word counter',
    'character counter',
    'word count tool',
    'count words online',
    'sentence counter',
    'reading time calculator',
    'speaking time calculator',
    'text statistics tool',
    'vocabulary density checker',
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

export default function WordCounterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Word Counter Online — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free online word counter. Count words, characters, sentences, and paragraphs in real time with reading time, speaking time, and vocabulary density analysis.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Real-time word count',
      'Character count with and without spaces',
      'Sentence and paragraph count',
      'Estimated reading time',
      'Estimated speaking time',
      'Vocabulary density analysis',
      'Top word frequency list',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <WordCounterClient />
    </>
  );
}
