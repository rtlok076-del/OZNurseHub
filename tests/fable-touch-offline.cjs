const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await c.newPage();
 await p.goto('http://127.0.0.1:8765/fables.html');await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload();
 const tip=p.getByRole('button',{name:'Got it',exact:true});if(await tip.isVisible())await tip.click();
 await p.locator('.book-track').scrollIntoViewIfNeeded();const box=await p.locator('.book-track').boundingBox();const cdp=await c.newCDPSession(p);const y=Math.max(120,box.y+140);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y}]});
 for(let x=300;x>=60;x-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await new Promise(r=>setTimeout(r,20));}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await p.waitForFunction(()=>document.querySelector('.book-position').textContent==='2 / 2');
 await c.setOffline(true);
 await p.goto('http://127.0.0.1:8765/fables.html');assert.equal(await p.locator('.book-card').count(),2);
 for(const slug of ['mira-marsh-map','mara-two-lanterns']){await p.goto('http://127.0.0.1:8765/fable-'+slug+'.html');assert((await p.locator('.fable-text').innerText()).length>500);assert(await p.evaluate(async()=>{const r=await fetch(document.querySelector('video').poster);return r.ok}));}
 console.log('PASS simulated phone swipe and offline library, both stories and posters.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
