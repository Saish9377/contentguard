import { GrammarResult, GrammarError } from '@/types/analysis';

/**
 * Grammar Checker — Pattern-based Grammar Analysis
 * 
 * Detects common grammar, spelling, and style issues using pattern matching.
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
 * Check grammar on the given text.
 */
export function checkGrammar(text: string): GrammarResult {
  if (!text || text.trim().length === 0) {
    return {
      errors: [],
      errorCount: 0,
      warningCount: 0,
      suggestionCount: 0,
      grammarScore: 100,
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

      // Prevent infinite loops on zero-length matches
      if (match[0].length === 0) break;
    }
  }

  // Check sentence capitalization
  const sentenceRegex = /[^.!?]+(?:[.!?]+|$)/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = sentenceRegex.exec(text)) !== null) {
    const sentenceText = sMatch[0];
    const trimmed = sentenceText.trim();
    if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase() && /[a-z]/.test(trimmed[0])) {
      const trimOffset = sentenceText.indexOf(trimmed);
      const offset = sMatch.index + trimOffset;
      
      // Check if it's the start of a sentence (either start of text, or first non-whitespace character backwards is sentence punctuation)
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

  // Sort by offset
  errors.sort((a, b) => a.offset - b.offset);

  // Remove duplicates (same offset)
  const uniqueErrors = errors.filter((error, index) => {
    if (index === 0) return true;
    return error.offset !== errors[index - 1].offset;
  });

  const errorCount = uniqueErrors.filter(e => e.severity === 'error').length;
  const warningCount = uniqueErrors.filter(e => e.severity === 'warning').length;
  const suggestionCount = uniqueErrors.filter(e => e.severity === 'suggestion').length;

  // Calculate grammar score
  const totalIssues = errorCount * 3 + warningCount * 1.5 + suggestionCount * 0.5;
  const wordCount = text.split(/\s+/).length;
  const issueRate = wordCount > 0 ? totalIssues / wordCount : 0;
  const grammarScore = Math.max(0, Math.min(100, Math.round(100 - issueRate * 500)));

  return {
    errors: uniqueErrors,
    errorCount,
    warningCount,
    suggestionCount,
    grammarScore,
  };
}
