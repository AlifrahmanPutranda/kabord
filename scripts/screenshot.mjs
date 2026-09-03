// Screenshot helper for visual QA — logs in, then captures pages.
// Usage: node scripts/screenshot.mjs <path> <out.png> [light] [fullPage]
import { chromium } from 'playwright-core';

const [,, pagePath, outPath, theme, fullPageArg] = process.argv;
if (!pagePath || !outPath) { console.error('Usage: node scripts/screenshot.mjs <path> <out.png> [light] [fullPage]'); process.exit(1); }

const BASE = process.env.KABORD_URL || 'http://localhost:3002';
const creds = { username: process.env.KABORD_USER, password: process.env.KABORD_PASS };
if (!creds.username || !creds.password) { console.error('Set KABORD_USER and KABORD_PASS env vars'); process.exit(1); }

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-gpu'] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await context.newPage();

const res = await page.request.post(`${BASE}/api/auth/login`, { data: creds });
if (!res.ok()) { console.error('Login failed:', res.status(), await res.text()); process.exit(1); }

if (theme === 'light') {
  await page.goto(BASE + pagePath, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { try { localStorage.setItem('kabord-theme', 'light'); } catch {} });
}

await page.goto(BASE + pagePath, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: outPath, fullPage: fullPageArg === 'fullPage' });
console.log('saved', outPath);
await browser.close();
