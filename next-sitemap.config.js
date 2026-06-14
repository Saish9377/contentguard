/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl:
    process.env.SITE_URL ||
    'https://contentguard.saishshinde2030.workers.dev',
  generateRobotsTxt: false, // robots.ts in app/ handles this natively
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*', '/report/*'],
  transform: async (config, path) => {
    const toolPages = [
      '/ai-detector',
      '/plagiarism-checker',
      '/grammar-checker',
      '/readability-checker',
      '/citation-generator',
      '/word-counter',
      '/humanizer',
    ];
    const legalPages = ['/privacy', '/terms', '/legal'];
    const infoPages = ['/features', '/how-it-works', '/faq', '/resources', '/contact'];

    let priority = 0.7;
    let changefreq = 'monthly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (toolPages.includes(path)) {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (infoPages.includes(path)) {
      priority = 0.7;
      changefreq = 'monthly';
    } else if (legalPages.includes(path)) {
      priority = 0.3;
      changefreq = 'yearly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
