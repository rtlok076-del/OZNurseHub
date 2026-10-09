const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const profile = require("node:fs").mkdtempSync(
    require("node:path").join(require("node:os").tmpdir(), "oznurse-app-qa-"),
  );
  const context = await chromium.launchPersistentContext(profile, {
    channel: "msedge",
    headless: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8765/app.html");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  const cdp = await context.newCDPSession(page);
  const manifest = await cdp.send("Page.getAppManifest");
  assert.equal(manifest.errors.length, 0);
  const data = JSON.parse(manifest.data);
  assert.equal(data.start_url, "/app.html");
  assert.equal(data.display, "standalone");
  assert.deepEqual(
    data.icons.map((i) => i.sizes),
    ["192x192", "512x512"],
  );
  console.log(
    "Manifest valid; installability:",
    JSON.stringify(await cdp.send("Page.getInstallabilityErrors")),
  );
  const installed = await context.newPage();
  await installed.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { value: true }),
  );
  await installed.goto("http://127.0.0.1:8765/app.html");
  assert.equal(
    await installed
      .locator(".app-bottom-nav")
      .evaluate((e) => getComputedStyle(e).display),
    "flex",
  );
  assert.equal(await installed.locator(".app-bottom-nav a").count(), 4);
  await installed.close();
  // Test the install button only with a local simulated browser event (no OS install).
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    dispatchEvent(event);
  });
  await page.click("#install-app");
  assert.match(
    await page.locator("#install-status").textContent(),
    /cancelled/,
  );
  await context.setOffline(true);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  await page.reload();
  assert.ok(await page.locator(".app-welcome h1").isVisible());
  assert.ok(await page.locator(".app-offline").isVisible());
  await page.goto("http://127.0.0.1:8765/quickref.html");
  assert.ok(await page.locator("h1").isVisible());
  await context.setOffline(false);
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  await page.goto("http://127.0.0.1:8765/resources.html#study");
  await page.waitForTimeout(100);
  assert.ok(await page.locator("#study").isVisible());
  await page.goto("http://127.0.0.1:8765/clinical-quiz.html");
  await page.click(".start-btn");
  assert.ok(await page.locator("#quiz").isVisible());
  assert.equal(await page.locator("#landing").isVisible(), false);
  assert.equal(
    await page.locator("#quiz").evaluate((e) => getComputedStyle(e).position),
    "relative",
  );
  await page.goto("http://127.0.0.1:8765/meds-quiz.html");
  await page.click(".start-btn");
  assert.ok(await page.locator("#quiz").isVisible());
  assert.deepEqual(errors, []);
  await context.close();
  console.log(
    "PASS app manifest, standalone navigation, install cancellation, offline app/reference, resource navigation and both quizzes",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
