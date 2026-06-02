import type { Metadata } from 'next';
import { PlagiarismClient } from './client';

export function generateMetadata(): Metadata {
  return {
    title: 'Free Plagiarism Checker — Check Content Originality',
    description: 'Check your content for plagiarism with our free plagiarism checker. Get detailed similarity reports, matched sources, and originality scores. No signup required.',
    keywords: ['plagiarism checker', 'plagiarism checker free', 'check plagiarism online', 'originality checker', 'similarity checker'],
    openGraph: {
      title: 'Free Plagiarism Checker — Check Content Originality',
      description: 'Scan text against billions of online documents. Get similarity indexes and sources instantly.',
      type: 'website',
      url: 'https://contentguard.ai/plagiarism-checker',
    },
  };
}

export default function PlagiarismCheckerPage() {
  return <PlagiarismClient />;
}
