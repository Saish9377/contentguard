import type { Metadata } from 'next';
import { HowItWorks } from '@/components/home/HowItWorks';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/how-it-works`;
const TITLE = 'How AI Content Detection Works — ContentGuard AI';
const DESCRIPTION =
  'Learn how ContentGuard AI detects AI-generated text using perplexity and burstiness analysis, cross-references plagiarism sources, and scores grammar and readability in seconds.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'how AI content detection works',
    'how does plagiarism checker work',
    'AI detection algorithm',
    'perplexity burstiness analysis',
    'how to detect AI text',
    'AI writing detection explained',
    'plagiarism checking process',
    'ContentGuard AI how it works',
    'essay analysis steps',
    'content analysis pipeline',
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

export default function HowItWorksPage() {
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

        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-syne font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
            How AI Content Detection{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Works
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto mt-3 leading-relaxed">
            Understand the perplexity, burstiness, and fingerprint-matching pipeline that powers every ContentGuard AI analysis.
          </p>
        </div>

        <HowItWorks />

        {/* Detailed breakdown */}
        <div className="max-w-3xl mx-auto mt-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 sm:p-10 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6">Detailed Processing Pipeline</h2>

          <div className="space-y-7">
            {[
              {
                step: '1',
                title: 'Text Normalization & Extraction',
                desc: 'When you upload files (PDF, DOCX, TXT) or paste plain text, our system extracts and parses the raw contents. We filter out control characters and normalize white space for lexical processing.'
              },
              {
                step: '2',
                title: 'Statistical Model Evaluation',
                desc: 'Our system evaluates Perplexity and Burstiness scores for every sentence. Lower complexity and uniform sentence lengths strongly signal generative AI patterns, which are highlighted on your heatmap.'
              },
              {
                step: '3',
                title: 'Plagiarism Cross-referencing & Quality Check',
                desc: 'The text is cross-referenced using fingerprint matching algorithm to detect copy-pasted blocks. Meanwhile, grammatical patterns are analyzed, and Flesch readability levels are calculated.'
              }
            ].map(item => (
              <div key={item.step} className="flex gap-4">
                <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link
              href="/ai-detector"
              className="btn-primary inline-flex items-center gap-2 text-sm px-6 py-2.5"
            >
              Try the Free AI Detector Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
