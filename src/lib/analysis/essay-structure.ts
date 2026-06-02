import { EssayStructureResult } from '@/types/analysis';
import { splitIntoParagraphs } from '@/lib/utils';

/**
 * Essay Structure Analyzer
 * 
 * Detects introduction, body, and conclusion sections
 * and scores their quality.
 */

const INTRO_INDICATORS = [
  'this essay', 'this paper', 'this article', 'in this',
  'the purpose', 'the aim', 'introduction', 'thesis',
  'the following', 'we will', 'i will', 'this report',
  'the topic', 'the subject', 'overview', 'background',
];

const CONCLUSION_INDICATORS = [
  'in conclusion', 'to conclude', 'in summary', 'to summarize',
  'overall', 'finally', 'in closing', 'to sum up',
  'ultimately', 'as a result', 'therefore', 'thus',
  'it can be concluded', 'the evidence shows', 'in the end',
];

const TRANSITION_WORDS = [
  'however', 'moreover', 'furthermore', 'additionally',
  'consequently', 'nevertheless', 'on the other hand',
  'in contrast', 'similarly', 'for example', 'for instance',
  'specifically', 'in particular', 'secondly', 'thirdly',
  'first', 'second', 'third', 'next', 'finally',
];

function hasIndicators(text: string, indicators: string[]): boolean {
  const lowerText = text.toLowerCase();
  return indicators.some(indicator => lowerText.includes(indicator));
}

function scoreIntroduction(paragraph: string): number {
  let score = 0;
  const lowerPara = paragraph.toLowerCase();
  const words = paragraph.split(/\s+/).length;

  // Has introduction indicators
  if (hasIndicators(paragraph, INTRO_INDICATORS)) score += 25;

  // Good length (50-200 words)
  if (words >= 50 && words <= 200) score += 20;
  else if (words >= 30) score += 10;

  // Contains a question or thesis-like statement
  if (paragraph.includes('?') || lowerPara.includes('this') || lowerPara.includes('argue')) {
    score += 15;
  }

  // Ends with a clear sentence
  if (paragraph.trim().endsWith('.')) score += 10;

  // Has context-setting language
  if (lowerPara.includes('important') || lowerPara.includes('significant') || lowerPara.includes('crucial')) {
    score += 10;
  }

  // Base score for having content
  score += 20;

  return Math.min(100, score);
}

function scoreBody(paragraphs: string[]): number {
  if (paragraphs.length === 0) return 0;

  let score = 0;
  const totalWords = paragraphs.join(' ').split(/\s+/).length;

  // Has multiple paragraphs
  if (paragraphs.length >= 2) score += 20;
  if (paragraphs.length >= 3) score += 10;

  // Good total length
  if (totalWords >= 200) score += 15;
  else if (totalWords >= 100) score += 10;

  // Uses transition words
  const text = paragraphs.join(' ');
  const transitionCount = TRANSITION_WORDS.filter(t => text.toLowerCase().includes(t)).length;
  score += Math.min(20, transitionCount * 5);

  // Has evidence/examples indicators
  if (text.toLowerCase().match(/for example|for instance|evidence|research|study|data|according/)) {
    score += 15;
  }

  // Base score
  score += 20;

  return Math.min(100, score);
}

function scoreConclusion(paragraph: string): number {
  let score = 0;
  const words = paragraph.split(/\s+/).length;

  // Has conclusion indicators
  if (hasIndicators(paragraph, CONCLUSION_INDICATORS)) score += 30;

  // Good length
  if (words >= 40 && words <= 150) score += 20;
  else if (words >= 20) score += 10;

  // Ends definitively
  if (paragraph.trim().endsWith('.')) score += 10;

  // Has summarizing language
  const lowerPara = paragraph.toLowerCase();
  if (lowerPara.includes('important') || lowerPara.includes('significance') || lowerPara.includes('future')) {
    score += 10;
  }

  // Base score
  score += 20;

  return Math.min(100, score);
}

/**
 * Main essay structure analysis function.
 */
export function analyzeEssayStructure(text: string): EssayStructureResult {
  if (!text || text.trim().length === 0) {
    return {
      hasIntroduction: false,
      hasBody: false,
      hasConclusion: false,
      introductionScore: 0,
      bodyScore: 0,
      conclusionScore: 0,
      overallScore: 0,
      feedback: ['No text provided for analysis.'],
    };
  }

  const paragraphs = splitIntoParagraphs(text);
  const feedback: string[] = [];

  if (paragraphs.length < 2) {
    return {
      hasIntroduction: false,
      hasBody: true,
      hasConclusion: false,
      introductionScore: 0,
      bodyScore: 30,
      conclusionScore: 0,
      overallScore: 15,
      feedback: [
        'Text appears to be a single block. Consider breaking it into distinct paragraphs.',
        'A well-structured essay should have an introduction, body, and conclusion.',
      ],
    };
  }

  // Detect sections
  const firstParagraph = paragraphs[0];
  const lastParagraph = paragraphs[paragraphs.length - 1];
  const bodyParagraphs = paragraphs.length > 2 ? paragraphs.slice(1, -1) : paragraphs.slice(1);

  const hasIntroduction = hasIndicators(firstParagraph, INTRO_INDICATORS) || paragraphs.length >= 3;
  const hasConclusion = hasIndicators(lastParagraph, CONCLUSION_INDICATORS) || paragraphs.length >= 3;
  const hasBody = bodyParagraphs.length > 0 || paragraphs.length >= 2;

  const introductionScore = hasIntroduction ? scoreIntroduction(firstParagraph) : 0;
  const bodyScore = hasBody ? scoreBody(bodyParagraphs.length > 0 ? bodyParagraphs : [paragraphs[0]]) : 0;
  const conclusionScore = hasConclusion ? scoreConclusion(lastParagraph) : 0;

  // Overall score
  const overallScore = Math.round(
    introductionScore * 0.25 + bodyScore * 0.50 + conclusionScore * 0.25
  );

  // Generate feedback
  if (!hasIntroduction || introductionScore < 50) {
    feedback.push('Consider adding a clearer introduction with a thesis statement.');
  }
  if (introductionScore >= 70) {
    feedback.push('Good introduction with clear context setting.');
  }

  if (bodyParagraphs.length < 2) {
    feedback.push('The body could benefit from more supporting paragraphs.');
  }
  if (bodyScore >= 70) {
    feedback.push('Well-developed body paragraphs with good transitions.');
  }

  if (!hasConclusion || conclusionScore < 50) {
    feedback.push('Consider adding a stronger conclusion that summarizes key points.');
  }
  if (conclusionScore >= 70) {
    feedback.push('Effective conclusion that ties the essay together.');
  }

  if (overallScore >= 75) {
    feedback.unshift('Overall, the essay has a strong structure.');
  } else if (overallScore >= 50) {
    feedback.unshift('The essay structure is adequate but could be improved.');
  } else {
    feedback.unshift('The essay would benefit from better structural organization.');
  }

  return {
    hasIntroduction,
    hasBody,
    hasConclusion,
    introductionScore,
    bodyScore,
    conclusionScore,
    overallScore,
    feedback,
  };
}
