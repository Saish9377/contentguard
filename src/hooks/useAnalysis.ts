'use client';

import { useState, useCallback } from 'react';
import { FullAnalysisResult, AnalysisState } from '@/types/analysis';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });

  const analyze = useCallback(async (text: string) => {
    setState({ status: 'analyzing', progress: 10, result: null, error: null });

    try {
      // Simulate progress steps
      const progressTimer = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 15, 85),
        }));
      }, 300);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result: FullAnalysisResult = await response.json();

      setState({
        status: 'complete',
        progress: 100,
        result,
        error: null,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setState({
        status: 'error',
        progress: 0,
        result: null,
        error: message,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
  };
}
