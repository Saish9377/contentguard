'use client';

import { useCallback } from 'react';

import type { FullAnalysisResult } from '@/types/analysis';

/**
 * useHistory — IndexedDB-backed scan history
 *
 * Database: contentguard-db
 * Stores:
 *   - scans: full FullAnalysisResult objects (max 20 entries)
 *
 * All operations are silent — if IndexedDB is unavailable (private browsing,
 * old browser, Safari restrictions), functions become no-ops.
 */

const DB_NAME = 'contentguard-db';
const DB_VERSION = 1;
const STORE_NAME = 'scans';
const MAX_SCANS = 20;

export interface ScanSummary {
  id: string;
  timestamp: string;
  textPreview: string;    // first 150 chars
  wordCount: number;
  aiScore: number;
  originalityScore: number;
  grammarScore: number;
  qualityScore: number;
}

// Open (or create) the IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a full analysis result to history.
 * Automatically trims to MAX_SCANS oldest entries.
 */
export async function saveToHistory(result: FullAnalysisResult): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Trim to keep only the most recent MAX_SCANS-1 before inserting
    const countReq = store.count();
    await new Promise<void>((res, rej) => {
      countReq.onsuccess = async () => {
        if (countReq.result >= MAX_SCANS) {
          // Delete the oldest entries
          const index = store.index('timestamp');
          const cursorReq = index.openCursor(null, 'next');
          let deleted = 0;
          const toDelete = countReq.result - MAX_SCANS + 1;
          cursorReq.onsuccess = (e) => {
            const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && deleted < toDelete) {
              cursor.delete();
              deleted++;
              cursor.continue();
            } else {
              res();
            }
          };
          cursorReq.onerror = () => res(); // ignore errors
        } else {
          res();
        }
      };
      countReq.onerror = () => rej(countReq.error);
    });

    await new Promise<void>((res, rej) => {
      const addReq = store.put(result);
      addReq.onsuccess = () => res();
      addReq.onerror = () => rej(addReq.error);
    });

    db.close();
  } catch {
    // Silent — history is a convenience feature, never block the main flow
  }
}

/**
 * Get all scan summaries from history (newest first).
 */
export async function getHistory(): Promise<ScanSummary[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const results = await new Promise<FullAnalysisResult[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as FullAnalysisResult[]);
      req.onerror = () => reject(req.error);
    });

    db.close();

    return results
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        textPreview: (r.text ?? '').slice(0, 150),
        wordCount: r.writingMetrics?.wordCount ?? 0,
        aiScore: r.aiDetection?.aiScore ?? 0,
        originalityScore: r.plagiarism?.originalityScore ?? 100,
        grammarScore: r.grammar?.grammarScore ?? 100,
        qualityScore: r.qualityScore?.overallScore ?? 0,
      }));
  } catch {
    return [];
  }
}

/**
 * Get a single full result by ID.
 */
export async function getHistoryItem(id: string): Promise<FullAnalysisResult | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const result = await new Promise<FullAnalysisResult | undefined>((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as FullAnalysisResult | undefined);
      req.onerror = () => reject(req.error);
    });

    db.close();
    return result ?? null;
  } catch {
    return null;
  }
}

/**
 * Delete a single scan from history.
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await new Promise<void>((res, rej) => {
      const req = store.delete(id);
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    db.close();
  } catch {
    // Silent
  }
}

/**
 * Clear all history.
 */
export async function clearHistory(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await new Promise<void>((res, rej) => {
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => res();
      req.onerror = () => rej(req.error);
    });
    db.close();
  } catch {
    // Silent
  }
}

/**
 * React hook for managing scan history state.
 */
export function useHistory() {
  const save = useCallback(async (result: FullAnalysisResult) => {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    await saveToHistory(result);
  }, []);

  return { save };
}
