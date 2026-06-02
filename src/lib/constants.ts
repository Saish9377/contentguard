export const APP_NAME = 'ContentGuard AI';
export const APP_DESCRIPTION = 'Free AI Content Detector & Plagiarism Checker — Detect AI-generated content, check plagiarism, analyze grammar, and generate citations. No signup required.';
export const APP_URL = 'https://contentguard.ai';

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB (virtually unlimited)
export const SUPPORTED_FILE_TYPES = ['.pdf', '.docx', '.txt'];
export const MAX_TEXT_LENGTH = 10 * 1000 * 1000; // 10M chars (virtually unlimited)

export const NAV_LINKS = [
  { label: 'AI Detector', href: '/ai-detector', icon: 'Scan' },
  { label: 'Plagiarism', href: '/plagiarism-checker', icon: 'Search' },
  { label: 'Grammar', href: '/grammar-checker', icon: 'SpellCheck' },
  { label: 'Readability', href: '/readability-checker', icon: 'BookOpen' },
  { label: 'Citations', href: '/citation-generator', icon: 'Quote' },
  { label: 'Word Counter', href: '/word-counter', icon: 'Hash' },
  { label: 'Resources', href: '/resources', icon: 'BookOpen' },
] as const;

export const FEATURES = [
  {
    title: 'AI Content Detection',
    description: 'Advanced analysis to detect AI-generated text with sentence-level highlighting and confidence scores.',
    icon: 'Scan',
    href: '/ai-detector',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Plagiarism Checker',
    description: 'Check text originality with detailed similarity reports and source matching.',
    icon: 'Search',
    href: '/plagiarism-checker',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Grammar Analysis',
    description: 'Identify grammar, spelling, and punctuation errors with smart corrections.',
    icon: 'SpellCheck',
    href: '/grammar-checker',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    title: 'Readability Analyzer',
    description: 'Measure reading level, complexity, and estimated reading time for your content.',
    icon: 'BookOpen',
    href: '/readability-checker',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Citation Generator',
    description: 'Generate properly formatted citations in APA, MLA, Harvard, and Chicago styles.',
    icon: 'Quote',
    href: '/citation-generator',
    gradient: 'from-rose-500 to-red-500',
  },
  {
    title: 'Writing Metrics',
    description: 'Word count, character count, sentence analysis, and vocabulary density — all in real time.',
    icon: 'Hash',
    href: '/word-counter',
    gradient: 'from-indigo-500 to-violet-500',
  },
] as const;

export const FAQ_ITEMS = [
  {
    question: 'How accurate is the AI detection?',
    answer: 'Our AI detection uses advanced statistical analysis including perplexity, burstiness, and vocabulary richness metrics to identify AI-generated content. While no detector is 100% accurate, our system provides reliable results with confidence scores to help you make informed decisions.',
  },
  {
    question: 'Is the plagiarism checker really free?',
    answer: 'Yes! ContentGuard AI is completely free to use. No signup, no credit card, no hidden fees. We believe everyone should have access to content quality tools.',
  },
  {
    question: 'What file formats are supported?',
    answer: 'We support PDF, DOCX (Microsoft Word), and plain text (TXT) files. You can also paste text directly into the editor without any size limits.',
  },
  {
    question: 'Is my content stored or shared?',
    answer: 'Your privacy is our priority. We do not store, share, or use your content for any purpose beyond the analysis you request. All processing happens in real-time and content is not retained after analysis.',
  },
  {
    question: 'Can I use this for academic papers?',
    answer: 'Absolutely! ContentGuard AI is designed for students, researchers, bloggers, and professionals. Our tools help ensure your content is original, well-written, and properly cited.',
  },
  {
    question: 'How does the AI heatmap work?',
    answer: 'Our AI heatmap analyzes each sentence individually and assigns a probability score. Sentences are color-coded: green for likely human-written, yellow for mixed/uncertain, and red for likely AI-generated.',
  },
] as const;
