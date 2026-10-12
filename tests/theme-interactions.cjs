const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { contrastAudit } = require('./theme-audit.cjs');
const root = process.env.TEST_BASE_URL || 'http://127.0.0.1:8765/';
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  const report=[],errors=[];
  try {
    for(const width of [390,1440]) {
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
      page.on('pageerror',e=>errors.push(e.message));
      await page.route(/google-analytics|googletagmanager|fonts.googleapis|fonts.gstatic/,r=>r.abort());
      async function audit(state) {
        for(const mode of ['light','dark']) {
          // Dispatch the same change event as selecting Appearance, without scrolling away from the state under review.
          await page.locator('[data-theme-picker]').evaluate((el,mode)=>{el.value=mode;el.dispatchEvent(new Event('change',{bubbles:true}));},mode);
          await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
          const issues=await page.evaluate(contrastAudit);
          if(issues.length) report.push({file:new URL(page.url()).pathname,width,mode,state,issues});
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,state+' overflow');
        }
      }
      for(const file of ['clinical-quiz.html','meds-quiz.html']) {
        await page.goto(root+file,{waitUntil:'domcontentloaded'});
        await page.locator('.start-btn').click();
        let n=0;
        while(await page.locator('#quiz.active').count()) {
          assert(++n<=30,'Quiz did not finish');
          await audit('question '+n);
          if(await page.locator('.option').count()) await page.locator('.option').first().click();
          else if(await page.locator('.tf-btn').count()) await page.locator('.tf-btn').first().click();
          else {
            if(await page.locator('#fillInput').count()) await page.locator('#fillInput').fill('test');
            await page.locator('#checkBtn').click();
          }
          await audit('answer '+n);
          await page.locator('#nextBtn').click();
        }
        await audit('results');
      }
      await page.goto(root+'learning-lab.html',{waitUntil:'domcontentloaded'});
      await page.locator('#reveal').click(); await audit('flashcard revealed');
      await page.locator('#mode').selectOption('quiz');
      await page.locator('.choice').first().click(); await audit('learning feedback');
      await page.locator('#reset').click(); await audit('reset confirmation');
      await page.goto(root+'clinical-skills-logbook.html',{waitUntil:'domcontentloaded'});
      await page.selectOption('#skill','as-vitals');await page.selectOption('#level','obs');
      await page.locator('button[type=submit]').click(); await audit('saved record');
      await page.locator('.record button').first().click(); await audit('editing record');
      await page.goto(root+'tools.html',{waitUntil:'domcontentloaded'});
      const tabs=page.locator('.calc-tab');
      for(let i=0;i<await tabs.count();i++) {
        await tabs.nth(i).click();
        await page.locator('.calc-btn:visible').click(); await audit('calculator error '+i);
        const inputs=page.locator('.calc-panel:visible input[type=number]');
        for(let j=0;j<await inputs.count();j++) await inputs.nth(j).fill('10');
        await page.locator('.calc-btn:visible').click(); await audit('calculator result '+i);
      }
      await page.goto(root+'wardwise.html',{waitUntil:'domcontentloaded'});
      for(const tab of ['diagnosisTab','termsTab','priorityTab']) {
        await page.locator('#restartButton').click();
        for(let i=0;i<4;i++) {
          await page.locator('#'+tab).click();
          await page.locator('#hintButton').click(); await audit(tab+' hint '+i);
          await page.locator('.choice').first().click(); await audit(tab+' feedback '+i);
          await page.locator('#nextButton').click();
        }
        await audit(tab+' final');
      }
      await page.goto(root+'cognitive.html',{waitUntil:'domcontentloaded'});
      await page.locator('.check-item').first().click(); await audit('checked checklist');
      await page.close(); console.log('Interactive light/dark states checked at',width);
    }
    fs.writeFileSync('tests/theme-interactions-report.json',JSON.stringify({report,errors},null,2));
    assert.deepEqual(errors,[]);
    assert.equal(report.length,0,'See tests/theme-interactions-report.json');
    console.log('PASS interactive theme contrast');
  } finally {await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1);});
