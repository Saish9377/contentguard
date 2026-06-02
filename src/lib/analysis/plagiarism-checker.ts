import { PlagiarismResult, PlagiarismMatch } from '@/types/analysis';
import { splitIntoSentences } from '@/lib/utils';

/**
 * Plagiarism Checker — N-gram Fingerprinting & Similarity Analysis
 * 
 * For MVP: Uses internal text analysis with simulated source matching.
 * Production: Would integrate with web search APIs for real source detection.
 */

// Simulated known sources database for demo
const KNOWN_SOURCES = [
  {
    name: 'Wikipedia — Artificial Intelligence',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    phrases: [
      'artificial intelligence is intelligence demonstrated by machines',
      'machine learning is a subset of artificial intelligence',
      'deep learning uses neural networks with many layers',
      'natural language processing enables computers to understand human language',
    ],
  },
  {
    name: 'Stanford AI Index Report',
    url: 'https://aiindex.stanford.edu',
    phrases: [
      'the global ai market is projected to grow',
      'ai adoption has increased significantly',
      'machine learning models have shown remarkable performance',
    ],
  },
  {
    name: 'MIT Technology Review',
    url: 'https://technologyreview.com',
    phrases: [
      'generative ai has transformed content creation',
      'large language models are trained on vast datasets',
      'responsible ai development requires careful consideration',
    ],
  },
];

/**
 * Generate word-level shingles for fingerprinting.
 */
function generateShingles(text: string, size: number = 5): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  const shingles = new Set<string>();
  
  for (let i = 0; i <= words.length - size; i++) {
    shingles.add(words.slice(i, i + size).join(' '));
  }
  
  return shingles;
}

/**
 * Calculate Jaccard similarity between two sets.
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  
  let intersectionSize = 0;
  // Iterate over the smaller set for efficiency
  if (setA.size < setB.size) {
    for (const x of setA) {
      if (setB.has(x)) intersectionSize++;
    }
  } else {
    for (const x of setB) {
      if (setA.has(x)) intersectionSize++;
    }
  }
  
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

const hfSemanticCache = new Map<string, number[]>();

/**
 * Query Hugging Face Inference API for semantic similarity scores.
 */
async function queryHFSemanticSimilarity(
  sourceSentence: string,
  targetSentences: string[],
  token: string
): Promise<number[] | null> {
  const cacheKey = `${sourceSentence}:${targetSentences.join('|')}`;
  if (hfSemanticCache.has(cacheKey)) {
    return hfSemanticCache.get(cacheKey) ?? null;
  }

  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            source_sentence: sourceSentence,
            sentences: targetSentences,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HF Semantic API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      const scores = (data as unknown[]).map((val) => typeof val === 'number' ? val : 0);
      hfSemanticCache.set(cacheKey, scores);
      return scores;
    }
  } catch (error) {
    console.error('Hugging Face Semantic Similarity failed:', error);
  }
  return null;
}

/**
 * Check text against known sources for matching phrases.
 */
