'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  FileText, 
  CheckCircle2, 
  Download,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { FullAnalysisResult, PlagiarismMatch } from '@/types/analysis';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePlagiarismReport } from '@/lib/pdf-generator';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Custom Count-Up Animation Hook supporting prefers-reduced-motion
function useCountUp(endValue: number, duration: number = 600) {
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setCount(endValue);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic ease-out: f(t) = t * (2 - t)
      const easeProgress = progress * (2 - progress);
      
      const currentValue = Math.round(startValue + easeProgress * (endValue - startValue));
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [endValue, duration, prefersReducedMotion]);

  return count;
}

// Dynamically import other tabs to optimize performance and prevent bundle bloating
const AITab = dynamic(() => import('./tabs/AITab'), { ssr: false });
const GrammarTab = dynamic(() => import('./tabs/GrammarTab'), { ssr: false });
const MetricsTab = dynamic(() => import('./tabs/MetricsTab'), { ssr: false });
const ToneTab = dynamic(() => import('./tabs/ToneTab'), { ssr: false });

interface PlagiarismResultsProps {
  result: FullAnalysisResult;
  onReset: () => void;
}

interface HighlightRange {
  start: number;
  end: number;
  type: 'exact' | 'partial';
  source: string;
  url?: string;
  matchPercentage: number;
}

