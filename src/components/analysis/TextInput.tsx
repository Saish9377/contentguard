'use client';

import { useState, useRef, useEffect } from 'react';
import { countWords } from '@/lib/utils';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({
  value,
  onChange,
  placeholder = 'Paste your text here to analyze...',
  maxLength = 50000,
  disabled = false,
}: TextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const wordCount = countWords(value);
  const charCount = value.length;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(200, Math.min(textarea.scrollHeight, 500)) + 'px';
    }
  }, [value]);

  return (
    <div className={`relative rounded-xl border transition-all duration-200 ${
      isFocused
        ? 'border-indigo-400 dark:border-indigo-500 shadow-[0_0_0_3px_rgba(79,70,229,0.08)] bg-white dark:bg-zinc-900'
        : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900'
    } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full p-5 rounded-xl bg-transparent text-[var(--text-primary)] text-sm leading-relaxed resize-none focus:outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        style={{ minHeight: '200px' }}
      />

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {wordCount.toLocaleString()} words
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            {charCount.toLocaleString()} chars
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="tabular-nums font-semibold text-zinc-500 dark:text-zinc-400">
            {Math.round((charCount / maxLength) * 100)}%
          </span>
          <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(100, (charCount / maxLength) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
