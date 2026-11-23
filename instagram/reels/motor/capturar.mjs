// Grava um site de verdade quadro a quadro, de forma determinística, para usar num Reels.
// O relógio da página é falso (page.clock): cada quadro avança exatamente 1000/30 ms,
// a rolagem é posta com window.scrollTo e as animações CSS são sincronizadas com esse relógio.
//
// Uso (a partir da raiz do repositório):
//   node instagram/reels/motor/capturar.mjs instagram/reels/cenas/i01-captura.mjs
//
// O arquivo de configuração exporta (export default):
//   pasta       pasta do site, relativa à raiz do repositório (ex.: 'site-mach')
//   pagina      arquivo de entrada (padrão 'index.html')
//   largura, altura, escala   viewport em px CSS e deviceScaleFactor (432 × 768 × 2,5 = 1080 × 1920)
//   fps, duracao
//   saida       pasta dos PNG (ex.: 'instagram/reels/.quadros/i01-site')
//   bloquear    padrões de URL para bloquear (ex.: ['**/lenis*'])
//   rolagem(t)  posição da rolagem (px CSS) no tempo t
//   acao({ page, t, f })   opcional: o que fazer em cada quadro (digitar, marcar, etc.)
//   elementos   seletores cujo retângulo e visibilidade vão para meta.json, quadro a quadro
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(path.join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'));
}

const MOTOR = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(MOTOR, '../../..');

const arqConfig = process.argv[2];
if (!arqConfig) {
  console.error('Uso: node instagram/reels/motor/capturar.mjs <config.mjs> [--de N --ate M]');
  process.exit(1);
}
const cfg = (await import(pathToFileURL(path.resolve(arqConfig)).href)).default;
const argv = process.argv.slice(3);
const arg = (n) => {
  const i = argv.indexOf('--' + n);
  return i >= 0 ? argv[i + 1] : undefined;
};

const fps = cfg.fps ?? 30;
const total = Math.round(cfg.duracao * fps);
const ultimo = Number(arg('ate') ?? total - 1);
const saida = path.resolve(RAIZ, cfg.saida);
fs.mkdirSync(saida, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const servidor = http.createServer((req, res) => {
  let p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith(path.sep)) p = path.join(p, 'index.html');
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
// cfg.url grava um site publicado (só navegação e rolagem); senão, a pasta local cfg.pasta
const url = cfg.url || `http://127.0.0.1:${servidor.address().port}/${cfg.pasta}/${cfg.pagina ?? 'index.html'}`;

const browser = await playwright.chromium.launch({ args: ['--font-render-hinting=none', '--hide-scrollbars'] });
const contexto = await browser.newContext({
  viewport: { width: cfg.largura, height: cfg.altura },
  deviceScaleFactor: cfg.escala,
  isMobile: true,
  hasTouch: true,
  reducedMotion: 'no-preference',
  locale: 'pt-BR',
});
const page = await contexto.newPage();
page.on('pageerror', (e) => console.error('erro na página:', e.message));
// Math.random com semente: a mesma gravação sempre sai igual
await page.addInitScript((semente) => {
  let a = semente >>> 0;
  Math.random = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}, cfg.semente ?? 42);
await page.clock.install({ time: new Date('2026-12-01T15:00:00Z') });
for (const padrao of cfg.bloquear || []) await page.route(padrao, (r) => r.abort());
if (cfg.bloquearRegex) await page.route(cfg.bloquearRegex, (r) => r.abort());
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
// o relógio para: daqui em diante o tempo só anda quando o motor manda (runFor)
await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
if (cfg.css) await page.addStyleTag({ content: cfg.css });

// animações CSS seguem o relógio falso
const sincronizar = () =>
  page.evaluate(() => {
    const agora = performance.now();
    const m = (window.__inicioAnim ||= new WeakMap());
    for (const a of document.getAnimations()) {
      if (!m.has(a)) {
        m.set(a, agora);
        try {
          a.pause();
        } catch {}
      }
      try {
        a.currentTime = agora - m.get(a);
      } catch {}
    }
  });
const passo = 1000 / fps;
const rolar = (y) =>
  page.evaluate((y) => {
    window.scrollTo({ top: y, behavior: 'instant' });
    window.dispatchEvent(new Event('scroll'));
  }, y);

// aquecimento: a página roda um pouco antes do primeiro quadro
await rolar(cfg.rolagem(0));
// espera real para imagens e fontes da posição inicial chegarem pela rede (sites publicados)
if (cfg.esperaReal) {
  await page.waitForTimeout(cfg.esperaReal);
  await rolar(cfg.rolagem(0));
}
for (let k = 0; k < Math.round((cfg.aquecer ?? 1500) / passo); k++) {
  await page.clock.runFor(passo);
  await sincronizar();
}

const meta = [];
const t0 = Date.now();
for (let f = 0; f <= ultimo; f++) {
  const t = f / fps;
  await rolar(cfg.rolagem(t));
  if (cfg.acao) await cfg.acao({ page, t, f });
  await page.clock.runFor(passo);
  await sincronizar();
  const png = await page.screenshot({ type: 'png' });
  fs.writeFileSync(path.join(saida, `q_${String(f).padStart(5, '0')}.png`), png);
  const info = await page.evaluate((sels) => {
    const r = { y: window.scrollY };
    for (const s of sels) {
      const el = document.querySelector(s);
      if (!el) continue;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      r[s] = { x: b.x, y: b.y, w: b.width, h: b.height, opacidade: Number(cs.opacity), texto: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) };
    }
    return r;
  }, cfg.elementos || []);
  meta.push(info);
  if (f % 30 === 0) console.log(`quadro ${f}/${ultimo} · rolagem ${Math.round(info.y)} · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}
fs.writeFileSync(path.join(saida, 'meta.json'), JSON.stringify({ escala: cfg.escala, largura: cfg.largura, altura: cfg.altura, fps, quadros: meta }));
await browser.close();
servidor.close();
console.log(`Gravação pronta: ${meta.length} quadros em ${path.relative(RAIZ, saida)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
