'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, History, Trash2, Clock, FileText,
} from 'lucide-react';

import { getHistory, deleteHistoryItem, clearHistory, ScanSummary } from '@/hooks/useHistory';
import { cn } from '@/lib/utils';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

function ScorePill({
  value,
  label,
  inverted = false,
}: {
  value: number;
  label: string;
  inverted?: boolean;
}) {
  // For AI score: high = bad (red), low = good (green)
  // For others: high = good (green), low = red
  const score = inverted ? 100 - value : value;
  const color =
    score >= 80
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : score >= 55
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-red-500/10 text-red-400 border-red-500/20';

  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold', color)}>
      {label}: {value}%
    </span>
  );
}

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const router = useRouter();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const history = await getHistory();
    setScans(history);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        loadHistory();
      }, 0);
    }
  }, [open, loadHistory]);

  const handleDelete = async (id: string) => {
    await deleteHistoryItem(id);
    setScans(prev => prev.filter(s => s.id !== id));
  };

  const handleClear = async () => {
    setClearing(true);
    await clearHistory();
    setScans([]);
    setClearing(false);
  };

  const handleSelectScan = (scan: ScanSummary) => {
    onClose();
    if (scan.id.startsWith('local-plag-')) {
      router.push(`/plagiarism-checker?historyId=${scan.id}`);
    } else if (scan.id.startsWith('local-')) {
      router.push(`/ai-detector?historyId=${scan.id}`);
    } else {
      router.push(`/grammar-checker?historyId=${scan.id}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="history-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.aside
            key="history-drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-bg-primary border-l border-border-custom shadow-2xl flex flex-col"
            aria-label="Scan History"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-custom shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-accent-light-purple" />
                <h2 className="text-sm font-bold text-text-primary">Scan History</h2>
                {scans.length > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-light-purple border border-accent-purple/20">
                    {scans.length}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close history"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-input transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scan list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                  <div className="w-6 h-6 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-text-muted">Loading history…</p>
                </div>
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-bg-card border border-border-custom flex items-center justify-center">
                    <FileText className="w-5 h-5 text-text-muted" />
                  </div>
                  <p className="text-sm font-semibold text-text-primary">No scans yet</p>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Your recent analyses will appear here automatically after each scan.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {scans.map((scan, index) => (
                    <motion.div
                      key={scan.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      onClick={() => handleSelectScan(scan)}
                      className="group bg-bg-card border border-border-custom rounded-xl p-4 hover:border-accent-purple/40 hover:bg-bg-input/40 transition-all duration-200 space-y-3 cursor-pointer active:scale-[0.99]"
                    >
                      {/* Row 1: Time + delete */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(scan.timestamp)}
                          <span className="text-border-custom">·</span>
                          <span>{scan.wordCount} words</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(scan.id);
                          }}
                          aria-label="Delete scan"
                          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-red-400 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Row 2: Text preview */}
                      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                        {scan.textPreview}
                        {scan.textPreview.length >= 150 && '…'}
                      </p>

                      {/* Row 3: Score pills */}
                      <div className="flex flex-wrap gap-1.5">
                        <ScorePill value={scan.aiScore} label="AI" inverted />
                        <ScorePill value={scan.originalityScore} label="Original" />
                        <ScorePill value={scan.grammarScore} label="Grammar" />
                        <ScorePill value={scan.qualityScore} label="Quality" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {scans.length > 0 && (
              <div className="px-5 py-4 border-t border-border-custom shrink-0">
                <button
                  onClick={handleClear}
                  disabled={clearing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {clearing ? 'Clearing…' : 'Clear All History'}
                </button>
                <p className="text-[10px] text-text-muted text-center mt-2">
                  Stored locally in your browser · Up to {20} scans kept
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
