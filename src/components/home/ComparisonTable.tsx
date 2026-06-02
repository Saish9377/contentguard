'use client';

import { motion } from 'framer-motion';
import { Check, X, ShieldCheck } from 'lucide-react';

const comparisons = [
  { feature: 'AI Content Detection', us: true, them: true },
  { feature: 'Plagiarism Checker', us: true, them: true },
  { feature: 'Grammar Corrections', us: true, them: false },
  { feature: 'Readability Scoring', us: true, them: false },
  { feature: 'Interactive Heatmap', us: true, them: false },
  { feature: 'Full PDF Report Export', us: true, them: false },
  { feature: 'Unlimited Free Usage', us: true, them: false },
  { feature: 'No Registration Required', us: true, them: false },
];

export function ComparisonTable() {
  return (
    <section className="py-16 sm:py-24 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
      <div className="container-wide max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Comparison
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            How We Compare to <span className="gradient-text">Others</span>
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
            ContentGuard AI offers premium features that other platforms charge for.
          </p>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-center">
                    ContentGuard
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-center">
                    Others
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {comparisons.map((row) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {row.them ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 dark:bg-red-950/20 text-red-400 dark:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
