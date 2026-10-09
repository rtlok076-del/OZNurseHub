const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  const c = await b.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
    colorScheme: "dark",
  });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const root = "http://127.0.0.1:8765/";
  await p.goto(root + "tools.html");
  assert(await p.locator(".appearance-tip").isVisible());
  assert.equal(
    await p.evaluate(() => document.activeElement === document.body),
    true,
  );
  await p.getByRole("button", { name: "Show me", exact: true }).click();
  assert.equal(
    await p.locator(".elegant-toggle").getAttribute("aria-expanded"),
    "true",
  );
  assert(
    await p
      .locator("[data-theme-picker]")
      .evaluate((el) => el === document.activeElement),
  );
  await p.goto(root + "index.html");
  assert.equal(await p.locator(".appearance-tip").count(), 0);
  await p.evaluate(() =>
    localStorage.setItem("oznurse_appearance_tip_day", "2000-1-1"),
  );
  await p.reload();
  assert(await p.locator(".appearance-tip").isVisible());
  await p.getByRole("button", { name: "Got it", exact: true }).click();
  await p.reload();
  assert.equal(await p.locator(".appearance-tip").count(), 0);
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.evaluate(() => localStorage.removeItem("oznurse_appearance_tip_day"));
  await p.reload();
  await p.getByRole("button", { name: "Show me", exact: true }).click();
  assert(
    await p
      .locator("[data-theme-picker]")
      .evaluate((el) => el === document.activeElement),
  );
  await p.evaluate(() => localStorage.removeItem("oznurse_appearance_tip_day"));
  await p.reload();
  await p.getByRole("button", { name: "Got it", exact: true }).focus();
  await p.keyboard.press("Escape");
  assert.equal(await p.locator(".appearance-tip").count(), 0);
  assert.deepEqual(errors, []);
  await b.close();
  console.log(
    "PASS daily suppression, next-day return, mobile/desktop Show me, dismiss, Escape, and no initial focus steal.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
