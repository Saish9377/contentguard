import type { Metadata } from 'next';
import { CitationClient } from './client';

export const metadata: Metadata = {
  title: 'Free Citation Generator — APA, MLA, Harvard, Chicago | ContentGuard',
  description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles instantly. Free citation maker for students and researchers.',
  keywords: 'free citation generator, citation generator, APA citation, MLA citation, Harvard citation, Chicago citation, citation maker free',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/citation-generator',
  },
  openGraph: {
    title: 'Free Citation Generator — APA, MLA, Harvard, Chicago | ContentGuard',
    description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles instantly. Free citation maker for students and researchers.',
    url: 'https://contentguard.saishshinde2030.workers.dev/citation-generator',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Citation Generator — APA, MLA, Harvard, Chicago | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Citation Generator — APA, MLA, Harvard, Chicago | ContentGuard',
    description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles instantly. Free citation maker for students and researchers.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function CitationGeneratorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free Citation Generator — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/citation-generator',
    'description': 'Free online citation generator. Format references in APA, MLA, Harvard, and Chicago styles instantly.',
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
      <CitationClient />
    </>
  );
}
