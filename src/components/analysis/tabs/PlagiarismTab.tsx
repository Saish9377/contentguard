'use client';

import { FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PlagiarismResult } from '@/types/analysis';

interface PlagiarismTabProps {
  plagiarism: PlagiarismResult;
}

export default function PlagiarismTab({ plagiarism }: PlagiarismTabProps) {
  return (
    <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-text-primary text-sm">Plagiarism Report</h3>
          <p className="text-[11px] text-text-muted">Text similarity analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-accent-green/5 border border-accent-green/10 rounded-lg p-4 text-center">
          <div className="text-xl font-extrabold text-accent-green">{plagiarism.originalityScore}%</div>
          <div className="text-[10px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">Original</div>
        </div>
        <div className="bg-accent-pink/5 border border-accent-pink/10 rounded-lg p-4 text-center">
          <div className="text-xl font-extrabold text-accent-pink">{plagiarism.similarityScore}%</div>
          <div className="text-[10px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">Similar</div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2.5">Matched Sources</div>
        {plagiarism.matches.length > 0 ? (
          <div className="space-y-2.5">
            {plagiarism.matches.slice(0, 5).map((match, index) => (
              <div key={index} className="flex items-start gap-3 p-3.5 bg-accent-pink/5 rounded-lg border border-accent-pink/10">
                <AlertTriangle className="w-4 h-4 text-accent-pink flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium line-clamp-2">&ldquo;{match.text}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-medium text-text-muted bg-bg-input px-2 py-0.5 rounded">{match.source}</span>
                    <span className="text-xs font-semibold text-accent-pink">{Math.round(match.matchPercentage)}% match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-accent-green/5 border border-accent-green/10 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-accent-green" />
            <p className="text-sm font-medium text-accent-green">No plagiarism found. Content appears fully original.</p>
          </div>
        )}
      </div>
    </div>
  );
}
