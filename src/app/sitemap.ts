import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const urls = [
    '',
    '/ai-detector',
    '/plagiarism-checker',
    '/grammar-checker',
    '/readability-checker',
    '/citation-generator',
    '/word-counter',
    '/privacy',
    '/terms',
    '/contact',
    '/legal',
  ];

  return urls.map((url) => ({
    url: `https://contentguard.ai${url}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: url === '' ? 1.0 : 0.8,
  }));
}
