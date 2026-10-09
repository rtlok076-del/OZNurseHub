const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ serviceWorkers: "block" });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await p.setViewportSize(viewport);
    await p.goto("http://127.0.0.1:8765/");
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(100);
    const initial = await p
      .locator(".home-intro")
      .evaluate((e) => ({
        opacity: Number(getComputedStyle(e).opacity),
        top: e.getBoundingClientRect().top,
        bottom: e.getBoundingClientRect().bottom,
        height: e.offsetHeight,
        position: getComputedStyle(e).position,
      }));
    assert.equal(initial.opacity, 1);
    assert.notEqual(initial.position, "sticky");
    const pageHeight = await p.evaluate(
      () => document.documentElement.scrollHeight,
    );
    // Leave 120px of banner visible: it must visibly fade while still in the viewport.
    await p.evaluate(
      (y) => scrollTo({ top: y, behavior: "instant" }),
      initial.bottom - 120,
    );
    await p.waitForTimeout(100);
    const faded = await p
      .locator(".home-intro")
      .evaluate((e) => Number(getComputedStyle(e).opacity));
    assert.ok(faded > 0 && faded < 0.55, JSON.stringify({ viewport, faded }));
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollHeight),
      pageHeight,
    );
    await p.screenshot({ path: `tests/fade-${viewport.width}.png` });
    await p.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(100);
    assert.equal(
      await p
        .locator(".home-intro")
        .evaluate((e) => Number(getComputedStyle(e).opacity)),
      1,
    );
    console.log(
      "PASS banner fades before leaving viewport and returns at",
      viewport.width,
      "opacity",
      faded,
    );
  }
  await p.goto("http://127.0.0.1:8765/antt.html");
  assert.ok(await p.locator(".page-header.motion-reveal").count());
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.waitForFunction(() => !document.querySelector(".motion-reveal"));
  assert.equal(
    await p
      .locator(".page-header")
      .evaluate((e) => getComputedStyle(e).opacity),
    "1",
  );
  assert.deepEqual(errors, []);
  await b.close();
  console.log("PASS content-page header and reduced-motion fallback");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
