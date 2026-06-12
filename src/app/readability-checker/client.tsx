'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Zap, ArrowRight } from 'lucide-react';
import { ResultsDashboard } from '@/components/analysis/ResultsDashboard';
import { useAnalysis } from '@/hooks/useAnalysis';
import { AdSlot } from '@/components/layout/AdSlot';
import { useDebounce } from '@/hooks/useDebounce';

export function ReadabilityClient() {
  const [text, setText] = useState('');
  const { status, progress, result, error, analyze, reset } = useAnalysis();

  const debouncedText = useDebounce(text, 500);

  const handleAnalyze = async () => {
    if (!debouncedText.trim() || debouncedText.trim().split(/\s+/).length < 10) return;
    try {
      await analyze(debouncedText);
    } catch (err) {
      console.error('Analysis execution failed:', err);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="container-wide py-10 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-sm text-orange-600 font-medium mb-5">
          <BookOpen className="w-4 h-4" />
          Readability Checker
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 animate-fadeIn">
          Free Readability Checker —{' '}<span className="gradient-text">Analyze Your Writing Level</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Measure reading level, complexity score, and estimated reading time for your content.
        </p>
      </motion.div>

      {status !== 'complete' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-3xl mx-auto mb-8">
          <div className="relative rounded-xl border border-border-custom bg-bg-input overflow-hidden">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (status === 'error') {
                  reset();
                }
              }}
              placeholder="Paste your text here to analyze readability..."
              disabled={status === 'analyzing'}
              className="w-full p-5 bg-transparent text-text-primary text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-muted focus:border-accent-purple/50 min-h-[200px] md:min-h-[300px]"
            />
          </div>

          <div className="mt-6 flex justify-center">
            <button onClick={handleAnalyze} disabled={!debouncedText.trim() || wordCount < 10 || status === 'analyzing'} className="btn-primary text-base px-10 py-4 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {status === 'analyzing' ? (<><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing... {progress}%</>) : (<><Zap className="w-5 h-5" />Analyze Readability<ArrowRight className="w-4 h-4" /></>)}
            </button>
          </div>

          {status === 'analyzing' && (
            <div className="mt-4 w-full h-2 bg-bg-input rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, ease: 'easeOut' }} // Readability = 0.8s duration
              />
            </div>
          )}

          {error && (<div className="mt-4 p-4 bg-accent-pink/10 border border-accent-pink/20 rounded-xl"><p className="text-sm text-accent-pink">{error}</p></div>)}
        </motion.div>
      )}

      <AdSlot format="horizontal" className="max-w-3xl mx-auto mb-8" />

      {status === 'complete' && result && (
        <>
          <div className="flex justify-center mb-8"><button onClick={() => { setText(''); reset(); }} className="btn-secondary text-sm px-6 py-2.5 cursor-pointer">← Analyze New Text</button></div>
          
          {/* Results Dashboard with freemium check */}
          <div className="max-w-4xl mx-auto relative">
            <ResultsDashboard result={result} />
          </div>
        </>
      )}
      {/* SEO Content Section */}
      <div className="mt-16 pt-8 border-t border-border-custom/30 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold font-syne text-text-primary mb-4">
          About Our Free Readability Checker
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Our free readability checker helps writers, students, bloggers, and editors analyze the readability of any text online for free. The ContentGuard free readability tool calculates the Flesch Reading Ease score, Flesch-Kincaid Grade Level, and estimated reading/speaking times instantly. Simply paste your text to get detailed clarity ratings, sentence structure breakdowns, and vocabulary complexity scores. Optimize your content for search engines, simplify technical guides, or polish academic drafts. With no signup or login required, you can evaluate your writing density and quality immediately without restriction.
        </p>
      </div>
    </div>
  );
}
