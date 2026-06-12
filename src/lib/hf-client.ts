/**
 * hf-client.ts
 *
 * Client-side utility for Hugging Face inference.
 * All calls go through /api/hf/detect — the actual HF_TOKEN
 * never leaves the server, so it is never exposed in client JS bundles.
 *
 * Features:
 * - Request deduplication: identical in-flight calls return the same promise
 * - Transparent fallback: returns null on any failure so callers can use local heuristics
 */

// In-flight deduplication map (text → pending promise)
const inFlight = new Map<string, Promise<number | null>>();
const inFlightBatch = new Map<string, Promise<number[] | null>>();

/**
 * Query overall AI probability for a block of text.
 * Returns 0-100 probability that the text is AI-generated, or null if the proxy is unavailable.
 */
export async function queryHFOverallAI(text: string): Promise<number | null> {
  const key = `overall:${text.slice(0, 200)}`;
  if (inFlight.has(key)) return inFlight.get(key)!;

  const promise = (async (): Promise<number | null> => {
    try {
      const res = await fetch('/api/hf/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'overall', text }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return typeof data.score === 'number' ? data.score : null;
    } catch {
      return null;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Query AI probability for an array of sentences in one batch call.
 * Returns parallel array of scores (0-100), or null if unavailable.
 */
export async function queryHFBatchAI(sentences: string[]): Promise<number[] | null> {
  if (sentences.length === 0) return [];
  const key = `batch:${sentences.join('|').slice(0, 300)}`;
  if (inFlightBatch.has(key)) return inFlightBatch.get(key)!;

  const promise = (async (): Promise<number[] | null> => {
    try {
      const res = await fetch('/api/hf/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'batch', sentences }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data.scores) ? data.scores : null;
    } catch {
      return null;
    } finally {
      inFlightBatch.delete(key);
    }
  })();

  inFlightBatch.set(key, promise);
  return promise;
}

/**
 * Query semantic similarity between a source sentence and an array of target sentences.
 * Returns parallel array of similarity scores (0-1), or null if unavailable.
 */
export async function queryHFSemantic(
  sourceSentence: string,
  targetSentences: string[]
): Promise<number[] | null> {
  if (targetSentences.length === 0) return [];
  try {
    const res = await fetch('/api/hf/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'semantic', sourceSentence, targetSentences }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data.scores) ? data.scores : null;
  } catch {
    return null;
  }
}
