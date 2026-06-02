'use client';

import { motion } from 'framer-motion';
import { Upload, Cpu, BarChart3 } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Paste or Upload',
    description: 'Paste your writing text directly, or upload PDF, DOCX, and TXT files.',
    step: '01',
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10 border-accent-purple/20',
  },
  {
    icon: Cpu,
    title: 'Engine Processing',
    description: 'Our system analyzes content for AI generation, plagiarism, and grammar patterns.',
    step: '02',
    color: 'text-accent-light-purple',
    bg: 'bg-accent-light-purple/10 border-accent-purple/20',
  },
  {
    icon: BarChart3,
    title: 'Detailed Reports',
    description: 'View in-depth analysis reports with sentence highlights, scores, and exports.',
    step: '03',
    color: 'text-accent-green',
    bg: 'bg-accent-green/10 border-accent-green/20',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-bg-primary relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,92,252,0.03),transparent_60%)] pointer-events-none" />

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
            SIMPLE PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-syne font-extrabold tracking-tight mb-3 text-text-primary leading-tight">
            How It <span className="bg-gradient-to-r from-accent-purple to-accent-pink bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-sm sm:text-base text-text-muted max-w-lg mx-auto leading-relaxed">
            Get comprehensive writing statistics in three simple steps.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative max-w-4xl mx-auto">
          {/* Timeline connecting line */}
          <div className="hidden md:block absolute top-[2.75rem] left-[15%] right-[15%] h-[1px] border-t border-dashed border-border-custom" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 lg:gap-12">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="relative flex flex-col items-center text-center group"
                >
                  {/* Icon & number */}
                  <div className="relative z-10 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-bg-card border border-border-custom flex items-center justify-center shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent-purple/40">
                      <StepIcon className={`w-6 h-6 ${step.color}`} />
                    </div>
                    {/* Badge */}
                    <div className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-md border text-[9px] font-bold ${step.bg} shadow-sm uppercase tracking-wider`}>
                      {step.step}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-syne font-bold text-text-primary mb-2 transition-colors group-hover:text-accent-light-purple">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-text-muted max-w-[240px] mx-auto leading-relaxed font-medium">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
