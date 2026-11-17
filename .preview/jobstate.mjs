import { chromium } from 'playwright';
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', { headless: true, executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const page = await ctx.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1200);
const out = await page.evaluate(async () => {
  const call = async (name, args) => {
    const rpcId = 'x' + Math.random().toString(36).slice(2);
    const r = await fetch('/api/creativeStudio/' + name, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId, method: 'creativeStudio/' + name, payload: { args } }) });
    return (await r.json()).result;
  };
  const list = await call('listProjects', {});
  const head = (list.value ?? [])[0];
  const full = await call('getProject', { id: head.id });
  const job = full.value?.proposalJob;
  return { revision: full.value.projectRevision, attachments: (full.value.attachments ?? []).map(a => a.name), job: job ? { status: job.status, confirmedAt: job.briefConfirmedAt, intent: job.brief?.intent, questions: job.brief?.questions?.length ?? 0 } : null };
});
console.log(JSON.stringify(out));
await ctx.close();
