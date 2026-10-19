const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
      await page.goto((process.env.TEST_BASE_URL || 'http://127.0.0.1:8765/') + 'clinical-escalation.html');
      const count = await page.locator('.ce-case').count();
      for (let i = 0; i < count; i++) {
        await page.locator('.ce-case').nth(i).click();
        const expectStop = i === 1;
        assert.equal(await page.locator('.ce-idline').count(), 0);
        assert.equal(await page.locator('.ce-idcard').count(), 2);
        await page.locator(`.ce-idbtn[data-idcheck="${expectStop ? 'stop' : 'match'}"]`).click();
        assert.match(await page.locator('.ce-idfb h4').innerText(), expectStop ? /^Right call: stop and clarify/ : /^Correct: all three match/);
        assert.equal(await page.locator('.ce-idbad').count(), expectStop ? 2 : 0);
        if (width === 390 && i < 2) await page.locator('.ce-idcheck').screenshot({ path: `tests/id-check-${i}.png` });
        await page.locator('.ce-idfb button').click();
        assert.match(await page.locator('.ce-idline').innerText(), /Fictional patient[\s\S]*DOB \d\d\/\d\d\/\d{4}[\s\S]*URN 000-10\d/i);
        while (await page.locator('.ce-opt[data-id]').count()) {
          await page.locator('.ce-opt[data-id]').first().click();
          const state = await page.locator('.ce-fb').evaluate(el => {
            const s = getComputedStyle(el);
            const badge = el.querySelector('.ce-z');
            return { bg: s.backgroundColor, fg: s.color, zone: badge.classList[1], badgeBg: getComputedStyle(badge).backgroundColor, optionBg: getComputedStyle(document.querySelector('.ce-opt > span')).backgroundColor };
          });
          assert.equal(state.bg, 'rgb(27, 41, 36)');
          assert.equal(state.fg, 'rgb(232, 238, 233)');
          assert.equal(state.optionBg, 'rgba(0, 0, 0, 0)');
          assert.equal(state.badgeBg, { w: 'rgb(27, 41, 36)', y: 'rgb(57, 47, 29)', r: 'rgb(64, 39, 37)', p: 'rgb(53, 45, 67)' }[state.zone]);
          if (i === 0) await page.locator('.ce-fb').screenshot({ path: `tests/dark-feedback-${width}.png` });
          await page.locator('.ce-fb button').click();
        }
        await page.getByRole('button', { name: 'All scenarios', exact: true }).click();
      }
      await page.emulateMedia({ colorScheme: 'light' });
      await page.locator('.ce-case').first().click();
      await page.locator('.ce-idbtn[data-idcheck="stop"]').click();
      assert.match(await page.locator('.ce-idfb h4').innerText(), /^Look again/);
      await page.locator('.ce-idfb button').click();
      await page.locator('.ce-opt[data-id]').first().click();
      assert.deepEqual(await page.evaluate(() => [Object.keys(localStorage).filter(k => k !== 'oznurse_appearance_tip_day'), sessionStorage.length]), [[], 0], 'The simulator saves nothing (only the sitewide appearance-tip day is allowed)');
      assert.equal(await page.locator('.ce-fb').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(246, 248, 244)');
      await page.close();
    }
    console.log('Wristband ID checks (match and mismatch), nothing stored, and all scenario feedback states pass on mobile and desktop; light mode preserved.');
  } finally { await browser.close(); }
})().catch(err => { console.error(err); process.exit(1); });
