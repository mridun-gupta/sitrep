import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content-Security-Policy.
 * MapLibre needs worker-src blob: and connect-src for tiles/fonts; Supabase
 * and AI endpoints are reached server-side only, so the browser connect-src
 * stays tight (own origin + tile hosts + Supabase REST).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next inline bootstraps require unsafe-inline
  "style-src 'self' 'unsafe-inline'",
  // NOTE: CSP wildcards (*.host) do NOT cover the bare host — list both.
  "img-src 'self' data: blob: https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://openfreemap.org https://*.openfreemap.org",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  "connect-src 'self' data: blob: https://basemaps.cartocdn.com https://*.basemaps.cartocdn.com https://openfreemap.org https://*.openfreemap.org https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone', // slim Docker images
  poweredByHeader: false,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
