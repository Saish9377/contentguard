'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Hash } from 'lucide-react';
import { calculateWritingMetrics } from '@/lib/analysis/writing-metrics';
import { AdSlot } from '@/components/layout/AdSlot';
import { useDebounce } from '@/hooks/useDebounce';

export function WordCounterClient() {
  const [text, setText] = useState('');

  // Debounce the text value before running analysis metrics
  const debouncedText = useDebounce(text, 500);

  const metrics = useMemo(() => calculateWritingMetrics(debouncedText), [debouncedText]);

  const cards = [
    { label: 'Words', value: metrics.wordCount, color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/10' },
    { label: 'Characters', value: metrics.characterCount, color: 'text-accent-purple', bg: 'bg-accent-purple/5 border-accent-purple/10' },
    { label: 'Characters (no spaces)', value: metrics.characterCountNoSpaces, color: 'text-indigo-500', bg: 'bg-indigo-500/5 border-indigo-500/10' },
    { label: 'Sentences', value: metrics.sentenceCount, color: 'text-accent-green', bg: 'bg-accent-green/5 border-accent-green/10' },
    { label: 'Paragraphs', value: metrics.paragraphCount, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/10' },
    { label: 'Unique Words', value: metrics.uniqueWords, color: 'text-accent-pink', bg: 'bg-accent-pink/5 border-accent-pink/10' },
    { label: 'Avg Word Length', value: metrics.averageWordLength, color: 'text-cyan-500', bg: 'bg-cyan-500/5 border-cyan-500/10' },
    { label: 'Avg Sentence Length', value: metrics.averageSentenceLength, color: 'text-teal-500', bg: 'bg-teal-500/5 border-teal-500/10' },
  ];

  return (
    <div className="container-wide py-10 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-sm text-accent-light-purple font-medium mb-5">
          <Hash className="w-4 h-4" />
          Word Counter
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 animate-fadeIn">
          Free Word Counter —{' '}<span className="gradient-text">Count Words & Characters Online</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Real-time word, character, sentence, and paragraph counting with detailed writing metrics.
        </p>
      </motion.div>

      <div className="max-w-3xl mx-auto mb-8">
        
        {/* Input Textarea */}
        <div className="relative rounded-xl border border-border-custom bg-bg-input overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder="Start typing or paste your text here..."
            className="w-full p-5 bg-transparent text-text-primary text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-muted focus:border-accent-purple/50 min-h-[200px] md:min-h-[300px]"
          />
        </div>

        {/* Metrics Display Section with Freemium Blur */}
        <div className="relative mt-6">
          <div>
            {/* Real-time metrics grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {cards.map(card => (
                <div key={card.label} className={`${card.bg} rounded-xl p-4 text-center border transition-all hover:scale-105`}>
                  <div className={`text-2xl font-bold ${card.color} tabular-nums`}>
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </div>
                  <div className="text-xs text-text-muted mt-1">{card.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Vocabulary density bar */}
            {debouncedText.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 bg-bg-card border border-border-custom rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">Vocabulary Density</span>
                  <span className="text-sm font-bold text-accent-light-purple">{(metrics.vocabularyDensity * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-bg-input rounded-full overflow-hidden border border-border-custom">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-light-purple transition-all duration-500"
                    style={{ width: `${metrics.vocabularyDensity * 100}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Vocabulary density measures the ratio of unique words to total words. Higher values indicate more diverse vocabulary.
                </p>
              </motion.div>
            )}

            {/* Pro Statistics Section */}
            {debouncedText.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-2 text-accent-light-purple font-bold text-sm uppercase tracking-wide">
                  <Hash className="w-4 h-4 text-accent-purple" />
                  Word Statistics Pro
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-bg-input border border-border-custom rounded-lg p-3.5 space-y-1">
                    <span className="text-xs text-text-muted font-semibold block">Longest Word</span>
                    <span className="text-sm font-extrabold text-text-primary break-all">{metrics.longestWord || 'None'}</span>
                  </div>
                  <div className="bg-bg-input border border-border-custom rounded-lg p-3.5 space-y-1">
                    <span className="text-xs text-text-muted font-semibold block">Average Sentence Length</span>
                    <span className="text-sm font-extrabold text-text-primary">{metrics.averageSentenceLength} words</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-text-muted font-semibold block">Top Used Words (excluding stopwords)</span>
                  {metrics.topWords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {metrics.topWords.map((item, idx) => (
                        <span key={idx} className="bg-accent-purple/10 border border-accent-purple/20 text-accent-light-purple px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                          {item.word}
                          <span className="bg-accent-purple/20 text-accent-light-purple w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold">{item.count}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted">Not enough diverse words to display top frequency list.</span>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AdSlot format="horizontal" className="max-w-3xl mx-auto mb-8" />

      {/* SEO Content Section */}
      <div className="mt-16 pt-8 border-t border-border-custom/30 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold font-syne text-text-primary mb-4">
          About Our Free Word Counter
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Our free word counter provides instant, detailed writing metrics for writers, students, bloggers, and editors online for free. The ContentGuard free word counter online tool analyzes character count (with and without spaces), sentence count, paragraph count, and average word length in real time. Simply type or paste your text to check reading time, speaking time, and vocabulary density instantly. Perfect for tracking essay limits, social media character caps, or copywriter drafts. Features require no account signup or text storage, offering secure and private analysis at no cost.
        </p>
      </div>
    </div>
  );
}
