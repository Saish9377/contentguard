import type { Metadata } from 'next';
import { HowItWorks } from '@/components/home/HowItWorks';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — ContentGuard AI analysis flow',
  description: 'Learn how ContentGuard AI analyzes your text for artificial intelligence signatures, sentence-level plagiarism, grammatical corrections, and readability scoring in three easy steps.',
  keywords: ['AI detector workflow', 'plagiarism checker how it works', 'essay analysis steps'],
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
              Try It Out Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
