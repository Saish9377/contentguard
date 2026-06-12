'use client';

import { SpellCheck, AlertTriangle, CheckCircle2, ChevronRight, XCircle } from 'lucide-react';
import { GrammarResult } from '@/types/analysis';

interface GrammarTabProps {
  grammar: GrammarResult;
}

export default function GrammarTab({ grammar }: GrammarTabProps) {
  return (
    <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center">
            <SpellCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-text-primary text-sm">Grammar & Correctness</h3>
              {grammar.isNLPEnhanced && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-[9px] font-bold text-accent-light-purple tracking-wider">
                  ✦ NLP Enhanced
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted">
              {grammar.errorCount} errors · {grammar.warningCount} warnings · {grammar.suggestionCount} suggestions
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-extrabold text-accent-green">{grammar.grammarScore}</span>
          <span className="text-xs text-text-muted font-semibold">/100</span>
        </div>
      </div>


      <div>
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2.5">Corrections & Suggestions</div>
        {grammar.errors.length > 0 ? (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {grammar.errors.map((error, index) => (
              <div key={index} className={`flex items-start gap-3 p-3.5 rounded-lg border ${
                error.severity === 'error' ? 'bg-accent-pink/5 border-accent-pink/10' :
                error.severity === 'warning' ? 'bg-amber-500/5 border-amber-500/10' :
                'bg-accent-purple/5 border-accent-purple/10'
              }`}>
                {error.severity === 'error' ? <XCircle className="w-4 h-4 text-accent-pink flex-shrink-0 mt-0.5" /> :
                 error.severity === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> :
                 <ChevronRight className="w-4 h-4 text-accent-purple flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-text-primary">{error.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-bg-input rounded border border-border-custom text-accent-pink line-through font-mono">
                      {error.originalText}
                    </span>
                    {error.suggestions.length > 0 && (
                      <>
                        <ChevronRight className="w-3 h-3 text-text-muted" />
                        <span className="text-[10px] px-2 py-0.5 bg-bg-input rounded border border-accent-purple/20 text-accent-green font-semibold font-mono">
                          {error.suggestions[0]}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-accent-green/5 border border-accent-green/10 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <p className="text-sm font-medium text-accent-green">No grammar or spelling errors found. Great work!</p>
          </div>
        )}
      </div>
    </div>
  );
}
