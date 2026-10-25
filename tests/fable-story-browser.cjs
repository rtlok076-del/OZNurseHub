const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.BASE_URL || 'http://127.0.0.1:8765';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const width of [390,1440]) for(const colorScheme of ['light','dark']) {
   await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme});
   for(const [slug,lastLine,videoWidth] of [['merchants-crossroads','The Nash Equilibrium had moved.',540],['fox-and-rook','yet truer in practice.',720],['mira-marsh-map','the best compass is prediction corrected by evidence.',720],['mara-two-lanterns','she cultivated better uncertainty.',540],['fox-river-returns','how fast the chain forgets where it began.',720],['mina-two-seeds','the algebra of rational belief revision under uncertainty.',720],['thea-pond-map','converges on what is really there.',720]]) {
    await page.goto(`${base}/fable-${slug}.html`);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('video').count(),1);
    assert((await page.locator('.fable-text').innerText()).includes(lastLine));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    const video=page.locator('video');await video.evaluate(async v=>{v.muted=true;await v.play()});
    await page.waitForFunction(()=>document.querySelector('video').currentTime>.2);
    assert(await video.evaluate((v,w)=>v.duration>45&&v.duration<65&&v.videoWidth===w&&!v.error,videoWidth));await video.evaluate(v=>v.pause());
    assert.equal(await page.getByRole('link',{name:'Next story:',exact:false}).count(),1);
   }
  }
  await page.getByRole('link',{name:'← All fables',exact:true}).click();assert.equal(await page.locator('.book-card').count(),7);
  await page.goto(`${base}/resources.html`);assert.equal(await page.locator('.si-card[href="fables.html"]').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS both standalone stories, full text, video playback, responsive themes, and library navigation.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
