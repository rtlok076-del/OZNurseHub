const { chromium } = require("playwright");
const fs = require("node:fs");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    colorScheme: "dark",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const root = "http://127.0.0.1:8765/";
  const theme = () => page.getAttribute("html", "data-theme");
  const pages = fs
    .readdirSync(".")
    .filter(
      (f) =>
        f.endsWith(".html") &&
        fs.readFileSync(f, "utf8").includes("site-theme.css"),
    );
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of pages) {
      await page.goto(root + file);
      assert.equal(await theme(), "dark", file);
      assert.equal(await page.locator("[data-theme-picker]").count(), 1, file);
      const state = await page.evaluate(() => ({
        bg: getComputedStyle(document.body).backgroundColor,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        filters: [
          document.documentElement,
          document.body,
          ...document.images,
        ].map((el) => getComputedStyle(el).filter),
      }));
      assert.equal(state.bg, "rgb(17, 28, 25)", file);
      assert.equal(state.overflow, false, file + " overflow");
      assert(
        state.filters.every((f) => !f.includes("invert")),
        file + " inverts images",
      );
    }
  }
  await page.goto(root + "index.html");
  await page.locator("[data-theme-picker]").selectOption("light");
  assert.equal(await theme(), "light");
  await page.goto(root + "tools.html");
  assert.equal(await theme(), "light", "choice follows navigation");
  await page.emulateMedia({ colorScheme: "light" });
  await page.locator("[data-theme-picker]").selectOption("dark");
  await page.reload();
  assert.equal(await theme(), "dark", "saved choice beats system");
  await page.locator("[data-theme-picker]").selectOption("system");
  assert.equal(await theme(), "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  const second = await context.newPage();
  await second.goto(root + "quickref.html");
  await second.locator("[data-theme-picker]").selectOption("light");
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await second.close();
  await page.locator("[data-theme-picker]").selectOption("dark");
  await page.goto(root + "clinical-skills-logbook.html");
  await page.pdf();
  assert.equal(await theme(), "dark", "printing restores dark preference");
  assert.equal(
    await page.evaluate(() => localStorage.getItem("oznurse_theme")),
    "dark",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(root + "tools.html");
  await page.locator(".elegant-toggle").click();
  await page.getByLabel("Appearance").selectOption("light");
  assert.equal(await theme(), "light", "mobile menu appearance works");
  await page.getByLabel("Appearance").selectOption("dark");
  await page.locator(".elegant-toggle").click();
  await page.screenshot({ path: "tests/dark-tools-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(root + "quickref.html");
  await page.screenshot({ path: "tests/dark-reference-desktop.png" });
  const restricted = await browser.newContext({
    colorScheme: "dark",
    serviceWorkers: "block",
  });
  await restricted.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage blocked");
      },
    }),
  );
  const restrictedPage = await restricted.newPage();
  await restrictedPage.goto(root + "tools.html");
  await restrictedPage.getByLabel("Appearance").selectOption("light");
  assert.equal(
    await restrictedPage.getAttribute("html", "data-theme"),
    "light",
  );
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: 24 pages, mobile/desktop, saved/system/cross-tab preferences, storage failure, print restore, no inversion or overflow.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
