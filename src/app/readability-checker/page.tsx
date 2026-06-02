import type { Metadata } from 'next';
import { ReadabilityClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Free Readability Checker — Analyze Text Complexity',
    description: 'Analyze text readability with Flesch-Kincaid, Gunning Fog, and more. Check reading level, complexity, and estimated reading time. Free, no signup.',
    keywords: ['readability checker', 'readability score', 'Flesch-Kincaid', 'reading level checker', 'text complexity'],
    openGraph: {
      title: 'Free Readability Checker — Analyze Text Complexity',
      description: 'Check reading ease, complexity scores, and estimated reading time of your content.',
      type: 'website',
      url: 'https://contentguard.ai/readability-checker',
    },
  };
}

export default function ReadabilityCheckerPage() {
  return <ReadabilityClient />;
}
