'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Download,
  RefreshCw
} from 'lucide-react';
import { FullAnalysisResult, PlagiarismMatch } from '@/types/analysis';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generatePlagiarismReport } from '@/lib/pdf-generator';

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
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredMatchIndex, setHoveredMatchIndex] = useState<number | null>(null);

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
    setIsExporting(true);
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
        
        // Premium fields (dummy or fallback)
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
      await generatePlagiarismReport(plagiarismReportData);
      toast.success('Plagiarism report downloaded successfully!');
    } catch (err) {
      console.error('Failed to generate plagiarism report:', err);
      toast.error('Failed to export plagiarism report.');
    } finally {
      setIsExporting(false);
    }
  };

  // SVG parameters for Donut Chart
  const r = 45;
  const circ = 2 * Math.PI * r;
  const strokeWidth = 10;
  const valUnique = (metrics.unique / 100) * circ;
  const valPlagiarized = (metrics.similarity / 100) * circ;

  return (
    <div className="space-y-6">
      {/* Top Header Card with Export Button */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="font-bold text-lg text-text-primary">Plagiarism Scan Results</h2>
          <p className="text-xs text-text-muted">Detailed similarity analysis of your text</p>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="px-5 py-2.5 rounded-xl bg-accent-purple/10 border border-accent-purple/20 text-accent-light-purple hover:bg-accent-purple hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-bold w-full sm:w-auto active:scale-95 shadow-md shadow-premium-glow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-accent-light-purple border-t-transparent rounded-full animate-spin mr-1" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Premium Report
            </>
          )}
        </button>
      </div>

      {/* 4 Stats Cards Side-by-Side */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Plagiarism card */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted mb-1">Plagiarism</span>
          <span className={cn(
            "text-3xl font-extrabold",
            metrics.similarity === 0 ? "text-emerald-500" : metrics.similarity > 10 ? "text-red-500" : "text-amber-500"
          )}>
            {metrics.similarity}%
          </span>
        </div>

        {/* Exact Match card */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted mb-1">Exact Match</span>
          <span className="text-3xl font-extrabold text-red-500">
            {metrics.exact}%
          </span>
        </div>

        {/* Partial Match card */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted mb-1">Partial Match</span>
          <span className="text-3xl font-extrabold text-amber-500">
            {metrics.partial}%
          </span>
        </div>

        {/* Unique card */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] tracking-wider uppercase font-bold text-text-muted mb-1">Unique</span>
          <span className="text-3xl font-extrabold text-emerald-500">
            {metrics.unique}%
          </span>
        </div>
      </div>

      {/* Main 2-Column Detail Display */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Interactive Document Text (3/5 Width) */}
        <div className="lg:col-span-3 flex flex-col bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm min-h-[450px]">
          <div className="flex items-center gap-2 mb-4 border-b border-border-custom/50 pb-3">
            <FileText className="w-5 h-5 text-accent-purple" />
            <h3 className="font-bold text-text-primary text-sm">Interactive Document Text</h3>
            <span className="text-xs text-text-muted ml-auto font-medium">Highlighted matches from online sources</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 text-sm leading-relaxed text-text-primary whitespace-pre-wrap select-text font-serif">
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
                      "relative cursor-pointer transition-all duration-150 rounded px-0.5 border-b-2 font-medium break-words",
                      isExact
                        ? sourceMatches
                          ? "bg-red-500/30 text-red-900 dark:text-red-200 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 hover:bg-red-500/20"
                        : sourceMatches
                          ? "bg-blue-500/30 text-blue-900 dark:text-blue-200 border-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.2)]"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40 hover:bg-blue-500/20"
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

        {/* Right Column: Statistics & Sources (2/5 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Donut Chart & Detailed Side legend */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-center">
            
            {/* SVG Donut Chart */}
            <div className="relative flex items-center justify-center w-40 h-40 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="60"
                  cy="60"
                  r={r}
                  className="stroke-zinc-100 dark:stroke-zinc-800/80"
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                
                {/* Unique portion (Green) */}
                {metrics.unique > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    className="stroke-emerald-500"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${valUnique} ${circ - valUnique}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />
                )}

                {/* Plagiarized portion (Red) */}
                {metrics.similarity > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    className="stroke-red-500"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${valPlagiarized} ${circ - valPlagiarized}`}
                    strokeDashoffset={-valUnique}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              
              {/* Central Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold text-text-primary">{metrics.similarity}%</span>
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">Plagiarism</span>
              </div>
            </div>

            {/* Legend Stats Table */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-border-custom/50 pb-2">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  Exact Match
                </span>
                <span className="font-extrabold text-red-500 text-sm">{metrics.exact}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs border-b border-border-custom/50 pb-2">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  Partial Match
                </span>
                <span className="font-extrabold text-blue-500 text-sm">{metrics.partial}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Unique
                </span>
                <span className="font-black text-emerald-500 text-lg">{metrics.unique}%</span>
              </div>
            </div>
          </div>

          {/* Document Stats Row */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="font-bold text-xs text-text-muted uppercase tracking-wider border-b border-border-custom/50 pb-2">Document Statistics</h4>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Words:</span>
                <span className="font-bold text-text-primary">{totalWords}</span>
              </div>
              <div className="flex justify-between border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Characters:</span>
                <span className="font-bold text-text-primary">{totalChars}</span>
              </div>
              <div className="flex justify-between border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Sentences:</span>
                <span className="font-bold text-text-primary">{totalSentences}</span>
              </div>
              <div className="flex justify-between border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Paragraphs:</span>
                <span className="font-bold text-text-primary">{totalParagraphs}</span>
              </div>
              <div className="flex justify-between col-span-2 sm:col-span-1 border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Read Time:</span>
                <span className="font-bold text-text-primary">{readTime} minute{readTime > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between col-span-2 sm:col-span-1 border-b border-border-custom/30 pb-1.5">
                <span className="text-text-muted font-medium">Speak Time:</span>
                <span className="font-bold text-text-primary">{speakTime} minute{speakTime > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Matched Sources Section */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-text-primary text-sm border-b border-border-custom/50 pb-3">Matched Sources</h3>

            {activeMatches.length > 0 ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {activeMatches.map((match, index) => {
                  const isHovered = hoveredMatchIndex === index;

                  return (
                    <div 
                      key={index} 
                      onMouseEnter={() => setHoveredMatchIndex(index)}
                      onMouseLeave={() => setHoveredMatchIndex(null)}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200 space-y-2",
                        isHovered
                          ? "border-accent-purple/60 bg-accent-purple/5 shadow-md shadow-premium-glow/5"
                          : "border-border-custom bg-bg-primary/20 hover:border-zinc-300 dark:hover:border-zinc-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-[10px] text-text-muted font-semibold block mb-0.5">Source #{index + 1}</span>
                          {match.url ? (
                            <a 
                              href={match.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-text-primary hover:text-accent-purple inline-flex items-center gap-1.5 hover:underline break-all truncate max-w-full"
                            >
                              {match.url.replace(/https?:\/\/(www\.)?/, '')}
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <p className="text-xs font-bold text-text-primary truncate">{match.source}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <span className="text-[10px] font-extrabold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            {match.matchPercentage}%
                          </span>
                        </div>
                      </div>

                      {/* Matched Text Snippet */}
                      <p className="text-xs italic text-text-muted bg-bg-input/50 p-2.5 rounded border border-border-custom/50 font-serif leading-relaxed">
                        "{match.text}"
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-emerald-500">✅ No plagiarism found. Content is 100% original.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
