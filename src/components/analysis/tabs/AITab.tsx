'use client';

import { useState } from 'react';
import { ShieldCheck, Cpu, Sparkles, CheckCircle2, Copy, Check } from 'lucide-react';
import { AIDetectionResult, ReadabilityResult } from '@/types/analysis';
import { AIHeatmap } from '../AIHeatmap';

interface AITabProps {
  aiDetection: AIDetectionResult;
  readability: ReadabilityResult;
  text: string;
}

export default function AITab({ aiDetection, readability, text }: AITabProps) {
  return (
    <div className="space-y-5">
      {/* AI Detection Summary */}
      <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">AI Probability Scores</h3>
            <p className="text-[11px] text-text-muted">Sentence-level statistical likelihood</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'AI Score', value: `${aiDetection.aiScore}%`, color: 'text-accent-pink' },
            { label: 'Human Score', value: `${aiDetection.humanScore}%`, color: 'text-accent-green' },
            { label: 'Confidence', value: `${aiDetection.confidenceScore}%`, color: 'text-accent-light-purple' },
          ].map(item => (
            <div key={item.label} className="bg-bg-input border border-border-custom rounded-lg p-3 text-center">
              <div className={`text-lg font-extrabold ${item.color}`}>{item.value}</div>
              <div className="text-[10px] font-semibold text-text-muted mt-0.5 uppercase tracking-wider">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
          {[
            { label: 'Perplexity', value: aiDetection.metrics.perplexity },
            { label: 'Burstiness', value: aiDetection.metrics.burstiness },
            { label: 'Vocab Richness', value: aiDetection.metrics.vocabularyRichness },
            { label: 'Uniformity', value: aiDetection.metrics.sentenceUniformity },
            { label: 'Repetition', value: aiDetection.metrics.repetitionScore },
          ].map(metric => (
            <div key={metric.label} className="text-center p-3 bg-accent-purple/5 border border-accent-purple/10 rounded-lg">
              <div className="text-sm font-bold text-accent-light-purple">{metric.value}</div>
              <div className="text-[10px] font-medium text-text-muted mt-0.5">{metric.label}</div>
            </div>
          ))}
        </div>

        <AIHeatmap sentences={aiDetection.sentences} originalText={text} />
      </div>

      {/* Advanced Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Humanizer & Model Origin</h3>
              <p className="text-[11px] text-text-muted">Likely model source breakdown</p>
            </div>
          </div>

          <div className="space-y-3 mb-5 pb-5 border-b border-border-custom/50">
            <div>
              <div className="flex items-center justify-between mb-1 text-xs font-medium text-text-muted">
                <span>AI Generated</span>
                <span>{aiDetection.humanizerScore.aiGenerated}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-pink to-rose-500" style={{ width: `${aiDetection.humanizerScore.aiGenerated}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1 text-xs font-medium text-text-muted">
                <span>Humanized Content</span>
                <span>{aiDetection.humanizerScore.humanized}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-accent-green to-emerald-500" style={{ width: `${aiDetection.humanizerScore.humanized}%` }} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Likely Source</span>
              <span className="text-[10px] font-semibold bg-accent-purple/10 text-accent-light-purple px-2 py-0.5 rounded-full">
                {aiDetection.modelDetection.likelySource}
              </span>
            </div>
            <div className="space-y-2.5">
              {[
                { name: 'ChatGPT', value: aiDetection.modelDetection.chatgpt, color: 'bg-sky-500' },
                { name: 'Gemini', value: aiDetection.modelDetection.gemini, color: 'bg-blue-600' },
                { name: 'Claude', value: aiDetection.modelDetection.claude, color: 'bg-amber-500' },
              ].map(model => (
                <div key={model.name}>
                  <div className="flex items-center justify-between mb-1 text-xs font-medium text-text-muted">
                    <span>{model.name}</span>
                    <span>{model.value}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${model.color}`} style={{ width: `${model.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Content Trust & Rewrite</h3>
              <p className="text-[11px] text-text-muted">Reliability indexes and rewrite tips</p>
            </div>
          </div>

          <div className="bg-bg-input border border-border-custom rounded-lg p-4 mb-5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-0.5">Content Trust Score</div>
              <div className="text-xs font-medium text-text-muted">
                {aiDetection.trustScore >= 80 ? 'Highly Reliable Writing' :
                 aiDetection.trustScore >= 50 ? 'Moderate Quality Signals' :
                 'Low Trustworthiness'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-accent-purple">{aiDetection.trustScore}</span>
              <span className="text-xs text-text-muted font-semibold">/100</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2.5">Improvement Suggestions</div>
            {aiDetection.suggestions.length > 0 ? (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {aiDetection.suggestions.map((sug, idx) => (
                  <SuggestionRow key={idx} sug={sug} />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-accent-green/5 border border-accent-green/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-accent-green" />
                <p className="text-sm font-medium text-accent-green">Writing style is natural. No revisions required.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuggestionRow({ sug }: { sug: { sentenceIndex: number; originalText: string; suggestion: string; reason: string } }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sug.suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-3.5 bg-bg-input border border-border-custom rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Sentence #{sug.sentenceIndex + 1}</span>
        <button onClick={handleCopy} className="p-1 hover:bg-bg-card rounded transition-colors focus:outline-none cursor-pointer">
          {copied ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3 text-text-muted" />}
        </button>
      </div>
      <p className="text-xs text-text-muted line-through">&ldquo;{sug.originalText}&rdquo;</p>
      <p className="text-xs text-text-primary font-medium bg-bg-card p-2.5 rounded border border-border-custom">&ldquo;{sug.suggestion}&rdquo;</p>
      <p className="text-[10px] text-accent-light-purple font-medium italic">Why: {sug.reason}</p>
    </div>
  );
}
