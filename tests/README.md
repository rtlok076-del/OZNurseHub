Run a local server from the repository root (`python -m http.server 8765 --bind 127.0.0.1`), then run `node tests/logbook-browser.cjs` with Playwright available. The test uses installed Microsoft Edge in headless mode. Screenshots are generated locally and ignored by Git.
`node tests/sitewide-scroll-browser.cjs` checks shared transitions across all content pages, natural homepage scrolling, reduced motion and dynamic content.

`node tests/app-browser.cjs` checks manifest/installability, simulated standalone navigation, install cancellation, real offline cache loads, and quiz/resource navigation. It uses a temporary browser profile and does not install an app on the computer.
`node tests/theme-screens.cjs` checks overflow and browser errors on every content page and saves selected mobile/desktop screenshots.

`node tests/visible-fades-browser.cjs` verifies that the whole homepage banner visibly fades while still on screen, reverses when scrolling back, and adds no page height.
`node tests/navigation-layout-browser.cjs` checks section-menu and button heights across all pages at phone and desktop widths, plus keyboard access to off-screen menu links.

`node tests/dark-mode-browser.cjs` checks every page on mobile/desktop, saved and system appearance, cross-tab updates, storage restrictions, print restoration, and unchanged image colours.
`node tests/dark-contrast-audit.cjs` checks text against solid ancestor backgrounds in dark mode (4.5:1); it does not replace visual checks of images, transparency, or gradients.

`node tests/theme-audit.cjs` switches all 28 top-level pages light → dark → light at 390px and 1440px, checks overflow/browser errors and text contrast (including translucent backgrounds), and inspects dormant reference sections. Set `THEME_SCREENSHOTS=1` to capture each page in both themes. Gradients and artwork still require visual review.

`node tests/theme-interactions.cjs` checks both themes during quiz questions, answers and results, learning cards, skills records, calculator errors/results, WardWise rounds and the cognitive checklist. It waits for colour transitions to finish before measuring contrast.

`node tests/dark-scenarios-browser.cjs` checks every escalation scenario step and its clinical zone colours. `node tests/survivor-theme.cjs` checks the restored Survivor menu, live HUD, result template, and saved/system/cross-tab appearance. It does not simulate a full five-minute game; canvas artwork is intentionally not recoloured.

These theme tests accept `TEST_BASE_URL` (include the trailing slash) to test an alternate local server or deployed site. They use temporary browser contexts; they do not alter real users' records. JSON reports and screenshots are generated locally and ignored by Git.
