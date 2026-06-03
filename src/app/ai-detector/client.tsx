'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Zap, Cpu, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/analysis/FileUpload';
import { useDebounce } from '@/hooks/useDebounce';
import { analyzeReadability } from '@/lib/analysis/readability';
import { calculateWritingMetrics } from '@/lib/analysis/writing-metrics';
import { analyzeTone } from '@/lib/analysis/tone-analyzer';
import { ResultsDashboard } from '@/components/analysis/ResultsDashboard';
import { FullAnalysisResult, AIDetectionResult } from '@/types/analysis';

const FREE_WORD_LIMIT = 500;

export function AIDetectorClient() {
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  
  // Custom analysis state (worker based)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFreemiumOverlay, setShowFreemiumOverlay] = useState(true);

  const debouncedText = useDebounce(text, 500);
  
  const workerRef = useRef<Worker | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      const { type, result: aiDetectionResult, error: workerError } = event.data;
      
      if (type === 'success') {
        const aiResult = aiDetectionResult as AIDetectionResult;
        
        // Compute lightweight results on client thread
        const readability = analyzeReadability(text);
        const writingMetrics = calculateWritingMetrics(text);
        const tone = analyzeTone(text);
        
        const overallScore = Math.max(0, Math.min(100, Math.round(
          100 - (aiResult.aiScore * 0.6) + (readability.fleschReadingEase * 0.2) + (writingMetrics.uniqueWords > 15 ? 20 : 0)
        )));

        const fullResult: FullAnalysisResult = {
          id: 'local-' + Date.now(),
          text,
          timestamp: new Date().toISOString(),
          aiDetection: aiResult,
          plagiarism: {
            originalityScore: 100,
            similarityScore: 0,
            matches: [],
            totalMatchedWords: 0,
            totalWords: writingMetrics.wordCount
          },
          readability,
          writingMetrics,
          grammar: { errors: [], errorCount: 0, warningCount: 0, suggestionCount: 0, grammarScore: 95 },
          essayStructure: {
            hasIntroduction: true,
            hasBody: true,
            hasConclusion: true,
            introductionScore: 90,
            bodyScore: 85,
            conclusionScore: 95,
            overallScore: 90,
            feedback: [],
          },
          qualityScore: {
            overallScore,
            originality: 100 - aiResult.aiScore,
            grammar: 95,
            readability: readability.fleschReadingEase,
            structure: 90,
            breakdown: [
              { label: 'AI Authenticity', score: 100 - aiResult.aiScore, weight: 0.6 },
              { label: 'Readability Level', score: readability.fleschReadingEase, weight: 0.2 },
              { label: 'Style Quality', score: 90, weight: 0.2 },
            ],
          },
          tone,
        };

        setResult(fullResult);
        setProgress(100);
        setStatus('complete');
        setShowFreemiumOverlay(true);
      } else {
        setError(workerError || 'Analysis failed');
        setStatus('error');
        setProgress(0);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [text]);

  const handleAnalyze = () => {
    // Apply analysis to debouncedText
    if (!debouncedText.trim() || debouncedText.trim().split(/\s+/).length < 10) return;
    
    setStatus('analyzing');
    setProgress(15);
    setError(null);

    // Simulate progress bar over 2.0s
    let currentProgress = 15;
    const interval = setInterval(() => {
      currentProgress = Math.min(currentProgress + 10, 90);
      setProgress(currentProgress);
    }, 200);

    const token = process.env.NEXT_PUBLIC_HF_TOKEN || undefined;

    // Send task to Web Worker
    workerRef.current?.postMessage({
      type: 'ai',
      text: debouncedText,
      token,
    });

    // Cleanup interval on complete or error inside worker message callback
    workerRef.current!.addEventListener('message', () => {
      clearInterval(interval);
    }, { once: true });
  };

  const reset = () => {
    setText('');
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
  };

  const handleFileExtracted = (extractedText: string) => {
    setText(extractedText);
    setInputMode('text');
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  const maxLength = 50000;
  const pctUsed = Math.min(100, Math.round((charCount / maxLength) * 100));

  const getAiColorClass = (score: number) => {
    if (score > 60) return 'text-accent-pink';
    if (score >= 30) return 'text-amber-500';
    return 'text-accent-green';
  };

  const getAiBgClass = (score: number) => {
    if (score > 60) return 'bg-accent-pink/10 border-accent-pink/20';
    if (score >= 30) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-accent-green/10 border-accent-green/20';
  };

  const editorStyle = {
    fontFamily: '"DM Sans", var(--font-sans), sans-serif',
    fontSize: '0.875rem',
    lineHeight: '1.625',
    letterSpacing: 'normal',
    padding: '1.25rem',
  };

  const renderOverlayContent = () => {
    if (!text) {
      return <span className="text-text-muted">Paste your text here to detect AI content... (minimum 10 words)</span>;
    }

    if (status === 'complete' && result) {
      const sentences = result.aiDetection.sentences;
      if (sentences.length > 0) {
        return sentences.map((sentence, idx) => {
          let highlightClass = '';
          if (sentence.classification === 'ai') {
            highlightClass = 'bg-accent-pink/20 text-text-primary border-b border-accent-pink/50';
          } else if (sentence.classification === 'mixed') {
            highlightClass = 'bg-amber-500/10 text-text-primary border-b border-amber-500/30';
          } else {
            highlightClass = 'bg-accent-green/5 text-text-primary border-b border-accent-green/20';
          }

          return (
            <span
              key={idx}
              className={cn('rounded px-0.5 cursor-help transition-colors', highlightClass)}
              title={`AI Prob: ${Math.round(sentence.aiProbability)}%`}
            >
              {sentence.text}{' '}
            </span>
          );
        });
      }
    }

    return <span>{text}</span>;
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs font-bold text-accent-light-purple mb-5">
            <Scan className="w-4 h-4 text-accent-purple" />
            AI CONTENT DETECTOR
          </div>
          <h1 className="text-4xl sm:text-5xl font-syne font-extrabold tracking-tight mb-4">
            Free AI Content Detector —{' '}
            <span className="bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink bg-clip-text text-transparent">
              Detect ChatGPT & Claude Text
            </span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto">
            Paste your text or upload a file to detect AI-generated content with sentence-level analysis and confidence scores.
          </p>
        </motion.div>

        {/* Detector Editor */}
        <AnimatePresence mode="wait">
          {status !== 'complete' || !result ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="bg-bg-card rounded-2xl border border-border-custom p-6 shadow-xl shadow-premium-glow mb-8"
            >
              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-border-custom/50 pb-4 overflow-x-auto whitespace-nowrap">
                <button
                  onClick={() => setInputMode('text')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                    inputMode === 'text'
                      ? 'bg-accent-purple/10 text-accent-light-purple border border-accent-purple/20'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Paste Text
                </button>
                <button
                  onClick={() => setInputMode('file')}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer',
                    inputMode === 'file'
                      ? 'bg-accent-purple/10 text-accent-light-purple border border-accent-purple/20'
                      : 'text-text-muted hover:text-text-primary'
                  )}
                >
                  Upload File
                </button>
              </div>

              {/* Input Editor with highlighting overlay */}
              {inputMode === 'text' ? (
                <div className="relative rounded-xl border border-border-custom bg-bg-input overflow-hidden min-h-[220px] sm:min-h-[300px]">
                  
                  {/* Highlights Div Behind Textarea */}
                  <div
                    ref={overlayRef}
                    className="absolute inset-0 w-full h-full pointer-events-none whitespace-pre-wrap break-words overflow-y-auto"
                    style={{ ...editorStyle, color: 'var(--text-primary)' }}
                  >
                    {renderOverlayContent()}
                  </div>

                  {/* Synced Textarea */}
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value.slice(0, maxLength));
                      if (status === 'complete' || status === 'error') {
                        setStatus('idle');
                        setResult(null);
                      }
                    }}
                    onScroll={(e) => {
                      if (overlayRef.current) {
                        overlayRef.current.scrollTop = e.currentTarget.scrollTop;
                        overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
                      }
                    }}
                    placeholder="Paste your text here to detect AI content... (minimum 10 words)"
                    disabled={status === 'analyzing'}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-text-primary resize-none focus:outline-none placeholder:text-text-muted focus:border-accent-purple/50 p-5 text-sm leading-relaxed"
                    style={{ caretColor: 'var(--text-primary)' }}
                  />

                  {/* Overlay background placeholder overlay to block clicks during analysis */}
                  {status === 'analyzing' && <div className="absolute inset-0 bg-bg-primary/20 backdrop-blur-xs z-20 pointer-events-auto" />}
                </div>
              ) : (
                <div className="bg-bg-input rounded-xl border border-border-custom p-8 text-center">
                  <FileUpload onTextExtracted={handleFileExtracted} disabled={status === 'analyzing'} />
                </div>
              )}

              {/* Editor statistics footer */}
              {inputMode === 'text' && (
                <div className="flex items-center justify-between px-5 py-3 border-b border-x border-border-custom rounded-b-xl text-xs text-text-muted font-semibold bg-bg-primary/30 mt-px">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {wordCount} words
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      {charCount} chars
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="tabular-nums">{pctUsed}%</span>
                    <div className="w-16 h-1.5 bg-bg-primary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent-purple to-accent-light-purple transition-all duration-300"
                        style={{ width: `${pctUsed}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6 flex flex-col items-center justify-center">
                <button
                  onClick={handleAnalyze}
                  disabled={!debouncedText.trim() || wordCount < 10 || status === 'analyzing'}
                  className="px-10 py-4 rounded-xl font-bold text-text-primary bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_25px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === 'analyzing' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-text-primary border-t-transparent rounded-full animate-spin mr-1" />
                      Analyzing... {progress}%
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Detect AI Content
                    </>
                  )}
                </button>

                {wordCount < 10 && text.trim().length > 0 && (
                  <p className="text-xs text-accent-pink mt-3 font-semibold">
                    Please paste at least 10 words to run AI detection.
                  </p>
                )}
              </div>

              {/* Progress Indicator */}
              {status === 'analyzing' && (
                <div className="mt-6 w-full h-1.5 bg-bg-input border border-border-custom rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-accent-purple to-accent-pink"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, ease: 'easeOut' }} // AI = 2s duration
                  />
                </div>
              )}

              {/* Error block */}
              {error && (
                <div className="mt-6 p-4 bg-accent-pink/10 border border-accent-pink/20 rounded-xl">
                  <p className="text-sm text-accent-pink font-semibold">{error}</p>
                </div>
              )}
            </motion.div>
          ) : (
            // Result View with Freemium overlay
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Back CTA */}
              <div className="flex justify-start">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl border border-border-custom bg-bg-card hover:bg-bg-input text-sm font-semibold transition-all cursor-pointer active:scale-95"
                >
                  ← Analyze New Content
                </button>
              </div>

              {/* Dashboard wrapper */}
              <div className="relative">
                <ResultsDashboard result={result} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SEO Content Section */}
        <div className="mt-16 pt-8 border-t border-border-custom/30">
          <h2 className="text-xl font-bold font-syne text-text-primary mb-4">
            About Our Free AI Content Detector
          </h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Use our free AI content detector to scan essays, articles, and documents for AI-written text. ContentGuard analyzes writing patterns to identify content generated by ChatGPT, GPT-4, Claude, and Gemini instantly for free. By examining perplexity and burstiness markers, our AI detector free tool distinguishes between human writing and AI-generated sentences. Paste your text or upload files to get sentence-level color-coded highlighting showing exact probabilities of AI origin. Trusted by educators and content editors, it requires no registration or subscription.
          </p>
        </div>

      </div>
    </div>
  );
}
