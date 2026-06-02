export interface SentenceAnalysis {
  text: string;
  startIndex: number;
  endIndex: number;
  aiProbability: number;
  classification: 'human' | 'mixed' | 'ai';
  confidence: number;
}

export interface AIDetectionResult {
  aiScore: number;
  humanScore: number;
  confidenceScore: number;
  sentences: SentenceAnalysis[];
  metrics: {
    perplexity: number;
    burstiness: number;
    vocabularyRichness: number;
    sentenceUniformity: number;
    repetitionScore: number;
  };
  humanizerScore: {
    aiGenerated: number;
    humanized: number;
  };
  modelDetection: {
    chatgpt: number;
    gemini: number;
    claude: number;
    likelySource: string;
  };
  trustScore: number;
  suggestions: {
    sentenceIndex: number;
    originalText: string;
    suggestion: string;
    reason: string;
  }[];
}

export interface PlagiarismMatch {
  text: string;
  matchPercentage: number;
  source: string;
  url?: string;
  startIndex: number;
  endIndex: number;
}

export interface PlagiarismResult {
  originalityScore: number;
  similarityScore: number;
  matches: PlagiarismMatch[];
  totalMatchedWords: number;
  totalWords: number;
}

export interface GrammarError {
  message: string;
  type: 'grammar' | 'spelling' | 'punctuation' | 'style';
  severity: 'error' | 'warning' | 'suggestion';
  offset: number;
  length: number;
  originalText: string;
  suggestions: string[];
}

export interface GrammarResult {
  errors: GrammarError[];
  errorCount: number;
  warningCount: number;
  suggestionCount: number;
  grammarScore: number;
}

export interface ReadabilityResult {
  fleschKincaid: number;
  fleschReadingEase: number;
  gunningFog: number;
  colemanLiau: number;
  smog: number;
  averageReadingTime: string;
  readingLevel: string;
  complexityScore: number;
}

export interface WritingMetricsResult {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  averageWordLength: number;
  averageSentenceLength: number;
  uniqueWords: number;
  vocabularyDensity: number;
  longestWord: string;
  topWords: { word: string; count: number }[];
}

export interface EssayStructureResult {
  hasIntroduction: boolean;
  hasBody: boolean;
  hasConclusion: boolean;
  introductionScore: number;
  bodyScore: number;
  conclusionScore: number;
  overallScore: number;
  feedback: string[];
}

export interface QualityScoreResult {
  overallScore: number;
  originality: number;
  grammar: number;
  readability: number;
  structure: number;
  breakdown: {
    label: string;
    score: number;
    weight: number;
  }[];
}

export interface ToneAnalysisResult {
  tone: 'Formal' | 'Casual' | 'Aggressive' | 'Persuasive' | 'Neutral';
  score: number;
  breakdown: {
    formal: number;
    casual: number;
    aggressive: number;
    persuasive: number;
    neutral: number;
  };
  explanation: string;
}

export interface FullAnalysisResult {
  id: string;
  text: string;
  timestamp: string;
  aiDetection: AIDetectionResult;
  plagiarism: PlagiarismResult;
  grammar: GrammarResult;
  readability: ReadabilityResult;
  writingMetrics: WritingMetricsResult;
  essayStructure: EssayStructureResult;
  qualityScore: QualityScoreResult;
  tone?: ToneAnalysisResult;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'complete' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  progress: number;
  result: FullAnalysisResult | null;
  error: string | null;
}

