'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export function SEOContent() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="prose prose-lg max-w-none"
        >
          <h2 className="text-3xl font-extrabold tracking-tight mb-8 text-center">
            The Most Comprehensive Free{' '}
            <span className="gradient-text">AI Content Detection</span> Platform
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose">
            <div className="bg-white border border-zinc-150 p-6 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-zinc-900 text-base mb-2.5 flex items-center gap-2">
                <span className="text-lg">🔍</span> AI Content Detector
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                Our <Link href="/ai-detector" className="text-indigo-650 hover:underline font-semibold">free AI content detector</Link> uses 
                advanced statistical analysis to identify AI-generated text. Whether content was written by ChatGPT, 
                Claude, Gemini, or other AI models, our detector analyzes perplexity, burstiness, and vocabulary patterns 
                to provide accurate AI probability scores with sentence-level highlighting.
              </p>
            </div>

            <div className="bg-white border border-zinc-150 p-6 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-zinc-900 text-base mb-2.5 flex items-center gap-2">
                <span className="text-lg">📋</span> Plagiarism Checker
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                Check your content for originality with our <Link href="/plagiarism-checker" className="text-indigo-650 hover:underline font-semibold">free plagiarism checker</Link>. 
                Get detailed similarity reports showing matched sentences, source references, 
                and originality scores. Perfect for academic papers, blog posts, and professional documents.
              </p>
            </div>

            <div className="bg-white border border-zinc-150 p-6 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-zinc-900 text-base mb-2.5 flex items-center gap-2">
                <span className="text-lg">✍️</span> Grammar Checker
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                Improve your writing with our <Link href="/grammar-checker" className="text-indigo-650 hover:underline font-semibold">free grammar checker</Link>. 
                Detect grammar errors, spelling mistakes, and punctuation issues with intelligent 
                correction suggestions. Works with essays, emails, reports, and any text content.
              </p>
            </div>

            <div className="bg-white border border-zinc-150 p-6 rounded-2xl shadow-sm">
              <h3 className="font-extrabold text-zinc-900 text-base mb-2.5 flex items-center gap-2">
                <span className="text-lg">📊</span> Writing Analysis
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-medium">
                Get comprehensive writing analysis including <Link href="/readability-checker" className="text-indigo-650 hover:underline font-semibold">readability scores</Link>, 
                <Link href="/word-counter" className="text-indigo-650 hover:underline font-semibold">word count</Link>, 
                essay structure analysis, and writing quality scores. Understand your content&apos;s 
                complexity and accessibility at a glance.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-sm sm:text-base mb-6 max-w-2xl mx-auto leading-relaxed font-medium">
              ContentGuard AI is trusted by students, educators, content creators, and professionals 
              across the globe. Our platform processes thousands of documents daily, providing instant, 
              accurate analysis without requiring registration or payment.
            </p>
            <Link
              href="/ai-detector"
              className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 text-sm"
            >
              Start Analyzing — It&apos;s Free
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
