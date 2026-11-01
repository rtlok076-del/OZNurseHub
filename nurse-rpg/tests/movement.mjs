import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const reducedMotion of ["no-preference", "reduce"]) {
    const page = await browser.newPage({
      viewport: { width: 900, height: 650 },
      reducedMotion,
    });
    await page.route("**/movement-fixture", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<div id="world" tabindex="0" style="width:768px;height:512px"></div>',
      }),
    );
    await page.goto("http://127.0.0.1:5186/movement-fixture");
    await page.addScriptTag({ url: "/nurse-rpg/assets/phaser.min.js" });
    await page.evaluate(async () => {
      const { createWorld } = await import("/nurse-rpg/js/world.js");
      const world = await (await fetch("/nurse-rpg/data/world.json")).json();
      window.samples = [];
      window.steps = [];
      window.game = createWorld(
        world,
        {
          position: { x: 2, y: 8 },
          chapter: 1,
          completedQuests: [],
          events: {},
        },
        {
          blocked: () => false,
          interact: () => {},
          position: () => window.steps.push(performance.now()),
          ready: (scene) => {
            window.scene = scene;
            scene.events.on("postupdate", () =>
              window.samples.push({
                time: performance.now(),
                x: scene.player.x,
                y: scene.player.y,
                bob: (scene.player.originY - 0.5) * 32,
                moving: !!scene.moving,
              }),
            );
          },
        },
      );
    });
    await page.waitForFunction(() => Boolean(window.scene?.ready));
    await page.locator("#world").focus();
    await page.evaluate(() => {
      window.samples = [];
      window.steps = [];
    });
    // Hold two keys: the grid must still choose only one cardinal direction.
    await page.keyboard.down("d");
    await page.keyboard.down("s");
    await page.waitForTimeout(1050);
    await page.keyboard.up("d");
    await page.keyboard.up("s");
    await page.waitForTimeout(260);
    const keyboard = await page.evaluate(() => ({
      samples,
      steps,
      x: scene.player.x,
      y: scene.player.y,
      bob: scene.player.originY,
      round: game.config.roundPixels,
    }));
    assert.equal(keyboard.y, 272);
    assert.equal(keyboard.bob, 0.5);
    assert.equal(keyboard.round, true);
    assert.ok(keyboard.steps.length >= 4 && keyboard.steps.length <= 6);
    for (let i = 1; i < keyboard.samples.length; i++)
      assert.ok(
        keyboard.samples[i].x >= keyboard.samples[i - 1].x - 0.001,
        "no backwards snap",
      );
    for (let i = 1; i < keyboard.steps.length; i++) {
      const gap = keyboard.steps[i] - keyboard.steps[i - 1];
      assert.ok(gap >= 185 && gap < 270, `step cadence ${gap}`);
    }
    if (reducedMotion === "reduce")
      assert.ok(
        keyboard.samples.every((s) => s.bob === 0 && (s.x - 16) % 32 === 0),
        "instant reduced motion, no bob",
      );
    else {
      assert.ok(keyboard.samples.some((s) => s.bob > 1 && s.bob <= 2.01));
      assert.ok(
        keyboard.samples.some((s) => (s.x - 16) % 32 !== 0),
        "interpolated walking",
      );
    }
    await page.evaluate(() => {
      window.samples = [];
      window.steps = [];
    });
    // Tap an empty corridor tile; it runs through the same route and step logic.
    await page
      .locator("#world canvas")
      .click({ position: { x: 12 * 32 + 16, y: 8 * 32 + 16 } });
    await page.waitForFunction(
      () => scene.player.x === 400 && !scene.moving,
      {},
      { timeout: 5000 },
    );
    const tapped = await page.evaluate(() => ({
      steps,
      bob: scene.player.originY,
      y: scene.player.y,
    }));
    assert.equal(tapped.y, 272);
    assert.equal(tapped.bob, 0.5);
    for (let i = 1; i < tapped.steps.length; i++) {
      const gap = tapped.steps[i] - tapped.steps[i - 1];
      assert.ok(gap >= 185 && gap < 270, `tap cadence ${gap}`);
    }
    console.log(
      `PASS ${reducedMotion}: held WASD, cardinal steps, steady 200ms-class cadence, tap parity, idle reset, pixel rounding.`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
