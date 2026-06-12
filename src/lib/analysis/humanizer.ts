/**
 * humanizer.ts
 *
 * Library for transforming AI-generated text into natural, human-like writing.
 *
 * Heuristics applied:
 * 1. AI Transition Word Substitution (replacing delve, tapestry, moreover, etc. with synonyms)
 * 2. Contractions Injection (randomly converting formal terms e.g. "do not" -> "don't" to add flow)
 * 3. Sentence Length Variation (splitting long, compound sentences at conjunctions to introduce burstiness)
 * 4. Punctuation & Rhetorical variation (injecting em-dashes, brackets, or conversational cues)
 * 5. Tone Converters (adjusting vocabulary depending on Casual, Conversational, Professional, or Academic selection)
 *
 * Returns humanized text with embedded diff tags: [cg-diff:original|modified]
 * This allows the client to render beautiful highlighted changes easily.
 */

// Contractions map
const CONTRACTIONS: Record<string, string> = {
  'do not': "don't",
  'does not': "doesn't",
  'cannot': "can't",
  'it is': "it's",
  'that is': "that's",
  'they are': "they're",
  'we are': "we're",
  'you are': "you're",
  'should not': "shouldn't",
  'would not': "wouldn't",
  'could not': "couldn't",
  'have not': "haven't",
  'has not': "hasn't",
  'will not': "won't",
  'is not': "isn't",
  'are not': "aren't",
  'was not': "wasn't",
  'were not': "weren't",
  'there is': "there's",
  'what is': "what's",
  'who is': "who's",
  'how is': "how's",
};

// AI word synonyms dictionary
const AI_SYNONYMS: Record<string, string[]> = {
  delve: ['look', 'go deeper', 'explore', 'dig'],
  tapestry: ['blend', 'mix', 'combination', 'mosaic'],
  testament: ['proof', 'sign', 'indication', 'mark'],
  multifaceted: ['complex', 'many-sided', 'varied', 'diverse'],
  beacon: ['guide', 'light', 'sign'],
  symphony: ['mix', 'blend', 'harmony'],
  cradle: ['birthplace', 'source', 'origin'],
  seamlessly: ['easily', 'smoothly', 'without issues'],
  leverage: ['use', 'apply', 'make use of'],
  resonate: ['strike a chord', 'stick with', 'connect'],
  pivotal: ['key', 'crucial', 'critical', 'main'],
  moreover: ['also', 'plus', 'what\'s more', 'besides'],
  furthermore: ['also', 'besides', 'what\'s more'],
  consequently: ['so', 'as a result'],
  nevertheless: ['still', 'even so', 'yet', 'nonetheless'],
  utilize: ['use'],
  facilitate: ['help', 'make easier', 'support'],
  implement: ['set up', 'put in place', 'start'],
  enhance: ['improve', 'boost', 'upgrade'],
  ensure: ['make sure', 'guarantee'],
  crucial: ['key', 'vital', 'essential'],
  paramount: ['most important', 'key', 'vital'],
  ultimately: ['in the end', 'basically'],
  overall: ['all in all', 'mostly'],
};

const TONE_CASUAL_PHRASES: Record<string, string> = {
  'in conclusion': 'all in all',
  'to summarize': 'in short',
  'in addition': 'plus',
  'on the other hand': 'then again',
  'in other words': 'simply put',
  'for instance': 'like',
  'it is important to note': 'keep in mind',
  'it is worth noting': 'remember',
  'plays a crucial role': 'is key',
  'it is essential': 'we need to',
  'significantly': 'a lot',
  'in this regard': 'here',
  'as a result': 'so',
  'therefore': 'so',
  'thus': 'so',
  'hence': 'so',
};

// Capitalize first letter of string
function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Simple random element picker
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface HumanizeResult {
  rawText: string;        // Text with [cg-diff:original|modified] markers
  plainText: string;      // Clean text ready for use
  changesCount: number;
}

