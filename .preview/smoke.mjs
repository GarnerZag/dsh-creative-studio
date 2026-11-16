import {chromium} from 'playwright-core';
const ctx=await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile',{headless:true,locale:'zh-CN',viewport:{width:1440,height:1100}});
const page=ctx.pages()[0]??await ctx.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://192.168.31.188:3080/',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1800);
await page.getByRole('button',{name:'创意工坊'}).first().click();
await page.waitForTimeout(900);
await page.getByRole('button',{name:/考研市场中台/}).first().click();
await page.waitForTimeout(1500);
const out={};
const steps=await page.locator('.cs-steps button').allInnerTexts();
out.steps=steps.map(s=>s.replace('\n','.'));
// requirements stage: canvas/outline toggle + tree
await page.locator('.cs-steps button').nth(1).click();await page.waitForTimeout(800);
out.req={treeNodes:await page.locator('.cs-tree div').count(),canvasBtn:await page.getByRole('button',{name:/画布|Canvas/}).count(),outlineBtn:await page.getByRole('button',{name:/大纲|Outline/}).count(),inspector:await page.locator('.cs-inspector, [aria-label*="检查器"], [aria-label*="Inspector"]').count()};
await page.getByRole('button',{name:/大纲|Outline/}).first().click().catch(()=>{});
await page.waitForTimeout(500);
out.req.outlineVisible=await page.locator('.cs-outline, ol.cs-outline').count();
await page.screenshot({path:'.preview/review/smoke-req.png'});
// references panel: table columns
out.references=await page.locator('.cs-table thead th').allInnerTexts().catch(()=>[]);
// architecture stage
await page.locator('.cs-steps button').nth(2).click();await page.waitForTimeout(700);
out.arch={modules:await page.locator('.cs-block').count(),inputs:await page.locator('.cs-stage-body input, .cs-stage-body textarea, .cs-stage-body select').count()};
await page.screenshot({path:'.preview/review/smoke-arch.png'});
// approval stage: select options + freeze button state
await page.locator('.cs-steps button').nth(3).click();await page.waitForTimeout(700);
out.approval={selects:await page.locator('.cs-stage-body select').count(),freezeDisabled:await page.getByRole('button',{name:/批准并冻结|Approve and freeze/}).first().isDisabled().catch(()=>null),details:await page.locator('.cs-stage-body details summary').allInnerTexts().catch(()=>[])};
// handoff stage
await page.locator('.cs-steps button').nth(4).click();await page.waitForTimeout(700);
out.handoff={selects:await page.locator('.cs-stage-body select').count(),buttons:await page.locator('.cs-stage-body button').allInnerTexts().catch(()=>[]).then(a=>a.slice(0,8))};
await page.screenshot({path:'.preview/review/smoke-handoff.png'});
out.errs=errs;
console.log(JSON.stringify(out,null,1).slice(0,1800));
await ctx.close();
