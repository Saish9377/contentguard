'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FullAnalysisResult } from '@/types/analysis';
import { ScoreGauge } from './ScoreGauge';
import {
  FileText, ShieldCheck, SpellCheck, BookOpen, MessageSquare, Download
} from 'lucide-react';
import { generatePremiumReport, generatePlagiarismReport } from '@/lib/pdf-generator';
import { toast } from 'sonner';

// Lazy load tab contents for optimization
const AITab = lazy(() => import('./tabs/AITab'));
const PlagiarismTab = lazy(() => import('./tabs/PlagiarismTab'));
const GrammarTab = lazy(() => import('./tabs/GrammarTab'));
const MetricsTab = lazy(() => import('./tabs/MetricsTab'));
const ToneTab = lazy(() => import('./tabs/ToneTab'));

interface ResultsDashboardProps {
  result: FullAnalysisResult;
  defaultTab?: 'ai' | 'plagiarism' | 'grammar' | 'metrics' | 'tone';
}

export function ResultsDashboard({ result, defaultTab = 'ai' }: ResultsDashboardProps) {
  const { aiDetection, plagiarism, grammar, readability, writingMetrics, essayStructure, qualityScore, tone } = result;
  const [activeTab, setActiveTab] = useState<'ai' | 'plagiarism' | 'grammar' | 'metrics' | 'tone'>(defaultTab);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab, result.id]);

  const exportPDFReport = async () => {
    setIsExporting(true);
    try {
      // Calculate sentence complexity percentages dynamically
      const sentences = aiDetection.sentences || [];
      let simpleCount = 0;
      let mediumCount = 0;
      
      sentences.forEach((s) => {
        const words = s.text.trim().split(/\s+/).filter(Boolean).length;
        if (words < 12) simpleCount++;
        else if (words <= 22) mediumCount++;
      });
      
      const totalCount = sentences.length || 1;
      const simpleSentencesPct = Math.round((simpleCount / totalCount) * 100);
      const mediumSentencesPct = Math.round((mediumCount / totalCount) * 100);
      const complexSentencesPct = 100 - simpleSentencesPct - mediumSentencesPct;

      const reportData = {
        aiScore: aiDetection.aiScore,
        originalityScore: plagiarism.originalityScore,
        grammarScore: grammar.grammarScore,
        qualityScore: qualityScore.overallScore,
        readabilityScore: readability.fleschReadingEase,
        readingLevel: readability.readingLevel,
        wordCount: writingMetrics.wordCount,
        characterCount: writingMetrics.characterCount,
        tone: tone ? tone.tone : 'Neutral',
        toneConfidence: tone ? tone.score : 100,
        avgSentenceLength: writingMetrics.averageSentenceLength,
        contentPreview: result.text,
        grammarErrors: grammar.errorCount,
        reportId: result.id,
        generatedAt: new Date(result.timestamp),
        simpleSentencesPct,
        mediumSentencesPct,
        complexSentencesPct,
        uniqueWords: writingMetrics.uniqueWords,
        plagiarismMatches: plagiarism.matches.length,
        sentenceCount: writingMetrics.sentenceCount,
        paragraphCount: writingMetrics.paragraphCount,
        reportType: activeTab === 'plagiarism' ? 'plagiarism' as const : 'ai' as const,
      };

      if (activeTab === 'plagiarism') {
        const plagiarismReportData = {
          text: result.text,
          originalityScore: plagiarism.originalityScore,
          similarityScore: plagiarism.similarityScore,
          matches: plagiarism.matches.map(m => ({
            text: m.text,
            matchPercentage: m.matchPercentage,
            source: m.source,
            url: m.url,
            startIndex: m.startIndex || 0,
            endIndex: m.endIndex || 0,
          })),
          wordCount: writingMetrics.wordCount,
          characterCount: writingMetrics.characterCount,
          sentenceCount: writingMetrics.sentenceCount,
          paragraphCount: writingMetrics.paragraphCount,
          reportId: result.id,
          generatedAt: new Date(result.timestamp),
          
          // Premium fields
          aiScore: aiDetection.aiScore,
          grammarScore: grammar.grammarScore,
          qualityScore: qualityScore.overallScore,
          readabilityScore: readability.fleschReadingEase,
          readingLevel: readability.readingLevel,
          tone: tone ? tone.tone : 'Neutral',
          toneConfidence: tone ? tone.score : 100,
          avgSentenceLength: writingMetrics.averageSentenceLength,
          grammarErrors: grammar.errorCount,
          plagiarismMatches: plagiarism.matches.length
        };
        await generatePlagiarismReport(plagiarismReportData);
      } else {
        await generatePremiumReport(reportData);
      }
      toast.success('Report downloaded successfully!');
    } catch (error) {
      const err = error as Error;
      console.error('Failed to generate report:', err);
      toast.error(`Failed to export report: ${err?.message || String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* Top Score Summary & PDF Export Button */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center flex-1 w-full">
          <ScoreGauge score={aiDetection.aiScore} label="AI Score" size={96} colorScheme="inverted" />
          <ScoreGauge score={plagiarism.originalityScore} label="Originality" size={96} />
          <ScoreGauge score={grammar.grammarScore} label="Grammar" size={96} />
          <ScoreGauge score={qualityScore.overallScore} label="Quality" size={96} />
        </div>
        
        {/* Export Button */}
        <button
          onClick={exportPDFReport}
          disabled={isExporting}
          className="px-5 py-3 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-light-purple hover:bg-accent-purple hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-bold shrink-0 w-full md:w-auto active:scale-95 shadow-md shadow-premium-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-accent-light-purple border-t-transparent rounded-full animate-spin mr-1" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4.5 h-4.5" />
              Export Premium Report ↓
            </>
          )}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-1 border-b border-border-custom pb-px overflow-x-auto whitespace-nowrap">
        {[
          { id: 'ai', label: 'AI Detection', icon: ShieldCheck },
          { id: 'plagiarism', label: 'Plagiarism', icon: FileText },
          { id: 'grammar', label: 'Grammar', icon: SpellCheck },
          { id: 'metrics', label: 'Metrics & Structure', icon: BookOpen },
          { id: 'tone', label: 'Tone Analysis', icon: MessageSquare },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 text-xs font-semibold transition-all focus:outline-none -mb-px cursor-pointer ${
                isActive
                  ? 'border-accent-purple text-accent-light-purple'
                  : 'border-transparent text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents loaded dynamically */}
      <div className="min-h-[300px]">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-bg-card border border-border-custom rounded-xl">
            <div className="w-8 h-8 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Loading tab panel...</p>
          </div>
        }>
          <AnimatePresence mode="wait">
            {activeTab === 'ai' && (
              <motion.div
                key="ai-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <AITab aiDetection={aiDetection} readability={readability} text={result.text} />
              </motion.div>
            )}

            {activeTab === 'plagiarism' && (
              <motion.div
                key="plagiarism-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <PlagiarismTab plagiarism={plagiarism} text={result.text} />
              </motion.div>
            )}

            {activeTab === 'grammar' && (
              <motion.div
                key="grammar-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <GrammarTab grammar={grammar} />
              </motion.div>
            )}

            {activeTab === 'metrics' && (
              <motion.div
                key="metrics-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <MetricsTab
                  readability={readability}
                  essayStructure={essayStructure}
                  writingMetrics={writingMetrics}
                  qualityScore={qualityScore}
                />
              </motion.div>
            )}

            {activeTab === 'tone' && tone && (
              <motion.div
                key="tone-tab"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ToneTab toneResult={tone} />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </div>
    </motion.div>
  );
}
