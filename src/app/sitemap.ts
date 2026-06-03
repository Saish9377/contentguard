import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    { url: '', priority: 1.0 },
    { url: '/plagiarism-checker', priority: 0.9 },
    { url: '/ai-detector', priority: 0.9 },
    { url: '/grammar-checker', priority: 0.8 },
    { url: '/readability-checker', priority: 0.8 },
    { url: '/citation-generator', priority: 0.8 },
    { url: '/word-counter', priority: 0.8 },
  ];

  return pages.map((page) => ({
    url: `https://contentguard.saishshinde2030.workers.dev${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: page.priority,
  }));
}
