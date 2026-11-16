// Preview-only: locate the exact elements behind audit findings.
import { chromium } from 'playwright';

const base = process.env.PREVIEW_BASE ?? 'http://127.0.0.1:8765';
const page = process.argv[2] ?? 'dark-workspace.html';
const browser = await chromium.launch({ headless: true });
const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${base}/${page}`, { waitUntil: 'networkidle' });
await p.waitForTimeout(900);

const result = await p.evaluate(() => {
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const parts = m[1].split(',').map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const path = (el) => {
    const bits = [];
    for (let e = el; e && e !== document.body && bits.length < 4; e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.className && typeof e.className === 'string') s += '.' + e.className.trim().split(/\s+/).join('.');
      bits.unshift(s);
    }
    return bits.join(' > ');
  };
  const offenders = [];
  for (const el of document.querySelectorAll('*')) {
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim()).join(' ');
    if (!own) continue;
    const cs = getComputedStyle(el);
    const fg = parse(cs.color); if (!fg || fg.a === 0) continue;
    let bg = null, node = el;
    while (node && !bg) {
      const c = parse(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0.9) bg = c; else node = node.parentElement;
    }
    if (!bg) continue;
    const r = ratio(fg, bg);
    if (r < 4.6) offenders.push({ selector: path(el), text: own.slice(0, 42), color: cs.color, background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`, contrast: Math.round(r * 100) / 100, fontSize: cs.fontSize });
  }
  const small = [...document.querySelectorAll('button, input, select, textarea, summary, a[href], [role=button], [role=separator]')]
    .map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName.toLowerCase(), cls: typeof el.className === 'string' ? el.className : '', w: Math.round(r.width), h: Math.round(r.height), label: (el.textContent ?? el.getAttribute('aria-label') ?? '').trim().slice(0, 24) }; })
    .filter(x => x.h > 0 && (x.h < 24 || x.w < 24));
  return { offenders: offenders.sort((a, b) => a.contrast - b.contrast).slice(0, 14), small: small.slice(0, 14) };
});
await browser.close();
console.log(JSON.stringify(result, null, 2));
