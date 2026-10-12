const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765/';
// Composite translucent colours against their actual ancestor surfaces.
function contrastAudit() {
  const rgb = s => s.match(/[\d.]+/g)?.map(Number);
  const blend = (a, b) => a.slice(0,3).map((v,i) => v*(a[3] ?? 1)+b[i]*(1-(a[3] ?? 1)));
  const lum = c => c.map(v => { v/=255; return v<=.04045?v/12.92:((v+.055)/1.055)**2.4; }).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const seen = new Set(), issues = [];
  for(const el of document.querySelectorAll('body *')) {
    if (!el.checkVisibility({checkVisibilityCSS:true,checkOpacity:true}) || ![...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim()) || el.closest('svg, video, [aria-hidden="true"]')) continue;
    const style = getComputedStyle(el);
    const chain = []; let opaque = false;
    for(let n=el;n;n=n.parentElement) {
      const s=getComputedStyle(n);
      if(s.backgroundImage!=='none') break;
      const c=rgb(s.backgroundColor); if(c) chain.push(c);
      if(c && (c[3]??1)===1){opaque=true;break;}
    }
    if(!opaque) continue;
    let bg=chain.pop().slice(0,3); while(chain.length) bg=blend(chain.pop(),bg);
    const fg=blend(rgb(style.color),bg);
    const ratio=(Math.max(lum(fg),lum(bg))+.05)/(Math.min(lum(fg),lum(bg))+.05);
    const large = parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && parseInt(style.fontWeight)>=700);
    if(ratio + .01 >= (large?3:4.5)) continue;
    const selector=el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'?'.'+el.className.trim().replace(/\s+/g,'.'):'');
    const key=selector+style.color+bg.join(','); if(seen.has(key)) continue;seen.add(key);
    issues.push({selector,ratio:+ratio.toFixed(2),fg:style.color,bg:bg.map(Math.round).join(','),text:el.textContent.trim().slice(0,65)});
  }
  return issues;
}
module.exports = { contrastAudit };
if(require.main===module) (async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const report=[]; const errors=[];
  try {
    const page=await browser.newPage({reducedMotion:'reduce',serviceWorkers:'block'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/google-analytics|googletagmanager|fonts.googleapis|fonts.gstatic/,r=>r.abort());
    const files=fs.readdirSync('.').filter(f=>f.endsWith('.html')&&!f.startsWith('google'));
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:900});
      for(const file of files) {
        await page.goto(root+file,{waitUntil:'domcontentloaded'});
        // The shared control itself drives every transition, including dark -> light.
        for(const [step,mode] of ['light','dark','light'].entries()) {
          if(width===390) await page.locator('.elegant-toggle').click();
          await page.locator('[data-theme-picker]').selectOption(mode);
          if(width===390) await page.locator('.elegant-toggle').click();
          assert.equal(await page.getAttribute('html','data-theme'),mode,file);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,file+' overflow');
          const issues=await page.evaluate(contrastAudit);
          if(issues.length) report.push({file,width,mode,issues});
          if(step<2 && process.env.THEME_SCREENSHOTS) {
            await page.screenshot({path:`tests/audit-${width}-${mode}-${file}.png`});
          }
        }
        // Inspect dormant reference sections as well as the initial landing screen.
        if(width===1440) {
          await page.evaluate(()=>{
            document.querySelectorAll('details').forEach(el=>el.open=true);
            document.querySelectorAll('main *, .screen, .section').forEach(el=>{
              if(!/^(SCRIPT|STYLE|OPTION|INPUT|SVG|PATH)$/.test(el.tagName) && getComputedStyle(el).display==='none') {
                el.hidden=false;el.style.setProperty('display','block','important');
              }
            });
          });
          for(const mode of ['light','dark']) {
            await page.locator('[data-theme-picker]').selectOption(mode);
            const issues=await page.evaluate(contrastAudit);
            if(issues.length) report.push({file,width,mode,state:'dormant sections',issues});
          }
        }
        console.log('Checked',width,file);
      }
    }
    fs.writeFileSync('tests/theme-audit-report.json',JSON.stringify({report,errors},null,2));
    console.log(`${report.length} states with contrast findings; ${errors.length} browser errors`);
    assert.deepEqual(errors,[]);
    assert.equal(report.length,0,'See tests/theme-audit-report.json');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.message);process.exit(1);});
