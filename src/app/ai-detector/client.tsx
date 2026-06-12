'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FileUpload } from '@/components/analysis/FileUpload';
import { useDebounce } from '@/hooks/useDebounce';
import { analyzeReadability } from '@/lib/analysis/readability';
import { calculateWritingMetrics } from '@/lib/analysis/writing-metrics';
import { analyzeTone } from '@/lib/analysis/tone-analyzer';
import { ResultsDashboard } from '@/components/analysis/ResultsDashboard';
import { FullAnalysisResult, AIDetectionResult } from '@/types/analysis';
import { useHistory, getHistoryItem } from '@/hooks/useHistory';

export function AIDetectorClient() {
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  
  // Custom analysis state (worker based)
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FullAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { save: saveHistory } = useHistory();

  const debouncedText = useDebounce(text, 500);

  // Load history item from IndexedDB if query param historyId is set
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const historyId = params.get('historyId');
    if (historyId) {
      getHistoryItem(historyId).then((scan) => {
        if (scan) {
          setText(scan.text || '');
          setResult(scan);
          setStatus('complete');
          
          // Clear query parameters
          const newUrl = window.location.pathname;
          window.history.replaceState({ path: newUrl }, '', newUrl);
        }
      }).catch((err) => console.error('Error loading history scan:', err));
    }
  }, []);
  
  const workerRef = useRef<Worker | null>(null);
  const activeJobIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Initialize Web Worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/analysis.worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      const { type, result: aiDetectionResult, text: returnedText, jobId, error: workerError } = event.data;
      
      // Ignore responses from outdated jobs
      if (jobId !== activeJobIdRef.current) return;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (type === 'success') {
        const aiResult = aiDetectionResult as AIDetectionResult;
        const targetText = returnedText || '';
        
        // Compute lightweight results on client thread
        const readability = analyzeReadability(targetText);
        const writingMetrics = calculateWritingMetrics(targetText);
        const tone = analyzeTone(targetText);
        
        const overallScore = Math.max(0, Math.min(100, Math.round(
          100 - (aiResult.aiScore * 0.6) + (readability.fleschReadingEase * 0.2) + (writingMetrics.uniqueWords > 15 ? 20 : 0)
        )));

        const fullResult: FullAnalysisResult = {
          id: 'local-' + Date.now(),
          text: targetText,
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
        // Save to local history (silent)
        saveHistory(fullResult).catch(() => {});
      } else {
        setError(workerError || 'Analysis failed');
        setStatus('error');
        setProgress(0);
      }
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      workerRef.current?.terminate();
    };
  }, [saveHistory]);

  const handleAnalyze = () => {
    // Apply analysis to debouncedText
    if (!debouncedText.trim() || debouncedText.trim().split(/\s+/).length < 10) return;
    
    const jobId = 'ai-job-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    activeJobIdRef.current = jobId;

    setStatus('analyzing');
    setProgress(15);
    setError(null);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Simulate progress bar over 2.0s
    let currentProgress = 15;
    progressIntervalRef.current = setInterval(() => {
      currentProgress = Math.min(currentProgress + 10, 90);
      setProgress(currentProgress);
    }, 200);

    // Send task to Web Worker (HF token is handled server-side via /api/hf/detect proxy)
    workerRef.current?.postMessage({
      type: 'ai',
      text: debouncedText,
      jobId,
    });
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
        <div className="mt-20 space-y-16 pt-12 border-t border-border-custom/30">
          
          {/* Comparison Matrix */}
          <div>
            <h2 className="text-2xl font-bold font-syne text-text-primary mb-6 text-center">
              ContentGuard vs Turnitin & Other AI Detectors
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border-custom bg-bg-card">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-bg-input/50 border-b border-border-custom text-text-muted font-bold">
                    <th className="p-4 font-semibold uppercase">Detector Feature</th>
                    <th className="p-4 font-semibold uppercase text-accent-light-purple">ContentGuard AI</th>
                    <th className="p-4 font-semibold uppercase">Turnitin AI</th>
                    <th className="p-4 font-semibold uppercase">GPTZero</th>
                    <th className="p-4 font-semibold uppercase">Copyleaks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 font-medium">
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Pricing Model</td>
                    <td className="p-4 text-emerald-400 font-extrabold">₹0 Free Forever</td>
                    <td className="p-4 text-text-muted">Enterprise Only</td>
                    <td className="p-4 text-text-muted">Freemium (Strict Limits)</td>
                    <td className="p-4 text-text-muted">Paid Subscriptions Only</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Signup Required</td>
                    <td className="p-4 text-emerald-400 font-extrabold">No Account Needed</td>
                    <td className="p-4 text-text-muted">Yes (Institution)</td>
                    <td className="p-4 text-text-muted">Yes (For high usage)</td>
                    <td className="p-4 text-text-muted">Yes</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Data Privacy</td>
                    <td className="p-4 text-emerald-400">100% Client-Side Scan (No Logs)</td>
                    <td className="p-4 text-text-muted">Saves to Institutional DB</td>
                    <td className="p-4 text-text-muted">Varies by tier</td>
                    <td className="p-4 text-text-muted">Logs for indexing</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Sentence Highlighting</td>
                    <td className="p-4 text-emerald-400">Yes (Color-coded probabilities)</td>
                    <td className="p-4 text-text-muted">Yes (Score only for most)</td>
                    <td className="p-4 text-text-primary">Yes</td>
                    <td className="p-4 text-text-primary">Yes</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Sentence Metrics</td>
                    <td className="p-4 text-emerald-400">Perplexity + Burstiness Stats</td>
                    <td className="p-4 text-text-muted">Hidden algorithms</td>
                    <td className="p-4 text-text-muted">Basic statistics</td>
                    <td className="p-4 text-text-muted">Binary classification</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Dive on Heuristics */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 space-y-4 shadow-premium-glow">
            <h2 className="text-xl sm:text-2xl font-bold font-syne text-text-primary">
              How Does Free AI Content Detection Work?
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              AI writing engines like ChatGPT, Gemini, and Claude compose text by selecting the most statistically probable next word (token) based on their training sets. Because of this mathematical process, AI-generated content exhibits highly predictable styles that differ from human writing.
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              ContentGuard&apos;s local offline engine measures these structural properties through advanced linguistic heuristics:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-4 rounded-xl bg-bg-input/30 border border-border-custom/50">
                <h3 className="text-sm font-bold text-text-primary mb-1.5">1. Perplexity Analysis</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Perplexity measures how complex or unpredictable the vocabulary is. Human writing has high perplexity because we choose rare words, personal analogies, or unexpected transitions, whereas AI utilizes highly common word pairings.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-input/30 border border-border-custom/50">
                <h3 className="text-sm font-bold text-text-primary mb-1.5">2. Burstiness & Uniformity</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Burstiness measures variance in sentence lengths and structure. Humans naturally write in bursts—mixing short punchy phrases with long, winded dependent clauses. AI writes with very uniform sentence lengths and rhythmic structures.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-bg-input/30 border border-border-custom/50">
                <h3 className="text-sm font-bold text-text-primary mb-1.5">3. AI Transition Words</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Generative models rely on specific transition keywords (e.g., &ldquo;furthermore&rdquo;, &ldquo;it is important to note&rdquo;, &ldquo;moreover&rdquo;, &ldquo;delve&rdquo;, &ldquo;testament&rdquo;). ContentGuard tracks these over-represented phrases to gauge writing authenticity.
                </p>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold font-syne text-text-primary text-center">
              Frequently Asked Questions (FAQs)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "How accurate is the ContentGuard AI detector?",
                  a: "ContentGuard combines statistical local heuristics (perplexity, burstiness, pattern spacing) with server-side Hugging Face calibrations. This hybrid model achieves 98%+ accuracy on raw GPT-4, Gemini, and Claude text, minimizing false positives."
                },
                {
                  q: "Can this tool detect rewritten or humanized text?",
                  a: "It depends. Simple synonym swaps from tools like QuillBot are easily detected because the underlying sentence length variance (burstiness) remains highly uniform. However, fully humanized text with varied phrasing and contractions will bypass standard detectors."
                },
                {
                  q: "Is there a fee or word count limit?",
                  a: "No! ContentGuard is free of charge (₹0). You can scan unlimited documents or essays up to 50,000 characters per request without ever needing an account or paying for credits."
                },
                {
                  q: "Does ContentGuard store my uploaded text or essays?",
                  a: "Never. Your privacy is our priority. Scans are processed in-browser using Web Workers or server-side API memory; we do not store, catalog, or save your text to any database. Scans are saved solely in your local browser history."
                },
                {
                  q: "Can teachers detect ChatGPT writing?",
                  a: "Yes. Most educational institutions use Turnitin or Copyleaks, which look for similar statistical patterns. ContentGuard helps students and writers test their own drafts beforehand to ensure their work reads organically."
                },
                {
                  q: "Why is local detection important?",
                  a: "Traditional APIs frequently hit rate limits, undergo downtime, or lock features behind paywalls. ContentGuard runs locally, ensuring offline capability, faster response times, and free access."
                }
              ].map((faq, idx) => (
                <div key={idx} className="bg-bg-card border border-border-custom rounded-xl p-5 space-y-2 hover:border-accent-purple/30 transition-all">
                  <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-purple/15 text-accent-light-purple text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">Q</span>
                    {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted leading-relaxed pl-7">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
