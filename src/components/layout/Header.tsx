'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  Search,
  SpellCheck,
  BookOpen,
  Quote,
  Hash,
  Menu,
  X,
  Shield,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/layout/ThemeProvider';

const iconMap: Record<string, React.ElementType> = {
  Scan,
  Search,
  SpellCheck,
  BookOpen,
  Quote,
  Hash,
};

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Links to display in Header (first 6 links as specified in prompt)
  const headerLinks = NAV_LINKS.slice(0, 6);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-border-custom/50',
          isScrolled
            ? 'bg-bg-primary/80 backdrop-blur-md py-3 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)]'
            : 'bg-bg-primary/30 backdrop-blur-xs py-5'
        )}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-light-purple flex items-center justify-center shadow-[0_2px_10px_rgba(124,92,252,0.3)] group-hover:shadow-[0_4px_16px_rgba(124,92,252,0.4)] transition-all duration-300">
                <Shield className="w-5 h-5 text-bg-primary" />
              </div>
            </motion.div>
            <span className="font-syne font-extrabold text-xl tracking-tight">
              <span className="text-text-primary">Content</span>
              <span className="text-accent-purple">Guard</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <nav className="flex items-center gap-1 mr-4">
              {headerLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:text-text-primary hover:bg-bg-card/50',
                      isActive
                        ? 'text-accent-light-purple bg-accent-purple/10 border border-accent-purple/20'
                        : 'text-text-muted border border-transparent'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Dark/Light Toggler Desktop */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-border-custom bg-bg-card hover:bg-bg-input text-text-muted hover:text-text-primary transition-all duration-200 cursor-pointer active:scale-95"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500/10" />
              ) : (
                <Moon className="w-4 h-4 text-accent-purple fill-accent-purple/10" />
              )}
            </button>
          </div>

          {/* Mobile Hamburger & Toggler */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Dark/Light Toggler Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-bg-card border border-border-custom/50 hover:bg-bg-input text-text-muted hover:text-text-primary transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4.5 h-4.5 text-amber-500" />
              ) : (
                <Moon className="w-4.5 h-4.5 text-accent-purple" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-bg-card border border-border-custom/50 hover:bg-bg-input transition-all"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-text-primary" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-bg-primary/40 backdrop-blur-md"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-bg-card border-l border-border-custom shadow-2xl flex flex-col justify-between"
            >
              <div className="p-6 pt-24 overflow-y-auto flex-1">
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4 px-3.5">
                  Navigation
                </div>
                <nav className="space-y-1">
                  {headerLinks.map((link, index) => {
                    const Icon = iconMap[link.icon];
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 + 0.05 }}
                      >
                        <Link
                          href={link.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-250',
                            isActive
                              ? 'bg-accent-purple/10 text-accent-light-purple border border-accent-purple/20'
                              : 'text-text-muted hover:text-text-primary hover:bg-bg-input'
                          )}
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile CTA */}
              <div className="p-6 border-t border-border-custom bg-bg-primary/20">
                <Link
                  href="/ai-detector"
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-text-primary bg-gradient-to-r from-accent-purple to-accent-light-purple hover:shadow-[0_0_20px_rgba(124,92,252,0.4)] transition-all duration-300"
                >
                  Start Free Analysis
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-[10px] text-text-muted text-center mt-3 font-semibold uppercase tracking-wider">
                  No signup · Instant results
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 lg:h-20" />
    </>
  );
}
