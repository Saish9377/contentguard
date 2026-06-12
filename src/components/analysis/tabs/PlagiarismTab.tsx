'use client';

import { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  EyeOff, 
  Eye, 
  Quote
} from 'lucide-react';
import { PlagiarismResult } from '@/types/analysis';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PlagiarismTabProps {
  plagiarism: PlagiarismResult;
  text?: string;
}

interface HighlightRange {
  start: number;
  end: number;
  type: 'exact' | 'partial';
  source: string;
  url?: string;
  matchPercentage: number;
}

interface GroupedSource {
  name: string;
  url?: string;
  maxPercentage: number;
  wordCount: number;
  percentageOfText: number;
}

export default function PlagiarismTab({ plagiarism, text = '' }: PlagiarismTabProps) {
  // Excluded sources state
  const [excludedSources, setExcludedSources] = useState<Set<string>>(new Set());
  // Hovered source for bidirectional highlights
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);
  // Copy state for citations (maps sourceName -> citationType -> boolean)
  const [copiedStates, setCopiedStates] = useState<Record<string, string>>({});
  // Expanded citation states (maps sourceName -> boolean)
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  // 1. Toggle source exclusion
  const toggleSourceExclusion = (sourceName: string) => {
    setExcludedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceName)) {
        next.delete(sourceName);
        toast.success(`Included matches from: ${sourceName}`);
      } else {
        next.add(sourceName);
        toast.info(`Excluded matches from: ${sourceName}`);
      }
      return next;
    });
  };

  // 2. Filter active matches (excluding matching sources)
  const activeMatches = useMemo(() => {
    return plagiarism.matches.filter(m => !excludedSources.has(m.source));
  }, [plagiarism.matches, excludedSources]);

  // 3. Recalculate metrics dynamically based on exclusions
  const metrics = useMemo(() => {
    const totalWords = plagiarism.totalWords || 1;
    if (activeMatches.length === 0) {
      return {
        originality: 100,
        similarity: 0,
        exact: 0,
        partial: 0
      };
    }

    // matched characters set to calculate unique words
    const matchedChars = new Set<number>();
    activeMatches.forEach(match => {
      for (let i = match.startIndex; i < match.endIndex; i++) {
        matchedChars.add(i);
      }
    });

    const activeMatchedWords = activeMatches.reduce((sum, m) => {
      return sum + m.text.split(/\s+/).filter(Boolean).length;
    }, 0);

    const similarity = Math.min(100, Math.round((activeMatchedWords / totalWords) * 100));
    const originality = Math.max(0, 100 - similarity);

    const exactMatchedWords = activeMatches
      .filter(m => m.matchPercentage >= 70)
      .reduce((sum, m) => sum + m.text.split(/\s+/).filter(Boolean).length, 0);

    const exact = Math.min(similarity, Math.round((exactMatchedWords / totalWords) * 100));
    const partial = Math.max(0, similarity - exact);

    return {
      originality,
      similarity,
      exact,
      partial
    };
  }, [activeMatches, plagiarism.totalWords]);

  // 4. Highlighted ranges (merging overlaps)
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
          // Combine sources
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

  // 5. Group sources (e.g. Duplichecker style)
  const groupedSources = useMemo(() => {
    const map = new Map<string, GroupedSource>();
    plagiarism.matches.forEach(match => {
      const key = match.source;
      const matchWords = match.text.split(/\s+/).filter(Boolean).length;
      const existing = map.get(key);
      if (existing) {
        existing.wordCount += matchWords;
        existing.maxPercentage = Math.max(existing.maxPercentage, match.matchPercentage);
      } else {
        map.set(key, {
          name: match.source,
          url: match.url,
          maxPercentage: match.matchPercentage,
          wordCount: matchWords,
          percentageOfText: 0,
        });
      }
    });

    const totalWords = plagiarism.totalWords || 1;
    const list = Array.from(map.values());
    list.forEach(src => {
      src.percentageOfText = Math.min(100, Math.round((src.wordCount / totalWords) * 100));
    });

    return list.sort((a, b) => b.percentageOfText - a.percentageOfText || b.maxPercentage - a.maxPercentage);
  }, [plagiarism.matches, plagiarism.totalWords]);

  // 6. Generate citations
  const citations = (name: string, url?: string) => {
    const actualUrl = url || 'https://contentguard.ai';
    const cleanName = name.replace(/^(Wikipedia — |Stanford |MIT Technology Review — )/i, '');
    return {
      apa: `${cleanName} Contributors. (2026). Web Content Analysis. Retrieved from ${actualUrl}`,
      mla: `"${cleanName} Contributors." ContentGuard Originality Archive, 2026, ${actualUrl}.`,
      chicago: `"${cleanName} Contributors." ContentGuard. 2026. ${actualUrl}.`
    };
  };

  const copyCitationToClipboard = (sourceName: string, type: 'apa' | 'mla' | 'chicago', citationText: string) => {
    navigator.clipboard.writeText(citationText);
    const key = `${sourceName}-${type}`;
    setCopiedStates(prev => ({ ...prev, [key]: 'copied' }));
    toast.success(`${type.toUpperCase()} citation copied!`);
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [key]: '' }));
    }, 2000);
  };

  // SVG parameters for Donut Chart
  const r = 45;
  const circ = 2 * Math.PI * r;
  const strokeWidth = 10;
  const valUnique = (metrics.originality / 100) * circ;
  const valExact = (metrics.exact / 100) * circ;
  const valPartial = (metrics.partial / 100) * circ;

  return (
    <div className="space-y-6">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Interactive Highlighted Document Text (3/5 Width) */}
        <div className="lg:col-span-3 flex flex-col bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm min-h-[450px]">
          <div className="flex items-center gap-2 mb-4 border-b border-border-custom/50 pb-3">
            <FileText className="w-5 h-5 text-accent-purple" />
            <h3 className="font-bold text-text-primary text-sm">Interactive Document Text</h3>
            <span className="text-xs text-text-muted ml-auto font-medium">Hover matched text to view sources</span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 text-sm leading-relaxed text-text-primary whitespace-pre-wrap select-text font-serif">
            {text ? (
              highlightedSegments.map((segment, idx) => {
                if (segment.type === 'text') {
                  return <span key={idx}>{segment.text}</span>;
                }

                const isExact = segment.matchType === 'exact';
                const isHovered = segment.source && hoveredSource && segment.source.includes(hoveredSource);

                return (
                  <span
                    key={idx}
                    onMouseEnter={() => segment.source && setHoveredSource(segment.source.split(', ')[0])}
                    onMouseLeave={() => setHoveredSource(null)}
                    className={cn(
                      "relative cursor-pointer transition-all duration-150 rounded px-0.5 border-b-2 font-medium break-words",
                      isExact
                        ? isHovered
                          ? "bg-red-500/30 text-red-900 dark:text-red-200 border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                          : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/40 hover:bg-red-500/20"
                        : isHovered
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

        {/* Right Column: Statistics & Plagiarized Sources (2/5 Width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Donut Chart & Detailed Table Card */}
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
                
                {/* Unique (Green) */}
                {metrics.originality > 0 && (
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

                {/* Exact (Red) */}
                {metrics.exact > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    className="stroke-red-500"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${valExact} ${circ - valExact}`}
                    strokeDashoffset={-valUnique}
                    strokeLinecap="round"
                  />
                )}

                {/* Partial (Blue) */}
                {metrics.partial > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={r}
                    className="stroke-blue-500"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${valPartial} ${circ - valPartial}`}
                    strokeDashoffset={-(valUnique + valExact)}
                    strokeLinecap="round"
                  />
                )}
              </svg>
              
              {/* Central Text */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-text-primary">{metrics.originality}%</span>
                <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Unique</span>
              </div>
            </div>

            {/* Legend Stats Table */}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-border-custom/50 pb-2">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Unique
                </span>
                <span className="font-extrabold text-emerald-500 text-sm">{metrics.originality}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs border-b border-border-custom/50 pb-2">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  Exact Copy
                </span>
                <span className="font-extrabold text-red-500 text-sm">{metrics.exact}%</span>
              </div>
              
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="flex items-center gap-2 font-semibold text-text-primary">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  Partial Match
                </span>
                <span className="font-extrabold text-blue-500 text-sm">{metrics.partial}%</span>
              </div>
            </div>
          </div>

          {/* Plagiarized Sources Card */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-custom/50 pb-3">
              <h3 className="font-bold text-text-primary text-sm">View Plagiarized Sources</h3>
              {excludedSources.size > 0 && (
                <button
                  onClick={() => setExcludedSources(new Set())}
                  className="text-[10px] text-accent-purple hover:underline font-bold"
                >
                  Reset Excluded ({excludedSources.size})
                </button>
              )}
            </div>

            {groupedSources.length > 0 ? (
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {groupedSources.map((src, index) => {
                  const isExcluded = excludedSources.has(src.name);
                  const isHovered = hoveredSource === src.name;
                  const hasCitations = expandedCitations[src.name];
                  const cits = citations(src.name, src.url);

                  return (
                    <div 
                      key={index} 
                      onMouseEnter={() => !isExcluded && setHoveredSource(src.name)}
                      onMouseLeave={() => setHoveredSource(null)}
                      className={cn(
                        "p-4 rounded-xl border transition-all duration-200 space-y-3",
                        isExcluded 
                          ? "bg-bg-input/40 border-border-custom/40 opacity-60"
                          : isHovered
                            ? "border-accent-purple/60 bg-accent-purple/5 shadow-md shadow-premium-glow/5"
                            : "border-border-custom bg-bg-primary/20 hover:border-zinc-300 dark:hover:border-zinc-800"
                      )}
                    >
                      {/* Source Info Headers */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{src.name}</p>
                          {src.url ? (
                            <a 
                              href={src.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-text-muted hover:text-accent-purple inline-flex items-center gap-1.5 mt-0.5 hover:underline break-all"
                            >
                              {src.url.replace(/https?:\/\/(www\.)?/, '')}
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-text-muted mt-0.5 block">Internal Document</span>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-extrabold text-red-500 bg-red-500/5 px-2 py-0.5 rounded border border-red-500/10">
                            {src.percentageOfText}% Match
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar (Only show if not excluded) */}
                      {!isExcluded && (
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full transition-all duration-500" 
                              style={{ width: `${src.percentageOfText}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Control Panel: Exclude, Cite Buttons */}
                      <div className="flex items-center justify-between border-t border-border-custom/30 pt-2 text-[11px] font-bold">
                        <button
                          onClick={() => toggleSourceExclusion(src.name)}
                          className={cn(
                            "flex items-center gap-1 hover:underline cursor-pointer",
                            isExcluded ? "text-emerald-500" : "text-text-muted hover:text-red-500"
                          )}
                        >
                          {isExcluded ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Include Matches
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Exclude Source
                            </>
                          )}
                        </button>

                        {!isExcluded && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => setExpandedCitations(prev => ({ ...prev, [src.name]: !hasCitations }))}
                              className={cn(
                                "flex items-center gap-1 hover:underline cursor-pointer",
                                hasCitations ? "text-accent-purple" : "text-text-muted hover:text-accent-purple"
                              )}
                            >
                              <Quote className="w-3.5 h-3.5" />
                              {hasCitations ? 'Hide Citations' : 'Cite Source'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Citations Panel (Expandable Drawer) */}
                      {hasCitations && !isExcluded && (
                        <div className="bg-bg-input rounded-lg border border-border-custom p-3 space-y-3 mt-2 text-[10px] leading-relaxed">
                          <div className="border-b border-border-custom/50 pb-1.5 font-bold text-text-muted">
                            Cite this source in academic formats:
                          </div>
                          
                          {/* APA Format */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-text-primary text-[9px] uppercase tracking-wider">
                              APA Citation
                              <button 
                                onClick={() => copyCitationToClipboard(src.name, 'apa', cits.apa)}
                                className="text-text-muted hover:text-accent-purple flex items-center gap-0.5 cursor-pointer font-bold lowercase"
                              >
                                {copiedStates[`${src.name}-apa`] ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedStates[`${src.name}-apa`] ? 'copied' : 'copy'}
                              </button>
                            </div>
                            <p className="bg-bg-primary/50 p-2 rounded text-text-primary border border-border-custom/20">{cits.apa}</p>
                          </div>

                          {/* MLA Format */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-text-primary text-[9px] uppercase tracking-wider">
                              MLA Citation
                              <button 
                                onClick={() => copyCitationToClipboard(src.name, 'mla', cits.mla)}
                                className="text-text-muted hover:text-accent-purple flex items-center gap-0.5 cursor-pointer font-bold lowercase"
                              >
                                {copiedStates[`${src.name}-mla`] ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedStates[`${src.name}-mla`] ? 'copied' : 'copy'}
                              </button>
                            </div>
                            <p className="bg-bg-primary/50 p-2 rounded text-text-primary border border-border-custom/20">{cits.mla}</p>
                          </div>

                          {/* Chicago Format */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-text-primary text-[9px] uppercase tracking-wider">
                              Chicago Citation
                              <button 
                                onClick={() => copyCitationToClipboard(src.name, 'chicago', cits.chicago)}
                                className="text-text-muted hover:text-accent-purple flex items-center gap-0.5 cursor-pointer font-bold lowercase"
                              >
                                {copiedStates[`${src.name}-chicago`] ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedStates[`${src.name}-chicago`] ? 'copied' : 'copy'}
                              </button>
                            </div>
                            <p className="bg-bg-primary/50 p-2 rounded text-text-primary border border-border-custom/20">{cits.chicago}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs font-semibold text-emerald-500">No matching online content detected. Content appears fully original.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
