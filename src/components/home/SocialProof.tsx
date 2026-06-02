'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Users, ShieldCheck, Sparkles } from 'lucide-react';

const stats = [
  { number: '50K+', label: 'Checks Completed', icon: CheckCircle2, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  { number: '10K+', label: 'Monthly Users', icon: Users, color: 'text-accent-light-purple', bg: 'bg-accent-light-purple/10' },
  { number: '99.9%', label: 'System Uptime', icon: ShieldCheck, color: 'text-accent-green', bg: 'bg-accent-green/10' },
  { number: '100%', label: 'Free Forever', icon: Sparkles, color: 'text-accent-pink', bg: 'bg-accent-pink/10' },
];

function CountUp({ value }: { value: string }) {
  const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
  const suffix = value.replace(/[0-9.]/g, '');
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const end = numericPart;
    const duration = 1500; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out exponential progress
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(easeProgress * end);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, numericPart]);

  // Format with one decimal point if there is a period in the original string, else integer
  const displayValue = value.includes('.') 
    ? count.toFixed(1) 
    : Math.floor(count).toString();

  return <span ref={ref}>{displayValue}{suffix}</span>;
}

export function SocialProof() {
  return (
    <section className="py-12 sm:py-16 bg-bg-primary border-b border-border-custom">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-bg-card rounded-2xl border border-border-custom shadow-xl overflow-hidden shadow-premium-glow">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-x-0 md:divide-y-0 md:divide-x divide-border-custom">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.05 }}
                  className="p-6 sm:p-8 flex flex-col items-center text-center group hover:bg-bg-input/20 transition-colors duration-200"
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${stat.bg} mb-3.5 transition-transform group-hover:scale-105 duration-200`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl sm:text-3xl font-syne font-extrabold text-text-primary tracking-tight">
                    <CountUp value={stat.number} />
                  </div>
                  <div className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
