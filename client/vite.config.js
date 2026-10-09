import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import lazyImages from './build/lazyImages.js';

/**
 * Build stamp.
 *
 * `npm run verify:deploy` fetches the deployed index.html and compares the
 * revision it reports against this checkout's HEAD. Without a stamp there is no
 * way to tell "the push shipped" from "Vercel quietly kept serving the previous
 * bundle" — the two look identical from the outside.
 *
 * Vercel exports VERCEL_GIT_COMMIT_SHA to the build step. A local build falls
 * back to its own git HEAD, so the very same check also works against
 * `vite preview` while developing.
 */
const readGit = (args) => {
  try {
    // git walks up from cwd, so this resolves whether the config is loaded from
    // client/ (npm --prefix) or the repo root.
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch (error) {
    return '';
  }
};

const BUILD_COMMIT = (
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GIT_COMMIT ||
  process.env.COMMIT_REF ||
  readGit('rev-parse HEAD')
).trim();

const BUILD_BRANCH = (
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.GIT_BRANCH ||
  readGit('rev-parse --abbrev-ref HEAD')
).trim();

const BUILD_TIME = new Date().toISOString();

const buildStamp = () => ({
  name: 'aft-build-stamp',
  transformIndexHtml() {
    return [
      { tag: 'meta', attrs: { name: 'x-aft-commit', content: BUILD_COMMIT || 'unknown' }, injectTo: 'head' },
      { tag: 'meta', attrs: { name: 'x-aft-branch', content: BUILD_BRANCH || 'unknown' }, injectTo: 'head' },
      { tag: 'meta', attrs: { name: 'x-aft-built-at', content: BUILD_TIME }, injectTo: 'head' },
    ];
  },
});

export default defineConfig({
  plugins: [
    // `lazyImages` runs on every JSX file: images get loading="lazy" +
    // decoding="async" unless they set `loading` themselves. See
    // client/build/lazyImages.js for why this is done in the build.
    react({ babel: { plugins: [lazyImages] } }),
    buildStamp(),
  ],
  server: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    allowedHosts: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-icons': ['lucide-react'],
          // framer-motion is ~120 kB of the entry bundle. As its own chunk it
          // downloads in parallel with the app code instead of after it, and a
          // deploy that only changes app code leaves the cached copy alone.
          'vendor-motion': ['framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
