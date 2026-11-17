import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1500);
const out = await page.evaluate(async () => {
  const call = async (method, args) => {
    const rpcId = 'x' + Math.random().toString(36).slice(2);
    const response = await fetch('/api/creativeStudio/' + method, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId, method: 'creativeStudio/' + method, payload: { args } }) });
    return (await response.json()).result;
  };
  const list = await call('listProjects', {});
  const rows = [];
  for (const head of list.value ?? []) {
    const full = await call('getProject', { id: head.id });
    rows.push({ id: head.id, name: head.name, revision: full.value?.projectRevision, attachments: (full.value?.attachments ?? []).map(a => a.name) });
  }
  return rows;
});
console.log(JSON.stringify(out));
await ctx.close();
