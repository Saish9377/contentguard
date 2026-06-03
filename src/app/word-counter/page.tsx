import type { Metadata } from 'next';
import { WordCounterClient } from './client';

export const metadata: Metadata = {
  title: 'Free Word Counter — Count Words, Characters & Sentences | ContentGuard',
  description: 'Count words, characters, sentences, and paragraphs instantly. Get reading time, speaking time, and vocabulary density analysis. 100% free online tool.',
  keywords: 'free word counter, word counter online, character counter, check word count, count words free, text statistics tool',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/word-counter',
  },
  openGraph: {
    title: 'Free Word Counter — Count Words, Characters & Sentences | ContentGuard',
    description: 'Count words, characters, sentences, and paragraphs instantly. Get reading time, speaking time, and vocabulary density analysis. 100% free online tool.',
    url: 'https://contentguard.saishshinde2030.workers.dev/word-counter',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free Word Counter — Count Words, Characters & Sentences | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Word Counter — Count Words, Characters & Sentences | ContentGuard',
    description: 'Count words, characters, sentences, and paragraphs instantly. Get reading time, speaking time, and vocabulary density analysis. 100% free online tool.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function WordCounterPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free Word Counter — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/word-counter',
    'description': 'Free online word counter. Count words, characters, sentences, and paragraphs instantly with real-time reading and speaking time analysis.',
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
      <WordCounterClient />
    </>
  );
}
