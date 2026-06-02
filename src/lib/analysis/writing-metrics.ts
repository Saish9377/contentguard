import { WritingMetricsResult } from '@/types/analysis';

const STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'am', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had', 'having'
]);

/**
 * Writing Metrics Calculator Pro
 */
export function calculateWritingMetrics(text: string): WritingMetricsResult {
  if (!text || text.trim().length === 0) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      sentenceCount: 0,
      paragraphCount: 0,
      averageWordLength: 0,
      averageSentenceLength: 0,
      uniqueWords: 0,
      vocabularyDensity: 0,
      longestWord: '',
      topWords: [],
    };
  }

  // Extract clean words
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const cleanWords = words.map(w => w.toLowerCase().replace(/[^a-z']/g, '')).filter(w => w.length > 0);
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  const wordCount = words.length;
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  const sentenceCount = sentences.length;
  const paragraphCount = Math.max(1, paragraphs.length);

  const totalWordLength = cleanWords.reduce((sum, w) => sum + w.length, 0);
  const averageWordLength = cleanWords.length > 0 ? Math.round((totalWordLength / cleanWords.length) * 10) / 10 : 0;
  const averageSentenceLength = sentenceCount > 0 ? Math.round((wordCount / sentenceCount) * 10) / 10 : 0;

  // Unique words
  const uniqueWordSet = new Set(cleanWords);
  const uniqueWords = uniqueWordSet.size;
  const vocabularyDensity = wordCount > 0 ? Math.round((uniqueWords / wordCount) * 100) / 100 : 0;

  // Longest word
  let longestWord = '';
  for (const word of cleanWords) {
    if (word.length > longestWord.length) {
      longestWord = word;
    }
  }

  // Top 10 most used words excluding stopwords
  const wordFreqs = new Map<string, number>();
  for (const word of cleanWords) {
    if (!STOPWORDS.has(word) && word.length > 1) {
      wordFreqs.set(word, (wordFreqs.get(word) || 0) + 1);
    }
  }

  const topWords = Array.from(wordFreqs.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, 10);

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    sentenceCount,
    paragraphCount,
    averageWordLength,
    averageSentenceLength,
    uniqueWords,
    vocabularyDensity,
    longestWord,
    topWords,
  };
}