async function findMatches(text: string, sentences: string[], hfToken?: string): Promise<PlagiarismMatch[]> {
  const matches: PlagiarismMatch[] = [];
  const lowerText = text.toLowerCase();

  // Known sources flat list for batch semantic comparison
  const allKnownPhrases: string[] = [];
  const phraseToSourceMap: { phrase: string; sourceName: string; url: string }[] = [];
  for (const source of KNOWN_SOURCES) {
    for (const phrase of source.phrases) {
      allKnownPhrases.push(phrase);
      phraseToSourceMap.push({ phrase, sourceName: source.name, url: source.url });
    }
  }

  // Check against known sources semantically if token is available
  if (hfToken && sentences.length > 0 && allKnownPhrases.length > 0) {
    for (const sentence of sentences) {
      if (sentence.trim().split(/\s+/).length < 3) continue;
      const scores = await queryHFSemanticSimilarity(sentence, allKnownPhrases, hfToken);
      if (scores) {
        scores.forEach((score, idx) => {
          if (score > 0.65) {
            const mapped = phraseToSourceMap[idx];
            const startIndex = text.indexOf(sentence);
            if (!matches.some(m => m.text === sentence)) {
              matches.push({
                text: sentence,
                matchPercentage: Math.round(score * 100),
                source: mapped.sourceName,
                url: mapped.url,
                startIndex: startIndex >= 0 ? startIndex : 0,
                endIndex: startIndex >= 0 ? startIndex + sentence.length : sentence.length,
              });
            }
          }
        });
      }
    }
  }

  // Check against known source phrases using exact matching
  for (const source of KNOWN_SOURCES) {
    for (const phrase of source.phrases) {
      if (lowerText.includes(phrase)) {
        const startIndex = lowerText.indexOf(phrase);
        const matchedSubstring = text.substring(startIndex, startIndex + phrase.length);
        if (!matches.some(m => m.text === matchedSubstring)) {
          matches.push({
            text: matchedSubstring,
            matchPercentage: 90 + Math.random() * 10,
            source: source.name,
            url: source.url,
            startIndex,
            endIndex: startIndex + phrase.length,
          });
        }
      }
    }
  }

  // Pre-calculate shingles (size 3) for internal duplicate detection
  const sentenceShingles3 = sentences.map(s => generateShingles(s, 3));

  // Check for internal self-similarity (duplicate sentences within text)
  for (let i = 0; i < sentences.length; i++) {
    const shinglesA = sentenceShingles3[i];
    if (shinglesA.size === 0) continue;

    // Batch query semantic scores for sentence i compared to all subsequent sentences
    let semanticScores: number[] | null = null;
    if (hfToken) {
      const targets = sentences.slice(i + 1);
      if (targets.length > 0) {
        semanticScores = await queryHFSemanticSimilarity(sentences[i], targets, hfToken);
      }
    }

    for (let j = i + 1; j < sentences.length; j++) {
      const shinglesB = sentenceShingles3[j];
      if (shinglesB.size === 0) continue;

      const jaccardScore = jaccardSimilarity(shinglesA, shinglesB);
      let combinedScore = jaccardScore;

      if (semanticScores) {
        const semanticScore = semanticScores[j - (i + 1)] || 0;
        combinedScore = 0.6 * semanticScore + 0.4 * jaccardScore;
      }

      if (combinedScore > 0.5) {
        const startIndex = text.indexOf(sentences[j]);
        if (!matches.some(m => m.startIndex === startIndex)) {
          matches.push({
            text: sentences[j],
            matchPercentage: Math.round(combinedScore * 100),
            source: 'Internal duplicate',
            startIndex: startIndex >= 0 ? startIndex : 0,
            endIndex: startIndex >= 0 ? startIndex + sentences[j].length : sentences[j].length,
          });
        }
      }
    }
  }

  // Generate some plausible flagged sentences for demonstration
  const sentenceShingles = sentences.map(s => ({
    sentence: s,
    shingles: generateShingles(s, 4),
  }));

  for (const { sentence, shingles } of sentenceShingles) {
    if (shingles.size < 3) continue;

    // Simulate a match probability based on generic phrase patterns
    const words = sentence.toLowerCase().split(/\s+/);
    const genericPhraseCount = words.filter(w => 
      ['however', 'therefore', 'furthermore', 'additionally', 'consequently'].includes(w)
    ).length;

    if (genericPhraseCount >= 2 && !matches.some(m => m.text === sentence)) {
      const startIndex = text.indexOf(sentence);
      matches.push({
        text: sentence,
        matchPercentage: 30 + Math.round(Math.random() * 25),
        source: 'Similar content found online',
        url: 'https://example.com/similar-content',
        startIndex: startIndex >= 0 ? startIndex : 0,
        endIndex: startIndex >= 0 ? startIndex + sentence.length : sentence.length,
      });
    }
  }

  return matches;
}

/**
 * Main plagiarism checking function.
 */
export async function checkPlagiarism(text: string, hfToken?: string): Promise<PlagiarismResult> {
  if (!text || text.trim().length === 0) {
    return {
      originalityScore: 100,
      similarityScore: 0,
      matches: [],
      totalMatchedWords: 0,
      totalWords: 0,
    };
  }

  const sentences = splitIntoSentences(text);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;

  const matches = await findMatches(text, sentences, hfToken);

  // Calculate matched words
  const matchedChars = new Set<number>();
  matches.forEach(match => {
    for (let i = match.startIndex; i < match.endIndex; i++) {
      matchedChars.add(i);
    }
  });

  // Estimate matched word count
  const totalMatchedWords = matches.reduce((sum, m) => {
    return sum + m.text.split(/\s+/).length;
  }, 0);

  const similarityScore = totalWords > 0
    ? Math.min(100, Math.round((totalMatchedWords / totalWords) * 100))
    : 0;

  const originalityScore = Math.max(0, 100 - similarityScore);

  return {
    originalityScore,
    similarityScore,
    matches,
    totalMatchedWords: Math.min(totalMatchedWords, totalWords),
    totalWords,
  };
}
