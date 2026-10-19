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
      await panel.getByRole('link', { name: /Home/ }).click();
      await page.waitForURL('**/index.html');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.goto(base + '/clinical-tips.html');
      assert.equal(await page.locator('a[href$=".mp4"]').count(), 0);
      assert.equal(await page.locator('.tips-video-card').count(), 3);
      for (const file of ['clinical-tips.html', 'clinical-tip-spot-the-deteriorating-patient.html', 'clinical-tip-make-an-isbar-call.html', 'clinical-tip-check-the-patient-id.html', 'fables.html', 'fable-mara-two-lanterns.html', 'fable-mira-marsh-map.html', 'fable-merchants-crossroads.html', 'fable-fox-and-rook.html']) {
        await page.goto(base + '/' + file);
        assert(await toggle.isVisible(), file + ' has Browse resources on arrival');
        assert.equal(await page.locator('.resource-browse').count(), 1);
        await page.evaluate(() => scrollTo(0, 400));
        await page.waitForFunction(() => document.querySelector('.resource-browse').classList.contains('is-floating'));
        const y = await page.evaluate(() => scrollY);
        await toggle.click();
        assert.equal(await page.evaluate(() => scrollY), y);
        const bounds = await panel.locator('nav').boundingBox();
        assert(bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= 844, file + ' menu fits');
        assert.equal(await panel.getByRole('link', { name: 'Home', exact: true }).getAttribute('href'), 'index.html');
        assert.equal(await panel.getByRole('link', { name: 'All resources', exact: true }).getAttribute('href'), 'resources.html');
        if (file === 'clinical-tips.html' || file === 'fables.html') await page.screenshot({ path: `tests/menu-${file}-${width}-${colorScheme}.png` });
        await panel.getByRole('link', { name: 'Clinical', exact: true }).click();
        await page.waitForURL('**/resources.html#clinical');
        assert(await page.locator('#clinical').isVisible());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      assert.deepEqual(errors, []);
      await page.close();
      console.log('PASS floating menu and video link removal', width, colorScheme);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
