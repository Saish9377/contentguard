import type { Metadata } from 'next';
import { FAQSection } from '@/components/home/FAQSection';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — ContentGuard AI Support',
  description: 'Find answers to common questions about ContentGuard AI content detection accuracy, plagiarism checking database, user privacy, file formats, and free usage limits.',
  keywords: ['AI detector FAQ', 'plagiarism checker support', 'is my content private', 'writing tools support'],
};

export default function FAQPage() {
  return (
    <div className="bg-bg-primary min-h-screen py-14 sm:py-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <FAQSection />

        {/* Bottom support card */}
        <div className="mt-14 text-center">
          <div className="max-w-md mx-auto bg-bg-card border border-border-custom p-8 rounded-2xl shadow-md shadow-premium-glow">
            <h3 className="text-lg font-bold text-text-primary mb-2 font-syne">Have more questions?</h3>
            <p className="text-xs sm:text-sm text-text-muted mb-5 leading-relaxed">
              Our team is here to help with integrations, false positives, or API access.
            </p>
            <Link
              href="mailto:saishshinde92@gmail.com"
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-text-primary bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_20px_rgba(124,92,252,0.35)] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
