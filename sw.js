// ═══════════════════════════════════════════════════════════════════════════
// Service Worker — Club Pilates ISSEO
// ═══════════════════════════════════════════════════════════════════════════
// Stratégie :
//   • App shell (HTML/CSS/JS/icônes) → cache-first, mise à jour en arrière-plan
//   • Supabase (API + realtime + auth) → network-only, jamais caché
//   • Leaflet/Supabase CDN (unpkg) → cache-first (versions figées)
//   • Reste → network-first avec fallback cache
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'isseo-v1-20260415-wow5';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './logo-white.png',
  './logo-cp.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './js/constants.js?v=20260415wow5',
  './js/animations.js?v=20260415wow5',
  './js/state.js?v=20260415wow5',
  './js/notifications.js?v=20260415wow5',
  './js/auth.js?v=20260415wow5',
  './js/pages.js?v=20260415wow5',
  './js/map.js?v=20260415wow5',
  './js/utils.js?v=20260415wow5',
  './js/exports.js?v=20260415wow5',
  './js/simulator.js?v=20260415wow5',
  './js/chat.js?v=20260415wow5',
  './js/sync.js?v=20260415wow5',
  './js/app.js?v=20260415wow5'
];

// ── Install : pré-cache l'app shell ──────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(APP_SHELL).catch(function(err) {
        console.warn('[SW] Pré-cache partiel:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── Activate : nettoyer les vieux caches ─────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_VERSION; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── Fetch : routage des requêtes ─────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  const req = event.request;
  const url = new URL(req.url);

  // Seules les requêtes GET passent par le cache
  if (req.method !== 'GET') return;

  // Ne jamais cacher Supabase (API, realtime, auth, storage)
  if (url.hostname.indexOf('supabase.co') >= 0) return;

  // Ne pas intercepter les requêtes cross-origin autres que nos CDN connus
  const isUnpkg = url.hostname === 'unpkg.com';
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin && !isUnpkg) return;

  // unpkg : cache-first (versions figées)
  if (isUnpkg) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        return cached || fetch(req).then(function(res) {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  // Same-origin : network-first avec fallback cache
  event.respondWith(
    fetch(req).then(function(res) {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(function(c) { c.put(req, copy); });
      }
      return res;
    }).catch(function() {
      return caches.match(req).then(function(cached) {
        if (cached) return cached;
        // Fallback ultime : index.html pour les navigations
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('Hors ligne', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

// ── Message : permet à l'app de forcer le SKIP_WAITING ───────────────────────
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
