'use client';

import { motion } from 'framer-motion';
import { Star, MessageSquare } from 'lucide-react';

const testimonials = [
  {
    rating: 5,
    text: "As a university student, I was always worried about accidental plagiarism. ContentGuard is free, fast, and does not require signup. It's the best free plagiarism checker out there.",
    author: "Elena R.",
    role: "Undergraduate Student",
    avatarBg: "bg-indigo-500",
  },
  {
    rating: 5,
    text: "The sentence-level AI detector heatmap is incredibly accurate. I use it to check our freelance blogger drafts. It's much better than the paid tools we used to subscribe to.",
    author: "Dr. Marcus T.",
    role: "Academic Researcher & Editor",
    avatarBg: "bg-purple-500",
  },
  {
    rating: 5,
    text: "I love that my documents stay completely private and are not saved on the server. The readability statistics and writing metrics are a huge bonus for copywriters.",
    author: "Sarah K.",
    role: "Senior Copywriter",
    avatarBg: "bg-pink-500",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="container-wide max-w-5xl">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-xs text-purple-600 font-bold mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            User Reviews
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Loved by Writers & Researchers
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 font-medium mt-2">
            See what students, copywriters, and academics are saying about our platform.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, index) => (
            <motion.div
              key={test.author}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-white border border-zinc-150 rounded-2xl p-6.5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-zinc-250 transition-all duration-350 hover:-translate-y-1"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-3.5">
                  {[...Array(test.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-[13px] sm:text-sm text-zinc-650 font-medium leading-relaxed italic">
                  &ldquo;{test.text}&rdquo;
                </p>
              </div>

              {/* Author info */}
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-zinc-100">
                <div className="w-8.5 h-8.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-xs shadow-sm">
                  {test.author.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-zinc-800">
                    {test.author}
                  </h4>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {test.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
