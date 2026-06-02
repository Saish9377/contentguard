import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — ContentGuard AI',
  description: 'Learn how ContentGuard AI protects your data, documents, and privacy. No content is stored or shared.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-syne font-extrabold tracking-tight mb-8">
          Privacy{' '}
          <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">
            Policy
          </span>
        </h1>
        
        <div className="bg-bg-card border border-border-custom rounded-2xl p-8 space-y-6 shadow-xl shadow-premium-glow leading-relaxed text-sm text-text-muted">
          <p className="text-xs text-accent-light-purple font-bold uppercase tracking-wider">
            Last Updated: June 2, 2026
          </p>

          <p>
            At ContentGuard AI, your privacy is our absolute priority. We operate under a strict <strong>Zero-Retention Policy</strong>. 
            All text content, files, and analysis inputs processed through our tools are analyzed transiently in memory and are discarded immediately 
            after the analysis is delivered to your browser.
          </p>

          <hr className="border-border-custom/50" />

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">1. Information We Do Not Collect</h2>
            <p>
              We do not store or keep records of:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The text you paste, type, or submit.</li>
              <li>Files you upload (PDFs, DOCX, TXT).</li>
              <li>Analysis outputs, heatmap summaries, plagiarism scores, or metric metadata.</li>
              <li>Personal identifiers (names, emails, IP addresses) associated with your documents.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">2. Use of Third-Party API Services</h2>
            <p>
              When high-accuracy Hugging Face analysis is triggered:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Relevant text blocks or sentences are queried securely to Hugging Face Inference endpoints.</li>
              <li>These queries are governed by Hugging Face’s privacy standards and are used exclusively for computing machine-learning logits.</li>
              <li>No query information is cached or stored by us or third-party engines.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">3. Cookies and Local Storage</h2>
            <p>
              We use <code>localStorage</code> purely to remember your theme preferences (e.g. Dark/Light mode toggle state stored via <code>cg-theme</code>). 
              No tracking cookies or marketing pixels are used.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">4. Updates to This Policy</h2>
            <p>
              We may update this policy occasionally. Any changes will be posted on this page with an updated timestamp.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary font-syne">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, feel free to contact us at <code>saishshinde92@gmail.com</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
