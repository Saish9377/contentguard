'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FullAnalysisResult, AnalysisState } from '@/types/analysis';

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    progress: 0,
    result: null,
    error: null,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeRequestIdRef = useRef<number>(0);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const analyze = useCallback(async (text: string) => {
    const requestId = ++activeRequestIdRef.current;

    // Clear any existing timer first (in case analyze is called concurrently)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setState({ status: 'analyzing', progress: 10, result: null, error: null });

    try {
      // Simulate progress steps
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (requestId !== activeRequestIdRef.current) return prev;
          return {
            ...prev,
            progress: Math.min(prev.progress + 15, 85),
          };
        });
      }, 300);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (requestId !== activeRequestIdRef.current) {
        return null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result: FullAnalysisResult = await response.json();

      if (requestId !== activeRequestIdRef.current) {
        return null;
      }

      setState({
        status: 'complete',
        progress: 100,
        result,
        error: null,
      });

      return result;
    } catch (error) {
      if (requestId !== activeRequestIdRef.current) {
        return null;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({
      status: 'idle',
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  const loadResult = useCallback((result: FullAnalysisResult) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState({
      status: 'complete',
      progress: 100,
      result,
      error: null,
    });
  }, []);

  return {
    ...state,
    analyze,
    reset,
    loadResult,
  };
}
