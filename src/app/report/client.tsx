'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, FileText, Share2, ArrowRight, Calendar, BookOpen } from 'lucide-react';
import { deserializeReport, SerializedReport } from '@/lib/report-helper';
import { ScoreGauge } from '@/components/analysis/ScoreGauge';
import Link from 'next/link';

export function ReportClient() {
  const [report, setReport] = useState<SerializedReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('r');
    if (!code) {
      setTimeout(() => setError('No report parameters provided.'), 0);
      return;
    }

    const decoded = deserializeReport(code);
    if (!decoded) {
      setTimeout(() => setError('Invalid report URL. The link might be broken or corrupted.'), 0);
      return;
    }

    setTimeout(() => setReport(decoded), 0);
  }, []);

  const handleShareOnSocial = (platform: 'twitter' | 'linkedin' | 'whatsapp') => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const text = `Verified my writing with ContentGuard AI! Quality Score: ${report?.qualityScore}%, AI Score: ${report?.aiScore}%. Check out my certificate here:`;
    
    let shareUrl = '';
    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    } else if (platform === 'linkedin') {
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    } else if (platform === 'whatsapp') {
      shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  if (error) {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary flex items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-bg-card border border-border-custom p-8 rounded-2xl text-center shadow-2xl"
        >
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold font-syne text-text-primary mb-2">Report Load Error</h1>
          <p className="text-sm text-text-muted leading-relaxed mb-6">{error}</p>
          <Link
            href="/"
            className="btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
          >
            Go back to ContentGuard
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-bg-primary min-h-screen text-text-primary flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-accent-purple border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Decoding Certificate...</p>
        </div>
      </div>
    );
  }

  // Format date
  const dateStr = new Date(report.timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-12 sm:py-20">
      <div className="max-w-3xl mx-auto px-6 space-y-8">
        
        {/* Certificate Card Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card border border-border-custom rounded-2xl p-6 sm:p-8 shadow-2xl shadow-premium-glow relative overflow-hidden"
        >
          {/* Top colored badge */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink" />

          {/* Stamp background */}
          <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full border border-accent-purple/5 flex items-center justify-center pointer-events-none select-none">
            <div className="w-40 h-40 rounded-full border border-accent-purple/5 flex items-center justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent-purple/5 rotate-12">VERIFIED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-accent-purple/15 text-accent-light-purple px-2 py-0.5 rounded border border-accent-purple/25 tracking-wider mb-2.5">
                Verification Certificate
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold font-syne text-text-primary">
                ContentGuard AI Report
              </h1>
              <p className="text-xs text-text-muted font-medium mt-1">
                Report ID: <span className="font-mono text-[11px]">{report.id}</span>
              </p>
            </div>
            
            <div className="text-xs text-text-muted font-semibold flex items-center gap-1.5 sm:text-right">
              <Calendar className="w-3.5 h-3.5 text-accent-light-purple" />
              {dateStr}
            </div>
          </div>

          {/* Score Gauges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border-custom/50 my-6">
            <ScoreGauge score={report.aiScore} label="AI Score" size={88} colorScheme="inverted" />
            <ScoreGauge score={report.originalityScore} label="Originality" size={88} />
            <ScoreGauge score={report.grammarScore} label="Grammar" size={88} />
            <ScoreGauge score={report.qualityScore} label="Quality" size={88} />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-text-muted mb-6">
            <div>
              Analysis Engine: <span className="text-text-primary font-bold capitalize">{report.type}</span>
            </div>
            <div>
              Word Count: <span className="text-text-primary font-bold">{report.wordCount} words</span>
            </div>
          </div>

          {/* Text Preview */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-accent-light-purple" />
              Content Preview
            </span>
            <div className="bg-bg-input/20 border border-border-custom p-4 rounded-xl text-xs sm:text-sm text-text-muted leading-relaxed whitespace-pre-wrap select-none font-medium">
              {report.textPreview}
              {report.textPreview.length >= 450 && '... [Preview matches limit]'}
            </div>
          </div>
        </motion.div>

        {/* Share buttons & Verify new CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Share Box */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-accent-light-purple" />
              Share Verification Certificate
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Verify your content authenticity publicly. Share this report card directly on social media:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => handleShareOnSocial('linkedin')}
                className="px-3.5 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all cursor-pointer flex-1 text-center"
              >
                LinkedIn
              </button>
              <button
                onClick={() => handleShareOnSocial('twitter')}
                className="px-3.5 py-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-bold hover:bg-sky-500 hover:text-white transition-all cursor-pointer flex-1 text-center"
              >
                Twitter
              </button>
              <button
                onClick={() => handleShareOnSocial('whatsapp')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all cursor-pointer flex-1 text-center"
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-bg-card border border-border-custom rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-accent-light-purple" />
                Analyze Your Writing
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Check your own reports for plagiarism, AI detection, and grammar errors for free with zero storage and zero signups.
              </p>
            </div>
            <Link
              href="/"
              className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_20px_rgba(124,92,252,0.4)] text-xs font-bold text-text-primary flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              Verify Content Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
