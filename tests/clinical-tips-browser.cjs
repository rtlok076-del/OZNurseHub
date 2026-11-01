const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  for (const width of [320,390,1440]) for (const colorScheme of ['light','dark']) {
   const page = await browser.newPage({viewport:{width,height:1000},colorScheme,serviceWorkers:'block',reducedMotion:'reduce'});
   const errors=[], media=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(r.url().endsWith('.mp4'))media.push(r.url())});
   await page.goto(base+'/clinical-tips.html');
   const tip=page.getByRole('button',{name:'Got it',exact:true});
   if(await tip.isVisible()) await tip.click();
   assert.equal(await page.locator('.tips-video-card').count(),5);
   assert.equal(await page.locator('video').count(),0,'Library loads posters, not players');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for (const card of await page.locator('.tips-video-card').all()) await card.scrollIntoViewIfNeeded();
   await page.waitForFunction(()=>[...document.querySelectorAll('.tips-preview img')].every(i=>i.complete&&i.naturalWidth>0));
   assert(await page.locator('.tips-preview img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
   await page.screenshot({path:`tests/tips-library-${width}-${colorScheme}.png`,fullPage:true});
   for(const [slug,duration] of [['spot-the-deteriorating-patient',47],['make-an-isbar-call',55],['check-the-patient-id',53],['first-day-placement-checklist',45],['track-your-clinical-skills',44]]) {
   media.length=0;
   await page.locator(`.tips-video-card[href="clinical-tip-${slug}.html"]`).click();
   await page.waitForURL(`**/clinical-tip-${slug}.html`);
   await page.waitForTimeout(700);
   assert.equal(media.length,0,'Video must not download before play');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const box=await page.locator('.tip-video-box').boundingBox();
   assert(box.width<=360.1 && Math.abs(box.width/box.height-9/16)<.001);
   assert.equal(await page.locator('video').getAttribute('preload'),'none');
   await page.locator('video').evaluate(async v=>{v.muted=true;await v.play()});
   await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
   assert(await page.locator('video').evaluate((v,d)=>v.videoWidth===720&&v.videoHeight===1280&&v.duration>d&&v.duration<d+1&&!v.error,duration));
   await page.locator('video').evaluate(v=>{v.pause();v.currentTime=0});
   assert.equal(await page.locator('a[href$=".mp4"]').count(),0);
   await page.screenshot({path:`tests/${slug}-${width}-${colorScheme}.png`,fullPage:true});
   await page.evaluate(()=>scrollTo(0,400));
   await page.waitForFunction(()=>document.querySelector('.resource-browse').classList.contains('is-floating'));
   await page.locator('.resource-browse summary').click();
   assert(await page.locator('.resource-browse nav').isVisible());
   await page.keyboard.press('Escape');
   await page.locator('.tips-back').click();
   await page.waitForURL('**/clinical-tips.html');
   }
   assert.deepEqual(errors,[]);
   await page.close();
  }
  const page=await browser.newPage();
  await page.goto(base+'/resources.html');
  await page.locator('.si-card[href="clinical-tips.html"]').click();
  await page.waitForURL('**/clinical-tips.html');
  await page.goto(base+'/index.html');
  assert.equal(await page.locator('a[href="clinical-tips.html"]').count(),1);
  console.log('PASS library and all three tips: responsive light/dark layouts, 9:16 sizing, deferred download, real playback, floating browsing and discovery links');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
