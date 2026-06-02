import type { Metadata } from 'next';
import { GrammarClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Free Grammar Checker — Fix Grammar & Spelling Errors',
    description: 'Fix grammar, spelling, and punctuation errors with our free grammar checker. Get intelligent correction suggestions for any text. No signup required.',
    keywords: ['grammar checker', 'grammar checker free', 'spell check', 'punctuation checker', 'writing checker'],
    openGraph: {
      title: 'Free Grammar Checker — Fix Grammar & Spelling Errors',
      description: 'Fix grammar, spelling, and style errors instantly with intelligent corrections.',
      type: 'website',
      url: 'https://contentguard.ai/grammar-checker',
    },
  };
}

export default function GrammarCheckerPage() {
  return <GrammarClient />;
}
