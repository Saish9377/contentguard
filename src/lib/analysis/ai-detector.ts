import { AIDetectionResult, SentenceAnalysis } from '@/types/analysis';
import { splitIntoSentences } from '@/lib/utils';
import { queryHFOverallAI, queryHFBatchAI } from '@/lib/hf-client';

/**
 * AI Content Detector — Statistical Heuristic Analysis
 * 
 * Uses multiple signals to estimate AI probability:
 * 1. Perplexity estimation (word predictability)
 * 2. Burstiness (sentence length variance)
 * 3. Vocabulary richness (type-token ratio)
 * 4. Sentence uniformity (AI tends to be very uniform)
 * 5. Repetition patterns (n-gram repetition)
 *
 * When HF_TOKEN is configured server-side, the proxy at /api/hf/detect
 * is used for higher accuracy — the token is never exposed to the browser.
 */

// Common English word frequencies (top words for baseline comparison)
const COMMON_WORDS = new Set([
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
]);

// AI transition phrases commonly overused
const AI_PHRASES_HIGH = [
  'delve', 'tapestry', 'testament', 'multifaceted', 'beacon', 'symphony',
  'cradle', 'seamlessly', 'leverage', 'resonate', 'pivotal', 'moreover',
  'furthermore', 'not only', 'in conclusion', 'consequently'
];

const AI_PHRASES_MEDIUM = [
  'in addition', 'nevertheless', 'on the other hand', 'in other words', 
  'for instance', 'it is important to note', 'it is worth noting', 
  'it should be noted', 'in today\'s world', 'in the modern era', 
  'plays a crucial role', 'it is essential', 'significantly', 
  'comprehensive', 'facilitate', 'utilize', 'implement', 'enhance', 
  'ensure', 'crucial', 'paramount', 'in this regard', 'as a result', 
  'therefore', 'thus', 'hence', 'accordingly', 'overall', 'ultimately', 
  'in summary', 'to summarize', 'it can be concluded', 'in light of', 
  'with regard to', 'pertaining to'
];



function getWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z\s']/g, '').split(/\s+/).filter(w => w.length > 0);
}

function getNgrams(words: string[], n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Estimate perplexity based on word frequency distribution.
 * AI text tends to have lower perplexity (more predictable words).
 */
function estimatePerplexity(words: string[]): number {
  if (words.length === 0) return 50;
  
  let commonCount = 0;
  for (const w of words) {
    if (COMMON_WORDS.has(w)) commonCount++;
  }
  const commonRatio = commonCount / words.length;
  
  // AI typically uses more common/predictable words
  // Human writing tends to be more varied
  // Scale: 0 (very predictable/AI-like) to 100 (very varied/human-like)
  const perplexity = Math.min(100, Math.max(0, (1 - commonRatio) * 150));
  
  return perplexity;
}

/**
 * Measure burstiness — the variance in sentence length and complexity.
 * Human writing has high burstiness (mix of short and long sentences).
 * AI writing tends to have uniform sentence lengths.
 */
function measureBurstiness(lengths: number[]): number {
  if (lengths.length < 2) return 50;

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? (stdDev / mean) * 100 : 0;

  // High CV = more burstiness = more human-like
  // Typical human CV: 40-80%, AI CV: 15-35%
  return Math.min(100, coefficientOfVariation * 1.5);
}

/**
 * Measure vocabulary richness using Type-Token Ratio.
 * AI text often has lower vocabulary diversity.
 */
function measureVocabularyRichness(words: string[]): number {
  if (words.length === 0) return 50;

  const wordFreq = new Map<string, number>();
  for (const w of words) {
    wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
  }
  const ttr = wordFreq.size / words.length;

  // Hapax legomena ratio (words appearing only once)
  let hapax = 0;
  for (const f of wordFreq.values()) {
    if (f === 1) hapax++;
  }
  const hapaxRatio = hapax / words.length;

  // Combine TTR and hapax ratio
  const richness = (ttr * 60 + hapaxRatio * 40);
  return Math.min(100, Math.max(0, richness * 1.5));
}

/**
 * Measure sentence uniformity.
 * AI tends to produce sentences of similar structure and length.
 */
function measureSentenceUniformity(lengths: number[]): number {
  if (lengths.length < 3) return 50;

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Check how many sentences are within 30% of mean length
  const nearMean = lengths.filter(l => Math.abs(l - mean) / mean < 0.3).length;
  const uniformityRatio = nearMean / lengths.length;

  // High uniformity = more AI-like
  // Scale: 0 (very uniform/AI) to 100 (very varied/human)
  return Math.min(100, Math.max(0, (1 - uniformityRatio) * 130));
}

/**
 * Detect AI transition phrase usage.
 */
function measureAIPhraseUsage(text: string): number {
  const lowerText = text.toLowerCase();
  let highCount = 0;
  let medCount = 0;

  AI_PHRASES_HIGH.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) highCount += matches.length;
  });

  AI_PHRASES_MEDIUM.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) medCount += matches.length;
  });

  const words = getWords(text);
  if (words.length === 0) return 0;
  
  // High weight phrases have a 3.5x multiplier, medium have 1.2x multiplier
  const totalWeightedPhrases = (highCount * 3.5) + (medCount * 1.2);
  const phraseRatio = totalWeightedPhrases / (words.length / 100);

  // Typical human: ratio < 1.5. AI: ratio 3.0+.
  return Math.min(100, Math.max(0, Math.round(phraseRatio * 25)));
}

