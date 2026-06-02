import type { Metadata } from 'next';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ContentGuard AI Features — AI Detector & Writing Tools',
  description: 'Explore the full suite of free tools offered by ContentGuard AI, including AI content detection, plagiarism checking, grammar analysis, and writing metrics.',
  keywords: ['AI detector features', 'plagiarism checker', 'grammar checker tools', 'content analysis features'],
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
