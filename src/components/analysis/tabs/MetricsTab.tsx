'use client';

import { BookOpen, Award, BarChart3 } from 'lucide-react';
import { ReadabilityResult, EssayStructureResult, WritingMetricsResult, QualityScoreResult } from '@/types/analysis';

interface MetricsTabProps {
  readability: ReadabilityResult;
  essayStructure: EssayStructureResult;
  writingMetrics: WritingMetricsResult;
  qualityScore: QualityScoreResult;
}

export default function MetricsTab({ readability, essayStructure, writingMetrics, qualityScore }: MetricsTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Readability */}
        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Readability</h3>
              <p className="text-[11px] text-text-muted">Level: {readability.readingLevel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Flesch-Kincaid', value: readability.fleschKincaid },
              { label: 'Reading Ease', value: readability.fleschReadingEase },
              { label: 'Complexity', value: `${readability.complexityScore}%` },
              { label: 'SMOG Index', value: readability.smog },
            ].map(item => (
              <div key={item.label} className="bg-bg-input border border-border-custom rounded-lg p-3">
                <div className="text-base font-extrabold text-text-primary">{item.value}</div>
                <div className="text-[10px] font-medium text-text-muted mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
            <p className="text-xs font-medium text-text-primary">
              📖 Reading time: <strong>{readability.averageReadingTime}</strong>
            </p>
          </div>
        </div>

        {/* Essay Structure */}
        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-pink/10 text-accent-pink flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Essay Structure</h3>
              <p className="text-[11px] text-text-muted">Score: {essayStructure.overallScore}/100</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Intro', score: essayStructure.introductionScore, has: essayStructure.hasIntroduction },
              { label: 'Body', score: essayStructure.bodyScore, has: essayStructure.hasBody },
              { label: 'Conclusion', score: essayStructure.conclusionScore, has: essayStructure.hasConclusion },
            ].map(section => (
              <div key={section.label} className="text-center p-3 bg-bg-input border border-border-custom rounded-lg">
                <div className={`text-base font-extrabold ${section.has ? 'text-accent-green' : 'text-text-muted'}`}>{section.score}</div>
                <div className="text-[10px] font-semibold text-text-muted mt-0.5">{section.label}</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${section.has ? 'text-accent-green' : 'text-text-muted'}`}>
                  {section.has ? '✓ Yes' : '✗ No'}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-xs text-text-muted">
            {essayStructure.feedback.slice(0, 2).map((fb, idx) => (
              <p key={idx} className="flex gap-1.5"><span className="text-accent-purple">→</span>{fb}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Counts & Quality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-text-primary text-sm">Writing Metrics</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: 'Words', value: writingMetrics.wordCount.toLocaleString() },
              { label: 'Characters', value: writingMetrics.characterCount.toLocaleString() },
              { label: 'Sentences', value: writingMetrics.sentenceCount.toLocaleString() },
              { label: 'Vocab Density', value: `${(writingMetrics.vocabularyDensity * 100).toFixed(0)}%` },
            ].map(item => (
              <div key={item.label} className="bg-bg-input border border-border-custom rounded-lg p-3">
                <div className="text-base font-extrabold text-text-primary">{item.value}</div>
                <div className="text-[10px] font-medium text-text-muted mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border-custom rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-purple/10 text-accent-light-purple flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">Quality Breakdown</h3>
              <p className="text-[11px] text-text-muted">Overall: {qualityScore.overallScore}/100</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {qualityScore.breakdown.map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1 text-xs font-medium text-text-muted">
                  <span>{item.label}</span>
                  <span>{item.score}</span>
                </div>
                <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.score >= 70 ? 'bg-accent-green' : item.score >= 40 ? 'bg-amber-500' : 'bg-accent-pink'}`} style={{ width: `${item.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
