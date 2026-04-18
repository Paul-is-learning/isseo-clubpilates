// ═══════════════════════════════════════════════════════════════════════════
// Service Worker — Club Pilates ISSEO
// ═══════════════════════════════════════════════════════════════════════════
// Stratégie :
//   • App shell (HTML/CSS/JS/icônes) → cache-first, mise à jour en arrière-plan
//   • Supabase (API + realtime + auth) → network-only, jamais caché
//   • Leaflet/Supabase CDN (unpkg) → cache-first (versions figées)
//   • Reste → network-first avec fallback cache
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = 'isseo-v1-20260418-a18';
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
  './js/constants.js?v=20260418a18',
  './js/animations.js?v=20260418a18',
  './js/state.js?v=20260418a18',
  './js/notifications.js?v=20260418a18',
  './js/auth.js?v=20260418a18',
  './js/pages-accueil.js?v=20260418a18',
  './js/pages-fichiers.js?v=20260418a18',
  './js/pages-prospection.js?v=20260418a18',
  './js/pages-engagements.js?v=20260418a18',
  './js/pages-bp-consolide.js?v=20260418a18',
  './js/pages-collab.js?v=20260418a18',
  './js/pages-local.js?v=20260418a18',
  './js/pages-echanges.js?v=20260418a18',
  './js/pages-financier.js?v=20260418a18',
  './js/pages-detail.js?v=20260418a18',
  './js/pages.js?v=20260418a18',
  './js/vendor/preact.umd.js?v=20260418a18',
  './js/vendor/htm.umd.js?v=20260418a18',
  './js/preact-components/next-steps-widget.js?v=20260418a18',
  './js/gdrive.js?v=20260418a18',
  './js/gdrive-ui.js?v=20260418a18',
  './js/map.js?v=20260418a18',
  './js/utils.js?v=20260418a18',
  './js/exports.js?v=20260418a18',
  './js/simulator.js?v=20260418a18',
  './js/chat.js?v=20260418a18',
  './js/sync.js?v=20260418a18',
  './js/app.js?v=20260418a18'
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

// ── Notification click : ouvre l'app (studio ciblé si studioId présent) ──
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var data = event.notification.data || {};
  var targetPath = './';
  if (data.studioId) targetPath = './#/studio/' + encodeURIComponent(data.studioId);
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if (c.url.indexOf(self.location.origin) >= 0 && 'focus' in c) {
          c.focus();
          if ('postMessage' in c) c.postMessage({ type: 'NOTIF_CLICK', data: data });
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetPath);
    })
  );
});

// ── Push event : skeleton pour Web Push + VAPID (à wire avec backend plus tard) ──
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var payload = {};
  try { payload = event.data.json(); } catch (e) { payload = { title: 'ISSEO', body: event.data.text() }; }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'ISSEO', {
      body: payload.body || '',
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: payload.tag || 'isseo-push',
      data: payload.data || {},
      vibrate: [30, 40, 20],
      renotify: !!payload.renotify
    })
  );
});

// ── Share Target : intercepte les fichiers partagés depuis d'autres apps ─────
// Déclaré dans manifest.json (share_target). Stocke dans Cache Storage puis
// redirige vers /#/share-received où la page cliente lit et propose l'upload.
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.searchParams.get('source') === 'share') {
    event.respondWith((async function() {
      try {
        var formData = await event.request.formData();
        var title = formData.get('title') || '';
        var text = formData.get('text') || '';
        var shared_url = formData.get('url') || '';
        var files = formData.getAll('files') || [];
        var cache = await caches.open('isseo-share-inbox');
        var payload = { title: String(title), text: String(text), url: String(shared_url), filesCount: files.length, receivedAt: Date.now() };
        await cache.put('/share-meta', new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } }));
        for (var i = 0; i < files.length; i++) {
          var f = files[i];
          if (f && f.name) {
            await cache.put('/share-file-' + i, new Response(f, { headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-File-Name': f.name } }));
          }
        }
      } catch (e) { console.warn('[sw share]', e); }
      return Response.redirect('./#/share-received', 303);
    })());
  }
});
