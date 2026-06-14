import type { Metadata } from 'next';
import { ContactClient } from './ContactClient';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/contact`;
const TITLE = 'Contact ContentGuard AI — Support & Feedback';
const DESCRIPTION =
  'Contact the ContentGuard AI team for support, feedback, feature requests, or partnership inquiries. We are happy to help with any questions about our free writing tools.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'contact ContentGuard AI',
    'ContentGuard support',
    'AI detector support',
    'plagiarism checker help',
    'writing tools feedback',
    'ContentGuard partnership',
    'report false positive AI detection',
    'ContentGuard AI contact',
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

export default function ContactPage() {
  return <ContactClient />;
}
