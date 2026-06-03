'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, Zap, ShieldAlert, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/analysis/FileUpload';
import { useDebounce } from '@/hooks/useDebounce';
import { analyzeReadability } from '@/lib/analysis/readability';
import { calculateWritingMetrics } from '@/lib/analysis/writing-metrics';
import { analyzeTone } from '@/lib/analysis/tone-analyzer';
import { generatePlagiarismReport } from '@/lib/pdf-generator';
import { PlagiarismResults } from '@/components/analysis/PlagiarismResults';
import { toast } from 'sonner';
import { FullAnalysisResult, PlagiarismResult } from '@/types/analysis';

const FREE_WORD_LIMIT = 500;

export function PlagiarismClient() {
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  
  // Custom analysis state (worker based)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFreemiumOverlay, setShowFreemiumOverlay] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const prefersReducedMotion = useReducedMotion();
  const prefersReducedMotionRef = useRef(false);
  prefersReducedMotionRef.current = !!prefersReducedMotion;

  // Visual checklist scanning progress
  const [activeStep, setActiveStep] = useState(0);
  const activeStepRef = useRef(0);
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  const pendingResultRef = useRef<FullAnalysisResult | null>(null);
  const isWorkerFinishedRef = useRef(false);
  const activeStepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedText = useDebounce(text, 500);

  const handleExportPDF = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const plagiarismReportData = {
        text: result.text,
        originalityScore: result.plagiarism.originalityScore,
        similarityScore: result.plagiarism.similarityScore,
        matches: result.plagiarism.matches.map(m => ({
          text: m.text,
          matchPercentage: m.matchPercentage,
          source: m.source,
          url: m.url,
          startIndex: m.startIndex || 0,
          endIndex: m.endIndex || 0,
        })),
        wordCount: result.writingMetrics.wordCount,
        characterCount: result.writingMetrics.characterCount,
        sentenceCount: result.writingMetrics.sentenceCount,
        paragraphCount: result.writingMetrics.paragraphCount,
        reportId: result.id,
        generatedAt: new Date(result.timestamp),
        
        // Premium fields
        aiScore: result.aiDetection.aiScore,
        grammarScore: result.grammar.grammarScore,
        qualityScore: result.qualityScore.overallScore,
        readabilityScore: result.readability.fleschReadingEase,
        readingLevel: result.readability.readingLevel,
        tone: result.tone ? result.tone.tone : 'Neutral',
        toneConfidence: result.tone ? result.tone.score : 100,
        avgSentenceLength: result.writingMetrics.averageSentenceLength,
        grammarErrors: result.grammar.errorCount,
        plagiarismMatches: result.plagiarism.matches.length
      };
      await generatePlagiarismReport(plagiarismReportData);
      toast.success('Plagiarism report downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate plagiarism report:', err);
      toast.error('Failed to export plagiarism report.');
    } finally {
      setIsExporting(false);
    }
  };

  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      const { type, result: plagiarismResult, error: workerError } = event.data;

      if (type === 'success') {
        const plagResult = plagiarismResult as PlagiarismResult;
        
        // Compute lightweight results on client thread
        const readability = analyzeReadability(text);
        const writingMetrics = calculateWritingMetrics(text);
        const tone = analyzeTone(text);
        
        const overallScore = Math.max(0, Math.min(100, Math.round(
          plagResult.originalityScore * 0.5 + readability.fleschReadingEase * 0.3 + 20
        )));

        const fullResult: FullAnalysisResult = {
          id: 'local-plag-' + Date.now(),
          text,
          timestamp: new Date().toISOString(),
          aiDetection: {
            aiScore: 0,
            humanScore: 100,
            confidenceScore: 100,
            sentences: [],
            metrics: { perplexity: 50, burstiness: 50, vocabularyRichness: 50, sentenceUniformity: 50, repetitionScore: 0 },
            humanizerScore: { aiGenerated: 0, humanized: 100 },
            modelDetection: { chatgpt: 0, gemini: 0, claude: 0, likelySource: 'Human' },
            trustScore: 100,
            suggestions: [],
          },
          plagiarism: plagResult,
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
            originality: plagResult.originalityScore,
            grammar: 95,
            readability: readability.fleschReadingEase,
            structure: 90,
            breakdown: [
              { label: 'Originality Index', score: plagResult.originalityScore, weight: 0.5 },
              { label: 'Readability', score: readability.fleschReadingEase, weight: 0.3 },
              { label: 'Writing Quality', score: 90, weight: 0.2 },
            ],
          },
          tone,
        };

        pendingResultRef.current = fullResult;
        isWorkerFinishedRef.current = true;

        if (activeStepRef.current >= 4 || prefersReducedMotionRef.current) {
          setResult(fullResult);
          setProgress(100);
          setStatus('complete');
          setShowFreemiumOverlay(true);
          if (activeStepIntervalRef.current) {
            clearInterval(activeStepIntervalRef.current);
            activeStepIntervalRef.current = null;
          }
        }
      } else {
        setError(workerError || 'Plagiarism analysis failed');
        setStatus('error');
        setProgress(0);
        if (activeStepIntervalRef.current) {
          clearInterval(activeStepIntervalRef.current);
          activeStepIntervalRef.current = null;
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [text]);

  const handleAnalyze = () => {
    if (!debouncedText.trim() || debouncedText.trim().split(/\s+/).length < 10) return;
    
    setStatus('analyzing');
    setProgress(15);
    setError(null);
    setActiveStep(0);
    isWorkerFinishedRef.current = false;
    pendingResultRef.current = null;

    if (activeStepIntervalRef.current) {
      clearInterval(activeStepIntervalRef.current);
    }

    if (prefersReducedMotion) {
      setActiveStep(4);
    } else {
      let currentStep = 0;
      activeStepIntervalRef.current = setInterval(() => {
        currentStep += 1;
        setActiveStep(currentStep);
        setProgress(Math.min(15 + currentStep * 20, 90));
        
        if (currentStep >= 4) {
          if (activeStepIntervalRef.current) {
            clearInterval(activeStepIntervalRef.current);
            activeStepIntervalRef.current = null;
          }
          if (isWorkerFinishedRef.current && pendingResultRef.current) {
            setResult(pendingResultRef.current);
            setProgress(100);
            setStatus('complete');
            setShowFreemiumOverlay(true);
          }
        }
      }, 800);
    }

    const token = process.env.NEXT_PUBLIC_HF_TOKEN || undefined;

    // Send task to worker
    workerRef.current?.postMessage({
      type: 'plagiarism',
      text: debouncedText,
      token,
    });
  };

  const reset = () => {
    setText('');
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setActiveStep(0);
    isWorkerFinishedRef.current = false;
    pendingResultRef.current = null;
    if (activeStepIntervalRef.current) {
      clearInterval(activeStepIntervalRef.current);
      activeStepIntervalRef.current = null;
    }
  };

  const handleFileExtracted = (extractedText: string) => {
    setText(extractedText);
    // Keep inputMode as 'file' to preserve the card view!
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = text.length;
  const maxLength = 50000;
  const pctUsed = Math.min(100, Math.round((charCount / maxLength) * 100));

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-10 sm:py-16">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs font-bold text-accent-light-purple mb-5">
            <Search className="w-4 h-4 text-accent-purple" />
            PLAGIARISM CHECKER
          </div>
          <h1 className="text-4xl sm:text-5xl font-syne font-extrabold tracking-tight mb-4">
            Check Content{' '}
            <span className="bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink bg-clip-text text-transparent">
              Originality
            </span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto">
            Verify your content is original with detailed similarity reports and source matching.
          </p>
        </motion.div>

        {/* Checker Component */}
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
              {status !== 'analyzing' && (
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
              )}

              {/* Textarea or File Uploader or Step-by-Step Progress */}
              {status === 'analyzing' ? (
                <div className="flex flex-col py-6 px-4 sm:px-12 max-w-xl mx-auto bg-bg-input/10 rounded-xl border border-border-custom/30">
                  <div className="text-center space-y-2 mb-8">
                    <h3 className="text-lg font-bold font-syne text-text-primary">Scanning Document</h3>
                    <p className="text-xs text-text-muted">Performing multi-layered similarity checks...</p>
                  </div>

                  {/* Sequential progress checklist */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: {
                          staggerChildren: prefersReducedMotion ? 0 : 0.15
                        }
                      }
                    }}
                    initial="hidden"
                    animate="show"
                    className="space-y-4 mb-8"
                  >
                    {[
                      { id: 0, text: "Reading document..." },
                      { id: 1, text: "Extracting sentences..." },
                      { id: 2, text: "Checking web sources..." },
                      { id: 3, text: "Generating report..." }
                    ].map((step, idx) => {
                      const isFuture = idx > activeStep;
                      const isActive = idx === activeStep;
                      const isCompleted = idx < activeStep;

                      return (
                        <motion.div
                          key={step.id}
                          variants={{
                            hidden: { opacity: 0, y: 10 },
                            show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }
                          }}
                          className="flex items-center justify-between p-4 rounded-xl border border-border-custom bg-bg-input/20 backdrop-blur-sm transition-all duration-300"
                          style={{ opacity: isFuture ? 0.3 : 1 }}
                        >
                          <div className="flex items-center gap-3.5">
                            {/* Left Indicator Dot */}
                            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
                              <AnimatePresence mode="wait">
                                {isCompleted ? (
                                  <motion.div
                                    key="completed-dot"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                    className="w-2.5 h-2.5 rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                  />
                                ) : isActive ? (
                                  <motion.div
                                    key="active-dot"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                    className="w-2.5 h-2.5 rounded-full bg-accent-purple shadow-[0_0_8px_rgba(124,92,252,0.6)]"
                                  />
                                ) : (
                                  <div
                                    key="future-dot"
                                    className="w-2.5 h-2.5 rounded-full border border-border-custom bg-zinc-800/80"
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                            
                            <span className={cn(
                              "text-sm font-semibold transition-all duration-300",
                              isFuture ? "text-text-muted" : "text-text-primary"
                            )}>
                              {step.text}
                            </span>
                          </div>

                          {/* Right Status Icon */}
                          <div className="flex items-center justify-center w-6 h-6 shrink-0">
                            <AnimatePresence mode="wait">
                              {isCompleted ? (
                                <motion.div
                                  key="checked"
                                  initial={{ scale: 0, rotate: -15 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                  className="text-accent-green"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </motion.div>
                              ) : isActive ? (
                                <motion.div
                                  key="loading"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <Loader2 className="w-4.5 h-4.5 text-accent-purple animate-spin" />
                                </motion.div>
                              ) : null}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Linear progress bar at the bottom */}
                  <div className="w-full h-1.5 bg-bg-input border border-border-custom rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink"
                      initial={{ width: '0%' }}
                      animate={{ width: `${Math.min(activeStep * 25, 100)}%` }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ) : inputMode === 'text' ? (
                <div className="relative rounded-xl border border-border-custom bg-bg-input overflow-hidden">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value.slice(0, maxLength));
                      if (status === 'complete' || status === 'error') {
                        setStatus('idle');
                        setResult(null);
                      }
                    }}
                    placeholder="Paste your text here to check for plagiarism... (minimum 10 words)"
                    disabled={false}
                    className="w-full p-5 bg-transparent text-text-primary text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-muted focus:border-accent-purple/50 min-h-[200px] sm:min-h-[300px]"
                  />
                  
                  {/* Textarea footer bar */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-custom text-xs text-text-muted font-semibold bg-bg-primary/30">
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
                </div>
              ) : (
                <div className="bg-bg-input rounded-xl border border-border-custom p-8 text-center">
                  <FileUpload 
                    onTextExtracted={handleFileExtracted} 
                    onClear={() => setText('')}
                    disabled={false} 
                  />
                </div>
              )}

              {/* Action Button */}
              <div className="mt-6 flex flex-col items-center justify-center">
                <motion.button
                  whileTap={prefersReducedMotion ? {} : { scale: 0.97 }}
                  onClick={handleAnalyze}
                  disabled={!debouncedText.trim() || wordCount < 10 || status === 'analyzing'}
                  className="px-10 py-4 rounded-xl font-bold text-text-primary bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_25px_rgba(124,92,252,0.45)] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === 'analyzing' ? (
                    <>
                      <Loader2 className="w-5 h-5 text-text-primary animate-spin mr-1" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Check Plagiarism
                    </>
                  )}
                </motion.button>

                {wordCount < 10 && text.trim().length > 0 && (
                  <p className="text-xs text-accent-pink mt-3 font-semibold">
                    Please paste at least 10 words to run plagiarism check.
                  </p>
                )}
              </div>

              {/* Error block */}
              {error && (
                <div className="mt-6 p-4 bg-accent-pink/10 border border-accent-pink/20 rounded-xl">
                  <p className="text-sm text-accent-pink font-semibold">{error}</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Back Button */}
              <div className="flex justify-start">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl border border-border-custom bg-bg-card hover:bg-bg-input text-sm font-semibold transition-all cursor-pointer active:scale-95"
                >
                  ← Scan New Content
                </button>
              </div>

              {/* Dashboard Wrapper */}
              <div className="relative">
                <PlagiarismResults result={result} onReset={reset} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
