import type { Metadata } from 'next';
import { WordCounterClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Free Word Counter — Count Words, Characters, Sentences',
    description: 'Count words, characters, sentences, and paragraphs in real-time. Analyze vocabulary density and average word/sentence length. Free online word counter.',
    keywords: ['word counter', 'character counter', 'word count online', 'sentence counter', 'text counter'],
    openGraph: {
      title: 'Free Word Counter — Count Words, Characters, Sentences',
      description: 'Analyze real-time word counting, unique vocabulary densities, and writing statistics.',
      type: 'website',
      url: 'https://contentguard.ai/word-counter',
    },
  };
}

export default function WordCounterPage() {
  return <WordCounterClient />;
}
