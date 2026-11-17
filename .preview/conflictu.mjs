import { chromium } from 'playwright';

const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', error => errs.push(String(error).slice(0, 160)));
page.on('dialog', dialog => dialog.accept());
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1400);
const cards = await page.locator('.cs-project-card').allTextContents();
const index = cards.findIndex(text => text.includes('考研市场中台开发'));
await page.locator('.cs-project-card').nth(index).click();
await page.waitForTimeout(1600);
await page.locator('.cs-steps button').first().click();
await page.waitForTimeout(800);

const bump = async (action) => page.evaluate(async method => {
  const call = async (name, args) => {
    const rpcId = 'x' + Math.random().toString(36).slice(2);
    const response = await fetch('/api/creativeStudio/' + name, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId, method: 'creativeStudio/' + name, payload: { args } }) });
    return (await response.json()).result;
  };
  const list = await call('listProjects', {});
  const head = (list.value ?? [])[0];
  const full = await call('getProject', { id: head.id });
  if (method === 'upload') {
    const result = await call('uploadAttachment', { id: head.id, expectedProjectRevision: full.value.projectRevision, expectedContentRevision: full.value.contentRevision, input: { name: 'conflict-probe.md', mime: 'text/markdown', base64: btoa('# probe') } });
    return { ok: result.ok, revision: result.value?.projectRevision };
  }
  const target = (full.value.attachments ?? []).find(item => item.name === 'conflict-probe.md');
  if (!target) return { ok: true, gone: true };
  const result = await call('deleteAttachment', { id: head.id, expectedProjectRevision: full.value.projectRevision, attachmentId: target.id });
  return { ok: result.ok };
}, action);

const bumped = await bump('upload');
const confirmButton = page.getByRole('button', { name: /确认理解，开始推导|Confirm and draft requirements/ });
const buttonCount = await confirmButton.count();
let alert = null, reloadButton = 0;
if (buttonCount) {
  await confirmButton.first().click();
  await page.waitForTimeout(1800);
  alert = await page.locator('.cs-error').first().innerText().catch(() => null);
  reloadButton = await page.getByRole('button', { name: /重新载入项目|Reload project/ }).count();
}
const cleaned = await bump('delete');
console.log(JSON.stringify({ bumped, buttonCount, alert, reloadButton, cleaned, errs }));
await ctx.close();
