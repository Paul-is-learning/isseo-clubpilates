import { defineConfig } from 'vite';

// Phase 1 — Vite sert le site statique avec HMR.
// On ne bundle rien pour le moment : l'app reste chargée via <script> dans index.html.
// La build prod (Phase 3+) viendra plus tard.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    host: true,
    open: '/index.html'
  },
  preview: {
    port: 4173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
