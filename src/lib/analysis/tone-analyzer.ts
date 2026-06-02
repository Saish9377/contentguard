import { splitIntoSentences } from '@/lib/utils';

export interface ToneAnalysisResult {
  tone: 'Formal' | 'Casual' | 'Aggressive' | 'Persuasive' | 'Neutral';
  score: number; // confidence score 0-100
  breakdown: {
    formal: number;
    casual: number;
    aggressive: number;
    persuasive: number;
    neutral: number;
  };
  explanation: string;
}

const FORMAL_WORDS = [
  'therefore', 'consequently', 'subsequently', 'furthermore', 'moreover',
  'nevertheless', 'nonetheless', 'however', 'indeed', 'demonstrates',
  'exhibits', 'illustrates', 'utilize', 'implement', 'significant',
  'analytical', 'conducted', 'empirical', 'investigate', 'approximately'
];

const CASUAL_WORDS = [
  'hey', 'basically', 'cool', 'awesome', 'guy', 'stuff', 'thing',
  'maybe', 'totally', 'kid', 'yeah', 'wanna', 'gonna', 'y\'all',
  'like', 'guess', 'sort of', 'kind of', 'pretty much', 'whatever'
];

const AGGRESSIVE_WORDS = [
  'must', 'demand', 'unacceptable', 'useless', 'terrible', 'ridiculous',
  'fail', 'failings', 'wrong', 'incorrect', 'bad', 'refuse', 'never',
  'stop', 'disaster', 'awful', 'hate', 'blame', 'guilty', 'liar'
];

const PERSUASIVE_WORDS = [
  'should', 'believe', 'essential', 'crucial', 'vital', 'important',
  'imagine', 'guarantee', 'proven', 'effective', 'trust', 'benefit',
  'best', 'discover', 'need', 'action', 'together', 'success', 'power'
];

/**
 * Heuristics-based Tone Analyzer.
 * Analyzes vocabulary and syntax style to determine content tone.
 * 
 * @param text The source text to analyze.
 * @returns ToneAnalysisResult
 */
export function analyzeTone(text: string): ToneAnalysisResult {
  if (!text || text.trim().length === 0) {
    return {
      tone: 'Neutral',
      score: 100,
      breakdown: { formal: 0, casual: 0, aggressive: 0, persuasive: 0, neutral: 100 },
      explanation: 'No text provided to analyze.',
    };
  }

  const cleanText = text.toLowerCase();
  const words = cleanText.replace(/[^a-z\s']/g, '').split(/\s+/).filter(w => w.length > 0);
  const sentences = splitIntoSentences(text);
  
  let formalScore = 0;
  let casualScore = 0;
  let aggressiveScore = 0;
  let persuasiveScore = 0;
  const neutralScore = 20; // baseline neutral

  // 1. Keyword density signals
  for (const word of words) {
    if (FORMAL_WORDS.includes(word)) formalScore += 8;
    if (CASUAL_WORDS.includes(word)) casualScore += 10;
    if (AGGRESSIVE_WORDS.includes(word)) aggressiveScore += 12;
    if (PERSUASIVE_WORDS.includes(word)) persuasiveScore += 8;
  }

  // 2. Structural heuristics
  
  // Contractions signal casual tone (e.g. don't, it's, i'm, you're, we've)
  const contractions = cleanText.match(/\b\w+['’](?:t|s|m|re|ve|ll|d)\b/g);
  if (contractions) {
    casualScore += contractions.length * 12;
  }

  // Exclamation marks signal aggressive or casual/persuasive tone
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 0) {
    aggressiveScore += exclamations * 8;
    casualScore += exclamations * 5;
  }

  // Rhetorical questions signal persuasive tone
  const questions = (text.match(/\?/g) || []).length;
  if (questions > 0) {
    persuasiveScore += questions * 8;
  }

  // Sentence length signals
  if (sentences.length > 0) {
    const averageSentenceLength = words.length / sentences.length;
    // Long sentences indicate formal writing
    if (averageSentenceLength > 22) {
      formalScore += 15;
    }
    // Short punchy sentences indicate casual or aggressive writing
    if (averageSentenceLength < 12) {
      casualScore += 10;
      persuasiveScore += 5;
    }
  }

  // Normalize scores to sum to 100
  const rawSum = formalScore + casualScore + aggressiveScore + persuasiveScore + neutralScore;
  
  const breakdown = {
    formal: Math.round((formalScore / rawSum) * 100),
    casual: Math.round((casualScore / rawSum) * 100),
    aggressive: Math.round((aggressiveScore / rawSum) * 100),
    persuasive: Math.round((persuasiveScore / rawSum) * 100),
    neutral: 0
  };

  // Adjust neutral as the remainder to sum to exactly 100
  breakdown.neutral = Math.max(0, 100 - (breakdown.formal + breakdown.casual + breakdown.aggressive + breakdown.persuasive));

  // Determine primary tone
  const scoresArray = [
    { tone: 'Formal' as const, val: breakdown.formal },
    { tone: 'Casual' as const, val: breakdown.casual },
    { tone: 'Aggressive' as const, val: breakdown.aggressive },
    { tone: 'Persuasive' as const, val: breakdown.persuasive },
    { tone: 'Neutral' as const, val: breakdown.neutral },
  ];

  scoresArray.sort((a, b) => b.val - a.val);
  const primary = scoresArray[0];
  const primaryTone = primary.tone;
  const confidence = primary.val;

  let explanation = '';
  switch (primaryTone) {
    case 'Formal':
      explanation = 'The writing exhibits an analytical, objective, and professional structure typical of academic papers, business communications, and reports.';
      break;
    case 'Casual':
      explanation = 'The content displays contractions, punctuation variety, and relaxed vocabulary suitable for blog posts, emails, and direct chats.';
      break;
    case 'Aggressive':
      explanation = 'The tone contains high forcefulness, demand adjectives, or intense punctuation which can project strong criticism or urgency.';
      break;
    case 'Persuasive':
      explanation = 'The structure utilizes rhetorical style words, action verbs, and confidence markers designed to sway the reader\'s opinion or inspire action.';
      break;
    default:
      explanation = 'The text uses plain descriptive language and statements of fact, maintaining an impartial and objective stance.';
      break;
  }

  return {
    tone: primaryTone,
    score: confidence,
    breakdown,
    explanation,
  };
}
