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
    const text = await response.text();
    try { return JSON.parse(text).result; } catch { return { parse: 'text', status: response.status, text: text.slice(0, 300) }; }
  };
  const list = await call('listProjects', {});
  const head = (list.value ?? [])[0];
  const full = await call('getProject', { id: head.id });
  const before = full.value.attachments?.length ?? 0;
  const base64 = btoa('# 测试文档\n- 一行内容\n');
  const upload = await call('uploadAttachment', { id: head.id, expectedProjectRevision: full.value.projectRevision, expectedContentRevision: full.value.contentRevision, input: { name: 'rpc-test.md', mime: 'text/markdown', base64 } });
  const after = await call('getProject', { id: head.id });
  return { before, upload, revision: full.value.projectRevision, afterCount: (after.value?.attachments ?? []).length, names: (after.value?.attachments ?? []).map(a => a.name) };
});
console.log(JSON.stringify(out).slice(0, 900));
await ctx.close();
