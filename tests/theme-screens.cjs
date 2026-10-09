const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const errors = [];
  p.on("pageerror", (e) => errors.push({ page: p.url(), error: e.message }));
  for (const name of fs
    .readdirSync(".")
    .filter((n) => n.endsWith(".html") && !n.startsWith("google"))) {
    await p.goto("http://127.0.0.1:8765/" + name, {
      waitUntil: "domcontentloaded",
    });
    await p.waitForTimeout(100);
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    console.log(name, "overflow=", overflow);
    assert.equal(overflow, false, name);
    if (
      [
        "quickref.html",
        "antt.html",
        "clinical-quiz.html",
        "resources.html",
        "app.html",
        "tools.html",
      ].includes(name)
    )
      await p.screenshot({ path: "tests/theme-" + name + ".png" });
  }
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto("http://127.0.0.1:8765/quickref.html");
  await p.screenshot({ path: "tests/theme-desktop.png" });
  console.log("ERRORS", JSON.stringify(errors));
  assert.deepEqual(errors, []);
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
