import { chromium } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({ headless: true, channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } }),
  errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("PAGE ERROR", e.message);
});
await mkdir("test-results", { recursive: true });
const save = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("project-ward.save.v1")));
const destination = async (name) => {
  await page
    .locator("#destinations")
    .getByRole("button", { name, exact: true })
    .click();
};
await page.goto("http://127.0.0.1:5186/nurse-rpg/");
await page.getByRole("button", { name: "Begin the journey" }).click();
for (let i = 0; i < 2; i++)
  await page.getByRole("button", { name: "Follow the light" }).click();
await page.getByRole("button", { name: "Step into Lantern Ward" }).click();
for (const [place, choice] of [
  ["Bed 2", "Sit and listen"],
  ["Med room", "Ask Pip to read"],
  ["Portal", "Weave the copper"],
]) {
  console.log("Encounter", place);
  await destination(place);
  await page
    .getByRole("button", { name: new RegExp(choice) })
    .click({ timeout: 15000 });
  await page
    .getByRole("button", { name: "Continue exploring", exact: true })
    .click();
}
assert.equal((await save()).xp, 75);
await destination("Bed 2");
await page.waitForFunction(
  () => document.getElementById("dialogue-tag").textContent === "WARD MEMORY",
);
assert.equal((await save()).xp, 75);
for (const [i, id, place] of [
  [1, "identity", "Bed 1 · Sam"],
  [2, "isbar", "Bed 3 · Mira"],
  [3, "deterioration", "Bed 4 · Tavi"],
]) {
  const q = JSON.parse(
    await readFile(new URL("../data/quests/" + id + ".json", import.meta.url)),
  );
  if (i === 1) await destination("Nurses’ station");
  if (i === 2)
    await page
      .getByRole("button", { name: "Listener · no voice forgotten" })
      .click();
  await page
    .getByRole("button", { name: "Accept ·", exact: false })
    .click({ timeout: 15000 });
  await destination(place);
  await page.locator("#choices button").first().waitFor();
  await page.waitForFunction(() =>
    Boolean(JSON.parse(localStorage.getItem("project-ward.save.v1")).node),
  );
  let steps = 0;
  while (!(await save()).completed) {
    const s = await save(),
      n = q.nodes[s.node];
    assert.ok(n, "valid node " + s.node);
    if (steps === 3) {
      await page.reload();
      await page.locator("#choices button").first().waitFor();
      assert.equal((await save()).node, s.node);
    }
    const c = n.choices.find((c) => c.correct !== false);
    await page
      .locator("#choices")
      .getByRole("button", { name: c.label, exact: true })
      .click();
    if (++steps > 40) throw Error("quest failed to terminate");
  }
  assert.match(await page.locator("#story").innerText(), /REAL WORLD NOTE/);
  await page.screenshot({
    path: `test-results/chapter-${i}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Return to the ward", exact: true })
    .click();
  await destination("Nurses’ station");
  await page.locator("#overlay[open]").waitFor({ timeout: 15000 });
  if (i < 3)
    await page
      .getByRole("button", { name: "Begin chapter " + (i + 1), exact: true })
      .click();
}
assert.equal((await save()).xp, 445);
assert.equal((await save()).completedQuests.length, 3);
await page
  .getByRole("heading", { name: "The bridge of three lights" })
  .waitFor();
await page.screenshot({
  path: "test-results/campaign-ending.png",
  fullPage: true,
});
await page.getByRole("button", { name: "Stay in Lumen" }).click();
await page.reload();
await page.locator("#destinations button").first().waitFor();
assert.equal((await save()).xp, 445);
await page.setViewportSize({ width: 390, height: 844 });
await page.reload();
await page.locator("#destinations button").first().waitFor();
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  true,
);
await page.getByRole("button", { name: "Use an art" }).click();
await page.getByRole("button", { name: "✦ Listening", exact: true }).click();
await page.getByRole("heading", { name: "Listening", exact: true }).waitFor();
await page
  .getByRole("button", { name: "Back to the ward", exact: true })
  .click();
await page.screenshot({
  path: "test-results/campaign-mobile.png",
  fullPage: true,
});
await destination("Bed 1 · Sam");
await page.waitForFunction(
  () => document.getElementById("location").textContent === "Bed 1 · Sam",
);
for (let repeat = 0; repeat < 2; repeat++) {
  await page.getByRole("button", { name: "Use an art" }).click();
  await page.getByRole("button", { name: "✦ Listening", exact: true }).click();
  await page
    .getByRole("button", { name: "Listen to Sam Okafor", exact: true })
    .click();
  await page.getByRole("heading", { name: "A voice remembered" }).waitFor();
  assert.equal((await save()).xp, 455);
  await page.getByRole("button", { name: "Return to your task" }).click();
}
await page.getByRole("button", { name: "Use an art" }).click();
await page.getByRole("button", { name: "✦ Wayfinding", exact: true }).click();
await page
  .getByRole("button", { name: "Follow the compass to your objective" })
  .click();
await page
  .getByRole("heading", { name: "The bridge of three lights" })
  .waitFor({ timeout: 15000 });
await page.getByRole("button", { name: "Stay in Lumen" }).click();
await page.reload();
await page.locator("#destinations button").first().waitFor();
assert.equal((await save()).xp, 455);
assert.deepEqual((await save()).bonds, ["sam"]);
assert.deepEqual(errors, []);
console.log(
  "PASS: three encounters, all three chapters, path, 445 XP, chapter2/3 save-resume, ending, field guide, no duplicate rewards, mobile overflow, no page errors.",
);
await browser.close();
