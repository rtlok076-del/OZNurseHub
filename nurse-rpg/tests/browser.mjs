import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await mkdir("test-results", { recursive: true });
await page.goto("http://127.0.0.1:5186/nurse-rpg/");
await page.getByRole("button", { name: "Begin the journey" }).click();
await page.getByRole("button", { name: "Follow the light" }).click();
await page.getByRole("button", { name: "Follow the light" }).click();
await page.getByRole("button", { name: "Step into Lantern Ward" }).click();
await page
  .locator("#destinations")
  .getByRole("button", { name: "Nurses’ station", exact: true })
  .click();
await page
  .getByRole("button", { name: "Accept · The names we carry" })
  .click({ timeout: 15000 });
await page
  .locator("#destinations")
  .getByRole("button", { name: "Bed 1 · Sam", exact: true })
  .click();
await page
  .getByRole("button", { name: "Use the bed number" })
  .click({ timeout: 15000 });
assert.match(await page.locator("#story").innerText(), /not a person/);
await page.getByRole("button", { name: "Return to Sam" }).click();
await page.getByRole("button", { name: "Compare three identifiers" }).click();
await page.reload();
await page.getByRole("button", { name: "Stop and ask Rowan" }).waitFor();
assert.match(await page.locator("#story").innerText(), /LW-1086/);
await page.screenshot({
  path: "test-results/desktop-quest.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Stop and ask Rowan" }).click();
await page.getByRole("button", { name: "Confirm all three" }).click();
await page.getByRole("button", { name: "Record the resolved" }).click();
assert.match(await page.locator("#story").innerText(), /REAL WORLD NOTE/);
assert.equal(await page.locator("#xp").innerText(), "100 XP earned");
await page
  .getByRole("button", { name: "Return to the ward", exact: true })
  .click();
await page
  .locator("#destinations")
  .getByRole("button", { name: "Nurses’ station", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Your first light" })
  .waitFor({ timeout: 15000 });
await page.screenshot({ path: "test-results/debrief.png", fullPage: true });
await page.getByRole("button", { name: "Keep exploring" }).click();
await page.reload();
assert.equal(await page.locator("#xp").innerText(), "100 XP earned");
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await page.locator("canvas").waitFor();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
await page.getByRole("button", { name: "About", exact: true }).click();
await page.getByRole("heading", { name: "About Project Ward" }).waitFor();
await page.keyboard.press("Escape");
await page.setViewportSize({ width: 1440, height: 1100 });
await page.reload();
await page.locator("canvas").waitFor();
await page.locator("#destinations button").first().waitFor();
const position = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("project-ward.save.v1")).position,
  );
const before = await position();
await page.locator("#world").focus();
await page.keyboard.down("ArrowLeft");
await page.waitForTimeout(180);
await page.keyboard.up("ArrowLeft");
assert.notDeepEqual(await position(), before);
await page.getByRole("button", { name: "Pause journey" }).click();
const paused = await position();
await page.keyboard.down("ArrowLeft");
await page.waitForTimeout(250);
await page.keyboard.up("ArrowLeft");
assert.deepEqual(await position(), paused);
await page.getByRole("button", { name: "Resume journey" }).click();
await page.getByRole("button", { name: "Sound: off" }).click();
await page.reload();
await page.getByRole("button", { name: "Sound: on" }).waitFor();
const privatePage = await browser.newPage();
await privatePage.addInitScript(() => {
  Storage.prototype.setItem = function () {
    throw new Error("Storage unavailable");
  };
});
await privatePage.goto("http://127.0.0.1:5186/nurse-rpg/");
await privatePage.getByRole("button", { name: "Begin the journey" }).click();
assert.match(
  await privatePage.locator("#save-status").innerText(),
  /Saving unavailable/,
);
await privatePage.close();
assert.deepEqual(errors, []);
console.log(
  "PASS: intro, movement, unsafe branch, mid-quest reload, evidence cards, completion, debrief, saved XP, mobile width, About; no browser errors.",
);
await browser.close();
