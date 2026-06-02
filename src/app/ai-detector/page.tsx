import type { Metadata } from 'next';
import { AIDetectorClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Free AI Content Detector — Detect ChatGPT, Gemini & Claude',
    description: 'Instantly check if your text was written by ChatGPT, Gemini, Claude or a human. Get a sentence-level heatmap and trust score. 100% free with no registration.',
    keywords: ['AI detector', 'AI content detector', 'ChatGPT detector', 'AI text detector', 'detect AI writing', 'AI checker free'],
    openGraph: {
      title: 'Free AI Content Detector — Detect AI-Generated Text',
      description: 'Check content for ChatGPT, Gemini, Claude patterns with sentence-level highlighting. Free, instant, no signup required.',
      type: 'website',
      url: 'https://contentguard.ai/ai-detector',
    },
  };
}

export default function AIDetectorPage() {
  return <AIDetectorClient />;
}
