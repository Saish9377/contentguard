import { QualityScoreResult } from '@/types/analysis';

/**
 * Writing Quality Score Calculator
 * 
 * Combines originality, grammar, readability, and structure
 * into an overall quality score (0-100).
 */

const WEIGHTS = {
  originality: 0.30,
  grammar: 0.25,
  readability: 0.25,
  structure: 0.20,
};

export function calculateQualityScore(
  originalityScore: number,
  grammarScore: number,
  readabilityEase: number,
  structureScore: number
): QualityScoreResult {
  // Normalize readability ease to a 0-100 quality scale
  // Flesch Reading Ease: 60-70 is ideal for most content
  // Too easy or too hard both reduce quality
  let readabilityQuality: number;
  if (readabilityEase >= 50 && readabilityEase <= 80) {
    readabilityQuality = 80 + (readabilityEase - 50) * 0.67;
  } else if (readabilityEase > 80) {
    readabilityQuality = 100 - (readabilityEase - 80) * 1.5;
  } else {
    readabilityQuality = Math.max(20, readabilityEase * 1.6);
  }

  readabilityQuality = Math.max(0, Math.min(100, readabilityQuality));

  const overallScore = Math.round(
    originalityScore * WEIGHTS.originality +
    grammarScore * WEIGHTS.grammar +
    readabilityQuality * WEIGHTS.readability +
    structureScore * WEIGHTS.structure
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    originality: Math.round(originalityScore),
    grammar: Math.round(grammarScore),
    readability: Math.round(readabilityQuality),
    structure: Math.round(structureScore),
    breakdown: [
      { label: 'Originality', score: Math.round(originalityScore), weight: WEIGHTS.originality },
      { label: 'Grammar', score: Math.round(grammarScore), weight: WEIGHTS.grammar },
      { label: 'Readability', score: Math.round(readabilityQuality), weight: WEIGHTS.readability },
      { label: 'Structure', score: Math.round(structureScore), weight: WEIGHTS.structure },
    ],
  };
}
