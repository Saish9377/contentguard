import type { Metadata } from 'next';
import { HumanizerClient } from './client';

export const metadata: Metadata = {
  title: 'Free AI Humanizer — Bypass AI Detection Online | ContentGuard',
  description: 'Convert AI-generated text into human-like writing instantly. Bypass Turnitin, GPTZero, and Copyleaks for free. No signup required.',
  keywords: 'AI humanizer free, bypass AI detection, humanize AI text, convert AI text to human, bypass Turnitin free, ChatGPT humanizer',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/humanizer',
  },
  openGraph: {
    title: 'Free AI Humanizer — Bypass AI Detection Online | ContentGuard',
    description: 'Convert AI-generated text into human-like writing instantly. Bypass Turnitin, GPTZero, and Copyleaks for free. No signup required.',
    url: 'https://contentguard.saishshinde2030.workers.dev/humanizer',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free AI Humanizer — Bypass AI Detection Online | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Humanizer — Bypass AI Detection Online | ContentGuard',
    description: 'Convert AI-generated text into human-like writing instantly. Bypass Turnitin, GPTZero, and Copyleaks for free. No signup required.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function HumanizerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free AI Humanizer — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/humanizer',
    'description': 'Free online AI humanizer. Turn AI-written text into natural, human-grade content.',
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
      <HumanizerClient />
    </>
  );
}
