const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({serviceWorkers:'block'}),errors=[],videos=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('.mp4'))videos.push(r.url())});
  for(const width of [320,390,768,1440]) for(const colorScheme of ['light','dark']) {
   await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme,reducedMotion:'no-preference'});
   await page.goto(`${base}/fables.html`);
   const tip=page.getByRole('button',{name:'Got it',exact:true});if(await tip.isVisible())await tip.click();
   assert.equal(await page.locator('video').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert(await page.locator('[data-book-prev]').isDisabled());assert(!(await page.locator('[data-book-next]').isDisabled()));
   const opacity=await page.locator('.book-card').evaluateAll(cards=>cards.map(c=>+getComputedStyle(c).opacity));
   assert(opacity[0]>.95&&opacity[1]<.8,JSON.stringify(opacity));
   await page.locator('[data-book-next]').click();
   await page.waitForFunction(()=>+getComputedStyle(document.querySelectorAll('.book-card')[1]).opacity>.98);
   assert.equal(await page.locator('.book-position').innerText(),'2 / 5');assert(!(await page.locator('[data-book-next]').isDisabled()));
   await page.locator('.book-track').focus();await page.keyboard.press('Home');
   await page.waitForFunction(()=>+getComputedStyle(document.querySelector('.book-card')).opacity>.98);
   await page.keyboard.press('End');await page.waitForFunction(()=>+getComputedStyle(document.querySelectorAll('.book-card')[4]).opacity>.98);assert(await page.locator('[data-book-next]').isDisabled());
   await page.waitForFunction(()=>{const t=document.querySelector('.book-track');return Math.abs(t.scrollLeft-(t.scrollWidth-t.clientWidth))<2});
   await page.emulateMedia({reducedMotion:'reduce'});
   assert.deepEqual(await page.locator('.book-card').evaluateAll(cs=>cs.map(c=>getComputedStyle(c).opacity)),['1','1','1','1','1']);
   assert.deepEqual(await page.locator('.book-card').evaluateAll(cs=>cs.map(c=>getComputedStyle(c).transform)),['none','none','none','none','none']);
   await page.locator('.book-track').focus();await page.keyboard.press('Home');await page.waitForFunction(()=>document.querySelector('.book-track').scrollLeft<2).catch(async e=>{console.log(await page.locator('.book-track').evaluate(t=>({left:t.scrollLeft,focus:document.activeElement.className,cards:[...t.children].map(c=>({off:c.offsetLeft,width:c.offsetWidth})),width:t.clientWidth})));throw e;});
   await page.waitForFunction(()=>document.querySelector('.book-position').textContent==='1 / 5');
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   if(width===390||width===1440)await page.screenshot({path:`tests/library-${width}-${colorScheme}.png`,fullPage:true});
  }
  assert.deepEqual(videos,[],'Library must not load videos.');
  await page.locator('.book-card').first().click();await page.waitForURL('**/fable-merchants-crossroads.html');
  for(const [hash,slug] of [['mira','mira-marsh-map'],['mara','mara-two-lanterns']]) {await page.goto(`${base}/fables.html#${hash}`);await page.waitForURL(`**/fable-${slug}.html`)}
  const plain=await browser.newPage({javaScriptEnabled:false});await plain.goto(`${base}/fables.html`);await plain.locator('.book-card').last().click();await plain.waitForURL('**/fable-mina-two-seeds.html');
  assert.deepEqual(errors,[]);console.log('PASS cover browsing, reversible fades, keyboard, reduced motion, legacy links, no-JS, no video downloads, and responsive themes.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
