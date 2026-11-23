// Peças comuns da captura: servidor local, navegador e página no modo ?captura=1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/opt/node-tools/node_modules/playwright'); }

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

export async function servidor() {
  const srv = http.createServer((req, res) => {
    const p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
    const alvo = p.endsWith('/') ? path.join(p, 'index.html') : p;
    if (!alvo.startsWith(RAIZ) || !fs.existsSync(alvo) || fs.statSync(alvo).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(alvo)] || 'application/octet-stream' });
    fs.createReadStream(alvo).pipe(res);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${srv.address().port}/`, fechar: () => srv.close() };
}

export async function navegador() {
  return playwright.chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none', '--hide-scrollbars'],
  });
}

// Abre a página no modo de captura. largura x altura em px CSS, escala 2.5 => 1080 x 1920.
export async function abrir(browser, url, { largura = 432, altura = 768, escala = 2.5, extra = '' } = {}) {
  const page = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala });
  page.on('pageerror', (e) => console.error('pageerror:', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.goto(`${url}index.html?captura=1${extra}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__pronto === true || !document.querySelector('script[data-motor]'), null, { timeout: 30000 }).catch(() => {});
  return page;
}

// Posiciona a página no instante t (segundos) e na rolagem y (px CSS).
export async function quadro(page, t, y) {
  await page.evaluate(([t, y]) => {
    if (window.__quadro) return window.__quadro(t, y);
    window.scrollTo(0, y);
  }, [t, y]);
}
