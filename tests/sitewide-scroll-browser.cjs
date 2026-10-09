const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const errors = [];
  page.on("pageerror", (error) =>
    errors.push({ url: page.url(), message: error.message }),
  );
  const pages = fs
    .readdirSync(".")
    .filter((name) => name.endsWith(".html") && !name.startsWith("google"));
  for (const name of pages) {
    await page.goto("http://127.0.0.1:8765/" + name, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(150);
    assert.equal(
      await page.locator('script[src="scroll-effects.js"]').count(),
      1,
      name,
    );
    assert.ok((await page.locator(".motion-reveal").count()) > 0, name);
    await page.evaluate(() => scrollTo({ top: 500, behavior: "instant" }));
    await page.waitForTimeout(50);
    assert.equal(
      await page
        .locator(
          "form.motion-reveal,input.motion-reveal,textarea.motion-reveal,canvas.motion-reveal",
        )
        .count(),
      0,
      name,
    );
    console.log("PASS shared effects:", name);
  }
  await page.goto("http://127.0.0.1:8765/");
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator(".story-ready,.scroll-story").count(), 0);
  assert.ok(
    await page
      .locator(".home-intro")
      .evaluate((e) => e.offsetHeight < innerHeight * 0.7),
  );
  const before = await page
    .locator(".home-intro")
    .evaluate((e) => e.getBoundingClientRect().top);
  await page.evaluate(() => scrollTo({ top: 400, behavior: "instant" }));
  await page.waitForTimeout(80);
  const after = await page
    .locator(".home-intro")
    .evaluate((e) => e.getBoundingClientRect().top);
  assert.ok(Math.abs(before - after - 400) < 2);
  assert.ok(
    await page
      .locator("#explore")
      .evaluate((e) => e.getBoundingClientRect().top < innerHeight),
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({ path: "tests/natural-scroll-mobile.png" });
  // Prove opacity is driven by scroll distance and reverses, without adding layout height.
  const heights = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  const target = page.locator(".path-card").first();
  await target.evaluate((e) => {
    const y = scrollY + e.getBoundingClientRect().top;
    scrollTo({ top: y - innerHeight + 20, behavior: "instant" });
  });
  await page.waitForTimeout(80);
  const faded = Number(
    await target.evaluate((e) => getComputedStyle(e).opacity),
  );
  await page.evaluate(() => scrollBy({ top: 140, behavior: "instant" }));
  await page.waitForTimeout(80);
  const visible = Number(
    await target.evaluate((e) => getComputedStyle(e).opacity),
  );
  assert.ok(visible > faded);
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollHeight),
    heights,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".motion-reveal"));
  assert.equal(await page.locator("[inert]").count(), 0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.querySelector(".motion-reveal"));
  await page.evaluate(() => {
    const h = document.createElement("h2");
    h.id = "qa-dynamic";
    h.textContent = "Dynamic heading";
    document.querySelector("main").append(h);
  });
  await page.waitForFunction(() =>
    document.querySelector("#qa-dynamic").classList.contains("motion-reveal"),
  );
  await page.emulateMedia({ media: "print" });
  assert.equal(await target.evaluate((e) => getComputedStyle(e).opacity), "1");
  const nojs = await browser.newPage({ javaScriptEnabled: false });
  await nojs.goto("http://127.0.0.1:8765/");
  assert.equal(await nojs.locator(".motion-reveal").count(), 0);
  assert.ok(await nojs.locator("h1").isVisible());
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS natural homepage height, scroll-linked opacity, dynamic content, no-JS, reduced motion, print, overflow and browser errors",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
