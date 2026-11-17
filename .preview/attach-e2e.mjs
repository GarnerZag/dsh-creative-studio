// End-to-end proof that attachment upload works through the real Host.
// Needs the Web service restarted after the attachment endpoints were added.
import { chromium } from 'playwright';

const errs = [];
const ctx = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  headless: true,
  executablePath: '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome',
  viewport: { width: 1440, height: 1000 },
  acceptDownloads: true,
});
const page = await ctx.newPage();
page.on('pageerror', error => errs.push(String(error).slice(0, 200)));
page.on('dialog', dialog => dialog.accept());
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Creative Studio' }).click({ timeout: 60000 });
await page.waitForTimeout(1400);

const cards = await page.locator('.cs-project-card').allTextContents();
const index = cards.findIndex(text => text.includes('考研市场中台开发'));
const projectName = index >= 0 ? '考研市场中台开发' : cards[0]?.split('\n')[0];
await page.locator('.cs-project-card').nth(index >= 0 ? index : 0).click();
await page.waitForTimeout(1800);
await page.locator('.cs-steps button').first().click();
await page.waitForTimeout(700);

const panel = page.locator('.cs-attachments');
const present = await panel.count();
const before = await page.locator('.cs-attachment-list li').count();

const markdown = Buffer.from('# 需求草稿\n\n希望支持批量导出与分组筛选。\n', 'utf8');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const big = Buffer.alloc(2 * 1024 * 1024, 7);

await page.locator('.cs-attachments input[type=file]').setInputFiles([
  { name: '需求草稿.md', mimeType: 'text/markdown', buffer: markdown },
  { name: '首页截图.png', mimeType: 'image/png', buffer: png },
]);
await page.waitForTimeout(4000);
const afterTwo = await page.locator('.cs-attachment-list li').count();
const errorAfterTwo = await page.locator('.cs-attachments [role=alert]').first().innerText().catch(() => null);
const thumbs = await page.locator('.cs-attachment-list img').count();

// A near-limit upload proves the request body survives the transport.
await page.locator('.cs-attachments input[type=file]').setInputFiles({ name: '大文档.md', mimeType: 'text/markdown', buffer: big });
await page.waitForTimeout(6000);
const afterBig = await page.locator('.cs-attachment-list li').count();
const errorAfterBig = await page.locator('.cs-attachments [role=alert]').first().innerText().catch(() => null);

const snapshot = await page.evaluate(async name => {
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
  const items = (list.value ?? []);
  const head = items.find(item => item.name === name) ?? items[0];
  if (!head) return null;
  const full = await call('getProject', { id: head.id });
  const attachments = (full.value?.attachments ?? []).map(item => ({ name: item.name, kind: item.kind, size: item.size }));
  return { id: head.id, attachments };
}, projectName);

// Remove the markdown item again so the project is left as found.
const rows = await page.locator('.cs-attachment-list li').all();
for (const row of rows) {
  if (!(await row.innerText()).includes('需求草稿.md')) continue;
  await row.locator('button').last().click();
  await page.waitForTimeout(1800);
  break;
}
const afterRemove = await page.locator('.cs-attachment-list li').count();

await page.screenshot({ path: 'review/attach-e2e.png' });
console.log(JSON.stringify({ present, before, afterTwo, afterBig, afterRemove, thumbs, errorAfterTwo, errorAfterBig, snapshot, errs }));
await ctx.close();
