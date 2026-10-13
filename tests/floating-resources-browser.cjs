const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [320, 390, 1440]) for (const colorScheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, colorScheme, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/resources.html');
      const tip = page.getByRole('button', { name: 'Got it', exact: true });
      if (await tip.isVisible()) await tip.click();
      const panel = page.locator('.resource-browse');
      const toggle = panel.locator('summary');
      assert(await toggle.isVisible());
      assert.equal(await panel.getAttribute('open'), null);
      assert(await panel.locator('.resource-browse-label').isVisible());
      await page.evaluate(() => scrollTo(0, 650));
      await page.waitForFunction(() => document.querySelector('.resource-browse').classList.contains('is-floating'));
      const before = await page.evaluate(() => scrollY);
      const button = await toggle.boundingBox();
      const header = await page.locator('.elegant-header').boundingBox();
      assert(button.width >= 48 && button.height >= 48);
      assert(button.y >= header.y + header.height);
      await toggle.click();
      assert.equal(await page.evaluate(() => scrollY), before, 'Opening must preserve reading position');
      assert(await panel.locator('nav').isVisible());
      const menu = await panel.locator('nav').boundingBox();
      assert(menu.x >= 0 && menu.x + menu.width <= width && menu.y + menu.height <= 844);
      await page.screenshot({ path: `tests/floating-${width}-${colorScheme}.png` });
      await page.keyboard.press('Escape');
      assert.equal(await panel.getAttribute('open'), null);
      assert(await toggle.evaluate(e => e === document.activeElement));
      assert.equal(await page.evaluate(() => scrollY), before);
      await page.keyboard.press('Enter');
      await page.locator('.hero h1').dispatchEvent('pointerdown');
      assert.equal(await panel.getAttribute('open'), null);
      await toggle.click();
      await panel.locator('[data-section="clinical"]').click();
      assert(await page.locator('#clinical').isVisible());
      assert.equal(await panel.getAttribute('open'), null);
      await page.waitForFunction(() => !document.querySelector('.resource-browse').classList.contains('is-floating'));
      assert(await toggle.isVisible(), 'Browse stays available after changing category');
      await toggle.click();
      await panel.getByRole('button', { name: /Home/ }).click();
      assert(await toggle.isVisible());
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.goto(base + '/clinical-tips.html');
      assert.equal(await page.locator('a[href$=".mp4"]').count(), 0);
      assert.equal(await page.locator('video[controls] source[type="video/mp4"]').count(), 1);
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS floating menu and video link removal', width, colorScheme);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
