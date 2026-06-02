import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — ContentGuard AI',
  description: 'Understand the terms and guidelines for using the free ContentGuard AI content checker tools.',
};

export default function TermsPage() {
  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-syne font-extrabold tracking-tight mb-8">
          Terms of{' '}
          <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            Service
          </span>
        </h1>
        
        <div className="bg-bg-card border border-border-custom rounded-2xl p-8 space-y-6 shadow-xl shadow-premium-glow leading-relaxed text-sm text-text-muted">
          <p className="text-xs text-accent-light-purple font-bold uppercase tracking-wider">
            Last Updated: June 2, 2026
          </p>

          <p>
            Welcome to ContentGuard AI. By using our website, utilities, and writing analysis tools, you agree to comply with and be bound by the following terms.
          </p>

          <hr className="border-border-custom/50" />

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">1. Usage License</h2>
            <p>
              We grant you a free, non-exclusive, revocable license to access our platform and use the content check tools (AI Detector, Plagiarism, Grammar, Readability, Citations, Word Counter) for personal, academic, or professional analysis.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">2. Acceptable Use</h2>
            <p>
              You agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submit malicious payloads, viruses, or scrapers designed to disrupt our platform.</li>
              <li>Attempt to reverse-engineer our frontend processing or exploit our backend endpoint interfaces.</li>
              <li>Use scripts or bots to query our endpoints at a frequency that degrades server performance.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">3. Accuracy of Results</h2>
            <p>
              Our metrics, AI indicators, trust ratings, and grammar correction flags are computed based on statistical heuristics and machine-learning models. They are intended for guidance and self-correction purposes. We make no guarantees of 100% detection accuracy or grammatical perfection.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">4. Freemium Limitations</h2>
            <p>
              Free analysis checks are subject to word count limits (e.g. 500 words per submission). Circumventing these limits via automation is a violation of these terms.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">5. Disclaimer of Warranties</h2>
            <p>
              ContentGuard AI is provided &ldquo;as is&rdquo; without any warranty of any kind, either express or implied.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">6. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of your jurisdiction, without regard to conflict of law principles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
