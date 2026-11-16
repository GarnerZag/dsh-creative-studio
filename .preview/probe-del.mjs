import { chromium } from 'playwright-core';
const exe = '/dsh-home/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome';
const b = await chromium.launchPersistentContext('/dsh-home/.cache/creative-studio-browser-profile', {
  executablePath: exe, headless: true, viewport: { width: 1440, height: 900 },
});
const page = b.pages()[0] || await b.newPage();
await page.goto('http://192.168.31.188:3080/', { waitUntil: 'networkidle' });
const out = await page.evaluate(async () => {
  const rid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  const r = await fetch('/api/creativeStudio/deleteProject', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ type:'client-request', rpcId: rid(), method:'creativeStudio/deleteProject', payload:{ args:{ id:'__probe__', expectedProjectRevision:0 } } }) });
  const text = await r.text();
  return { status: r.status, text: text.slice(0, 300) };
});
console.log(JSON.stringify(out));
await b.close();
