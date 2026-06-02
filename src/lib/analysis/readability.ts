import { ReadabilityResult } from '@/types/analysis';
import { splitIntoSentences } from '@/lib/utils';

/**
 * Readability Analyzer
 * 
 * Implements multiple readability formulas:
 * - Flesch-Kincaid Grade Level
 * - Flesch Reading Ease
 * - Gunning Fog Index
 * - Coleman-Liau Index
 * - SMOG Index
 */

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 2) return 1;

  // Remove trailing 'e'
  word = word.replace(/e$/, '');

  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;

  return Math.max(1, count);
}

function getWords(text: string): string[] {
  return text.split(/\s+/).filter(w => w.replace(/[^a-z]/gi, '').length > 0);
}

function isComplexWord(word: string): boolean {
  return countSyllables(word) >= 3;
}

/**
 * Flesch-Kincaid Grade Level
 * Higher = harder to read
 */
function fleschKincaidGrade(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
}

/**
 * Flesch Reading Ease
 * Higher = easier to read (0-100)
 */
function fleschReadingEase(words: number, sentences: number, syllables: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

/**
 * Gunning Fog Index
 * Estimates years of formal education needed
 */
function gunningFog(words: number, sentences: number, complexWords: number): number {
  if (sentences === 0 || words === 0) return 0;
  return 0.4 * ((words / sentences) + 100 * (complexWords / words));
}

/**
 * Coleman-Liau Index
 * Based on characters per word and sentences per word
 */
function colemanLiau(characters: number, words: number, sentences: number): number {
  if (words === 0) return 0;
  const L = (characters / words) * 100; // avg characters per 100 words
  const S = (sentences / words) * 100;  // avg sentences per 100 words
  return 0.0588 * L - 0.296 * S - 15.8;
}

/**
 * SMOG Index
 * Simplified Measure of Gobbledygook
 */
function smogIndex(sentences: number, complexWords: number): number {
  if (sentences === 0) return 0;
  return 1.0430 * Math.sqrt(complexWords * (30 / sentences)) + 3.1291;
}

/**
 * Determine reading level label from grade level.
 */
function getReadingLevel(grade: number): string {
  if (grade <= 5) return 'Elementary';
  if (grade <= 8) return 'Middle School';
  if (grade <= 12) return 'High School';
  if (grade <= 16) return 'College';
  return 'Graduate';
}

/**
 * Calculate average reading time (assuming 200 WPM for average reader).
 */
function calculateReadingTime(wordCount: number): string {
  const minutes = Math.ceil(wordCount / 200);
  if (minutes < 1) return 'Less than 1 min';
  if (minutes === 1) return '1 min';
  return `${minutes} min`;
}

/**
 * Calculate complexity score (0-100).
 */
function calculateComplexity(fleschEase: number): number {
  // Flesch Reading Ease: 0-100 (higher = easier)
  // We invert it for complexity: 0-100 (higher = more complex)
  return Math.max(0, Math.min(100, Math.round(100 - fleschEase)));
}

/**
 * Main readability analysis function.
 */
export function analyzeReadability(text: string): ReadabilityResult {
  if (!text || text.trim().length === 0) {
    return {
      fleschKincaid: 0,
      fleschReadingEase: 0,
      gunningFog: 0,
      colemanLiau: 0,
      smog: 0,
      averageReadingTime: '0 min',
      readingLevel: 'N/A',
      complexityScore: 0,
    };
  }

  const words = getWords(text);
  const sentences = splitIntoSentences(text);
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);

  // Count syllables and complex words in a single pass
  let totalSyllables = 0;
  let complexWordCount = 0;
  let charCount = 0;

  for (const w of words) {
    const syllables = countSyllables(w);
    totalSyllables += syllables;
    if (syllables >= 3) {
      complexWordCount++;
    }
    
    // Count alphabetical characters directly (a-z, A-Z) to avoid large string allocations
    for (let i = 0; i < w.length; i++) {
      const code = w.charCodeAt(i);
      if ((code >= 97 && code <= 122) || (code >= 65 && code <= 90)) {
        charCount++;
      }
    }
  }

  // Calculate scores
  const fk = Math.max(0, Math.round(fleschKincaidGrade(wordCount, sentenceCount, totalSyllables) * 10) / 10);
  const fre = Math.max(0, Math.min(100, Math.round(fleschReadingEase(wordCount, sentenceCount, totalSyllables) * 10) / 10));
  const gf = Math.max(0, Math.round(gunningFog(wordCount, sentenceCount, complexWordCount) * 10) / 10);
  const cl = Math.max(0, Math.round(colemanLiau(charCount, wordCount, sentenceCount) * 10) / 10);
  const sm = sentenceCount >= 3 
    ? Math.max(0, Math.round(smogIndex(sentenceCount, complexWordCount) * 10) / 10)
    : 0;

  return {
    fleschKincaid: fk,
    fleschReadingEase: fre,
    gunningFog: gf,
    colemanLiau: cl,
    smog: sm,
    averageReadingTime: calculateReadingTime(wordCount),
    readingLevel: getReadingLevel(fk),
    complexityScore: calculateComplexity(fre),
  };
}
