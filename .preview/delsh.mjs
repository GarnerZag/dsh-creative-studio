import { chromium } from 'playwright-core';
const exe = '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const b = await chromium.launch({ executablePath: exe, headless: true });
for (const [theme, width] of [['light',1440],['dark',1440],['light',390]]) {
  const page = await b.newPage({ viewport:{ width, height:900 }, colorScheme: theme });
  await page.goto(`http://127.0.0.1:8765/${theme}-workspace.html`, { waitUntil:'networkidle' });
  await page.waitForSelector('.cs-article-head', { timeout: 5000 }).catch(()=>{});
  const info = await page.evaluate(()=>{
    const head = document.querySelector('.cs-article-head');
    const btn = head && head.querySelector('button.cs-danger');
    const r = btn && btn.getBoundingClientRect();
    const s = btn && getComputedStyle(btn);
    return { text: btn && btn.textContent, w: r && Math.round(r.width), h: r && Math.round(r.height), color: s && s.color, border: s && s.borderTopColor };
  });
  console.log(theme, width, JSON.stringify(info));
  if (width === 1440) await page.locator('.cs-article-head').screenshot({ path: `shots/delete-${theme}.png` });
  await page.close();
}
await b.close();
