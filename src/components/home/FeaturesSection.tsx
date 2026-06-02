'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Scan,
  Search,
  SpellCheck,
  BookOpen,
  Quote,
  Hash,
  ArrowUpRight,
} from 'lucide-react';

const tools = [
  {
    title: 'AI Content Detection',
    description: 'Advanced analysis to detect AI-generated text with sentence-level highlighting and confidence scores.',
    icon: Scan,
    href: '/ai-detector',
    hoverGlow: 'shadow-purple-glow',
    iconColor: 'text-accent-purple bg-accent-purple/10 border-accent-purple/20',
    topBorder: 'bg-accent-purple',
  },
  {
    title: 'Plagiarism Checker',
    description: 'Check text originality with detailed similarity reports and source matching.',
    icon: Search,
    href: '/plagiarism-checker',
    hoverGlow: 'shadow-green-glow',
    iconColor: 'text-accent-green bg-accent-green/10 border-accent-green/20',
    topBorder: 'bg-accent-green',
  },
  {
    title: 'Grammar Analysis',
    description: 'Identify grammar, spelling, and punctuation errors with smart corrections.',
    icon: SpellCheck,
    href: '/grammar-checker',
    hoverGlow: 'shadow-purple-glow', // amber placeholder glow
    iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    topBorder: 'bg-amber-500',
  },
  {
    title: 'Readability Analyzer',
    description: 'Measure reading level, complexity, and estimated reading time.',
    icon: BookOpen,
    href: '/readability-checker',
    hoverGlow: 'shadow-pink-glow', // orange/pink placeholder glow
    iconColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    topBorder: 'bg-orange-500',
  },
  {
    title: 'Citation Generator',
    description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles.',
    icon: Quote,
    href: '/citation-generator',
    hoverGlow: 'shadow-pink-glow',
    iconColor: 'text-accent-pink bg-accent-pink/10 border-accent-pink/20',
    topBorder: 'bg-accent-pink',
    showArrow: true,
  },
  {
    title: 'Writing Metrics',
    description: 'Word count, character count, sentence analysis, and vocabulary density — all in real time.',
    icon: Hash,
    href: '/word-counter',
    hoverGlow: 'shadow-purple-glow', // indigo placeholder
    iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    topBorder: 'bg-indigo-500',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-bg-primary border-b border-border-custom relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-pink/3 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent-light-purple bg-accent-purple/10 border border-accent-purple/20 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            ALL-IN-ONE WORKSPACE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-syne font-extrabold tracking-tight mb-3 text-text-primary leading-tight">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink bg-clip-text text-transparent">
              Analyze Writing
            </span>
          </h2>
          <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
            Detect AI-generated text, check plagiarism, correct grammar, and enhance readability — all on a single free, secure platform.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => {
            const Icon = tool.icon;

            return (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link href={tool.href} className="group block h-full">
                  <div className={`relative bg-bg-card border border-border-custom rounded-2xl p-7 pt-9 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${tool.hoverGlow} overflow-hidden`}>
                    
                    {/* Decorative Top Accent line on hover */}
                    <div className={`absolute top-0 left-0 right-0 h-[3px] ${tool.topBorder} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Icon Container */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border transition-all duration-300 group-hover:scale-115 ${tool.iconColor}`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-syne font-bold text-text-primary mb-2 flex items-center gap-1.5">
                      {tool.title}
                      {tool.showArrow && (
                        <ArrowUpRight className="w-4 h-4 text-accent-pink opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-text-muted leading-relaxed flex-1 font-medium">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
