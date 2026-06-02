import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BookOpen, HelpCircle, LayoutGrid, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Writers & Educators Resources — ContentGuard AI',
  description: 'Access writing resources, tool documentation, FAQ guides, privacy standards, and integration instructions for ContentGuard AI content detection systems.',
  keywords: ['writing resources', 'AI detector guides', 'plagiarism checker help', 'teacher resources'],
};

const resourceCards = [
  {
    title: 'Platform Features',
    description: 'Explore the details and capabilities of our 6 core analysis engines, including readability levels, grammar rules, and citation generators.',
    icon: LayoutGrid,
    href: '/features',
    linkText: 'Explore Features',
  },
  {
    title: 'How Our Engines Work',
    description: 'Dive deep into the mathematical models (perplexity, burstiness, n-gram matching) powering our AI detector and plagiarism checkers.',
    icon: CheckCircle2,
    href: '/how-it-works',
    linkText: 'Read Architecture Guide',
  },
  {
    title: 'Frequently Asked Questions',
    description: 'Get immediate answers to queries regarding accuracy rates, paper storage policies, batch file limits, and integration capabilities.',
    icon: HelpCircle,
    href: '/faq',
    linkText: 'Browse FAQs',
  },
  {
    title: 'Privacy & Data Security',
    description: 'We prioritize privacy. Learn why ContentGuard AI is trusted by scholars and enterprise writers due to our zero-retention guarantee.',
    icon: ShieldAlert,
    href: '/privacy',
    linkText: 'Read Privacy Standards',
  },
];

export default function ResourcesPage() {
  return (
    <div className="bg-bg-primary min-h-screen py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs text-accent-purple dark:text-accent-light-purple font-bold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Resources Hub
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary tracking-tight font-syne">
            Knowledge Base & Guides
          </h1>
          <p className="text-xs sm:text-sm text-text-muted font-medium mt-2 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about integrating, utilizing, and trust-verifying our free online writing tools.
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resourceCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-bg-card border border-border-custom rounded-2xl p-6.5 shadow-md shadow-premium-glow hover:border-accent-purple/30 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-accent-purple dark:text-accent-light-purple" />
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-text-primary mb-2 font-syne">
                    {card.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-text-muted font-medium leading-relaxed mb-6">
                    {card.description}
                  </p>
                </div>
                <Link
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-purple dark:text-accent-light-purple hover:underline transition-colors"
                >
                  <span>{card.linkText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Bottom Contact CTA */}
        <div className="mt-16 text-center">
          <p className="text-text-muted text-xs sm:text-sm font-medium">
            Looking for something else? Reach out at <Link href="mailto:saishshinde92@gmail.com" className="text-accent-purple dark:text-accent-light-purple hover:underline font-bold">saishshinde92@gmail.com</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
