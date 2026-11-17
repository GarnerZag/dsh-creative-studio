import { chromium } from 'playwright';

const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome', viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1500);
const out = await page.evaluate(async () => {
  const call = async (method, args) => {
    const rpcId = 'x' + Math.random().toString(36).slice(2);
    const response = await fetch('/api/creativeStudio/' + method, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'client-request', rpcId, method: 'creativeStudio/' + method, payload: { args } }),
    });
    return (await response.json()).result;
  };
  const list = await call('listProjects', {});
  const head = (list.value ?? [])[0];
  const drop = ['rpc-probe.md', '首页截图.png', '大文档.md'];
  const removed = [];
  for (const name of drop) {
    const full = await call('getProject', { id: head.id });
    const target = (full.value.attachments ?? []).find(item => item.name === name);
    if (!target) { removed.push([name, 'absent']); continue; }
    const result = await call('deleteAttachment', { id: head.id, expectedProjectRevision: full.value.projectRevision, attachmentId: target.id });
    removed.push([name, result.ok === true]);
  }
  const final = await call('getProject', { id: head.id });
  return { removed, remaining: (final.value?.attachments ?? []).map(item => item.name) };
});
console.log(JSON.stringify(out));
await ctx.close();