export function humanizeText(
  text: string,
  level: 'basic' | 'standard' | 'deep' = 'standard',
  tone: 'casual' | 'conversational' | 'professional' | 'academic' = 'conversational'
): HumanizeResult {
  if (!text || text.trim().length === 0) {
    return { rawText: '', plainText: '', changesCount: 0 };
  }

  let processed = text;
  let changesCount = 0;

  // 1. Split compound sentences to introduce length variation (only standard & deep levels)
  if (level !== 'basic') {
    // Split sentences at logical break points (", but", ", and", ";")
    // e.g., "This is a sentence, but it was split." -> "This is a sentence. But it was split."
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
    const newSentences = [];

    for (let sentence of sentences) {
      const words = sentence.trim().split(/\s+/);
      
      // Target long sentences (> 20 words) with splits
      if (words.length > 20 && Math.random() < 0.6) {
        let replaced = false;

        // Try comma splits
        if (sentence.includes(', but ')) {
          sentence = sentence.replace(', but ', '. [cg-diff:, but |But ]');
          replaced = true;
        } else if (sentence.includes(', and ')) {
          sentence = sentence.replace(', and ', '. [cg-diff:, and |And ]');
          replaced = true;
        } else if (sentence.includes('; ')) {
          sentence = sentence.replace('; ', '. [cg-diff:; |]');
          replaced = true;
        } else if (sentence.includes(', which ')) {
          sentence = sentence.replace(', which ', '. [cg-diff:, which |This ]');
          replaced = true;
        }

        if (replaced) {
          changesCount++;
        }
      }
      newSentences.push(sentence);
    }
    processed = newSentences.join('');
  }

  // Helper for applying diff tags
  const replaceWithDiff = (
    srcText: string,
    searchVal: string,
    replVal: string,
    caseSensitive = false
  ): string => {
    const regexFlags = caseSensitive ? 'g' : 'gi';
    const escaped = searchVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, regexFlags);
    
    let match;
    let modifiedText = srcText;
    
    while ((match = regex.exec(modifiedText)) !== null) {
      const originalMatch = match[0];
      // Keep match case
      let replacement = replVal;
      if (originalMatch.charAt(0) === originalMatch.charAt(0).toUpperCase()) {
        replacement = capitalize(replVal);
      }
      
      const diffTag = `[cg-diff:${originalMatch}|${replacement}]`;
      modifiedText = modifiedText.slice(0, match.index) + diffTag + modifiedText.slice(match.index + originalMatch.length);
      changesCount++;
      // Advance regex search index to skip past the diffTag
      regex.lastIndex = match.index + diffTag.length;
    }
    return modifiedText;
  };

  // Determine levels parameters
  const aiWordReplaceProb = level === 'basic' ? 0.4 : level === 'standard' ? 0.7 : 0.95;
  const contractionProb = level === 'basic' ? 0.3 : level === 'standard' ? 0.6 : 0.85;

  // 2. Replace AI synonyms (randomized based on probability)
  for (const [word, synonyms] of Object.entries(AI_SYNONYMS)) {
    if (Math.random() < aiWordReplaceProb) {
      const synonym = pickRandom(synonyms);
      processed = replaceWithDiff(processed, word, synonym);
    }
  }

  // 3. Inject contractions (e.g. "it is" -> "it's")
  for (const [formal, short] of Object.entries(CONTRACTIONS)) {
    if (Math.random() < contractionProb) {
      processed = replaceWithDiff(processed, formal, short);
    }
  }

  // 4. Inject tone specific phrases (Casual & Conversational levels)
  if (tone === 'casual' || tone === 'conversational') {
    for (const [formal, casual] of Object.entries(TONE_CASUAL_PHRASES)) {
      if (Math.random() < 0.8) {
        processed = replaceWithDiff(processed, formal, casual);
      }
    }
  }

  // 5. Deep humanization: Punctuation & Rhetorical cues (dashes, parentheses)
  if (level === 'deep' && Math.random() < 0.5) {
    // Introduce an em-dash in place of a colon or comma where appropriate
    if (processed.includes(': ') && Math.random() < 0.4) {
      processed = processed.replace(': ', ' [cg-diff:: |— ]');
      changesCount++;
    }
    // Convert a comma separator to a parenthetical comment
    if (processed.includes(', though ') && Math.random() < 0.5) {
      processed = processed.replace(', though ', ' [cg-diff:, though |(though ]') + ')';
      // simple correction, wrap end of sentence
      processed = processed.replace(/(\(though [^.!?]+)(\.)/g, '$1)$2');
      changesCount++;
    }
  }

  // Construct clean text (strip out [cg-diff:original|modified] -> modified)
  const plainText = processed.replace(/\[cg-diff:[^|]+\|([^\]]+)\]/g, '$1');

  return {
    rawText: processed,
    plainText,
    changesCount,
  };
}

/**
 * Parses [cg-diff:original|modified] string into React-renderable node objects
 */
export interface DiffSegment {
  type: 'text' | 'diff';
  text: string;
  originalText?: string;
}

export function parseDiffText(rawText: string): DiffSegment[] {
  const regex = /\[cg-diff:([^|]+)\|([^\]]+)\]/g;
  const segments: DiffSegment[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(rawText)) !== null) {
    const textBefore = rawText.slice(lastIndex, match.index);
    if (textBefore) {
      segments.push({ type: 'text', text: textBefore });
    }
    
    segments.push({
      type: 'diff',
      text: match[2],
      originalText: match[1],
    });
    
    lastIndex = regex.lastIndex;
  }
  
  const textAfter = rawText.slice(lastIndex);
  if (textAfter) {
    segments.push({ type: 'text', text: textAfter });
  }
  
  return segments;
}
