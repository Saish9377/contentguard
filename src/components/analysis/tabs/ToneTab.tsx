'use client';

import { Smile, MessageSquare } from 'lucide-react';
import { ToneAnalysisResult } from '@/types/analysis';

interface ToneTabProps {
  toneResult: ToneAnalysisResult;
}

export default function ToneTab({ toneResult }: ToneTabProps) {
  const { tone, score, breakdown, explanation } = toneResult;

  const getToneBadgeClass = (t: string) => {
    switch (t) {
      case 'Formal':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-500';
      case 'Casual':
        return 'bg-accent-green/10 border-accent-green/20 text-accent-green';
      case 'Aggressive':
        return 'bg-accent-pink/10 border-accent-pink/20 text-accent-pink';
      case 'Persuasive':
        return 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple';
      default:
        return 'bg-text-muted/10 border-text-muted/20 text-text-muted';
    }
  };

  return (
    <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-border-custom/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Tone Analysis</h3>
            <p className="text-[11px] text-text-muted">Detected communication style</p>
          </div>
        </div>

        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${getToneBadgeClass(tone)}`}>
          {tone} ({score}%)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Explanation Card */}
        <div className="bg-bg-input border border-border-custom rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-text-primary font-bold text-xs uppercase tracking-wide">
            <Smile className="w-4 h-4 text-accent-light-purple" />
            Style Explanation
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Breakdown progress bars */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Tone Breakdown</div>
          
          <div className="space-y-2.5">
            {[
              { name: 'Formal', val: breakdown.formal, color: 'bg-blue-500' },
              { name: 'Casual', val: breakdown.casual, color: 'bg-accent-green' },
              { name: 'Aggressive', val: breakdown.aggressive, color: 'bg-accent-pink' },
              { name: 'Persuasive', val: breakdown.persuasive, color: 'bg-accent-purple' },
              { name: 'Neutral', val: breakdown.neutral, color: 'bg-slate-400' },
            ].map(item => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1 text-[11px] font-semibold text-text-muted">
                  <span>{item.name}</span>
                  <span>{item.val}%</span>
                </div>
                <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden border border-border-custom/30">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
