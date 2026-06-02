/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://contentguard.ai',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    additionalSitemaps: [],
  },
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ['/api/*'],
  transform: async (config, path) => {
    // Set higher priority for tool pages
    const toolPages = ['/ai-detector', '/plagiarism-checker', '/grammar-checker', '/readability-checker', '/citation-generator', '/word-counter'];
    const priority = path === '/' ? 1.0 : toolPages.includes(path) ? 0.9 : 0.7;
    
    return {
      loc: path,
      changefreq: config.changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
};
