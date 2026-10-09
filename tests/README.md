Run a local server from the repository root (`python -m http.server 8765 --bind 127.0.0.1`), then run `node tests/logbook-browser.cjs` with Playwright available. The test uses installed Microsoft Edge in headless mode. Screenshots are generated locally and ignored by Git.
`node tests/sitewide-scroll-browser.cjs` checks shared transitions across all content pages, natural homepage scrolling, reduced motion and dynamic content.

`node tests/app-browser.cjs` checks manifest/installability, simulated standalone navigation, install cancellation, real offline cache loads, and quiz/resource navigation. It uses a temporary browser profile and does not install an app on the computer.
`node tests/theme-screens.cjs` checks overflow and browser errors on every content page and saves selected mobile/desktop screenshots.

`node tests/visible-fades-browser.cjs` verifies that the whole homepage banner visibly fades while still on screen, reverses when scrolling back, and adds no page height.
`node tests/navigation-layout-browser.cjs` checks section-menu and button heights across all pages at phone and desktop widths, plus keyboard access to off-screen menu links.

`node tests/dark-mode-browser.cjs` checks every page on mobile/desktop, saved and system appearance, cross-tab updates, storage restrictions, print restoration, and unchanged image colours.
`node tests/dark-contrast-audit.cjs` checks text against solid ancestor backgrounds in dark mode (4.5:1); it does not replace visual checks of images, transparency, or gradients.
