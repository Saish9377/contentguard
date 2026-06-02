import Link from 'next/link';
import { Shield } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-bg-card border-t border-border-custom text-text-muted mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-light-purple flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-bg-primary" />
              </div>
              <span className="font-syne font-extrabold text-lg tracking-tight">
                <span className="text-text-primary">Content</span>
                <span className="text-accent-purple">Guard</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-text-muted mb-4">
              Free AI content detection, plagiarism checking, and writing analysis. No signup required.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">
              Tools
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/ai-detector" className="text-sm hover:text-text-primary transition-colors">
                  AI Detector
                </Link>
              </li>
              <li>
                <Link href="/plagiarism-checker" className="text-sm hover:text-text-primary transition-colors">
                  Plagiarism
                </Link>
              </li>
              <li>
                <Link href="/grammar-checker" className="text-sm hover:text-text-primary transition-colors">
                  Grammar
                </Link>
              </li>
              <li>
                <Link href="/readability-checker" className="text-sm hover:text-text-primary transition-colors">
                  Readability
                </Link>
              </li>
              <li>
                <Link href="/citation-generator" className="text-sm hover:text-text-primary transition-colors">
                  Citations
                </Link>
              </li>
              <li>
                <Link href="/word-counter" className="text-sm hover:text-text-primary transition-colors">
                  Word Counter
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">
              Resources
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/resources" className="text-sm hover:text-text-primary transition-colors">
                  Resources Hub
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm hover:text-text-primary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-sm hover:text-text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm hover:text-text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold text-text-primary mb-4 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm hover:text-text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm hover:text-text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm hover:text-text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with pill badges */}
        <div className="mt-12 pt-8 border-t border-border-custom/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © {new Date().getFullYear()} ContentGuard. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-bg-input text-accent-purple border border-border-custom">
              Free forever
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-bg-input text-accent-green border border-border-custom">
              No signup required
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-bg-input text-accent-pink border border-border-custom">
              Your content stays private
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
