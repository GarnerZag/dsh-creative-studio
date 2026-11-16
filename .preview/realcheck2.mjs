import {chromium} from 'playwright-core';
const b=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,viewport:{width:1440,height:1100}});
const p=b.pages()[0] ?? await b.newPage();
await p.goto('http://192.168.31.188:3080/',{waitUntil:'networkidle'});
await p.waitForTimeout(1200);
await p.getByText('Creative Studio',{exact:true}).first().click().catch(()=>{});
await p.waitForTimeout(1200);
await p.locator('.cs-rail-list button').first().click().catch(()=>{});
await p.waitForTimeout(1500);
const steps=await p.locator('.cs-steps button').allInnerTexts().catch(()=>[]);
// click 需求 step
await p.locator('.cs-steps button').nth(1).click().catch(()=>{});
await p.waitForTimeout(800);
const canvas=await p.locator('.cs-canvas-column svg').count().catch(()=>0);
const seg=await p.locator('.cs-segmented button').allInnerTexts().catch(()=>[]);
await p.screenshot({path:'shots/real-gui-stage-requirements.png',fullPage:false});
console.log(JSON.stringify({steps,canvas,seg}));
await b.close();
