import type { Metadata } from 'next';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/features`;
const TITLE = 'ContentGuard AI Features — 7 Free Writing Tools';
const DESCRIPTION =
  'Explore all ContentGuard AI features: AI detector, plagiarism checker, grammar fixer, readability scorer, AI humanizer, citation generator, and word counter — all free.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'ContentGuard AI features',
    'AI detector features',
    'free writing tools',
    'plagiarism checker features',
    'grammar checker online',
    'readability analyzer',
    'AI humanizer tool',
    'citation generator features',
    'word counter features',
    'content analysis tools',
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

export default function FeaturesPage() {
  return (
    <div className="bg-[var(--bg-primary)] min-h-screen py-14 sm:py-20">
      <div className="container-wide">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <FeaturesSection />

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <div className="max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Ready to analyze your writing?</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Start checking essays, articles, and papers instantly. 100% free, no registration.
            </p>
            <Link
              href="/ai-detector"
              className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"
            >
              Analyze Your Text Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
