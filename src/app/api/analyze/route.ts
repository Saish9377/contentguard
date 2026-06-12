import { NextRequest, NextResponse } from 'next/server';
import { detectAI } from '@/lib/analysis/ai-detector';
import { checkPlagiarism } from '@/lib/analysis/plagiarism-checker';
import { checkGrammarWithNLP } from '@/lib/analysis/grammar-checker';
import { analyzeReadability } from '@/lib/analysis/readability';
import { calculateWritingMetrics } from '@/lib/analysis/writing-metrics';
import { analyzeEssayStructure } from '@/lib/analysis/essay-structure';
import { calculateQualityScore } from '@/lib/analysis/quality-score';
import { analyzeTone } from '@/lib/analysis/tone-analyzer';
import { generateId } from '@/lib/utils';
import { FullAnalysisResult } from '@/types/analysis';
import { MAX_TEXT_LENGTH } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text content is required.' },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH.toLocaleString()} characters.` },
        { status: 400 }
      );
    }

    if (text.trim().split(/\s+/).length < 10) {
      return NextResponse.json(
        { error: 'Please provide at least 10 words for analysis.' },
        { status: 400 }
      );
    }

    // Run all analyses concurrently where possible
    // detectAI and checkGrammarWithNLP make async API calls; run them in parallel
    const [aiDetection, plagiarism, grammar] = await Promise.all([
      detectAI(text),
      checkPlagiarism(text),          // HF token handled via /api/hf/detect proxy
      checkGrammarWithNLP(text),      // LanguageTool NLP + local regex
    ]);

    // Synchronous analyses (no network calls)
    const readability = analyzeReadability(text);
    const writingMetrics = calculateWritingMetrics(text);
    const essayStructure = analyzeEssayStructure(text);
    const tone = analyzeTone(text);

    // Calculate overall quality score
    const qualityScore = calculateQualityScore(
      plagiarism.originalityScore,
      grammar.grammarScore,
      readability.fleschReadingEase,
      essayStructure.overallScore
    );

    const result: FullAnalysisResult = {
      id: generateId(),
      text,
      timestamp: new Date().toISOString(),
      aiDetection,
      plagiarism,
      grammar,
      readability,
      writingMetrics,
      essayStructure,
      qualityScore,
      tone,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'An error occurred during analysis. Please try again.' },
      { status: 500 }
    );
  }
}
