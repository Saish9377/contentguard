import { GrammarResult, GrammarError } from '@/types/analysis';

/**
 * Grammar Checker — Two-Layer Analysis
 *
 * Layer 1 (sync, instant): Pattern-based regex rules
 *   Catches: double words, a/an errors, subject-verb agreement, common misspellings,
 *   punctuation issues, passive voice, wordy phrases.
 *
 * Layer 2 (async, ~300ms): LanguageTool public API
 *   Catches: homophones (their/there/they're), wrong prepositions, complex agreement,
 *   contextual spelling errors, style suggestions, and much more.
 *   Endpoint: https://api.languagetool.org/v2/check
 *   No API key required; free public tier, ~20 requests/min.
 *
 * checkGrammarWithNLP() runs both layers and merges results.
 * checkGrammarLocal() runs only Layer 1 (sync, for use in client-side contexts).
 */

interface PatternRule {
  pattern: RegExp;
  type: GrammarError['type'];
  severity: GrammarError['severity'];
  message: string;
  suggestion: (match: RegExpExecArray) => string[];
}

const GRAMMAR_RULES: PatternRule[] = [
  // Double words
  {
    pattern: /\b(\w+)\s+\1\b/gi,
    type: 'grammar',
    severity: 'error',
    message: 'Repeated word detected.',
    suggestion: (match) => [match[1]],
  },
  // a/an usage
  {
    pattern: /\ba\s+([aeiou]\w+)/gi,
    type: 'grammar',
    severity: 'error',
    message: 'Use "an" before words starting with a vowel sound.',
    suggestion: (match) => [`an ${match[1]}`],
  },
  {
    pattern: /\ban\s+([^aeiou\s]\w+)/gi,
    type: 'grammar',
    severity: 'error',
    message: 'Use "a" before words starting with a consonant sound.',
    suggestion: (match) => [`a ${match[1]}`],
  },
  // Subject-verb agreement patterns
  {
    pattern: /\b(he|she|it)\s+(are|were|have)\b/gi,
    type: 'grammar',
    severity: 'error',
    message: 'Subject-verb agreement error.',
    suggestion: (match) => {
      const fixes: Record<string, string> = { are: 'is', were: 'was', have: 'has' };
      return [`${match[1]} ${fixes[match[2].toLowerCase()] || match[2]}`];
    },
  },
  {
    pattern: /\b(they|we)\s+(is|was|has)\b/gi,
    type: 'grammar',
    severity: 'error',
    message: 'Subject-verb agreement error.',
    suggestion: (match) => {
      const fixes: Record<string, string> = { is: 'are', was: 'were', has: 'have' };
      return [`${match[1]} ${fixes[match[2].toLowerCase()] || match[2]}`];
    },
  },
  // Common misspellings
  {
    pattern: /\b(teh|hte)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: () => ['the'],
  },
  {
    pattern: /\b(recieve|reciept)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: (match) => [match[1].replace('ie', 'ei')],
  },
  {
    pattern: /\b(occurr?ance|occurance)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: () => ['occurrence'],
  },
  {
    pattern: /\b(definately|definatly)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: () => ['definitely'],
  },
  {
    pattern: /\b(seperate)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: () => ['separate'],
  },
  {
    pattern: /\b(accomodate)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: 'Possible misspelling.',
    suggestion: () => ['accommodate'],
  },
  {
    pattern: /\b(alot)\b/gi,
    type: 'spelling',
    severity: 'error',
    message: '"alot" is not a word — did you mean "a lot"?',
    suggestion: () => ['a lot'],
  },
  // Punctuation issues
  {
    pattern: /\s+[,.:;!?]/g,
    type: 'punctuation',
    severity: 'warning',
    message: 'Space before punctuation mark.',
    suggestion: (match) => [match[0].trim()],
  },
  {
    pattern: /[.!?]{3,}/g,
    type: 'punctuation',
    severity: 'warning',
    message: 'Excessive punctuation.',
    suggestion: (match) => [match[0][0]],
  },
  // Style suggestions
  {
    pattern: /\b(very|really|extremely|incredibly|absolutely)\s+(very|really|extremely|incredibly|absolutely)\b/gi,
    type: 'style',
    severity: 'suggestion',
    message: 'Redundant intensifier.',
    suggestion: (match) => [match[2]],
  },
  {
    pattern: /\b(in order to)\b/gi,
    type: 'style',
    severity: 'suggestion',
    message: 'Wordy phrase. Consider simplifying.',
    suggestion: () => ['to'],
  },
  {
    pattern: /\b(due to the fact that)\b/gi,
    type: 'style',
    severity: 'suggestion',
    message: 'Wordy phrase. Consider simplifying.',
    suggestion: () => ['because'],
  },
  {
    pattern: /\b(at this point in time)\b/gi,
    type: 'style',
    severity: 'suggestion',
    message: 'Wordy phrase. Consider simplifying.',
    suggestion: () => ['now', 'currently'],
  },
  // Passive voice detection (simplified)
  {
    pattern: /\b(was|were|is|are|been|being)\s+(\w+ed)\b/gi,
    type: 'style',
    severity: 'suggestion',
    message: 'Possible passive voice. Consider using active voice for clearer writing.',
    suggestion: () => [],
  },
];

