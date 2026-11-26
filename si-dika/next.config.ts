import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  // Disable PWA in development to avoid caching issues
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // App shell — cache first
      urlPattern: /^https?.*(\/|\/dashboard.*|\/login)$/,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "app-shell",
        expiration: { maxEntries: 20, maxAgeSeconds: 86400 },
      },
    },
    {
      // Student list — network first (fallback to cache when offline)
      urlPattern: /\/api\/students/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-students",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 50, maxAgeSeconds: 300 },
      },
    },
    {
      // Fonts & static assets — cache first, long TTL
      urlPattern: /\.(woff2?|ttf|eot|svg|png|jpg|ico|css|js)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 100, maxAgeSeconds: 31536000 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  // Enable React strict mode for catching issues early
  reactStrictMode: true,

  // Experimental features for App Router
  experimental: {
    // Server Actions are stable in Next.js 15
  },

  // Allow @react-pdf/renderer to be bundled server-side
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default withPWA(nextConfig);
