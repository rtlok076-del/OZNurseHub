import { chromium } from 'playwright';
import readline from 'node:readline';
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1100}});
page.on('pageerror',e=>console.log('ERROR',e.message));
await page.goto('http://127.0.0.1:5186/nurse-rpg/');
console.log(await page.locator('body').innerText());
for await(const line of readline.createInterface({input:process.stdin})){
try{const cmd=JSON.parse(line);if(cmd.close){await browser.close();break;}if(cmd.click) await page.getByRole('button',{name:cmd.click,exact:true}).click(); if(cmd.dest) await page.locator('#destinations').getByRole('button',{name:cmd.dest,exact:true}).click();if(cmd.viewport) await page.setViewportSize(cmd.viewport);await page.waitForTimeout(cmd.wait||800);if(cmd.shot) await page.screenshot({path:'test-results/reviewer-'+cmd.shot+'.png',fullPage:true});console.log(await page.locator('body').innerText());}catch(e){console.log('ERROR',e.message)}
}
