import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
let mode='dismiss';const dialogs=[];
page.on('dialog',async d=>{dialogs.push((mode==='accept'?'ACCEPT:':'DISMISS:')+d.message());if(mode==='accept')await d.accept();else await d.dismiss();});
const cdp=await ctx.newCDPSession(page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1400);
await page.getByRole('button',{name:'创意工坊'}).first().click();await page.waitForTimeout(700);
await page.getByRole('button',{name:/考研市场中台/}).first().click();await page.waitForTimeout(1300);
const current=()=>page.locator('.cs-steps button[aria-current=step]').innerText().catch(()=>'?');
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(1000);
// clean switch: no edits
await page.locator('.cs-steps button').nth(2).click();await page.waitForTimeout(900);
const clean={stage:await current(),dialogs:dialogs.length};
// back to requirements, select a card, type
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(900);
await page.getByRole('button',{name:'会话接入与定位',exact:true}).first().click();await page.waitForTimeout(600);
await page.locator('.cs-inspector textarea').first().fill('临时改动，验证离开提醒');
await page.waitForTimeout(300);
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(900);
const blocked={stage:await current(),dialogs:[...dialogs]};
mode='accept';
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(900);
const accepted={stage:await current(),dialogs:[...dialogs]};
console.log(JSON.stringify({clean,blocked,accepted,errs}));
await ctx.close();