/**
 * Layer 1: Synchronous regex-based grammar check.
 * Runs instantly with no network calls.
 */
export function checkGrammarLocal(text: string): GrammarResult {
  if (!text || text.trim().length === 0) {
    return {
      errors: [],
      errorCount: 0,
      warningCount: 0,
      suggestionCount: 0,
      grammarScore: 100,
      isNLPEnhanced: false,
    };
  }

  const errors: GrammarError[] = [];

  for (const rule of GRAMMAR_RULES) {
    const regex = rule.pattern;
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const suggestions = rule.suggestion(match);
      errors.push({
        message: rule.message,
        type: rule.type,
        severity: rule.severity,
        offset: match.index,
        length: match[0].length,
        originalText: match[0],
        suggestions,
      });

      if (match[0].length === 0) break;
    }
  }

  // Sentence capitalization check
  const sentenceRegex = /[^.!?]+(?:[.!?]+|$)/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = sentenceRegex.exec(text)) !== null) {
    const sentenceText = sMatch[0];
    const trimmed = sentenceText.trim();
    if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase() && /[a-z]/.test(trimmed[0])) {
      const trimOffset = sentenceText.indexOf(trimmed);
      const offset = sMatch.index + trimOffset;
      
      let isSentenceStart = (offset === 0);
      if (!isSentenceStart) {
        let ptr = offset - 1;
        while (ptr >= 0 && /\s/.test(text[ptr])) {
          ptr--;
        }
        if (ptr < 0 || /[.!?]/.test(text[ptr])) {
          isSentenceStart = true;
        }
      }
      
      if (isSentenceStart) {
        errors.push({
          message: 'Sentence should start with a capital letter.',
          type: 'grammar',
          severity: 'error',
          offset,
          length: 1,
          originalText: trimmed[0],
          suggestions: [trimmed[0].toUpperCase()],
        });
      }
    }
  }

  return buildResult(errors, false);
}

// ─── LanguageTool API Integration ─────────────────────────────────────────────

interface LTMatch {
  message: string;
  offset: number;
  length: number;
  replacements: { value: string }[];
  rule: {
    id: string;
    category: { id: string };
    issueType?: string;
  };
  context: {
    text: string;
    offset: number;
    length: number;
  };
}

interface LTResponse {
  matches: LTMatch[];
}

// Category → our GrammarError type mapping
function ltCategoryToType(rule: LTMatch['rule']): GrammarError['type'] {
  const cat = rule.category?.id ?? '';
  const issueType = rule.issueType ?? '';
  if (cat === 'TYPOS' || issueType === 'misspelling') return 'spelling';
  if (cat === 'PUNCTUATION') return 'punctuation';
  if (cat === 'STYLE' || cat === 'REDUNDANCY') return 'style';
  return 'grammar';
}

