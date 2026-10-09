const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true, channel: "msedge" });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:8765/clinical-skills-logbook.html");
  assert.equal(await page.locator("textarea,input[type=text]").count(), 0);
  await page.selectOption("#skill", "as-vitals");
  await page.selectOption("#level", "obs");
  await page.click("button[type=submit]");
  await page.reload();
  assert.equal(await page.locator(".record").count(), 1);
  await page.locator(".record button").first().click();
  await page.selectOption("#level", "ast");
  await page.click("button[type=submit]");
  assert.match(await page.locator(".record").textContent(), /Assisted/);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  const result = await page.evaluate(() => {
    const base = {
      skill: "as-vitals",
      date: "2026-01-01",
      level: "obs",
      note: "PATIENT SECRET",
      sup: "AB",
      sn: "SECRET",
      setting: "SECRET",
      r: { what: "SECRET" },
      stds: [1, 1, 2.5, 9],
    };
    return {
      clean: OZSkillsRecords.cleanEntry(base),
      bad: OZSkillsRecords.cleanEntry({ ...base, date: "2026-02-30" }),
      unknown: OZSkillsRecords.cleanEntry({ ...base, skill: "custom-secret" }),
    };
  });
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
  assert.equal(result.bad, null);
  assert.equal(result.unknown, null);
  assert.deepEqual(result.clean.stds, [1]);
  await page.evaluate(() =>
    localStorage.setItem(
      "ozn.skills-logbook.log",
      JSON.stringify({
        v: 2,
        profile: { name: "SECRET" },
        entries: [
          {
            skill: "as-vitals",
            date: "2026-01-01",
            level: "obs",
            note: "SECRET",
          },
        ],
      }),
    ),
  );
  await page.reload();
  assert.equal(
    (
      await page.evaluate(() => localStorage.getItem("ozn.skills-logbook.log"))
    ).includes("SECRET"),
    false,
  );
  await page.locator("#restore").setInputFiles({
    name: "old.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        entries: [
          {
            skill: "as-vitals",
            date: "2026-01-02",
            level: "sup",
            note: "SECRET",
          },
        ],
      }),
    ),
  });
  await page.waitForFunction(() =>
    document
      .querySelector("#backup-status")
      .textContent.includes("records added"),
  );
  assert.equal(await page.locator(".record").count(), 2);
  const downloadPromise = page.waitForEvent("download");
  await page.click("#backup");
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let body = "";
  for await (const chunk of stream) body += chunk;
  assert.equal(body.includes("SECRET"), false);
  assert.equal(JSON.parse(body).data.entries.length, 2);
  // Even current-format records must not retain unsupported private fields.
  await page.evaluate(() => {
    const key = "ozn.skills-logbook.log";
    const stored = JSON.parse(localStorage.getItem(key));
    stored.entries[0].note = "PRIVATE_V3";
    stored.profile = { name: "PRIVATE_V3" };
    localStorage.setItem(key, JSON.stringify(stored));
  });
  await page.reload();
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("ozn.skills-logbook.log").includes("PRIVATE_V3"),
    ),
    false,
  );
  // PDF invokes native print lifecycle, without pressing the page's print button.
  await page
    .locator("#progress details")
    .first()
    .evaluate((element) => {
      element.open = true;
    });
  const beforePrint = await page
    .locator("#progress details")
    .evaluateAll((elements) => elements.map((element) => element.open));
  await page.evaluate(() =>
    window.addEventListener("beforeprint", () => {
      window.printExpanded = [
        ...document.querySelectorAll("#progress details"),
      ].every((element) => element.open);
    }),
  );
  await page.pdf({
    path: require("node:path").join(
      require("node:os").tmpdir(),
      "oznursehub-native-print-qa.pdf",
    ),
    format: "A4",
  });
  assert.equal(await page.evaluate(() => window.printExpanded), true);
  assert.deepEqual(
    await page
      .locator("#progress details")
      .evaluateAll((elements) => elements.map((element) => element.open)),
    beforePrint,
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await page.selectOption("#skill", "as-pain");
  await page.selectOption("#level", "obs");
  await page.click("button[type=submit]");
  assert.match(await page.locator("#status").textContent(), /temporarily/);
  await page.goto("http://127.0.0.1:8765/");
  assert.ok((await page.locator(".scroll-reveal").count()) > 0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.querySelector(".scroll-reveal"));
  await page.screenshot({ path: "tests/home-mobile.png", fullPage: true });
  await page.goto("http://127.0.0.1:8765/clinical-skills-logbook.html");
  await page.screenshot({ path: "tests/logbook-mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: save/reload/edit, privacy schema, v3 disk sanitization, native print and state restoration, migration, import, export, storage failure, mobile overflow, reduced motion, browser errors",
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
