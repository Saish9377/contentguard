import type { Metadata } from 'next';
import { AIDetectorClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/ai-detector`;
const TITLE = 'Free AI Detector — Check ChatGPT, Claude & Gemini Text';
const DESCRIPTION =
  'Free AI detector that identifies ChatGPT, Claude, and Gemini-written text with sentence-level heatmap and confidence scores. No signup required — results in seconds.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free AI detector',
    'AI content detector',
    'ChatGPT detector free',
    'detect AI text online',
    'AI text detector',
    'check AI writing free',
    'Claude detector',
    'Gemini text detector',
    'AI sentence heatmap',
    'detect AI generated content',
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

export default function AIDetectorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free AI Detector — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Detect AI-generated text from ChatGPT, Claude, and Gemini with sentence-level heatmap. Free, no signup.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Sentence-level AI heatmap',
      'ChatGPT detection',
      'Claude detection',
      'Gemini detection',
      'Confidence scoring',
      'Perplexity & burstiness analysis',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AIDetectorClient />
    </>
  );
}
