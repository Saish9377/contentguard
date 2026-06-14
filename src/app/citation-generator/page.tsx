import type { Metadata } from 'next';
import { CitationClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/citation-generator`;
const TITLE = 'Free Citation Generator — APA, MLA, Harvard, Chicago';
const DESCRIPTION =
  'Free citation generator for APA, MLA, Harvard, and Chicago styles. Instantly create properly formatted references for websites, books, journals, and articles. No account needed.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free citation generator APA MLA',
    'citation generator',
    'APA citation generator',
    'MLA citation generator',
    'Harvard citation generator',
    'Chicago citation generator',
    'bibliography generator free',
    'reference generator',
    'citation maker online',
    'academic citation tool',
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

export default function CitationGeneratorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Citation Generator — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free online citation generator. Format references in APA, MLA, Harvard, and Chicago styles for websites, books, journals, and articles instantly.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'APA 7th edition citations',
      'MLA 9th edition citations',
      'Harvard citation style',
      'Chicago citation style',
      'Website citation support',
      'Book & journal citations',
      'One-click copy to clipboard',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CitationClient />
    </>
  );
}
