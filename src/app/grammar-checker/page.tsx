import type { Metadata } from 'next';
import { GrammarClient } from './client';

export const metadata: Metadata = {
  title: 'Free Grammar Checker — Fix Spelling & Punctuation Errors | ContentGuard',
  description: 'Check your grammar, spelling, and punctuation for free. Get smart correction suggestions with real-time analysis. No account required.',
  keywords: 'free grammar checker, grammar checker, spell check, punctuation checker, fix grammar free, grammar check online',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/grammar-checker',
  },
  openGraph: {
    title: 'Free Grammar Checker — Fix Spelling & Punctuation Errors | ContentGuard',
    description: 'Check your grammar, spelling, and punctuation for free. Get smart correction suggestions with real-time analysis. No account required.',
    url: 'https://contentguard.saishshinde2030.workers.dev/grammar-checker',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Grammar Checker — Fix Spelling & Punctuation Errors | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Grammar Checker — Fix Spelling & Punctuation Errors | ContentGuard',
    description: 'Check your grammar, spelling, and punctuation for free. Get smart correction suggestions with real-time analysis. No account required.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function GrammarCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free Grammar Checker — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/grammar-checker',
    'description': 'Free online grammar checker. Fix grammar, spelling, and punctuation errors instantly.',
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
      <GrammarClient />
    </>
  );
}
