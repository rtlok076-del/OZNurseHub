const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { contrastAudit } = require('./theme-audit.cjs');
const root=process.env.TEST_BASE_URL || 'http://127.0.0.1:8765/';
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    for(const width of [390,1440]) {
      const context=await browser.newContext({viewport:{width,height:900},colorScheme:'dark',reducedMotion:'reduce',serviceWorkers:'block'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(root+'med-survivor/',{waitUntil:'domcontentloaded'});
      await page.locator('.character').first().waitFor();
      assert.equal(await page.getAttribute('html','data-theme'),'dark');
      for(const mode of ['light','dark']) {
        await page.locator('[data-theme-picker]').selectOption(mode);
        assert.equal(await page.getAttribute('html','data-theme'),mode);
        assert.deepEqual(await page.evaluate(contrastAudit),[],mode+' menu contrast');
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
        await page.screenshot({path:`tests/survivor-${width}-${mode}.png`});
      }
      await page.locator('.character').first().click();
      await page.locator('#hud').waitFor({state:'visible'});
      for(const mode of ['light','dark']) {
        await page.locator('[data-theme-picker]').selectOption(mode);
        assert.deepEqual(await page.evaluate(contrastAudit),[],mode+' HUD contrast');
        await page.screenshot({path:`tests/survivor-hud-${width}-${mode}.png`});
      }
      // Inspect existing modal templates without waiting five minutes for game completion.
      await page.evaluate(()=>{document.querySelector('#hud').classList.add('hidden');document.querySelector('#result').classList.remove('hidden');});
      for(const mode of ['light','dark']) {
        await page.locator('[data-theme-picker]').selectOption(mode);
        assert.deepEqual(await page.evaluate(contrastAudit),[],mode+' result contrast');
      }
      await page.locator('[data-theme-picker]').selectOption('light');
      await page.reload();assert.equal(await page.getAttribute('html','data-theme'),'light');
      const second=await context.newPage();await second.goto(root+'index.html');
      assert.equal(await second.getAttribute('html','data-theme'),'light','game preference carries to site');
      await second.locator('[data-theme-picker]').evaluate(el=>{el.value='dark';el.dispatchEvent(new Event('change'));});
      await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
      await page.locator('[data-theme-picker]').selectOption('system');
      await page.emulateMedia({colorScheme:'light'});
      await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('PASS Survivor menus, HUD, result template, saved/system and cross-page themes at 390/1440px');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
