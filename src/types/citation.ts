export interface CitationSource {
  type: 'book' | 'journal' | 'website' | 'conference';
  authors: string[];
  title: string;
  year: string;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  url?: string;
  accessDate?: string;
  doi?: string;
  edition?: string;
  city?: string;
  conference?: string;
}

export type CitationStyle = 'apa' | 'mla' | 'harvard' | 'chicago';

export interface CitationOutput {
  style: CitationStyle;
  formatted: string;
  inText: string;
}
