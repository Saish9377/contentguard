'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { FAQ_ITEMS } from '@/lib/constants';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-bg-primary border-t border-border-custom/50">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-accent-purple/10 border border-accent-purple/20 text-xs text-accent-purple dark:text-accent-light-purple font-bold mb-4">
            <MessageCircle className="w-3.5 h-3.5" />
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight font-syne">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2">
            Answers to common questions about our detection engines.
          </p>
        </motion.div>

        {/* Accordion */}
        <div className="divide-y divide-border-custom/80 border-y border-border-custom/80">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index}>
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between py-4.5 text-left focus:outline-none group cursor-pointer"
                >
                  <span className={`font-semibold text-sm transition-colors duration-150 ${
                    isOpen ? 'text-accent-purple dark:text-accent-light-purple' : 'text-text-primary hover:text-accent-purple dark:hover:text-accent-light-purple'
                  }`}>
                    {item.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 ml-4"
                  >
                    <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-accent-purple dark:text-accent-light-purple' : 'text-text-muted'}`} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 text-xs sm:text-sm text-text-muted leading-relaxed">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
