import type { Metadata } from 'next';
import { PlagiarismClient } from './client';

const BASE_URL = 'https://contentguard.saishshinde2030.workers.dev';
const PAGE_URL = `${BASE_URL}/plagiarism-checker`;
const TITLE = 'Free Plagiarism Checker — Detect Copied Content Online';
const DESCRIPTION =
  'Check plagiarism free online with detailed similarity reports. Get Unique%, Exact Match%, and Partial Match% scores with source links. No signup — instant results.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'free plagiarism checker',
    'plagiarism checker online',
    'check plagiarism free',
    'plagiarism detector',
    'similarity checker',
    'duplicate content checker',
    'check for plagiarism',
    'plagiarism checker for students',
    'essay plagiarism checker',
    'originality checker free',
    'turnitin alternative free',
    'free alternative to turnitin',
    'plagiarism checker with AI detection',
    'plagiarism checker for teachers',
    'plagiarism checker for bloggers',
    'website plagiarism checker free',
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

export default function PlagiarismCheckerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free Plagiarism Checker — ContentGuard AI',
    url: PAGE_URL,
    description:
      'Free plagiarism checker online. Scan text against billions of web and academic sources. Get exact match, partial match, and unique content scores.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Web source matching',
      'Academic source checking',
      'Exact match detection',
      'Partial match detection',
      'Originality score',
      'Source URL citations',
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How is ContentGuard different from Turnitin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Turnitin requires an institutional license — your school or employer has to pay for access and create accounts. ContentGuard AI is completely free for individuals, with no signup needed. You also get plagiarism detection and AI content detection in a single scan, so you can verify originality and check for AI-generated text at the same time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a word or character limit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You need at least 10 words for a meaningful analysis. The maximum is 50,000 characters per scan — roughly 8,000–10,000 words, which comfortably covers most essays, research papers, and blog posts. There is no daily scan limit.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I check website or blog content, not just essays?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Bloggers and content marketers use ContentGuard to catch duplicate content across the web — whether someone has scraped your article or you want to make sure a freelancer\'s draft is original before publishing. The checker cross-references text against web sources the same way it handles academic papers.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <PlagiarismClient />

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-syne font-extrabold tracking-tight text-text-primary mb-10 text-center">
          Common Questions About Our{' '}
          <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            Plagiarism Checker
          </span>
        </h2>

        <div className="space-y-8">
          {/* Q1 */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-text-primary mb-3">
              How is ContentGuard different from Turnitin?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Turnitin requires an institutional license — your school or employer
              has to pay for access and create accounts. ContentGuard AI is
              completely free for individuals, with no signup needed. You also get
              plagiarism detection and AI content detection in a single scan, so
              you can verify originality and check for AI-generated text at the
              same time instead of using two separate tools.
            </p>
          </div>

          {/* Q2 */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-text-primary mb-3">
              Is there a word or character limit?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              You need at least 10 words for a meaningful analysis. The maximum
              is 50,000 characters per scan — roughly 8,000–10,000 words, which
              comfortably covers most essays, research papers, and blog posts.
              There is no daily scan limit.
            </p>
          </div>

          {/* Q3 */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="text-sm sm:text-base font-bold text-text-primary mb-3">
              Can I check website or blog content, not just essays?
            </h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Absolutely. Bloggers and content marketers use ContentGuard to
              catch duplicate content across the web — whether someone has
              scraped your article or you want to make sure a freelancer&apos;s draft
              is original before publishing. Just paste the text from any page
              and the checker will cross-reference it against web sources, the
              same way it handles academic papers.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
