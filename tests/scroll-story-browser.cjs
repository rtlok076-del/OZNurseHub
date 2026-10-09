const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/");
  await page.evaluate(() => document.fonts.ready);
  for (const size of [
    { width: 390, height: 844 },
    { width: 320, height: 568 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(100);
    assert.equal(await page.locator(".story-ready").count(), 1);
    for (const [index, p] of [0, 0.5, 1].entries()) {
      await page.evaluate((p) => {
        const s = document.querySelector(".scroll-story"),
          stage = s.querySelector(".story-stage");
        scrollTo({
          top:
            scrollY +
            s.getBoundingClientRect().top +
            (s.offsetHeight - stage.offsetHeight) * p,
          behavior: "instant",
        });
      }, p);
      await page.waitForTimeout(100);
      const state = await page.evaluate(() => ({
        active: [...document.querySelectorAll(".story-panel")].findIndex(
          (e) => !e.inert,
        ),
        top: document.querySelector(".story-stage").getBoundingClientRect().top,
        overflow: document.documentElement.scrollWidth > innerWidth,
        visible: [...document.querySelectorAll(".story-panel")]
          .filter((e) => !e.inert)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return r.top >= 0 && r.bottom < innerHeight - 60;
          }),
      }));
      assert.equal(state.active, index);
      assert.ok(Math.abs(state.top) < 2);
      assert.equal(state.overflow, false);
      assert.ok(state.visible.every(Boolean));
      await page.screenshot({ path: `tests/story-${size.width}-${index}.png` });
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-chapter="0"]').click();
  await page.waitForTimeout(100);
  assert.equal(
    await page.locator('[data-scene="0"]').getAttribute("aria-hidden"),
    "false",
  );
  const opacities = [];
  for (const progress of [0.18, 0.22, 0.26, 0.5, 0.8, 0.5, 0]) {
    await page.evaluate((p) => {
      const s = document.querySelector(".scroll-story");
      scrollTo({
        top:
          scrollY +
          s.getBoundingClientRect().top +
          (s.offsetHeight - s.querySelector(".story-stage").offsetHeight) * p,
        behavior: "instant",
      });
    }, progress);
    await page.waitForTimeout(80);
    opacities.push(
      Number(
        await page
          .locator('[data-scene="0"]')
          .evaluate((e) => getComputedStyle(e).opacity),
      ),
    );
  }
  assert.ok(opacities[0] > opacities[1] && opacities[1] > opacities[2]);
  assert.equal(opacities.at(-1), 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".story-ready"));
  assert.equal(await page.locator(".story-ready").count(), 0);
  assert.equal(await page.locator(".story-panel[inert]").count(), 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForFunction(() => !document.querySelector(".story-ready"));
  assert.equal(await page.locator(".story-ready").count(), 0);
  const nojs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await nojs.goto("http://127.0.0.1:8765/");
  assert.equal(await nojs.locator(".story-ready").count(), 0);
  assert.equal(await nojs.locator(".story-panel").count(), 3);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS phone/desktop sticky scenes, forward scroll, chapter navigation, reduced motion, landscape, no-JS, bounds and browser errors",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
