import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registered manually in src/pwa.ts (adds update-on-focus polling)
      includeAssets: ['favicon.svg'],
      workbox: {
        // Music files are large (~7MB each) — don't precache them; cache on first
        // play instead. rangeRequests lets the browser seek/stream from cache.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprout-audio',
              rangeRequests: true,
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Animated character/mascot WebPs + scene art (large) — cache on first use.
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/journey/') || url.pathname.startsWith('/assets/mascot/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sprout-art',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Sprout — Confidence for Kids',
        short_name: 'Sprout',
        description: 'Know what to say. Watch them grow. A parenting + kid confidence companion.',
        theme_color: '#7A5AD9',
        background_color: '#F6F1FF',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: { host: true },
});
