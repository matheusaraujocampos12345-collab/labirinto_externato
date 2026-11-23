// Renderiza os quadros do anúncio com Chromium headless (Playwright).
// Uso:
//   node scripts/render.mjs --out out/frames                 (todos os 900 quadros)
//   node scripts/render.mjs --out out/preview --frames 0,90,400
//   node scripts/render.mjs --out out/frames --from 480 --to 750 --workers 4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, []),
);
const OUT = path.resolve(ROOT, args.out || 'out/frames');
const TOTAL = 900;
let frames;
if (args.frames) frames = String(args.frames).split(',').map(Number);
else {
  const from = Number(args.from ?? 0), to = Number(args.to ?? TOTAL - 1);
  frames = [];
  for (let f = from; f <= to; f++) frames.push(f);
}
const WORKERS = Math.max(1, Math.min(Number(args.workers || Math.max(1, os.cpus().length - 0)), frames.length));
fs.mkdirSync(OUT, { recursive: true });
if (args.skipExisting) frames = frames.filter((f) => !fs.existsSync(path.join(OUT, `f_${String(f).padStart(4, '0')}.png`)));

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/index.html`;

const t0 = Date.now();
let done = 0;
async function worker(w) {
  const browser = await playwright.chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[w${w}] ${m.text()}`);
  });
  page.on('pageerror', (e) => console.error(`[w${w}] pageerror: ${e.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.ready !== undefined);
  await page.evaluate(() => window.ready);
  const mine = frames.filter((_, i) => i % WORKERS === w);
  for (const f of mine) {
    const data = await page.evaluate((f) => {
      window.renderFrame(f);
      return document.getElementById('c').toDataURL('image/png');
    }, f);
    fs.writeFileSync(path.join(OUT, `f_${String(f).padStart(4, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
    done++;
    if (done % 25 === 0 || done === frames.length) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${done}/${frames.length} quadros — ${el.toFixed(0)} s (≈${((el / done) * (frames.length - done)).toFixed(0)} s restantes)`);
    }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, w) => worker(w)));
server.close();
console.log(`Pronto: ${frames.length} quadros em ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}`);
