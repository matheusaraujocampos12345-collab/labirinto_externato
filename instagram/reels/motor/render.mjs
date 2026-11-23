// Renderizador genérico dos Reels da MACH.
// Abre o módulo do Reels no Chromium (Playwright), desenha cada quadro num canvas
// 1080×1920, salva os PNG e chama o ffmpeg. Também gera a capa (JPEG 92) e a prévia leve.
//
// Uso (a partir da raiz do repositório):
//   node instagram/reels/motor/render.mjs instagram/reels/cenas/i04.js
//   node instagram/reels/motor/render.mjs instagram/reels/cenas/i04.js --quadros 0,90,300 --grade
//
// Opções:
//   --workers N      navegadores em paralelo (padrão 2)
//   --quadros a,b,c  só estes quadros, em PNG, para conferir (não gera vídeo)
//   --de N --ate M   faixa de quadros (gera vídeo só se for a faixa inteira)
//   --grade          desenha a zona segura e o recorte 4:5 por cima
//   --so-capa        só a capa
//   --sem-previa     não gera a prévia 720×1280
//   --manter         não apaga os PNG depois de montar o vídeo
//   --continuar      pula os quadros que já existem na pasta
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require(path.join(spawnSync('npm', ['root', '-g']).stdout.toString().trim(), 'playwright'));
}

const MOTOR = path.dirname(fileURLToPath(import.meta.url));
const REELS = path.resolve(MOTOR, '..');
const RAIZ = path.resolve(REELS, '../..');

// ── argumentos ──────────────────────────────────────────────
const argv = process.argv.slice(2);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').match(/^--(workers|quadros|de|ate|saida)$/));
const opt = {};
argv.forEach((a, i) => {
  if (!a.startsWith('--')) return;
  const prox = argv[i + 1];
  opt[a.slice(2)] = prox && !prox.startsWith('--') && /^(workers|quadros|de|ate|saida)$/.test(a.slice(2)) ? prox : true;
});
if (!pos[0]) {
  console.error('Uso: node instagram/reels/motor/render.mjs <modulo-do-reels.js> [opções]');
  process.exit(1);
}
const moduloAbs = path.resolve(pos[0]);
const moduloURL = '/' + path.relative(RAIZ, moduloAbs).split(path.sep).join('/');
const WORKERS = Math.max(1, Number(opt.workers || 2));
const SAIDA = path.resolve(opt.saida || REELS);

