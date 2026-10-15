# OZNurseHub maintenance review

Reviewed against `96ae67c` (15 October 2026). Focus: shared browser scripts, service-worker caching, asset loading, navigation, and basic site integrity. This is not a line-by-line clinical-content or security audit.

## Changes

- Removed duplicate service-worker registration from seven pages; `renovation.js` remains the shared registration point.
- Cached assets revalidate at most once per five minutes per URL while a worker remains alive. Previously every cached asset request triggered a network request. HTML remains network-first. Worker restarts reset the window; failed network rechecks can retry immediately. The bookkeeping is bounded to 256 URLs.
- Kept the full existing offline page set. Cache updates now participate in the fetch event lifetime, clone responses before the browser consumes them, and tolerate write failures. Range requests bypass the cache. The cache version is bumped for rollout.
- Scroll effects ignore text-only DOM changes and disconnect their mutation observer for reduced motion. Dynamic headings still acquire effects, and removed elements are still cleaned up.
- Fable carousel measurements are collected before style writes, avoiding alternating layout reads and writes.
- Back-to-top visibility is updated only when it changes, instead of on every scroll event.
- Corrected an outdated scroll test: the fable library explicitly opts out of shared effects and has its own tested cover animations.

## Validation

Passed locally with system Chromium (the existing browser tests target Edge; a temporary launcher adapter selected Chromium):

- `tests/app-browser.cjs`: manifest/installability, simulated standalone mode, install cancellation, real offline app/reference loads, resource navigation, both quizzes.
- `tests/sitewide-scroll-browser.cjs`: all 32 content pages, dynamic headings, text-only update regression, reversible fades, reduced motion, print, no-JavaScript behavior.
- `tests/persistent-navigation-browser.cjs`: all content pages at 390px and 1440px.
- `tests/fable-library-browser.cjs`: cover navigation, keyboard behavior, reduced motion, legacy links, responsive themes, no eager video downloads.
- `tests/theme-screens.cjs`: no mobile overflow or uncaught page errors across all 32 content pages; selected screenshots.
- `tests/service-worker-runtime.cjs`: revalidation window, retries, storage quota failure, online/offline navigation, missing assets, excluded routes and range requests.
- Top-level JavaScript syntax checks, local HTML file-reference checks, and `git diff --check`.

## Remaining considerations

The site is static, so the main savings here are browser work and repeated asset requests rather than server computation. Videos already use `preload="none"` and bypass offline caching. The approximately 2.1 MB Survivor HTML file is a separate game payload; it is not included in the main site's offline precache. Its packaging merits a separate game-specific review if game startup is slow.

The offline install still downloads the complete existing core set. Reducing that would change which resources work before a user's first offline visit. No features, clinical text, stored user records, or offline resources were removed. No real-device speed percentage or production load improvement has been measured.
