import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/plagiarism/search — Real-time web search proxy for plagiarism checking
 *
 * Accepts: { sentences: string[] }  (max 5 most unique sentences)
 * Returns: WebSearchResult[]        (sentence → matched web snippets with similarity scores)
 *
 * Search priority:
 *   1. Bing Web Search API (if BING_SEARCH_API_KEY is set)
 *   2. DuckDuckGo instant answer API (unofficial, no key needed)
 *   3. Empty array (silent fallback — local heuristics still run in the worker)
 *
 * Caching: In-memory TTL cache (10 min) to avoid duplicate API calls.
 */

interface SearchMatch {
  title: string;
  url: string;
  snippet: string;
  similarity: number;
}

interface WebSearchResult {
  sentence: string;
  matches: SearchMatch[];
}

// ─── TTL Cache ─────────────────────────────────────────────────────────────────

const CACHE_TTL = 10 * 60 * 1000;
const searchCache = new Map<string, { results: SearchMatch[]; expiresAt: number }>();

function getCached(key: string): SearchMatch[] | null {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    searchCache.delete(key);
    return null;
  }
  return entry.results;
}

function setCache(key: string, results: SearchMatch[]) {
  // Evict oldest entries if cache grows too large
  if (searchCache.size >= 200) {
    const firstKey = searchCache.keys().next().value;
    if (firstKey !== undefined) searchCache.delete(firstKey);
  }
  searchCache.set(key, { results, expiresAt: Date.now() + CACHE_TTL });
}

// ─── Similarity Helpers ────────────────────────────────────────────────────────

/**
 * Normalised word-level overlap ratio between two strings.
 * Fast approximate similarity without requiring HF (used on snippets).
 */
function wordOverlapSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }
  return overlap / Math.max(wordsA.size, wordsB.size);
}

// ─── Bing Search ───────────────────────────────────────────────────────────────

async function searchBing(query: string, apiKey: string): Promise<SearchMatch[]> {
  const url = new URL('https://api.bing.microsoft.com/v7.0/search');
  url.searchParams.set('q', `"${query.slice(0, 150)}"`);
  url.searchParams.set('count', '5');
  url.searchParams.set('responseFilter', 'Webpages');

  const response = await fetch(url.toString(), {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) throw new Error(`Bing ${response.status}`);

  const data = await response.json();
  const webPages = data?.webPages?.value ?? [];

  return webPages.map((page: { name: string; url: string; snippet: string }) => ({
    title: page.name ?? '',
    url: page.url ?? '',
    snippet: page.snippet ?? '',
    similarity: wordOverlapSimilarity(query, page.snippet ?? ''),
  })).filter((m: SearchMatch) => m.similarity > 0.2);
}

// ─── DuckDuckGo Instant Answer (unofficial) ───────────────────────────────────

async function searchDDG(query: string): Promise<SearchMatch[]> {
  // DuckDuckGo's Instant Answer API returns summary text but not full SERP URLs.
  // We use it to retrieve AbstractText + AbstractURL as a single-result fallback.
  const url = new URL('https://api.duckduckgo.com/');
  url.searchParams.set('q', query.slice(0, 200));
  url.searchParams.set('format', 'json');
  url.searchParams.set('no_html', '1');
  url.searchParams.set('skip_disambig', '1');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(5000),
    headers: { 'User-Agent': 'ContentGuard-PlagiarismChecker/1.0' },
  });

  if (!response.ok) return [];

  const data = await response.json();

  const results: SearchMatch[] = [];

  if (data.AbstractText && data.AbstractURL) {
    results.push({
      title: data.AbstractSource ?? data.AbstractURL,
      url: data.AbstractURL,
      snippet: data.AbstractText,
      similarity: wordOverlapSimilarity(query, data.AbstractText),
    });
  }

  // RelatedTopics can contain additional result links
  if (Array.isArray(data.RelatedTopics)) {
    for (const topic of data.RelatedTopics.slice(0, 4)) {
      if (topic.FirstURL && topic.Text) {
        results.push({
          title: topic.Text.slice(0, 80),
          url: topic.FirstURL,
          snippet: topic.Text,
          similarity: wordOverlapSimilarity(query, topic.Text),
        });
      }
    }
  }

  return results.filter(r => r.similarity > 0.15);
}

// ─── Route Handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: { sentences?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sentences = body.sentences;
  if (!Array.isArray(sentences) || sentences.length === 0) {
    return NextResponse.json({ results: [] });
  }

  // Limit to 5 most unique sentences (longer sentences = more distinctive)
  const topSentences = [...sentences]
    .filter(s => s.trim().split(/\s+/).length >= 6)
    .sort((a, b) => b.length - a.length)
    .slice(0, 5);

  const bingKey = process.env.BING_SEARCH_API_KEY ?? '';
  const results: WebSearchResult[] = [];

  for (const sentence of topSentences) {
    const cacheKey = sentence.toLowerCase().trim().slice(0, 200);
    const cached = getCached(cacheKey);

    if (cached !== null) {
      results.push({ sentence, matches: cached });
      continue;
    }

    let matches: SearchMatch[] = [];
    try {
      if (bingKey) {
        matches = await searchBing(sentence, bingKey);
      } else {
        matches = await searchDDG(sentence);
      }
    } catch (err) {
      console.error('Search error for sentence:', err);
      // Silent fallback — local heuristics will still run
    }

    setCache(cacheKey, matches);
    if (matches.length > 0) {
      results.push({ sentence, matches });
    }
  }

  return NextResponse.json({ results });
}
