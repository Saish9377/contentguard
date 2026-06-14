import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Disable the "X-Powered-By: Next.js" header for security
  poweredByHeader: false,

  // Enable gzip/brotli compression for responses
  compress: true,

  // Mark pdf-parse as a server-only external package (it uses Node.js fs internals)
  serverExternalPackages: ['pdf-parse'],

  // Modern image format optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Security & SEO response headers applied to every route
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent this site from being embedded in iframes (clickjacking protection)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Send full referrer to same-origin, only origin to cross-origin
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict browser features not needed by the app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Long-lived cache for static assets (JS, CSS, fonts, images)
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