export function PlagiarismResults({ result, onReset }: PlagiarismResultsProps) {
  const { plagiarism, text = '', writingMetrics } = result;
  const [activeTab, setActiveTab] = useState<'ai' | 'plagiarism' | 'grammar' | 'metrics' | 'tone'>('plagiarism');
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [hoveredMatchIndex, setHoveredMatchIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const totalWords = writingMetrics.wordCount || 1;
  const totalChars = writingMetrics.characterCount || 0;
  const totalSentences = writingMetrics.sentenceCount || Math.ceil(totalWords / 15);
  const totalParagraphs = writingMetrics.paragraphCount || Math.ceil(totalWords / 50);

  // Read Time / Speak Time formulas
  const readTime = Math.max(1, Math.ceil(totalWords / 200));
  const speakTime = Math.max(1, Math.ceil(totalWords / 130));

  // 1. All active matches from the check
  const activeMatches = useMemo(() => {
    return plagiarism.matches || [];
  }, [plagiarism.matches]);

  // 2. Compute metrics
  const metrics = useMemo(() => {
    const similarity = plagiarism.similarityScore;
    const originality = plagiarism.originalityScore;

    const exactMatchedWords = activeMatches
      .filter(m => m.matchPercentage >= 70)
      .reduce((sum, m) => sum + m.text.split(/\s+/).filter(Boolean).length, 0);

    const exact = Math.min(similarity, Math.round((exactMatchedWords / totalWords) * 100));
    const partial = Math.max(0, similarity - exact);
    const unique = Math.max(0, 100 - similarity);

    return {
      similarity,
      exact,
      partial,
      unique
    };
  }, [activeMatches, totalWords, plagiarism.similarityScore, plagiarism.originalityScore]);

  const animatedSimilarity = useCountUp(metrics.similarity);
  const animatedExact = useCountUp(metrics.exact);
  const animatedPartial = useCountUp(metrics.partial);
  const animatedUnique = useCountUp(metrics.unique);

  // 3. Highlighted ranges (merging overlaps for rendering document text)
  const highlightedSegments = useMemo(() => {
    if (!text) return [];

    const ranges: HighlightRange[] = activeMatches
      .filter(m => m.startIndex !== undefined && m.endIndex !== undefined)
      .map(m => ({
        start: m.startIndex,
        end: m.endIndex,
        type: m.matchPercentage >= 70 ? 'exact' : 'partial',
        source: m.source,
        url: m.url,
        matchPercentage: m.matchPercentage,
      }));

    ranges.sort((a, b) => a.start - b.start);

    // Merge overlapping/adjacent ranges
    const merged: HighlightRange[] = [];
    for (const range of ranges) {
      if (merged.length === 0) {
        merged.push({ ...range });
      } else {
        const last = merged[merged.length - 1];
        if (range.start <= last.end) {
          last.end = Math.max(last.end, range.end);
          if (range.type === 'exact') {
            last.type = 'exact';
          }
          if (!last.source.includes(range.source)) {
            last.source = `${last.source}, ${range.source}`;
          }
        } else {
          merged.push({ ...range });
        }
      }
    }

    const segments: { type: 'text' | 'match'; text: string; matchType?: 'exact' | 'partial'; source?: string; url?: string; matchPercentage?: number }[] = [];
    let currentIndex = 0;

    merged.forEach(range => {
      if (range.start > currentIndex) {
        segments.push({
          type: 'text',
          text: text.substring(currentIndex, range.start),
        });
      }
      segments.push({
        type: 'match',
        text: text.substring(range.start, range.end),
        matchType: range.type,
        source: range.source,
        url: range.url,
        matchPercentage: range.matchPercentage,
      });
      currentIndex = range.end;
    });

    if (currentIndex < text.length) {
      segments.push({
        type: 'text',
        text: text.substring(currentIndex),
      });
    }

    return segments;
  }, [activeMatches, text]);

  // 4. Export Plagiarism Report PDF
  const handleExportPDF = async () => {
    setExportStatus('loading');
    try {
      const plagiarismReportData = {
        text,
        originalityScore: metrics.unique,
        similarityScore: metrics.similarity,
        matches: activeMatches.map(m => ({
          text: m.text,
          matchPercentage: m.matchPercentage,
          source: m.source,
          url: m.url,
          startIndex: m.startIndex || 0,
          endIndex: m.endIndex || 0,
        })),
        wordCount: totalWords,
        characterCount: totalChars,
        sentenceCount: totalSentences,
        paragraphCount: totalParagraphs,
        reportId: result.id,
        generatedAt: new Date(result.timestamp),
        
        // Premium fields
        aiScore: result.aiDetection?.aiScore || 0,
        grammarScore: result.grammar?.grammarScore || 95,
        qualityScore: result.qualityScore?.overallScore || 90,
        readabilityScore: result.readability?.fleschReadingEase || 60,
        readingLevel: result.readability?.readingLevel || 'College',
        tone: result.tone ? result.tone.tone : 'Neutral',
        toneConfidence: result.tone ? result.tone.score : 100,
        avgSentenceLength: writingMetrics.averageSentenceLength || 15,
        grammarErrors: result.grammar?.errorCount || 0,
        plagiarismMatches: activeMatches.length
      };
      
      // Enforce minimum 1.5s visual spinner duration
      await Promise.all([
        generatePlagiarismReport(plagiarismReportData),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
      
      setExportStatus('success');
      toast.success('Plagiarism report downloaded successfully!');
      
      // Reset back to idle after 3s
      setTimeout(() => {
        setExportStatus('idle');
      }, 3000);
    } catch (err) {
      console.error('Failed to generate plagiarism report:', err);
      toast.error('Failed to export plagiarism report.');
      setExportStatus('idle');
    }
  };

  // SVG parameters for Donut Chart
  const r = 48;
  const circ = 2 * Math.PI * r; // 301.6
  const valUnique = (metrics.unique / 100) * circ;
  const valPlagiarized = (metrics.similarity / 100) * circ;

  return (
    <div className="space-y-6">
      
      {/* 1. Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <motion.div
            initial={prefersReducedMotion ? {} : { y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400"
          >
            <motion.div
              initial={prefersReducedMotion ? {} : { rotateY: 90 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </motion.div>
            ANALYSIS COMPLETE
          </motion.div>
          <button
            onClick={onReset}
            className="px-4 py-2 border border-border-custom bg-transparent rounded-xl text-xs font-bold text-text-muted hover:text-text-primary hover:bg-bg-input transition-all cursor-pointer active:scale-95"
          >
            ← Scan New Content
          </button>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExportPDF}
          disabled={exportStatus !== 'idle'}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_20px_rgba(124,92,252,0.3)] text-text-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-bold w-full sm:w-auto active:scale-95 disabled:opacity-85 disabled:cursor-not-allowed shadow-md overflow-hidden relative min-w-[170px] h-[42px]"
        >
          <AnimatePresence mode="wait">
            {exportStatus === 'loading' ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 justify-center w-full"
              >
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Exporting...
              </motion.span>
            ) : exportStatus === 'success' ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 text-emerald-400 justify-center w-full font-bold"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Report Downloaded!
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 justify-center w-full"
              >
                <Download className="w-4 h-4 shrink-0" />
                Export Report
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* 2. Main Score Card (Single unified dark card, border-radius: 16px) */}
      <div className="bg-bg-card border border-border-custom rounded-2xl p-6 shadow-sm flex flex-col gap-6">
        
        {/* Top Row: 4 metric pills with vertical dividers (Staggered Stlide-Up) */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: prefersReducedMotion ? 0 : 0.1
              }
            }
          }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 border-b border-border-custom/30 pb-6"
        >
          
          {/* Plagiarism */}
          <motion.div
            variants={{
              hidden: { y: prefersReducedMotion ? 0 : 16, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
            }}
            className="flex items-center gap-3 px-2 md:px-6 md:border-r md:border-border-custom/20"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted">Plagiarism</span>
              <span className="text-2xl font-extrabold text-red-500">{animatedSimilarity}%</span>
            </div>
          </motion.div>

          {/* Exact Match */}
          <motion.div
            variants={{
              hidden: { y: prefersReducedMotion ? 0 : 16, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
            }}
            className="flex items-center gap-3 px-2 md:px-6 md:border-r md:border-border-custom/20"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted">Exact Match</span>
              <span className="text-2xl font-extrabold text-red-500">{animatedExact}%</span>
            </div>
          </motion.div>

          {/* Partial Match */}
          <motion.div
            variants={{
              hidden: { y: prefersReducedMotion ? 0 : 16, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
            }}
            className="flex items-center gap-3 px-2 md:px-6 md:border-r md:border-border-custom/20"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted">Partial Match</span>
              <span className="text-2xl font-extrabold text-amber-500">{animatedPartial}%</span>
            </div>
          </motion.div>

          {/* Unique */}
          <motion.div
            variants={{
              hidden: { y: prefersReducedMotion ? 0 : 16, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
            }}
            className="flex items-center gap-3 px-2 md:px-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted">Unique</span>
              <span className="text-2xl font-extrabold text-emerald-500">{animatedUnique}%</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Middle Row: Large donut on left, stats table on right */}
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 py-2">
          
          {/* Left Side: Big Donut Chart (250px) */}
          <div className="relative flex items-center justify-center w-[220px] h-[220px] sm:w-[250px] sm:h-[250px] shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
              {/* Background Ring */}
              <circle
                cx="60"
                cy="60"
                r={r}
                className="stroke-zinc-100 dark:stroke-zinc-800/80"
                strokeWidth="12"
                fill="transparent"
              />
              
              {metrics.similarity === 0 ? (
                /* Full green ring when 0% plagiarism */
                <motion.circle
                  cx="60"
                  cy="60"
                  r={r}
                  className="stroke-emerald-500"
                  strokeWidth="12"
                  fill="transparent"
                  initial={prefersReducedMotion ? {} : { strokeDasharray: `0 ${circ}` }}
                  animate={{ strokeDasharray: `${circ} 0` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              ) : (
                <>
                  {/* Unique portion (Green) */}
                  {metrics.unique > 0 && (
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={r}
                      className="stroke-emerald-500"
                      strokeWidth="12"
                      fill="transparent"
                      initial={prefersReducedMotion ? {} : { strokeDasharray: `0 ${circ}` }}
                      animate={{ strokeDasharray: `${valUnique} ${circ - valUnique}` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Plagiarized portion (Red) */}
                  {metrics.similarity > 0 && (
                    <motion.circle
                      cx="60"
                      cy="60"
                      r={r}
                      className="stroke-red-500"
                      strokeWidth="12"
                      fill="transparent"
                      initial={prefersReducedMotion ? {} : { strokeDasharray: `0 ${circ}` }}
                      animate={{ strokeDasharray: `${valPlagiarized} ${circ - valPlagiarized}` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      strokeDashoffset={-valUnique}
                      strokeLinecap="round"
                    />
                  )}
                </>
              )}
            </svg>
            
            {/* Center percentage label */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={cn(
                "text-4xl font-extrabold transition-colors duration-200",
                metrics.similarity === 0 ? "text-emerald-500" : "text-text-primary"
              )}>
                {metrics.similarity}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mt-1">Plagiarism</span>
            </div>
          </div>

          {/* Right Side: Document Stats Table (clean, borderless, alternating bg) */}
          <div className="flex-1 w-full overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: 'Words', val: totalWords },
                  { label: 'Characters', val: totalChars.toLocaleString() },
                  { label: 'Sentences', val: totalSentences },
                  { label: 'Paragraphs', val: totalParagraphs },
                  { label: 'Read Time', val: `${readTime} min(s)` },
                  { label: 'Speak Time', val: `${speakTime} min(s)` }
                ].map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={cn(
                      "transition-colors duration-150",
                      idx % 2 === 0 ? "bg-bg-input/25 dark:bg-bg-input/10" : "bg-transparent"
                    )}
                  >
                    <td className="px-4 py-2.5 text-text-muted font-medium">{row.label}</td>
                    <td className="px-4 py-2.5 text-right text-text-primary font-bold">{row.val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Tabs menu below card */}
      <div className="flex gap-1 border-b border-border-custom pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'ai', label: 'AI Detection' },
          { id: 'plagiarism', label: 'Plagiarism' },
          { id: 'grammar', label: 'Grammar' },
          { id: 'metrics', label: 'Metrics & Structure' },
          { id: 'tone', label: 'Tone Analysis' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex items-center gap-1.5 px-5 py-3 border-b-2 text-xs font-semibold transition-all focus:outline-none -mb-px cursor-pointer",
                isActive
                  ? "border-accent-purple text-accent-light-purple"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              {tab.label}
              {tab.id === 'plagiarism' && (
                <span className="text-[10px] text-emerald-500 font-bold ml-1">✓ active</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Panels */}
      <div className="min-h-[300px]">
        {/* Render other tabs dynamically */}
        {activeTab === 'ai' && (
          <AITab aiDetection={result.aiDetection} readability={result.readability} text={text} />
        )}
        
        {activeTab === 'grammar' && (
          <GrammarTab grammar={result.grammar} />
        )}
        
        {activeTab === 'metrics' && (
          <MetricsTab
            readability={result.readability}
            essayStructure={result.essayStructure}
            writingMetrics={result.writingMetrics}
            qualityScore={result.qualityScore}
          />
        )}
        
        {activeTab === 'tone' && result.tone && (
          <ToneTab toneResult={result.tone} />
        )}

        {/* Custom Plagiarism Tab Redesign */}
        {activeTab === 'plagiarism' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Left: Interactive Document Text */}
            <div className="lg:col-span-3 flex flex-col bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm min-h-[450px]">
              <div className="flex items-center gap-2 mb-4 border-b border-border-custom/50 pb-3">
                <FileText className="w-5 h-5 text-accent-purple" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">Interactive Document Text</h3>
                  <p className="text-[10px] text-text-muted font-medium">Hover matched text to view sources</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 text-sm leading-relaxed text-text-primary whitespace-pre-wrap select-text font-sans antialiased">
                {text ? (
                  highlightedSegments.map((segment, idx) => {
                    if (segment.type === 'text') {
                      return <span key={idx}>{segment.text}</span>;
                    }

                    const isExact = segment.matchType === 'exact';
                    const sourceMatches = activeMatches.some(
                      (m, matchIdx) => hoveredMatchIndex === matchIdx && segment.source?.includes(m.source)
                    );

                    return (
                      <span
                        key={idx}
                        className={cn(
                          "relative cursor-pointer transition-all duration-150 rounded-t px-0.5 font-medium break-words border-b-2",
                          isExact
                            ? sourceMatches
                              ? "border-red-500 bg-red-500/20 text-red-900 dark:text-red-200 shadow-[0_2px_8px_rgba(239,68,68,0.1)]"
                              : "border-red-500/50 bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/15"
                            : sourceMatches
                              ? "border-orange-500 bg-orange-500/20 text-orange-900 dark:text-orange-200 shadow-[0_2px_8px_rgba(249,115,22,0.1)]"
                              : "border-orange-500/50 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/15"
                        )}
                        title={`${segment.matchPercentage}% match: ${segment.source}`}
                      >
                        {segment.text}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-text-muted italic">No text provided for analysis.</p>
                )}
              </div>
            </div>

            {/* Right: Matched Sources Section */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-text-primary text-sm">Matched Sources & Academic Citations</h3>

                {activeMatches.length > 0 ? (
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: prefersReducedMotion ? 0 : 0.08
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="space-y-3 max-h-[460px] overflow-y-auto pr-1"
                  >
                    {activeMatches.map((match, index) => {
                      const isHovered = hoveredMatchIndex === index;

                      return (
                        <motion.div 
                          key={index} 
                          onMouseEnter={() => setHoveredMatchIndex(index)}
                          onMouseLeave={() => setHoveredMatchIndex(null)}
                          variants={{
                            hidden: { x: prefersReducedMotion ? 0 : -20, opacity: 0 },
                            show: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
                          }}
                          className={cn(
                            "p-4 rounded-xl border bg-bg-card transition-all duration-200 space-y-2.5",
                            isHovered
                              ? "border-accent-purple/60 bg-accent-purple/5 shadow-md shadow-premium-glow/5"
                              : "border-border-custom hover:border-zinc-300 dark:hover:border-zinc-800"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* Grey Circle with Number */}
                              <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-text-muted shrink-0">
                                {index + 1}
                              </span>
                              
                              {match.url ? (
                                <a 
                                  href={match.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-semibold text-accent-purple hover:underline flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[200px]"
                                >
                                  {match.url.replace(/https?:\/\/(www\.)?/, '')}
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs font-semibold text-text-primary truncate">
                                  {match.source}
                                </span>
                              )}
                            </div>
                            
                            {/* Match percentage pill badge */}
                            <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 shrink-0">
                              {match.matchPercentage}% MATCH
                            </span>
                          </div>

                          {/* Matched Text Snippet */}
                          <p className="text-xs italic text-text-muted bg-bg-input/30 p-2.5 rounded border border-border-custom/30 leading-relaxed font-serif">
                            "{match.text}"
                          </p>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center">
                    <span className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </span>
                    <p className="text-sm font-semibold text-emerald-500">
                      ✅ No plagiarism detected. Your content is 100% original.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
