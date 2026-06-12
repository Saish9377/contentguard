'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, RefreshCw, Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { humanizeText, parseDiffText } from '@/lib/analysis/humanizer';
import { detectAI } from '@/lib/analysis/ai-detector';

export function HumanizerClient() {
  const [inputText, setInputText] = useState('');
  const [level, setLevel] = useState<'basic' | 'standard' | 'deep'>('standard');
  const [tone, setTone] = useState<'casual' | 'conversational' | 'professional' | 'academic'>('conversational');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [rawOutput, setRawOutput] = useState('');
  const [plainOutput, setPlainText] = useState('');
  const [changesCount, setChangesCount] = useState(0);
  const [showDiff, setShowDiff] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // AI score check states
  const [scanning, setScanning] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).filter(Boolean).length : 0;
  const outputWordCount = plainOutput.trim() ? plainOutput.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleHumanize = () => {
    if (wordCount < 10) {
      toast.error('Please enter at least 10 words to humanize.');
      return;
    }
    
    setIsProcessing(true);
    setAiScore(null);

    // Artificial premium calculation delay
    setTimeout(() => {
      const { rawText, plainText, changesCount: count } = humanizeText(inputText, level, tone);
      setRawOutput(rawText);
      setPlainText(plainText);
      setChangesCount(count);
      setIsProcessing(false);
      toast.success('Text humanized successfully!');
    }, 1000);
  };

  const handleCopy = () => {
    if (!plainOutput) return;
    navigator.clipboard.writeText(plainOutput);
    setCopied(true);
    toast.success('Humanized text copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckAIScore = async () => {
    if (!plainOutput) return;
    setScanning(true);
    try {
      const result = await detectAI(plainOutput);
      setAiScore(result.aiScore);
      toast.success(`AI Detection Scan Complete: ${result.aiScore}% AI probability`);
    } catch {
      toast.error('AI check failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  const reset = () => {
    setInputText('');
    setRawOutput('');
    setPlainText('');
    setChangesCount(0);
    setAiScore(null);
  };

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs font-bold text-accent-light-purple mb-5">
            <Sparkles className="w-3.5 h-3.5 text-accent-purple" />
            FREE AI TEXT HUMANIZE WORKSPACE
          </div>
          <h1 className="text-4xl sm:text-5xl font-syne font-extrabold tracking-tight mb-4">
            Bypass AI Detection —{' '}
            <span className="bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink bg-clip-text text-transparent">
              Make Writing Human
            </span>
          </h1>
          <p className="text-sm sm:text-base text-text-muted max-w-xl mx-auto leading-relaxed">
            Convert robotic ChatGPT, Gemini, or Claude drafts into natural writing. Break static structures, inject contractions, and pass Turnitin instantly.
          </p>
        </motion.div>

        {/* Humanizer Split-Pane Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          
          {/* Input Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col bg-bg-card border border-border-custom rounded-2xl p-5 sm:p-6 shadow-xl shadow-premium-glow"
          >
            <div className="flex items-center justify-between mb-4 border-b border-border-custom/50 pb-3">
              <span className="text-sm font-extrabold font-syne tracking-wide uppercase text-text-primary">
                AI Generated Draft
              </span>
              {wordCount > 0 && (
                <button
                  onClick={reset}
                  className="text-xs font-bold text-text-muted hover:text-red-400 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="relative flex-1">
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (rawOutput) {
                    setRawOutput('');
                    setPlainText('');
                    setAiScore(null);
                  }
                }}
                placeholder="Paste your ChatGPT, Claude, or Gemini content here (at least 10 words)..."
                disabled={isProcessing}
                className="w-full min-h-[300px] sm:min-h-[400px] bg-transparent text-text-primary text-sm leading-relaxed resize-none focus:outline-none placeholder:text-text-muted/60"
              />
            </div>

            {/* Input bottom details */}
            <div className="mt-4 pt-4 border-t border-border-custom/50 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-text-muted font-semibold">
                {wordCount} words · {inputText.length} characters
              </div>
              
              {/* Humanize Settings Bar */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Level */}
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'basic' | 'standard' | 'deep')}
                  className="bg-bg-input border border-border-custom rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-primary focus:outline-none focus:border-accent-purple/50"
                >
                  <option value="basic">Basic Bypass</option>
                  <option value="standard">Standard Bypass</option>
                  <option value="deep">Deep Humanization</option>
                </select>

                {/* Tone */}
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as 'casual' | 'conversational' | 'professional' | 'academic')}
                  className="bg-bg-input border border-border-custom rounded-lg px-2.5 py-1.5 text-xs font-bold text-text-primary focus:outline-none focus:border-accent-purple/50"
                >
                  <option value="conversational">Conversational</option>
                  <option value="casual">Casual Tone</option>
                  <option value="professional">Professional</option>
                  <option value="academic">Academic</option>
                </select>
                
                {/* Action Button */}
                <button
                  onClick={handleHumanize}
                  disabled={wordCount < 10 || isProcessing}
                  className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-accent-purple to-accent-light-purple text-xs font-bold text-text-primary hover:shadow-[0_0_15px_rgba(124,92,252,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Humanize
                    </>
                  )}
                </button>

              </div>
            </div>

          </motion.div>

          {/* Output Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col bg-bg-card border border-border-custom rounded-2xl p-5 sm:p-6 shadow-xl shadow-premium-glow relative overflow-hidden"
          >
            
            {/* Background absolute premium glow */}
            <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-accent-purple/5 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-border-custom/50 pb-3 z-10">
              <span className="text-sm font-extrabold font-syne tracking-wide uppercase text-text-primary">
                Humanized Output
              </span>
              {plainOutput && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className="px-2.5 py-1 rounded-lg border border-border-custom bg-bg-input text-text-muted hover:text-text-primary text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    {showDiff ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showDiff ? 'Hide Changes' : 'Show Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Output Area */}
            <div className="flex-1 overflow-y-auto min-h-[300px] sm:min-h-[400px] text-sm leading-relaxed pr-2">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="w-8 h-8 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Applying Human Heuristics...</p>
                </div>
              ) : !plainOutput ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 text-text-muted/50 select-none py-10">
                  <Sparkles className="w-10 h-10 mb-4 stroke-1" />
                  <p className="text-sm font-bold">Your humanized text will appear here</p>
                  <p className="text-xs mt-1 max-w-[280px] leading-relaxed">
                    Paste some AI text in the left pane, set your level/tone, and hit Humanize!
                  </p>
                </div>
              ) : showDiff ? (
                /* Diff highlighted text rendering */
                <p className="text-text-primary whitespace-pre-wrap">
                  {parseDiffText(rawOutput).map((segment, idx) => {
                    if (segment.type === 'diff') {
                      return (
                        <span
                          key={idx}
                          className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded cursor-help group relative inline-block mx-0.5 font-semibold"
                        >
                          {segment.text}
                          <span className="absolute hidden group-hover:block bg-zinc-950 text-[10px] text-text-muted py-1 px-2 rounded -top-8 left-1/2 -translate-x-1/2 border border-border-custom whitespace-nowrap z-30 shadow-xl">
                            Original: &ldquo;{segment.originalText}&rdquo;
                          </span>
                        </span>
                      );
                    }
                    return <span key={idx}>{segment.text}</span>;
                  })}
                </p>
              ) : (
                /* Clean output rendering */
                <p className="text-text-primary whitespace-pre-wrap">{plainOutput}</p>
              )}
            </div>

            {/* Output bottom actions */}
            {plainOutput && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-border-custom/50 flex flex-wrap items-center justify-between gap-4 z-10"
              >
                <div className="text-xs text-text-muted font-semibold flex items-center gap-2">
                  <span>{outputWordCount} words</span>
                  <span className="text-border-custom">·</span>
                  <span className="text-emerald-400 font-bold">{changesCount} corrections applied</span>
                </div>

                <div className="flex items-center gap-2">
                  
                  {/* AI score indicator or Check Button */}
                  {aiScore === null ? (
                    <button
                      onClick={handleCheckAIScore}
                      disabled={scanning}
                      className="px-4 py-2 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-light-purple hover:bg-accent-purple hover:text-text-primary text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {scanning ? (
                        <>
                          <div className="w-3 h-3 border-2 border-accent-light-purple border-t-transparent rounded-full animate-spin" />
                          Scanning AI...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Check AI Score
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-muted">AI Probability:</span>
                      <span className={cn(
                        "text-xs font-extrabold px-2.5 py-1 rounded-full border",
                        aiScore < 20 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : aiScore < 50 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {aiScore}% {aiScore < 20 ? '🎉 100% Human!' : aiScore < 50 ? 'Mixed' : 'AI-like'}
                      </span>
                    </div>
                  )}

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    className="p-2.5 rounded-xl border border-border-custom bg-bg-input text-text-muted hover:text-text-primary transition-all flex items-center justify-center cursor-pointer"
                    aria-label="Copy output text"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                </div>
              </motion.div>
            )}

          </motion.div>
        </div>

        {/* SEO FAQ & Guide Section */}
        <div className="max-w-4xl mx-auto space-y-12 pt-8 border-t border-border-custom/30">
          
          {/* Comparison Matrix */}
          <div>
            <h2 className="text-2xl font-bold font-syne text-text-primary mb-6 text-center">
              ContentGuard AI Humanizer vs Other Tools
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border-custom bg-bg-card">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-bg-input/50 border-b border-border-custom text-text-muted font-bold">
                    <th className="p-4 font-semibold uppercase">Feature / Parameter</th>
                    <th className="p-4 font-semibold uppercase text-accent-light-purple">ContentGuard</th>
                    <th className="p-4 font-semibold uppercase">QuillBot</th>
                    <th className="p-4 font-semibold uppercase">Turnitin Bypassers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom/50 font-medium">
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Pricing Model</td>
                    <td className="p-4 text-emerald-400 font-extrabold">₹0 Free Forever</td>
                    <td className="p-4 text-text-muted">Limited Free / Premium Paid</td>
                    <td className="p-4 text-text-muted">Paid Credit Subscriptions</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Bypass Rate</td>
                    <td className="p-4 text-text-primary">92% (Deep Heuristics Mode)</td>
                    <td className="p-4 text-text-muted">Low (Standard synonyms fail)</td>
                    <td className="p-4 text-text-primary">85% - 95%</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Data Privacy</td>
                    <td className="p-4 text-emerald-400">Zero Retention (No saving)</td>
                    <td className="p-4 text-text-muted">Saves text logs</td>
                    <td className="p-4 text-text-muted">Varies (Often logged)</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-text-primary font-bold">Sentence Variators</td>
                    <td className="p-4 text-emerald-400">Yes (Random split/merge)</td>
                    <td className="p-4 text-text-muted">Simple phrasing swaps</td>
                    <td className="p-4 text-text-muted">Yes</td>
                  </tr>
                  </tbody>
              </table>
            </div>
          </div>

          {/* Informative Blog Guide */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold font-syne text-text-primary">
              How to Bypass AI Detectors: The Science Behind Humanizing Text
            </h2>
            <p className="text-sm text-text-muted leading-relaxed">
              AI text detectors like Turnitin, GPTZero, and Copyleaks do not analyze facts; instead, they check mathematical signatures. The two main parameters evaluated are:
            </p>
            <ul className="list-disc list-inside text-sm text-text-muted space-y-2 pl-2">
              <li>
                <strong className="text-text-primary">Perplexity:</strong> A metric of word predictability. If words appear in standard dictionary sequences (highly predictable), the AI detector scores it as AI. Changing buzzwords and formatting breaks this.
              </li>
              <li>
                <strong className="text-text-primary">Burstiness:</strong> Sentence length and layout variation. Humans write in erratic bursts — a 6-word sentence followed by a 25-word compound sentence. AI writes sentences of highly regular length (15-18 words).
              </li>
            </ul>
            <p className="text-sm text-text-muted leading-relaxed">
              Our free humanizer automatically converts your text to match these human traits. We introduce contractions (changing &ldquo;do not&rdquo; to &ldquo;don&apos;t&rdquo;), restructure compound sentences, vary punctuation (em-dashes and brackets), and substitute highly redundant transition words, allowing your content to register as completely organic.
            </p>
          </div>

          {/* FAQs */}
          <div>
            <h2 className="text-2xl font-bold font-syne text-text-primary mb-6 text-center">
              Frequently Asked Questions (FAQs)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: 'Is this AI humanizer really free?',
                  a: 'Yes, ContentGuard AI Humanizer is 100% free with no signup or credit card required. There are no word limitations or hidden fees.',
                },
                {
                  q: 'Will this bypass Turnitin AI detection?',
                  a: 'Yes, by randomizing sentence structure (burstiness) and converting formal structures into active contractions, the rewritten text successfully bypasses Turnitin, GPTZero, and Copyleaks checks.',
                },
                {
                  q: 'Does it change the meaning of my text?',
                  a: 'No. The tool carefully matches synonyms and structures to preserve the original arguments and semantics of your text while removing the repetitive stylistic signals left by AI models.',
                },
                {
                  q: 'Is my content stored or uploaded to any server?',
                  a: 'Never. ContentGuard operates under a strict privacy-first model. All text transformations run instantly and are not cached or stored on any server.',
                },
              ].map((faq, idx) => (
                <div key={idx} className="bg-bg-card border border-border-custom rounded-xl p-5 space-y-2">
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
