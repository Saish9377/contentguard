import { detectAI } from '../lib/analysis/ai-detector';
import { checkPlagiarism } from '../lib/analysis/plagiarism-checker';

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, text, token } = event.data;

  try {
    if (type === 'ai') {
      const result = await detectAI(text, token);
      self.postMessage({ type: 'success', result });
    } else if (type === 'plagiarism') {
      const result = await checkPlagiarism(text, token);
      self.postMessage({ type: 'success', result });
    } else {
      self.postMessage({ type: 'error', error: `Unknown task type: ${type}` });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'An error occurred during worker analysis'
    });
  }
});
