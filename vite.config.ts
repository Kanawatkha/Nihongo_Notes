import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { REPO_NAME } from './src/config/site.ts';

/** Preloads the three fonts every page needs at first paint, so text is not held back by font discovery. */
function preloadFonts(): Plugin {
  const wanted =
    /(space-grotesk-latin-wght|inter-latin-wght|ibm-plex-sans-thai-thai-400)-normal.*\.woff2$/;
  return {
    name: 'preload-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        if (!ctx.bundle) return;
        return Object.keys(ctx.bundle)
          .filter((name) => wanted.test(name))
          .map((name) => ({
            tag: 'link',
            injectTo: 'head' as const,
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
              href: `/${REPO_NAME}/${name}`,
            },
          }));
      },
    },
  };
}

export default defineConfig(({ command, isPreview }) => ({
  // GitHub Pages serves the site under /<repo name>/. The dev server uses the root;
  // preview mirrors production so the real base path can be tested locally.
  base: command === 'build' || isPreview ? `/${REPO_NAME}/` : '/',
  plugins: [
    preloadFonts(),
    react(),
    tailwindcss(),
    // Precaches the whole build so every page works offline. `autoUpdate` installs a new version
    // by itself; src/app/pwa/UpdateHost.tsx reloads the page and keeps the reading position.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Nihongo Notes',
        short_name: 'Nihongo',
        description: 'Vocabulary and oral exam notes for JN60101 Japanese for Communication 1.',
        lang: 'th',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,woff2,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    alias: {
      // The real module only exists inside a PWA build
      'virtual:pwa-register': fileURLToPath(
        new URL('./src/test/pwaRegisterStub.ts', import.meta.url),
      ),
    },
  },
}));
