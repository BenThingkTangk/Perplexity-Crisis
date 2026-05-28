import { defineConfig } from 'vite';
import { resolve } from 'path';

// ΔTOM // Vite config — minimal multi-entry static build.
// Atom Vercel project ignores this (no build configured at project level).
// Akamai-crisis-v2 Vercel project runs `vite build`, which produces dist/
// containing the same static surface area as the repo root.
export default defineConfig({
  root: '.',
  publicDir: 'dtom-assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main:         resolve(__dirname, 'index.html'),
        architecture: resolve(__dirname, 'akamai-architecture.html'),
      },
      output: {
        // Keep filenames stable so vercel.json header rules continue to match
        // (.js/.css/.woff2/etc. globs in /:path*.(js|css|...)). Vite hashes by
        // default; we disable hashing to preserve the existing immutable-asset
        // header pattern and avoid breaking inline <script src="./app.js">.
        entryFileNames:  '[name].js',
        chunkFileNames:  '[name].js',
        assetFileNames:  '[name].[ext]',
      },
    },
    // Don't fail the build on browser-target oddities in our hand-written code.
    target: 'es2020',
    minify: false,
  },
  server: { port: 3000 },
});
