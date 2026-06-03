'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Quote, Copy, Check, Plus, Trash2 } from 'lucide-react';
import { CitationSource, CitationStyle } from '@/types/citation';
import { generateAPA, generateMLA, generateHarvard, generateChicago } from '@/lib/citation/generators';
import { AdSlot } from '@/components/layout/AdSlot';

const defaultSource: CitationSource = {
  type: 'book',
  authors: [''],
  title: '',
  year: new Date().getFullYear().toString(),
  publisher: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  url: '',
  accessDate: '',
  doi: '',
  edition: '',
  city: '',
  conference: '',
};

const STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'apa', label: 'APA (7th)' },
  { value: 'mla', label: 'MLA (9th)' },
  { value: 'harvard', label: 'Harvard' },
  { value: 'chicago', label: 'Chicago' },
];

export function CitationClient() {
  const [source, setSource] = useState<CitationSource>({ ...defaultSource });
  const [activeStyle, setActiveStyle] = useState<CitationStyle>('apa');
  const [copiedStyle, setCopiedStyle] = useState<string | null>(null);

  const citations = useMemo(() => {
    if (!source.title || source.authors.every(a => !a.trim())) return null;
    return {
      apa: generateAPA(source),
      mla: generateMLA(source),
      harvard: generateHarvard(source),
      chicago: generateChicago(source),
    };
  }, [source]);

  const handleCopy = async (text: string, style: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedStyle(style);
    setTimeout(() => setCopiedStyle(null), 2000);
  };

  const updateField = (field: keyof CitationSource, value: string | string[]) => {
    setSource(prev => ({ ...prev, [field]: value }));
  };

  const addAuthor = () => {
    setSource(prev => ({ ...prev, authors: [...prev.authors, ''] }));
  };

  const removeAuthor = (index: number) => {
    setSource(prev => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
    }));
  };

  const updateAuthor = (index: number, value: string) => {
    setSource(prev => ({
      ...prev,
      authors: prev.authors.map((a, i) => i === index ? value : a),
    }));
  };

  return (
    <div className="container-wide py-10 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-100 text-sm text-rose-600 font-medium mb-5">
          <Quote className="w-4 h-4" />
          Citation Generator
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 animate-fadeIn">
          Free Citation Generator —{' '}<span className="gradient-text">APA, MLA, Harvard & Chicago</span>
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Create properly formatted citations in APA, MLA, Harvard, and Chicago styles.
        </p>
      </motion.div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-bg-card border border-border-custom rounded-2xl p-6 shadow-premium-glow"
        >
          <h2 className="font-bold text-lg mb-5 text-text-primary">Source Details</h2>

          {/* Source Type */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Source Type</label>
            <select
              value={source.type}
              onChange={e => updateField('type', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
            >
              <option value="book" className="bg-bg-card text-text-primary">Book</option>
              <option value="journal" className="bg-bg-card text-text-primary">Journal Article</option>
              <option value="website" className="bg-bg-card text-text-primary">Website</option>
              <option value="conference" className="bg-bg-card text-text-primary">Conference Paper</option>
            </select>
          </div>

          {/* Authors */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Authors</label>
            <div className="space-y-2">
              {source.authors.map((author, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={author}
                    onChange={e => updateAuthor(i, e.target.value)}
                    placeholder="Full name (e.g., John Smith)"
                    className="flex-1 px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                  />
                  {source.authors.length > 1 && (
                    <button onClick={() => removeAuthor(i)} className="p-2 text-text-muted hover:text-accent-pink transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addAuthor} className="flex items-center gap-1.5 text-sm text-accent-purple hover:text-accent-light-purple font-semibold transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Add Author
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Title</label>
            <input
              type="text"
              value={source.title}
              onChange={e => updateField('title', e.target.value)}
              placeholder="Title of the work"
              className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
            />
          </div>

          {/* Year */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Year</label>
            <input
              type="text"
              value={source.year}
              onChange={e => updateField('year', e.target.value)}
              placeholder="2024"
              className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
            />
          </div>

          {/* Conditional fields based on type */}
          {(source.type === 'book' || source.type === 'journal' || source.type === 'conference') && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Publisher</label>
              <input
                type="text"
                value={source.publisher || ''}
                onChange={e => updateField('publisher', e.target.value)}
                placeholder="Publisher name"
                className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
              />
            </div>
          )}

          {source.type === 'journal' && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary/80 mb-1">Journal</label>
                <input
                  type="text"
                  value={source.journal || ''}
                  onChange={e => updateField('journal', e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary/80 mb-1">Volume</label>
                <input
                  type="text"
                  value={source.volume || ''}
                  onChange={e => updateField('volume', e.target.value)}
                  className="w-full px-3 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-primary/80 mb-1">Pages</label>
                <input
                  type="text"
                  value={source.pages || ''}
                  onChange={e => updateField('pages', e.target.value)}
                  placeholder="1-10"
                  className="w-full px-3 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                />
              </div>
            </div>
          )}

          {source.type === 'website' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">URL</label>
                <input
                  type="url"
                  value={source.url || ''}
                  onChange={e => updateField('url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Access Date</label>
                <input
                  type="text"
                  value={source.accessDate || ''}
                  onChange={e => updateField('accessDate', e.target.value)}
                  placeholder="January 1, 2024"
                  className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
                />
              </div>
            </>
          )}

          {source.type === 'conference' && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">Conference Name</label>
              <input
                type="text"
                value={source.conference || ''}
                onChange={e => updateField('conference', e.target.value)}
                className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-primary/80 mb-1.5">DOI (optional)</label>
            <input
              type="text"
              value={source.doi || ''}
              onChange={e => updateField('doi', e.target.value)}
              placeholder="10.xxxx/xxxxx"
              className="w-full px-3.5 py-2 bg-bg-input border border-border-custom rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-purple/30 focus:border-accent-purple transition-all"
            />
          </div>
        </motion.div>

        {/* Output */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-bg-card border border-border-custom rounded-2xl p-6 sticky top-24 shadow-premium-glow">
            <h2 className="font-bold text-lg mb-5 text-text-primary">Generated Citations</h2>

            {/* Style tabs */}
            <div className="flex gap-1 mb-5 bg-bg-input border border-border-custom rounded-xl p-1">
              {STYLES.map(style => (
                <button
                  key={style.value}
                  onClick={() => setActiveStyle(style.value)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    activeStyle === style.value
                      ? 'bg-bg-card text-text-primary shadow-sm border border-border-custom/50'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-card/30'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {citations ? (
              <div className="space-y-4">
                {STYLES.map(style => {
                  const citation = citations[style.value];
                  if (style.value !== activeStyle) return null;
                  return (
                    <div key={style.value}>
                      {/* Bibliography */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Bibliography</label>
                        <div className="relative group">
                          <div className="p-4 bg-bg-input/60 dark:bg-bg-input/30 rounded-xl border border-border-custom/50 text-sm leading-relaxed text-text-primary">
                            {citation.formatted}
                          </div>
                          <button
                            onClick={() => handleCopy(citation.formatted, `${style.value}-bib`)}
                            className="absolute top-2 right-2 p-2 bg-bg-card rounded-lg shadow-sm border border-border-custom opacity-0 group-hover:opacity-100 transition-all hover:bg-bg-input hover:scale-105 cursor-pointer text-text-muted hover:text-text-primary"
                          >
                            {copiedStyle === `${style.value}-bib` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-text-muted" />}
                          </button>
                        </div>
                      </div>

                      {/* In-text */}
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">In-Text Citation</label>
                        <div className="relative group">
                          <div className="p-4 bg-accent-purple/5 dark:bg-accent-purple/10 rounded-xl border border-accent-purple/20 text-sm font-medium text-accent-purple dark:text-accent-light-purple">
                            {citation.inText}
                          </div>
                          <button
                            onClick={() => handleCopy(citation.inText, `${style.value}-text`)}
                            className="absolute top-2 right-2 p-2 bg-bg-card rounded-lg shadow-sm border border-border-custom opacity-0 group-hover:opacity-100 transition-all hover:bg-bg-input hover:scale-105 cursor-pointer text-text-muted hover:text-text-primary"
                          >
                            {copiedStyle === `${style.value}-text` ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-text-muted" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted">
                <Quote className="w-10 h-10 mx-auto mb-3 opacity-30 text-text-muted" />
                <p className="text-sm">Fill in the source details to generate citations.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AdSlot format="horizontal" className="max-w-4xl mx-auto mt-8" />

      {/* SEO Content Section */}
      <div className="mt-16 pt-8 border-t border-border-custom/30 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold font-syne text-text-primary mb-4">
          About Our Free Citation Generator
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          Our free citation generator makes bibliography compilation simple for students, academic researchers, and writers. Using our free citation maker, you can instantly format references in APA, MLA, Harvard, and Chicago styles. Simply select your style, enter reference details such as author name, article title, and publication year, and copy the correctly formatted output. ContentGuard citation generator online is completely free with no limits on the number of references created. Create accurate bibliographies, works cited lists, and citations instantly online for free without creating an account.
        </p>
      </div>
    </div>
  );
}
