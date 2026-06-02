import type { Metadata } from 'next';
import { CitationClient } from './client';

export const metadata: Metadata = {
  title: 'Free Citation Generator — APA, MLA, Harvard, Chicago',
  description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles. Free citation generator for books, journals, websites, and more. No signup required.',
  keywords: ['citation generator', 'APA citation', 'MLA citation', 'Harvard citation', 'Chicago citation', 'reference generator'],
};

export default function CitationGeneratorPage() {
  return <CitationClient />;
}
