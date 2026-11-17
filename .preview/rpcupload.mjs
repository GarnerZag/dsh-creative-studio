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
    const text = await response.text();
    try { return JSON.parse(text).result; } catch { return { status: response.status, text: text.slice(0, 200) }; }
  };
  const list = await call('listProjects', {});
  const head = (list.value ?? [])[0];
  const full = await call('getProject', { id: head.id });
  const base64 = btoa('# probe');
  const upload = await call('uploadAttachment', {
    id: head.id,
    expectedProjectRevision: full.value.projectRevision,
    expectedContentRevision: full.value.contentRevision,
    input: { name: 'rpc-probe.md', mime: 'text/markdown', base64 },
  });
  const after = await call('getProject', { id: head.id });
  return {
    beforeRevision: full.value.projectRevision,
    beforeNames: (full.value.attachments ?? []).map(item => item.name),
    upload: JSON.parse(JSON.stringify(upload)).ok === true ? 'ok' : JSON.stringify(upload).slice(0, 200),
    uploadOk: upload.ok,
    afterNames: (after.value?.attachments ?? []).map(item => item.name),
    afterRevision: after.value?.projectRevision,
  };
});
console.log(JSON.stringify(out));
await ctx.close();
