'use client';

import { useEffect, useState, useRef } from 'react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  colorScheme?: 'default' | 'inverted';
}

export function ScoreGauge({
  score,
  label,
  size = 140,
  strokeWidth = 10,
  colorScheme = 'default',
}: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  const getColor = (s: number) => {
    if (colorScheme === 'inverted') {
      // Lower is better (e.g., AI score)
      if (s <= 30) return '#10b981'; // green
      if (s <= 60) return '#f59e0b'; // amber
      return '#ef4444'; // red
    }
    // Higher is better (e.g., originality)
    if (s >= 70) return '#10b981';
    if (s >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(score);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 1200;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      current = Math.min(score, Math.round(increment * frame));
      setAnimatedScore(current);
      if (frame >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, score]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${color}40)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-zinc-400 dark:text-zinc-500 -mt-0.5">%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-[var(--text-secondary)]">{label}</span>
    </div>
  );
}
