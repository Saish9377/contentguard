'use client';

import { Mail, MessageSquare, Compass, Shield } from 'lucide-react';

export function ContactClient() {
  return (
    <div className="bg-bg-primary min-h-screen text-text-primary py-16 sm:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-syne font-extrabold tracking-tight mb-8 text-center sm:text-left">
          Contact{' '}
          <span className="bg-gradient-to-r from-accent-purple via-accent-light-purple to-accent-pink bg-clip-text text-transparent">
            Us
          </span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            {
              title: 'Support & Feedback',
              desc: 'Need help or want to suggest features?',
              info: 'saishshinde92@gmail.com',
              icon: MessageSquare,
            },
            {
              title: 'Privacy & Security',
              desc: 'Questions about document safety?',
              info: 'saishshinde92@gmail.com',
              icon: Shield,
            },
            {
              title: 'Partnerships & API',
              desc: 'Interested in enterprise custom integration?',
              info: 'saishshinde92@gmail.com',
              icon: Compass,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="bg-bg-card border border-border-custom hover:border-accent-purple/30 rounded-2xl p-6 space-y-4 shadow-md transition-all hover:scale-[1.02]">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 text-accent-light-purple flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-text-primary">{item.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
                <div className="pt-2">
                  <a href={`mailto:${item.info}`} className="text-xs font-bold text-accent-light-purple hover:text-accent-purple transition-colors flex items-center gap-1.5 break-all">
                    <Mail className="w-3.5 h-3.5" />
                    {item.info}
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Form Mock */}
        <div className="bg-bg-card border border-border-custom rounded-2xl p-8 shadow-xl shadow-premium-glow">
          <h2 className="text-xl font-bold font-syne text-text-primary mb-6">Send us a direct message</h2>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-bg-input border border-border-custom rounded-xl text-sm focus:outline-none focus:border-accent-purple/50 text-text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-bg-input border border-border-custom rounded-xl text-sm focus:outline-none focus:border-accent-purple/50 text-text-primary"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Message</label>
              <textarea
                placeholder="Write your message here..."
                rows={5}
                className="w-full p-4 bg-bg-input border border-border-custom rounded-xl text-sm focus:outline-none focus:border-accent-purple/50 text-text-primary resize-none"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Thank you for reaching out! We will get back to you shortly.');
                }}
                className="px-8 py-3.5 rounded-xl font-bold text-text-primary bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_20px_rgba(124,92,252,0.35)] transition-all cursor-pointer text-xs"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
