import { AIDetectionResult, SentenceAnalysis } from '@/types/analysis';
import { splitIntoSentences } from '@/lib/utils';

/**
 * AI Content Detector — Statistical Heuristic Analysis
 * 
 * Uses multiple signals to estimate AI probability:
 * 1. Perplexity estimation (word predictability)
 * 2. Burstiness (sentence length variance)
 * 3. Vocabulary richness (type-token ratio)
 * 4. Sentence uniformity (AI tends to be very uniform)
 * 5. Repetition patterns (n-gram repetition)
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

// AI transition phrases that are commonly overused
const AI_PHRASES = [
  'in conclusion', 'furthermore', 'moreover', 'in addition', 'consequently',
  'nevertheless', 'on the other hand', 'in other words', 'for instance',
  'it is important to note', 'it is worth noting', 'it should be noted',
  'in today\'s world', 'in the modern era', 'plays a crucial role',
  'it is essential', 'significantly', 'comprehensive', 'facilitate',
  'leverage', 'utilize', 'implement', 'enhance', 'ensure', 'crucial',
  'pivotal', 'paramount', 'delve', 'tapestry', 'multifaceted',
  'in this regard', 'as a result', 'therefore', 'thus', 'hence',
  'accordingly', 'overall', 'ultimately', 'in summary', 'to summarize',
  'it can be concluded', 'in light of', 'with regard to', 'pertaining to',
];

// Pre-compile AI transition phrase regexes globally to avoid overhead inside loops
const AI_PHRASE_REGEXES = AI_PHRASES.map(phrase => 
  new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
);


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
  let phraseCount = 0;

  for (const regex of AI_PHRASE_REGEXES) {
    const matches = lowerText.match(regex);
    if (matches) phraseCount += matches.length;
  }

  const words = getWords(text);
  const phraseRatio = words.length > 0 ? phraseCount / (words.length / 100) : 0;

  // High ratio = more AI-like
  // Typical human: 0-3 per 100 words, AI: 3-8 per 100 words
  return Math.min(100, Math.max(0, phraseRatio * 15));
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
      aiProbability: 20,
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

  // Sentence length factor (AI tends to write 15-25 word sentences)
  const lengthFactor = words.length >= 15 && words.length <= 25 ? 15 : 0;

  // Combine signals
  const aiProbability = Math.min(100, Math.max(0,
    phraseScore * 0.35 +
    predictability * 0.30 +
    lengthFactor * 0.15 +
    (100 - measureVocabularyRichness(words)) * 0.20
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
    aiProbability,
    classification,
    confidence: Math.min(95, Math.max(20, confidence)),
  };
}

/**
 * Main AI detection function.
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
    // Default weights with some signature variation based on AI score
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

      // Try basic text replacement rules to "humanize" it
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
        // Fallback: split or rephrase
        const words = s.text.split(/\s+/);
        if (words.length > 20) {
          reason = 'Long, overly structured sentence. Splitting it makes it more readable and human-like.';
          const mid = Math.floor(words.length / 2);
          suggestion = words.slice(0, mid).join(' ') + '. ' + words.slice(mid).join(' ');
        } else {
          // Just make it active or simpler
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

interface HFClassificationResult {
  label: string;
  score: number;
}

const hfAICache = new Map<string, number>();
const hfAIBatchCache = new Map<string, number[]>();

/**
 * Query Hugging Face Inference API for overall text AI probability.
 */
async function queryHF_AIDetection(text: string, token: string): Promise<number | null> {
  const cacheKey = text.trim();
  if (hfAICache.has(cacheKey)) {
    return hfAICache.get(cacheKey) ?? null;
  }
  
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/roberta-base-openai-detector',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const flatData: HFClassificationResult[] = Array.isArray(data[0]) ? data[0] : data;
    const aiLabel = flatData.find((item) => item.label === 'LABEL_1');
    if (aiLabel && typeof aiLabel.score === 'number') {
      const score = Math.round(aiLabel.score * 100);
      hfAICache.set(cacheKey, score);
      return score;
    }
  } catch (error) {
    console.error('Hugging Face AI Detection API failed, falling back to local heuristics:', error);
  }
  return null;
}

/**
 * Query Hugging Face Inference API for sentence-level AI probability in a single batch.
 */
async function queryHF_AIDetectionBatch(sentences: string[], token: string): Promise<number[] | null> {
  const cacheKey = sentences.join('|');
  if (hfAIBatchCache.has(cacheKey)) {
    return hfAIBatchCache.get(cacheKey) ?? null;
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/roberta-base-openai-detector',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: sentences }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF Batch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      const scores = data.map((item) => {
        const flatData: HFClassificationResult[] = Array.isArray(item) ? item : [item];
        const aiLabel = flatData.find((lbl) => lbl.label === 'LABEL_1');
        return aiLabel ? Math.round(aiLabel.score * 100) : 20;
      });
      hfAIBatchCache.set(cacheKey, scores);
      return scores;
    }
  } catch (error) {
    console.error('Hugging Face Batch AI Detection failed:', error);
  }
  return null;
}

export async function detectAI(text: string, hfToken?: string): Promise<AIDetectionResult> {
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

  // Calculate metrics
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const perplexity = estimatePerplexity(words);
  const burstiness = measureBurstiness(sentenceLengths);
  const vocabularyRichness = measureVocabularyRichness(words);
  const sentenceUniformity = measureSentenceUniformity(sentenceLengths);
  const repetitionScore = measureRepetition(words);
  const phraseUsage = measureAIPhraseUsage(text);

  // Weighted AI score (Heuristic Fallback)
  let aiScore = Math.min(100, Math.max(0, Math.round(
    (100 - perplexity) * 0.15 +
    (100 - burstiness) * 0.25 +
    (100 - vocabularyRichness) * 0.15 +
    (100 - sentenceUniformity) * 0.20 +
    repetitionScore * 0.10 +
    phraseUsage * 0.15
  )));

  // Hugging Face Accuracy Augmentation
  if (hfToken) {
    const hfScore = await queryHF_AIDetection(text, hfToken);
    if (hfScore !== null) {
      aiScore = hfScore;
    }
  }

  const humanScore = 100 - aiScore;
  const confidenceScore = Math.min(95, Math.max(30, Math.abs(aiScore - 50) * 1.5 + 30));

  // Batch query sentences if HF token is set
  let hfSentenceScores: number[] | null = null;
  if (hfToken && sentences.length > 0) {
    hfSentenceScores = await queryHF_AIDetectionBatch(sentences, hfToken);
  }

  // Analyze individual sentences
  let currentIndex = 0;
  const sentenceAnalyses: SentenceAnalysis[] = sentences.map((sentence, idx) => {
    const analysis = classifySentence(sentence);
    
    // Override with Hugging Face score if available
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
  
  // Calculate a composite Content Trust Score (higher is better)
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
