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
   await page.waitForTimeout(700);
   assert.equal(media.length,0,'Video must not download before play');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const box=await page.locator('.tip-video-box').boundingBox();
   assert(box.width<=360.1 && Math.abs(box.width/box.height-9/16)<.001);
   assert.equal(await page.locator('video').getAttribute('preload'),'none');
   await page.locator('video').evaluate(async v=>{v.muted=true;await v.play()});
   await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
   assert(await page.locator('video').evaluate(v=>v.videoWidth===720&&v.videoHeight===1280&&v.duration>47&&v.duration<48&&!v.error));
   await page.locator('video').evaluate(v=>{v.pause();v.currentTime=0});
   await page.screenshot({path:`tests/clinical-tips-${width}-${colorScheme}.png`,fullPage:true});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  const page=await browser.newPage();
  await page.goto(base+'/resources.html');
  await page.locator('.si-card[href="clinical-tips.html"]').click();
  await page.waitForURL('**/clinical-tips.html');
  await page.goto(base+'/index.html');
  assert.equal(await page.locator('a[href="clinical-tips.html"]').count(),1);
  console.log('PASS responsive light/dark layouts, 9:16 sizing, deferred download, H.264 playback and discovery links');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
