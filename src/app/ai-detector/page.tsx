import type { Metadata } from 'next';
import { AIDetectorClient } from './client';

export const metadata: Metadata = {
  title: 'Free AI Content Detector — Detect ChatGPT, Claude & Gemini Text | ContentGuard',
  description: 'Detect AI-generated content instantly. Identify text written by ChatGPT, Claude, or Gemini with sentence-level highlighting and confidence scores. 100% free.',
  keywords: 'free AI content detector, AI content detector, ChatGPT detector, AI text detector, AI detector free, check ChatGPT text free',
  alternates: {
    canonical: 'https://contentguard.saishshinde2030.workers.dev/ai-detector',
  },
  openGraph: {
    title: 'Free AI Content Detector — Detect ChatGPT, Claude & Gemini Text | ContentGuard',
    description: 'Detect AI-generated content instantly. Identify text written by ChatGPT, Claude, or Gemini with sentence-level highlighting and confidence scores. 100% free.',
    url: 'https://contentguard.saishshinde2030.workers.dev/ai-detector',
    type: 'website',
    images: [
      {
        url: 'https://contentguard.saishshinde2030.workers.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Free AI Content Detector — Detect ChatGPT, Claude & Gemini Text | ContentGuard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free AI Content Detector — Detect ChatGPT, Claude & Gemini Text | ContentGuard',
    description: 'Detect AI-generated content instantly. Identify text written by ChatGPT, Claude, or Gemini with sentence-level highlighting and confidence scores. 100% free.',
    images: ['https://contentguard.saishshinde2030.workers.dev/og-image.png'],
  },
};

export default function AIDetectorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'Free AI Content Detector — ContentGuard',
    'url': 'https://contentguard.saishshinde2030.workers.dev/ai-detector',
    'description': 'Free online AI content detector. Detect text written by ChatGPT, Claude, and Gemini instantly.',
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
      <AIDetectorClient />
    </>
  );
}
