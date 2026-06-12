/**
 * report-helper.ts
 *
 * Utility for serializing and deserializing analysis reports into URL query strings.
 * This allows sharing report results with zero backend and database costs!
 */

export interface SerializedReport {
  id: string;
  type: 'ai' | 'plagiarism' | 'grammar';
  aiScore: number;
  originalityScore: number;
  grammarScore: number;
  qualityScore: number;
  wordCount: number;
  timestamp: string;
  textPreview: string;
}

/**
 * Encodes a report object into a URL-safe Base64 string.
 */
export function serializeReport(report: SerializedReport): string {
  const jsonStr = JSON.stringify(report);
  
  // Unicode-safe Base64 encoding
  let base64 = '';
  if (typeof window !== 'undefined' && typeof window.btoa !== 'undefined') {
    base64 = window.btoa(unescape(encodeURIComponent(jsonStr)));
  } else {
    base64 = Buffer.from(jsonStr, 'utf-8').toString('base64');
  }
  
  // Replace +, / and = to make it URL-safe
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a URL-safe Base64 string back into a report object.
 */
export function deserializeReport(safeBase64: string): SerializedReport | null {
  try {
    // Restore base64 padding and characters
    let base64 = safeBase64
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    while (base64.length % 4) {
      base64 += '=';
    }
    
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob !== 'undefined') {
      jsonStr = decodeURIComponent(escape(window.atob(base64)));
    } else {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    }
    
    return JSON.parse(jsonStr) as SerializedReport;
  } catch (err) {
    console.error('Failed to deserialize report data:', err);
    return null;
  }
}