// ── servidor estático na raiz do repositório ────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.css': 'text/css',
};
const servidor = http.createServer((req, res) => {
  const p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${servidor.address().port}/instagram/reels/motor/pagina.html?reel=${encodeURIComponent(moduloURL)}${opt.grade ? '&grade' : ''}`;

async function abrir(w) {
  const browser = await playwright.chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console.error(`[w${w}] ${m.text()}`);
  });
  page.on('pageerror', (e) => console.error(`[w${w}] erro na página: ${e.message}`));
  await page.goto(url);
  await page.waitForFunction(() => window.motorPronto !== undefined);
  const info = await page.evaluate(() => window.motorPronto);
  return { browser, page, info };
}

// ── avisos de texto fora da zona segura ─────────────────────
const avisos = new Map();
function anotar(lista, f) {
  for (const a of lista || []) {
    const k = a.texto;
    const r = avisos.get(k) || { n: 0, de: f, ate: f, caixa: a.caixa };
    r.n++;
    r.de = Math.min(r.de, f);
    r.ate = Math.max(r.ate, f);
    avisos.set(k, r);
  }
}

const t0 = Date.now();
const primeiro = await abrir(0);
const { info } = primeiro;
const TOTAL = Math.round(info.duracao * info.fps);
const id = info.id || path.basename(moduloAbs, '.js');
const nome = info.nome || id;
console.log(`Reels ${nome}: ${info.duracao} s · ${TOTAL} quadros · ${WORKERS} worker(s)`);

// capa
if (!opt.quadros) {
  const capa = await primeiro.page.evaluate(() => window.motorCapa());
  anotar(capa.avisos, -1);
  const arq = path.join(SAIDA, `${id}-capa.jpg`);
  fs.writeFileSync(arq, Buffer.from(capa.jpg.split(',')[1], 'base64'));
  console.log(`Capa: ${path.relative(RAIZ, arq)}`);
}
if (opt['so-capa']) {
  await primeiro.browser.close();
  servidor.close();
  process.exit(0);
}

// quadros
let quadros;
let completo = false;
if (opt.quadros) quadros = String(opt.quadros).split(',').map(Number);
else {
  const de = Number(opt.de ?? 0), ate = Number(opt.ate ?? TOTAL - 1);
  completo = de === 0 && ate === TOTAL - 1;
  quadros = [];
  for (let f = de; f <= ate; f++) quadros.push(f);
}
const PASTA = opt.quadros ? path.join(REELS, '.quadros', `${id}-amostras`) : path.join(REELS, '.quadros', id);
fs.mkdirSync(PASTA, { recursive: true });
const nomeQuadro = (f) => path.join(PASTA, `q_${String(f).padStart(5, '0')}.png`);
if (opt.continuar) quadros = quadros.filter((f) => !fs.existsSync(nomeQuadro(f)));

let feitos = 0;
async function trabalhar(w, aberto) {
  const { browser, page } = aberto || (await abrir(w));
  const meus = quadros.filter((_, i) => i % WORKERS === w);
  for (const f of meus) {
    const r = await page.evaluate((f) => window.motorQuadro(f), f);
    anotar(r.avisos, f);
    fs.writeFileSync(nomeQuadro(f), Buffer.from(r.png.split(',')[1], 'base64'));
    feitos++;
    if (feitos % 30 === 0 || feitos === quadros.length) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${feitos}/${quadros.length} quadros · ${el.toFixed(0)} s (faltam ≈${((el / feitos) * (quadros.length - feitos)).toFixed(0)} s)`);
    }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: Math.min(WORKERS, quadros.length || 1) }, (_, w) => trabalhar(w, w === 0 ? primeiro : null)));
servidor.close();

if (avisos.size) {
  console.log('\nATENÇÃO: texto fora da zona segura (x 90–940, y 260–1440):');
  for (const [k, r] of avisos) console.log(`  "${k}" · quadros ${r.de}–${r.ate} (${r.n}×) · caixa ${r.caixa.join(', ')}`);
} else console.log('Zona segura: nenhum texto fora.');

if (opt.quadros) {
  console.log(`Amostras em ${path.relative(RAIZ, PASTA)}`);
  process.exit(0);
}
if (!completo) {
  console.log('Faixa parcial: vídeo não montado.');
  process.exit(0);
}

// ── vídeo final: H.264, yuv420p, CRF 18, faststart ──────────
const mp4 = path.join(SAIDA, `${nome}.mp4`);
const ff = (args) => {
  const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg falhou');
};
ff([
  '-framerate', String(info.fps), '-i', path.join(PASTA, 'q_%05d.png'),
  '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.2',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-x264-params', 'aq-mode=3', // protege os degradês escuros (menos faixas)
  '-r', String(info.fps), '-g', String(info.fps), '-threads', '2', '-an', '-movflags', '+faststart', mp4,
]);
console.log(`Vídeo: ${path.relative(RAIZ, mp4)} (${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB)`);

// ── prévia leve 720×1280 (até ~3 MB) ────────────────────────
if (!opt['sem-previa']) {
  fs.mkdirSync(path.join(SAIDA, 'previas'), { recursive: true });
  const previa = path.join(SAIDA, 'previas', `${id}.mp4`);
  const kbps = Math.min(1600, Math.floor((2.8 * 8 * 1000) / info.duracao));
  ff([
    '-i', mp4, '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-x264-params', 'aq-mode=3', '-maxrate', `${kbps}k`, '-bufsize', `${kbps * 2}k`,
    '-profile:v', 'high', '-threads', '2', '-an', '-movflags', '+faststart', previa,
  ]);
  console.log(`Prévia: ${path.relative(RAIZ, previa)} (${(fs.statSync(previa).size / 1e6).toFixed(1)} MB)`);
}

if (!opt.manter) fs.rmSync(PASTA, { recursive: true, force: true });
console.log(`Pronto em ${((Date.now() - t0) / 1000).toFixed(0)} s.`);
