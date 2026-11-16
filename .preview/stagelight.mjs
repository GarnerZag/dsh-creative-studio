import {chromium} from 'playwright-core';
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('http://127.0.0.1:8765/light-workspace.html',{waitUntil:'networkidle'});
await page.waitForTimeout(700);
await page.locator('.cs-steps button',{hasText:'需求'}).first().click();
await page.waitForTimeout(300);
console.log(await page.evaluate(()=>{const c=document.querySelector('.cs-canvas-column'),i=document.querySelector('.cs-inspector'),e=document.querySelector('.cs-editor'),g=document.querySelector('.cs-grid');return{editor:Math.round(e.getBoundingClientRect().width),canvas:Math.round(c.getBoundingClientRect().width),inspector:Math.round(i.getBoundingClientRect().width),grid:Array.from(getComputedStyle(g).gridTemplateColumns.split(' ')).join('|'),stagebody:Math.round(document.querySelector('.cs-stage-body').getBoundingClientRect().width)};}));
await browser.close();
