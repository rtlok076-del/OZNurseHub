// OzNurseHub — Service Worker
const CACHE = 'oznurse-v38-centred-tools';

const CORE_FILES = [
  './',
  './index.html',
  './app.html',
  './about.html',
  './fables.html',
  './app-home.css',
  './app-shell.js',
  './site-theme.css',
  './tools-choices.css?v=2',
  './theme.js',
  './dark-theme.css',
  './app-icon-180.png',
  './app-icon-192.png',
  './app-icon-512.png',
  './resources.html',
  './learning-lab.html',
  './medications.html',
  './downloads.html',
  './downloads.css',
  './renovation.css',
  './renovation.js',
  './home-intro.css',
  './scroll-effects.js',
  './scroll-effects.css',
  './learning-lab.css',
  './learning-lab.js',
  './learning-data.js',
  './medication-of-the-day.html',
  './manifest-motd.json',
  './student-to-rn.html',
  './placement-prep.html',
  './student-tools.css',
  './student-tools.js',
  './clinical-escalation.html',
  './clinical-escalation.js',
  './clinical-skills-logbook.html',
  './clinical-skills-logbook.js',
  './clinical-skills-logbook.css',
  './skills-data.js',
  './hero-nursing-v2.webp',
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
  './banner.webp'
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
        keys.filter(function (k) { return k.startsWith('oznurse-') && k !== CACHE; })
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
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;
  if (new URL(e.request.url).pathname.startsWith('/downloads/')) return;
  // The game's versioned bundles must not receive the site's HTML fallback.
  if (new URL(e.request.url).pathname.startsWith('/med-squad/')) return;
  if (new URL(e.request.url).pathname.startsWith('/med-survivor/')) return;
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
        // Missing assets must not receive HTML as JavaScript or CSS.
        return Response.error();
      });
    })
  );
});
