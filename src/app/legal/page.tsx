import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, FileText, Lock, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Legal Center — ContentGuard AI',
  description: 'Access terms, privacy practices, and compliance guidelines for ContentGuard AI.',
};

export default function LegalPage() {
  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-syne font-extrabold tracking-tight mb-8">
          Legal{' '}
          <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            Center
          </span>
        </h1>
        
        <div className="bg-bg-card border border-border-custom rounded-2xl p-8 space-y-6 shadow-xl shadow-premium-glow leading-relaxed text-sm text-text-muted">
          <p className="text-xs text-accent-light-purple font-bold uppercase tracking-wider">
            Overview
          </p>

          <p>
            Welcome to the ContentGuard AI Legal Center. Here you can find references and detailed document resources outlining how we govern our services, protect user privacy, and enforce terms of service.
          </p>

          <hr className="border-border-custom/50" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/privacy" className="flex items-start gap-4 p-5 bg-bg-input border border-border-custom hover:border-accent-purple/35 rounded-2xl transition-all hover:scale-[1.01] group">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-light-purple flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-accent-light-purple transition-colors">Privacy Policy</h3>
                <p className="text-xs text-text-muted leading-normal">Learn about our strict zero-retention policy and data safety guidelines.</p>
              </div>
            </Link>

            <Link href="/terms" className="flex items-start gap-4 p-5 bg-bg-input border border-border-custom hover:border-accent-purple/35 rounded-2xl transition-all hover:scale-[1.01] group">
              <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-light-purple flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-text-primary group-hover:text-accent-light-purple transition-colors">Terms of Service</h3>
                <p className="text-xs text-text-muted leading-normal">Understand usage rules, license rights, and disclaimer clauses.</p>
              </div>
            </Link>
          </div>

          <div className="space-y-3 pt-4">
            <h2 className="text-lg font-bold text-text-primary font-syne flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-light-purple" />
              AI Compliance & Standards
            </h2>
            <p>
              Our automated content detection engines rely on advanced heuristics and large language model classifiers (including Roberta OpenAI models). We guarantee that no submitted text or extracted output file content is used to train these models or recorded in any persistent database.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent-light-purple" />
              Copyright & Attribution
            </h2>
            <p>
              The plagiarism scoring mechanism is powered by Jaccard similarity and semantic sentence comparisons. ContentGuard AI matches submitted content against simulated datasets for demonstrative originality auditing and supports MLA/APA automated citation builders to encourage correct intellectual formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
