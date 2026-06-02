'use client';

import { SentenceAnalysis } from '@/types/analysis';

interface AIHeatmapProps {
  sentences: SentenceAnalysis[];
  originalText: string;
}

export function AIHeatmap({ sentences, originalText }: AIHeatmapProps) {
  if (!sentences || sentences.length === 0) return null;

  const getHighlightClass = (classification: 'human' | 'mixed' | 'ai') => {
    switch (classification) {
      case 'human': return 'highlight-human-sentence';
      case 'mixed': return 'highlight-mixed-sentence';
      case 'ai': return 'highlight-ai-sentence';
    }
  };

  const getTooltipText = (sentence: SentenceAnalysis) => {
    const labels = { human: 'Human', mixed: 'Mixed', ai: 'AI Generated' };
    return `${labels[sentence.classification]} · ${Math.round(sentence.aiProbability)}% AI probability · ${Math.round(sentence.confidence)}% confidence`;
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-5 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded highlight-human-sentence" />
          <span className="text-zinc-500 dark:text-zinc-400">Human Written</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded highlight-mixed-sentence" />
          <span className="text-zinc-500 dark:text-zinc-400">Mixed / Uncertain</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded highlight-ai-sentence" />
          <span className="text-zinc-500 dark:text-zinc-400">AI Generated</span>
        </div>
      </div>

      {/* Highlighted text */}
      <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-700/50 leading-[2] text-sm text-zinc-800 dark:text-zinc-200">
        {sentences.map((sentence, index) => (
          <span
            key={index}
            className={`${getHighlightClass(sentence.classification)} px-0.5 py-0.5 rounded cursor-help transition-opacity hover:opacity-80`}
            title={getTooltipText(sentence)}
          >
            {sentence.text}
          </span>
        ))}
      </div>

      {/* Sentence breakdown */}
      <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
        {sentences.map((sentence, index) => (
          <div
            key={index}
            className="flex items-center gap-3 text-xs p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors duration-150"
          >
            <div className="flex-shrink-0 w-7 text-center font-mono text-zinc-400 dark:text-zinc-500">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0 truncate text-zinc-600 dark:text-zinc-400 font-medium">
              {sentence.text.substring(0, 80)}{sentence.text.length > 80 ? '...' : ''}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    sentence.classification === 'human' ? 'bg-emerald-500' :
                    sentence.classification === 'mixed' ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${sentence.aiProbability}%` }}
                />
              </div>
              <span className={`font-mono w-9 text-right font-semibold ${
                sentence.classification === 'human' ? 'text-emerald-600 dark:text-emerald-400' :
                sentence.classification === 'mixed' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {Math.round(sentence.aiProbability)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
