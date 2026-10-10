const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({ serviceWorkers: "block" });
  const files = fs
    .readdirSync(".")
    .filter((n) => n.endsWith(".html") && !n.startsWith("google"));
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  for (const viewport of [
    { width: 320, height: 740 },
    { width: 390, height: 844 },
    { width: 412, height: 915 },
    { width: 1440, height: 900 },
  ]) {
    await p.setViewportSize(viewport);
    for (const file of files) {
      await p.goto("http://127.0.0.1:8765/" + file, {
        waitUntil: "domcontentloaded",
      });
      for (const nav of await p.locator(".sidebar").all()) {
        if (!(await nav.isVisible()) || file === "tools.html" || await nav.evaluate(e => !!e.closest(".resource-sidebar"))) continue;
        assert.ok(
          await nav.evaluate((e) => e.getBoundingClientRect().height < 110),
          file + " navigation too tall",
        );
        for (const item of await nav.locator(".sidebar-item").all()) {
          if (!(await item.isVisible())) continue;
          const height = await item.evaluate(
            (e) => e.getBoundingClientRect().height,
          );
          assert.ok(
            height >= 40 && height < 70,
            file + " item height " + height,
          );
        }
      }
      if (file === "tools.html") {
        assert.ok(
          await p
            .locator(".page-hero")
            .evaluate((e) => e.getBoundingClientRect().top < innerHeight * 0.5),
        );
        assert.equal(await p.locator(".tools-browse, .sidebar").count(), 0);
        for (const choice of await p.locator(".calc-tab").all()) {
          assert.ok(await choice.evaluate(e => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.left >= 0 && r.right <= innerWidth && r.height >= 44;
          }), "Tools choice must fit without horizontal scrolling");
        }
        await p.locator(".calc-tab").last().click();
        assert.ok(await p.locator("#panel-convert").isVisible());
        await p.locator(".calc-tab").last().focus();
        assert.ok(
          await p
            .locator(".calc-tab")
            .last()
            .evaluate((e) => {
              const r = e.getBoundingClientRect();
              return r.left >= 0 && r.right <= innerWidth;
            }),
        );
      }
    }
    console.log(
      "PASS compact section navigation on all pages at",
      viewport.width,
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto("http://127.0.0.1:8765/tools.html");
  await p.screenshot({ path: "tests/tools-navigation-mobile.png" });
  assert.deepEqual(errors, []);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