/**
 * Measure punctuation variety and uniformity.
 */
function measurePunctuationPatterns(text: string): number {
  const totalWords = text.split(/\s+/).filter(Boolean).length;
  if (totalWords < 20) return 50;

  // 1. Check special punctuation presence
  const exclamations = (text.match(/!/g) || []).length;
  const dashes = (text.match(/[—–-]/g) || []).length;
  const parens = (text.match(/[()]/g) || []).length;
  const ellipses = (text.match(/\.\.\./g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  
  const punchPoints = (exclamations > 0 ? 15 : 0) + (ellipses > 0 ? 20 : 0) + (dashes > 0 ? 10 : 0) + (parens > 0 ? 10 : 0) + (questions > 0 ? 10 : 0);
  const punctuationVarietyScore = Math.max(0, 100 - (punchPoints * 1.5)); // 0 = diverse (human), 100 = rigid (AI)

  // 2. Comma spacing uniformity
  const commaSegments = text.split(',');
  if (commaSegments.length > 3) {
    const segmentLengths = commaSegments.map(seg => seg.split(/\s+/).filter(Boolean).length);
    const mean = segmentLengths.reduce((a, b) => a + b, 0) / segmentLengths.length;
    const variance = segmentLengths.reduce((sum, l) => sum + Math.pow(l - mean, 2), 0) / segmentLengths.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 3 && mean >= 4 && mean <= 15) {
      return Math.round(0.4 * 100 + 0.6 * punctuationVarietyScore);
    }
  }

  return Math.round(punctuationVarietyScore);
}

/**
 * Measure n-gram repetition patterns.
 */
function measureRepetition(words: string[]): number {
  if (words.length < 10) return 0;

  const trigrams = getNgrams(words, 3);
  const trigramFreq = new Map<string, number>();
  trigrams.forEach(ng => trigramFreq.set(ng, (trigramFreq.get(ng) || 0) + 1));

  const repeatedTrigrams = Array.from(trigramFreq.values()).filter(f => f > 1).length;
  const repetitionRatio = trigrams.length > 0 ? repeatedTrigrams / trigrams.length : 0;

  // High repetition can indicate AI patterns
  return Math.min(100, repetitionRatio * 200);
}

/**
 * Classify a single sentence as human, mixed, or AI.
 */
function classifySentence(sentence: string): SentenceAnalysis {
  const words = getWords(sentence);
  const startIndex = 0;
  const endIndex = sentence.length;

  if (words.length < 3) {
    return {
      text: sentence,
      startIndex,
      endIndex,
      aiProbability: 15,
      classification: 'human',
      confidence: 40,
    };
  }

  // Per-sentence signals
  const phraseScore = measureAIPhraseUsage(sentence);
  let commonCount = 0;
  for (const w of words) {
    if (COMMON_WORDS.has(w)) commonCount++;
  }
  const commonRatio = words.length > 0 ? commonCount / words.length : 0;
  const predictability = commonRatio * 100;

  // Sentence length factor (AI tends to write 14-26 word sentences)
  const lengthFactor = words.length >= 14 && words.length <= 26 ? 20 : 0;

  // Combine signals
  const aiProbability = Math.min(100, Math.max(0,
    phraseScore * 0.40 +
    predictability * 0.35 +
    lengthFactor * 0.15 +
    (100 - measureVocabularyRichness(words)) * 0.10
  ));

  let classification: 'human' | 'mixed' | 'ai';
  if (aiProbability < 35) classification = 'human';
  else if (aiProbability < 65) classification = 'mixed';
  else classification = 'ai';

  const confidence = Math.abs(aiProbability - 50) * 2;

  return {
    text: sentence,
    startIndex,
    endIndex,
    aiProbability: Math.round(aiProbability),
    classification,
    confidence: Math.min(95, Math.max(20, Math.round(confidence))),
  };
}

/**
 * Detect likely model source based on vocabulary patterns.
 */
function detectModelSource(text: string, aiScore: number): { chatgpt: number; gemini: number; claude: number; likelySource: string } {
  if (aiScore < 15) {
    return { chatgpt: 0, gemini: 0, claude: 0, likelySource: 'Human' };
  }

  const lowerText = text.toLowerCase();
  
  // ChatGPT signatures
  const gptWords = ['delve', 'tapestry', 'moreover', 'furthermore', 'leverage', 'utilize', 'testament', 'important to note', 'not only', 'in conclusion', 'multifaceted'];
  let gptCount = 0;
  gptWords.forEach(w => {
    const matches = lowerText.match(new RegExp(w, 'g'));
    if (matches) gptCount += matches.length;
  });

  // Gemini signatures
  const geminiWords = ['here is', 'explore', 'basically', 'essentially', 'let\'s look', 'bullet points', 'summarizing', 'let\'s delve'];
  let geminiCount = 0;
  geminiWords.forEach(w => {
    const matches = lowerText.match(new RegExp(w, 'g'));
    if (matches) geminiCount += matches.length;
  });

  // Claude signatures
  const claudeWords = ['indeed', 'conversely', 'nonetheless', 'specifically', 'precise', 'nuance', 'critical examination', 'let us analyze', 'thoughtful'];
  let claudeCount = 0;
  claudeWords.forEach(w => {
    const matches = lowerText.match(new RegExp(w, 'g'));
    if (matches) claudeCount += matches.length;
  });

  const total = gptCount + geminiCount + claudeCount;
  if (total === 0) {
    const chatgpt = Math.round(50 + (aiScore % 10));
    const gemini = Math.round(25 - (aiScore % 5));
    const claude = 100 - chatgpt - gemini;
    return { chatgpt, gemini, claude, likelySource: 'ChatGPT' };
  }

  const chatgpt = Math.round((gptCount / total) * 100);
  const gemini = Math.round((geminiCount / total) * 100);
  const claude = 100 - chatgpt - gemini;

  let likelySource = 'ChatGPT';
  if (gemini > chatgpt && gemini > claude) likelySource = 'Gemini';
  if (claude > chatgpt && claude > gemini) likelySource = 'Claude';

  return { chatgpt, gemini, claude, likelySource };
}

function generateRewriteSuggestions(sentences: SentenceAnalysis[]): { sentenceIndex: number; originalText: string; suggestion: string; reason: string }[] {
  const suggestions: { sentenceIndex: number; originalText: string; suggestion: string; reason: string }[] = [];
  
  sentences.forEach((s, idx) => {
    if (s.classification === 'ai' && suggestions.length < 3) {
      let suggestion = s.text;
      let reason = 'Sentence structure is highly predictable and characteristic of AI generation.';

      const transitions = [
        { regex: /\bmoreover\b/gi, replacement: 'also' },
        { regex: /\bfurthermore\b/gi, replacement: 'in addition' },
        { regex: /\butilize\b/gi, replacement: 'use' },
        { regex: /\bleverage\b/gi, replacement: 'use' },
        { regex: /\bdelve\b/gi, replacement: 'look' },
        { regex: /\bin conclusion\b/gi, replacement: 'overall' },
        { regex: /\bconsequently\b/gi, replacement: 'so' },
        { regex: /\bit is important to note that\b/gi, replacement: 'remember that' }
      ];

      let modified = false;
      transitions.forEach(({ regex, replacement }) => {
        if (regex.test(suggestion)) {
          suggestion = suggestion.replace(regex, replacement);
          modified = true;
        }
      });

      if (modified) {
        reason = 'Overused AI transition words detected. Replaced with simpler terms to improve natural flow.';
      } else {
        const words = s.text.split(/\s+/);
        if (words.length > 20) {
          reason = 'Long, overly structured sentence. Splitting it makes it more readable and human-like.';
          const mid = Math.floor(words.length / 2);
          suggestion = words.slice(0, mid).join(' ') + '. ' + words.slice(mid).join(' ');
        } else {
          suggestion = 'For instance, ' + s.text.charAt(0).toLowerCase() + s.text.slice(1);
          reason = 'Adding introductory phrases and direct verbs can break up the robotic sentence rhythm.';
        }
      }

      suggestions.push({
        sentenceIndex: idx,
        originalText: s.text,
        suggestion,
        reason
      });
    }
  });

  return suggestions;
}

export async function detectAI(text: string): Promise<AIDetectionResult> {
  if (!text || text.trim().length === 0) {
    return {
      aiScore: 0,
      humanScore: 100,
      confidenceScore: 0,
      sentences: [],
      metrics: {
        perplexity: 0,
        burstiness: 0,
        vocabularyRichness: 0,
        sentenceUniformity: 0,
        repetitionScore: 0,
      },
      humanizerScore: { aiGenerated: 0, humanized: 100 },
      modelDetection: { chatgpt: 0, gemini: 0, claude: 0, likelySource: 'Human' },
      trustScore: 100,
      suggestions: [],
    };
  }

  const words = getWords(text);
  const sentences = splitIntoSentences(text);

  // Calculate local heuristic metrics
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const perplexity = estimatePerplexity(words);
  const burstiness = measureBurstiness(sentenceLengths);
  const vocabularyRichness = measureVocabularyRichness(words);
  const sentenceUniformity = measureSentenceUniformity(sentenceLengths);
  const repetitionScore = measureRepetition(words);
  const phraseUsage = measureAIPhraseUsage(text);
  const punctuationPatternScore = measurePunctuationPatterns(text);

  // Weighted local AI score (always calculated as baseline/fallback)
  let localAiScore = Math.min(100, Math.max(0, Math.round(
    (100 - perplexity) * 0.15 +
    (100 - burstiness) * 0.20 +
    (100 - vocabularyRichness) * 0.10 +
    (100 - sentenceUniformity) * 0.15 +
    repetitionScore * 0.10 +
    phraseUsage * 0.20 +
    punctuationPatternScore * 0.10
  )));

  // If very short text, cap the AI score to avoid false positives on short inputs
  if (words.length < 15) {
    localAiScore = Math.min(30, localAiScore);
  }

  let aiScore = localAiScore;

  // Attempt server-side HF proxy for higher accuracy (non-blocking)
  const hfScore = await queryHFOverallAI(text);
  if (hfScore !== null) {
    // Blend: local heuristics are the main engine (60% weight), HF acts as calibration overlay (40% weight)
    aiScore = Math.round(localAiScore * 0.6 + hfScore * 0.4);
  }

  const humanScore = 100 - aiScore;
  const confidenceScore = Math.min(95, Math.max(30, Math.abs(aiScore - 50) * 1.5 + 30));

  // Batch sentence scoring via proxy
  let hfSentenceScores: number[] | null = null;
  if (sentences.length > 0) {
    hfSentenceScores = await queryHFBatchAI(sentences);
  }

  // Analyze individual sentences
  let currentIndex = 0;
  const sentenceAnalyses: SentenceAnalysis[] = sentences.map((sentence, idx) => {
    const analysis = classifySentence(sentence);
    
    // Override with HF score if available
    if (hfSentenceScores && hfSentenceScores[idx] !== undefined) {
      const sentenceAiProb = hfSentenceScores[idx];
      analysis.aiProbability = sentenceAiProb;
      if (sentenceAiProb < 35) {
        analysis.classification = 'human';
      } else if (sentenceAiProb < 65) {
        analysis.classification = 'mixed';
      } else {
        analysis.classification = 'ai';
      }
      analysis.confidence = Math.min(95, Math.max(20, Math.abs(sentenceAiProb - 50) * 2));
    }

    const startIndex = text.indexOf(sentence, currentIndex);
    currentIndex = startIndex + sentence.length;
    return {
      ...analysis,
      startIndex: startIndex >= 0 ? startIndex : 0,
      endIndex: startIndex >= 0 ? startIndex + sentence.length : sentence.length,
    };
  });

  const humanizerScore = {
    aiGenerated: aiScore,
    humanized: 100 - aiScore,
  };

  const modelDetection = detectModelSource(text, aiScore);
  
  const trustScore = Math.max(0, Math.min(100, Math.round(
    100 - (aiScore * 0.6) - (repetitionScore * 0.2) + (burstiness * 0.1) + (perplexity * 0.1)
  )));

  const suggestions = generateRewriteSuggestions(sentenceAnalyses);

  return {
    aiScore,
    humanScore,
    confidenceScore,
    sentences: sentenceAnalyses,
    metrics: {
      perplexity: Math.round(perplexity),
      burstiness: Math.round(burstiness),
      vocabularyRichness: Math.round(vocabularyRichness),
      sentenceUniformity: Math.round(sentenceUniformity),
      repetitionScore: Math.round(repetitionScore),
    },
    humanizerScore,
    modelDetection,
    trustScore,
    suggestions,
  };
}
