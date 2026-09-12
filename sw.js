// OzNurse Hub — Service Worker
const CACHE = 'oznurse-v14';

const CORE_FILES = [
  './',
  './index.html',
  './quickref.html',
  './progressnote.html',
  './feedback.html',
  './bloods.html',
  './palliative.html',
  './cognitive.html',
  './antt.html',
  './tools.html',
  './clinical-quiz.html',
  './meds-quiz.html',
  './wardwise.html',
  './wardwise.css',
  './wardwise.js',
  './manifest.json',
  './icon.svg',
  './banner.png'
];

// ── Install: cache all core files ──
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ──
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network ──
self.addEventListener('fetch', function (e) {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;
  // The game's versioned bundles must not receive the site's HTML fallback.
  if (new URL(e.request.url).pathname.startsWith('/med-squad/')) return;
  // Prefer current navigation; retain cached pages only as an offline fallback.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (response) {
      if (response.ok) {
        var copy = response.clone();
        e.waitUntil(caches.open(CACHE).then(function (cache) { return cache.put(e.request, copy); }));
      }
      return response;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || caches.match('./index.html');
      });
    }));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) {
        // Return cached version and update in background
        fetch(e.request).then(function (fresh) {
          if (fresh && fresh.status === 200) {
            caches.open(CACHE).then(function (c) { c.put(e.request, fresh); });
          }
        }).catch(function () {});
        return cached;
      }

      // Not in cache — try network, cache on success
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type !== 'opaque') {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () {
        // Offline and not cached — return index as fallback
        return caches.match('./index.html');
      });
    })
  );
});
