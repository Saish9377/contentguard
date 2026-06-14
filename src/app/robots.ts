import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/report/'],
      },
    ],
    sitemap: 'https://contentguard.saishshinde2030.workers.dev/sitemap.xml',
    host: 'https://contentguard.saishshinde2030.workers.dev',
  };
}
