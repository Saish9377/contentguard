import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/hf/detect — Server-side Hugging Face Inference API proxy
 *
 * Security: HF_TOKEN lives only on the server; never sent to the browser.
 * Caching:  In-memory LRU-style cache with 10-minute TTL.
 * Retry:    Single retry with 1-second delay on 503/429 responses.
 *
 * Modes:
 *   overall  — single text → AI probability score (0-100)
 *   batch    — array of sentences → array of AI probability scores
 *   semantic — source sentence + target sentences → similarity scores (0-1)
 */

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 500;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T) {
    if (this.store.size >= MAX_CACHE_SIZE) {
      // Evict oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}

const overallCache = new TTLCache<number>();
const batchCache = new TTLCache<number[]>();
const semanticCache = new TTLCache<number[]>();

// ─── Retry Wrapper ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error('withRetry: exhausted attempts');
}

// ─── HF Fetch Helpers ─────────────────────────────────────────────────────────

interface HFLabel {
  label: string;
  score: number;
}

async function fetchHFDetector(
  inputs: string | string[],
  token: string
): Promise<HFLabel[][] | null> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/roberta-base-openai-detector',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const status = response.status;
    // Throw so withRetry can catch 503/429
    if (status === 503 || status === 429) {
      throw new Error(`HF API ${status}`);
    }
    return null;
  }

  const data = await response.json();
  // Normalise: single input returns [[...]], batch returns [[...], [...], ...]
  if (!Array.isArray(data)) return null;
  if (Array.isArray(data[0])) return data as HFLabel[][];
  return [data] as HFLabel[][];
}

function extractAIScore(labels: HFLabel[]): number {
  const ai = labels.find(l => l.label === 'LABEL_1');
  return ai ? Math.round(ai.score * 100) : 20;
}

async function fetchHFSemantic(
  sourceSentence: string,
  sentences: string[],
  token: string
): Promise<number[] | null> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: { source_sentence: sourceSentence, sentences } }),
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!response.ok) {
    const status = response.status;
    if (status === 503 || status === 429) throw new Error(`HF Semantic ${status}`);
    return null;
  }

  const data = await response.json();
  if (!Array.isArray(data)) return null;
  return (data as unknown[]).map(v => (typeof v === 'number' ? v : 0));
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const token = process.env.HF_TOKEN;

  if (!token) {
    // No token configured — tell client to use local heuristics
    return NextResponse.json({ source: 'fallback', reason: 'no_token' }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const mode = body.mode as string;

  // ── Mode: overall ──────────────────────────────────────────────────────────
  if (mode === 'overall') {
    const text = body.text as string;
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const cacheKey = text.slice(0, 500);
    const cached = overallCache.get(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json({ score: cached, source: 'cache' });
    }

    try {
      const results = await withRetry(() => fetchHFDetector(text.slice(0, 512), token));
      if (!results) {
        return NextResponse.json({ source: 'fallback', reason: 'hf_error' });
      }
      const score = extractAIScore(results[0]);
      overallCache.set(cacheKey, score);
      return NextResponse.json({ score, source: 'hf' });
    } catch {
      return NextResponse.json({ source: 'fallback', reason: 'hf_unavailable' });
    }
  }

  // ── Mode: batch ────────────────────────────────────────────────────────────
  if (mode === 'batch') {
    const sentences = body.sentences as string[];
    if (!Array.isArray(sentences) || sentences.length === 0) {
      return NextResponse.json({ error: 'sentences array required' }, { status: 400 });
    }

    const cacheKey = sentences.join('|').slice(0, 600);
    const cached = batchCache.get(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json({ scores: cached, source: 'cache' });
    }

    try {
      // Truncate each sentence to 512 chars
      const trimmed = sentences.map(s => s.slice(0, 512));
      const results = await withRetry(() => fetchHFDetector(trimmed, token));
      if (!results) {
        return NextResponse.json({ source: 'fallback', reason: 'hf_error' });
      }
      const scores = results.map(labels => extractAIScore(labels));
      batchCache.set(cacheKey, scores);
      return NextResponse.json({ scores, source: 'hf' });
    } catch {
      return NextResponse.json({ source: 'fallback', reason: 'hf_unavailable' });
    }
  }

  // ── Mode: semantic ─────────────────────────────────────────────────────────
  if (mode === 'semantic') {
    const sourceSentence = body.sourceSentence as string;
    const targetSentences = body.targetSentences as string[];
    if (!sourceSentence || !Array.isArray(targetSentences)) {
      return NextResponse.json({ error: 'sourceSentence and targetSentences required' }, { status: 400 });
    }

    const cacheKey = `${sourceSentence.slice(0, 200)}:${targetSentences.join('|').slice(0, 400)}`;
    const cached = semanticCache.get(cacheKey);
    if (cached !== undefined) {
      return NextResponse.json({ scores: cached, source: 'cache' });
    }

    try {
      const scores = await withRetry(() =>
        fetchHFSemantic(sourceSentence.slice(0, 512), targetSentences.map(s => s.slice(0, 256)), token)
      );
      if (!scores) {
        return NextResponse.json({ source: 'fallback', reason: 'hf_error' });
      }
      semanticCache.set(cacheKey, scores);
      return NextResponse.json({ scores, source: 'hf' });
    } catch {
      return NextResponse.json({ source: 'fallback', reason: 'hf_unavailable' });
    }
  }

  return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
}
