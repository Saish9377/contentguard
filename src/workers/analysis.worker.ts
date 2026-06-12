import { detectAI } from '../lib/analysis/ai-detector';
import { checkPlagiarism, WebSearchResult } from '../lib/analysis/plagiarism-checker';

/**
 * Analysis Web Worker
 *
 * Runs heavy analysis tasks off the main thread.
 *
 * Supported message types:
 *   ai        — run AI content detection
 *   plagiarism — run plagiarism check (with optional web search results)
 *
 * Note: HF token is no longer passed via postMessage. All HF calls are
 * proxied through /api/hf/detect on the server side.
 */
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, text, jobId, webSearchResults } = event.data as {
    type: 'ai' | 'plagiarism';
    text: string;
    jobId?: string;
    webSearchResults?: WebSearchResult[];
  };

  try {
    if (type === 'ai') {
      const result = await detectAI(text);
      self.postMessage({ type: 'success', result, jobId, text });
    } else if (type === 'plagiarism') {
      const result = await checkPlagiarism(text, webSearchResults);
      self.postMessage({ type: 'success', result, jobId, text });
    } else {
      self.postMessage({ type: 'error', error: `Unknown task type: ${type}`, jobId });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'An error occurred during worker analysis',
      jobId
    });
  }
});
