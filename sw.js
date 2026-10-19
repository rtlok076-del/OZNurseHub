// OzNurseHub — Service Worker
const CACHE = 'oznurse-v69-fable-mina';

const CORE_FILES = [
  './',
  './index.html',
  './app.html',
  './about.html',
  './clinical-tips.html',
  './clinical-tips.css',
  './clinical-tip-spot-the-deteriorating-patient.html',
  './clinical-tip-make-an-isbar-call.html',
  './media/make-an-isbar-call.jpg',
  './media/spot-the-deteriorating-patient.jpg',
  './fables.html',
  './fable-merchants-crossroads.html',
  './fable-fox-and-rook.html',
  './media/merchants-crossroads.jpg',
  './media/fox-and-rook.jpg',
  './fable-mira-marsh-map.html',
  './fable-mara-two-lanterns.html',
  './fable-library.css',
  './fable-library.js',
  './fable-story.css',
  './media/mara-two-lanterns.jpg',
  './media/mira-marsh-map.jpg',
  './fable-mina-two-seeds.html',
  './media/mina-two-seeds.jpg',
  './app-home.css',
  './app-shell.js',
  './site-theme.css',
  './site-navigation.css',
  './newsletter.css?v=2',
  './newsletter-confirm.js?v=2',
  './site-navigation.js',
  './resource-sidebar.css',
  './resource-sidebar.js?v=3',
  './tools-choices.css?v=3',
  './theme.js',
  './dark-theme.css',
  './apple-touch-icon.png',
  './icon-192.png',
  './icon-512.png',
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
  './fluid-balance.html',
  './fluid-balance.js?v=2',
  './fluid-balance.css?v=2',
  './clinical-skills-logbook.html',
  './clinical-skills-logbook.js',
  './clinical-skills-logbook.css',
  './skills-data.js',
  './hero-nursing-v2.webp',
  './hero-nursing-v2-768.webp',
  './hero-nursing-v2-1024.webp',
  './quickref.html',
  './progressnote.html',
  './feedback.html',
  './bloods.html',
  './palliative.html',
  './palliative-care-phases.html',
  './nsqhs-standards.html',
  './study-guides.css',
  './med-quiz-mode.css',
  './med-quiz-mode.js',
  './cognitive.html',
  './antt.html',
  './tools.html',
  './clinical-quiz.html',
  './meds-quiz.html',
  './wardwise.html',
  './wardwise.css',
  './wardwise.js',
  './manifest.json',
  './favicon.ico',
  './favicon-32.png',
  './logo-mark.png',
  './og-image.jpg',
  './icon-maskable-512.png',
  './banner.webp'
];

// ── Install: cache all core files ──
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(CORE_FILES).then(function () { return self.skipWaiting(); });
    })
  );
  // Activate only after the complete offline set has been stored.
});

// ── Activate: remove old caches ──
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k.startsWith('oznurse-') && k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// Avoid revalidating the same asset on every page visit within a short session.
// This in-memory window resets when the worker restarts; HTML stays network-first.
const REVALIDATE_MS = 5 * 60 * 1000;
const checkedAt = new Map();
async function storeResponse(request, response) {
  if (!response.ok || response.type === 'opaque' || response.status === 206) return;
  try {
    // Clone before yielding: the browser may start consuming the original body.
    const copy = response.clone();
    const cache = await caches.open(CACHE);
    await cache.put(request, copy);
  } catch {
    // A full or unavailable cache must never prevent an online response.
  }
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.headers.has('range')) return;
  if (/\.(mp4|webm)$/i.test(url.pathname)) return;
  if (['/api/', '/auth/', '/downloads/', '/med-survivor/'].some(function (path) {
    return url.pathname.startsWith(path);
  })) return;

  // Register lifetime work synchronously so cache writes survive page navigation.
  let background = Promise.resolve();
  const response = (async function () {
    const cache = await caches.open(CACHE).catch(function () { return null; });
    const cached = cache ? await cache.match(e.request).catch(function () { return null; }) : null;
    if (e.request.mode === 'navigate') {
      try {
        const fresh = await fetch(e.request);
        background = storeResponse(e.request, fresh);
        return fresh;
      } catch {
        return cached || (cache && await cache.match('./index.html')) || Response.error();
      }
    }
    if (cached) {
      const now = Date.now();
      if (!checkedAt.has(url.href) || now - checkedAt.get(url.href) >= REVALIDATE_MS) {
        // Bound bookkeeping even when URLs contain arbitrary query strings.
        if (checkedAt.size >= 256) checkedAt.delete(checkedAt.keys().next().value);
        checkedAt.set(url.href, now);
        background = fetch(e.request).then(async function (fresh) {
          if (!fresh.ok) checkedAt.delete(url.href);
          await storeResponse(e.request, fresh);
        }).catch(function () { checkedAt.delete(url.href); });
      }
      return cached;
    }
    try {
      const fresh = await fetch(e.request);
      background = storeResponse(e.request, fresh);
      return fresh;
    } catch {
      // Missing assets must not receive HTML as JavaScript or CSS.
      return Response.error();
    }
  })();
  e.respondWith(response);
  e.waitUntil(response.then(function () { return background; }).catch(function () {}));
});
