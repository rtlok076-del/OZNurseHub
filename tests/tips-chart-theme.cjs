const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const root=process.env.TEST_BASE_URL||'http://127.0.0.1:8879/';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const width of [390,1440]) {
   const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
   const setTheme=async mode=>p.locator('[data-theme-picker]').evaluate((el,m)=>{el.value=m;el.dispatchEvent(new Event('change'));},mode);
   await p.goto(root+'resources.html#tips');
   for(const button of await p.locator('#tips .accordion-btn').all()) await button.click();
   for(const mode of ['dark','light','dark']) {
    await setTheme(mode);
    assert.equal(await p.locator('#grid-tips').evaluate(el=>getComputedStyle(el).backgroundColor),mode==='dark'?'rgb(27, 41, 36)':'rgb(255, 255, 255)');
    for(const note of await p.locator('#tips .note').all()) assert.equal(await note.evaluate(el=>getComputedStyle(el).backgroundColor),mode==='dark'?'rgb(57, 47, 29)':'rgb(255, 248, 225)');
   }
   await p.locator('#tips').screenshot({path:`tests/year-tips-${width}.png`});
   await p.goto(root+'clinical-escalation.html');
   const count=await p.locator('.ce-case').count();
   for(let i=0;i<count;i++) {
    await p.locator('.ce-case').nth(i).click();await p.locator('.ce-idbtn').first().click();await p.locator('.ce-idfb button').click();
    while(await p.locator('.ce-opt[data-id]').count()) {
     for(const mode of ['light','dark']) {
      await setTheme(mode);
      const fills=await p.locator('#sc-play svg').evaluate(el=>({
       neutral:getComputedStyle(el.querySelector('rect[fill*="--obs-white"]')).fill,
       yellow:getComputedStyle(el.querySelector('rect[fill*="--obs-yellow"]')).fill,
       red:getComputedStyle(el.querySelector('rect[fill*="--obs-red"]')).fill,
       purple:getComputedStyle(el.querySelector('pattern rect')).fill,
       point:getComputedStyle(el.querySelector('circle')).fill
      }));
      assert.deepEqual(fills,mode==='dark'?{neutral:'rgb(27, 41, 36)',yellow:'rgb(57, 47, 29)',red:'rgb(64, 39, 37)',purple:'rgb(53, 45, 67)',point:'rgb(232, 238, 233)'}:{neutral:'rgb(255, 255, 255)',yellow:'rgb(255, 244, 184)',red:'rgb(251, 213, 207)',purple:'rgb(230, 219, 245)',point:'rgb(25, 60, 53)'});
     }
     assert.equal(await p.locator('.ce-obsline > span').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(27, 41, 36)');
     if(i===0) await p.locator('#sc-play .ce-chartwrap').screenshot({path:`tests/obs-chart-${width}.png`});
     await p.locator('.ce-opt[data-id]').first().click();await p.locator('.ce-fb button').click();
    }
    await p.getByRole('button',{name:'All scenarios',exact:true}).click();
   }
   await p.close();
  }
  console.log('PASS opened Year Tips and all scenario charts/observation pills in both themes, mobile and desktop');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
