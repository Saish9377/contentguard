import type { Metadata } from 'next';
import { HumanizerClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/humanizer`;
const TITLE = 'AI Text Humanizer Free — Bypass AI Detection Online';
const DESCRIPTION =
  'Humanize AI text for free and bypass AI detectors like Turnitin, GPTZero, and Copyleaks. Convert ChatGPT output to natural human writing instantly. No account needed.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'AI text humanizer free',
    'humanize AI text',
    'bypass AI detection',
    'bypass Turnitin free',
    'GPTZero bypass',
    'Copyleaks bypass',
    'ChatGPT humanizer',
    'AI to human text converter',
    'make AI text undetectable',
    'paraphrase AI text free',
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

export default function HumanizerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AI Text Humanizer — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free online AI text humanizer. Convert AI-generated writing into natural, human-grade content to bypass AI detectors.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'AI to human text conversion',
      'Bypass AI detectors',
      'Multiple rewriting modes',
      'Preserve original meaning',
      'No signup required',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HumanizerClient />
    </>
  );
}