function ltIssueTypeToSeverity(rule: LTMatch['rule']): GrammarError['severity'] {
  const issueType = rule.issueType ?? '';
  if (issueType === 'style' || issueType === 'locale-violation') return 'suggestion';
  if (issueType === 'duplication' || issueType === 'whitespace') return 'warning';
  return 'error';
}

async function fetchLanguageTool(text: string): Promise<LTMatch[]> {
  const body = new URLSearchParams({
    text,
    language: 'en-US',
    disabledRules: 'WHITESPACE_RULE,EN_QUOTES', // suppress trivial rules
  });

  const response = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`LanguageTool API error: ${response.status}`);
  }

  const data: LTResponse = await response.json();
  return data.matches ?? [];
}

// ─── Build Result ──────────────────────────────────────────────────────────────

function buildResult(errors: GrammarError[], isNLPEnhanced: boolean): GrammarResult {
  // Sort and deduplicate by offset
  errors.sort((a, b) => a.offset - b.offset);
  const unique = errors.filter((e, i) => {
    if (i === 0) return true;
    return e.offset !== errors[i - 1].offset;
  });

  const errorCount = unique.filter(e => e.severity === 'error').length;
  const warningCount = unique.filter(e => e.severity === 'warning').length;
  const suggestionCount = unique.filter(e => e.severity === 'suggestion').length;

  // Penalty-based score: deduct from 100 per issue type
  // Each error = -3, warning = -1.5, suggestion = -0.5 (capped at 0)
  const penalty = errorCount * 3 + warningCount * 1.5 + suggestionCount * 0.5;
  const grammarScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

  return {
    errors: unique,
    errorCount,
    warningCount,
    suggestionCount,
    grammarScore,
    isNLPEnhanced,
  };
}


/**
 * Layer 1 + Layer 2: Async grammar check with NLP enhancement.
 * Combines regex rules with LanguageTool context-aware analysis.
 * Falls back gracefully to local-only results if LT API is unavailable.
 */
export async function checkGrammarWithNLP(text: string): Promise<GrammarResult> {
  if (!text || text.trim().length === 0) {
    return {
      errors: [],
      errorCount: 0,
      warningCount: 0,
      suggestionCount: 0,
      grammarScore: 100,
      isNLPEnhanced: false,
    };
  }

  // Layer 1: instant regex results
  const localResult = checkGrammarLocal(text);

  // Layer 2: LanguageTool NLP (async)
  let ltMatches: LTMatch[] = [];
  try {
    // LanguageTool accepts up to ~40,000 chars on the free public endpoint
    ltMatches = await fetchLanguageTool(text.slice(0, 40000));
  } catch {
    // Silently fall back to local-only results
    return localResult;
  }

  // Convert LT matches to our GrammarError format
  const ltErrors: GrammarError[] = ltMatches.map(match => ({
    message: match.message,
    type: ltCategoryToType(match.rule),
    severity: ltIssueTypeToSeverity(match.rule),
    offset: match.offset,
    length: match.length,
    originalText: text.substring(match.offset, match.offset + match.length),
    suggestions: match.replacements.slice(0, 3).map(r => r.value),
  }));

  // Merge: prefer LT errors over regex errors at the same offset (LT is more accurate)
  const ltOffsets = new Set(ltErrors.map(e => e.offset));

  // Keep local errors that LT didn't find, and all LT errors
  const filteredLocal = localResult.errors.filter(e => !ltOffsets.has(e.offset));
  const merged = [...filteredLocal, ...ltErrors];


  return buildResult(merged, true);
}

/**
 * @deprecated Use checkGrammarWithNLP() for full NLP analysis or checkGrammarLocal() for sync-only.
 * This alias exists for backward compatibility.
 */
export function checkGrammar(text: string): GrammarResult {
  return checkGrammarLocal(text);
}
