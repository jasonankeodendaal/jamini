import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
    VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        workbox: {
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'app-assets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60, // Very short cache for main assets
                }
              },
            },
            {
              urlPattern: /index.*\.js$/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'main-bundle',
              }
            },
            {
              urlPattern: /\.(?:js|css)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'js-css-cache',
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: { maxEntries: 50 },
              },
            },
          ],
        },
        manifest: {
          name: 'JAMINI Studio',
          short_name: 'JAMINI',
          description: 'Professional AI Advertisement Studio',
          theme_color: '#050505',
          background_color: '#050505',
          display: 'standalone',
          icons: [
            {
              src: 'https://i.ibb.co/RTRNJgw0/1778090202960-removebg-preview.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://i.ibb.co/RTRNJgw0/1778090202960-removebg-preview.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.VITE_APP_VERSION': JSON.stringify(`${Date.now()}`),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ''),
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      ...Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [
          [`process.env.GEMINI_API_KEY_${i + 1}`, JSON.stringify(env[`GEMINI_API_KEY_${i + 1}`] || env[`VITE_GEMINI_API_KEY_${i + 1}`] || '')],
          [`process.env.VITE_GEMINI_API_KEY_${i + 1}`, JSON.stringify(env[`VITE_GEMINI_API_KEY_${i + 1}`] || env[`GEMINI_API_KEY_${i + 1}`] || '')],
          [`process.env.API_KEY_${i + 1}`, JSON.stringify(env[`API_KEY_${i + 1}`] || env[`VITE_API_KEY_${i + 1}`] || '')],
          [`process.env.VITE_API_KEY_${i + 1}`, JSON.stringify(env[`VITE_API_KEY_${i + 1}`] || env[`API_KEY_${i + 1}`] || '')],
        ]).flat()
      )
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
