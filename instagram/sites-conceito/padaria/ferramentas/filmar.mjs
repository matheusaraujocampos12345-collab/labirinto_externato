// Filma a rolagem de cinema quadro a quadro e monta o mp4.
// Uso: node ferramentas/filmar.mjs [--workers 4] [--quadros 0,90,300] [--sem-video]
// Saída: captura/rolagem-bruta.mp4 (1080x1920, 30 fps, 20 s, sem áudio, sem texto por cima)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { RAIZ, servidor, navegador, abrir } from './comum.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return a; }, []));
const FPS = 30, DURACAO = 20, TOTAL = Math.round(FPS * DURACAO);
const T0 = 3.0;                       // o letreiro já acendeu
const PASTA = process.env.QUADROS || path.join(os.tmpdir(), 'padaria-quadros');
const SAIDA = path.join(RAIZ, 'captura', 'rolagem-bruta.mp4');

// Roteiro: [segundo do vídeo, marco da página, deslocamento em px]
const ROTEIRO = [
  [0.0, 'topo', 0],
  [1.1, 'topo', 0],              // letreiro aceso, forno escuro
  [4.9, 'hero', 'heroCurso'],    // a mão puxa a assadeira e o pão sai do forno, sempre inteiro
  [5.4, 'hero', 'heroCurso+14'], // placa PÃO QUENTE acesa, plaquinha de preço
  [7.0, 'senha', -290],          // título e painel da próxima fornada
  [7.6, 'senha', -272],          // dois-pontos piscando, faltam 12 min
  [9.2, 'cardapio', 40],         // cardápio: título e abas
  [12.1, 'c-doces', -160],       // passa por pães e salgados; a aba acompanha
  [12.6, 'c-doces', -140],       // o "acabou" no sonho
  [14.2, 'c-bebidas', 220],
  [16.4, 'mapa', -140],          // endereço e o caminho até a porta
  [20.0, 'mapa', -112],
];

// Interpolação cúbica monotônica (Fritsch-Carlson): sem tranco e sem passar do ponto.
function spline(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else { const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]), w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1]);
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
  }
  return (x) => {
    let i = xs.findIndex((v, k) => k < n - 1 && x >= v && x <= xs[k + 1]);
    if (i < 0) i = x < xs[0] ? 0 : n - 2;
    const h = xs[i + 1] - xs[i], t = Math.min(1, Math.max(0, (x - xs[i]) / h));
    const t2 = t * t, t3 = t2 * t;
    const y = (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
    const dy = ((6 * t2 - 6 * t) * ys[i] + (3 * t2 - 4 * t + 1) * h * m[i] + (-6 * t2 + 6 * t) * ys[i + 1] + (3 * t2 - 2 * t) * h * m[i + 1]) / h;
    return [y, dy];
  };
}

const srv = await servidor();
const b0 = await navegador();
const p0 = await abrir(b0, srv.url);
const marcos = { topo: 0, ...(await p0.evaluate(() => window.__marcos())) };
const maxY = await p0.evaluate(() => document.documentElement.scrollHeight - innerHeight);
await b0.close();
const xs = ROTEIRO.map((r) => r[0]);
const ys = ROTEIRO.map((r) => Math.min(maxY, Math.round(typeof r[2] === 'string' ? marcos[r[1]] + r[2].split('+').reduce((a, k) => a + (isNaN(+k) ? marcos[k] : +k), 0) : marcos[r[1]] + r[2])));
const curva = spline(xs, ys);
console.log('marcos (px):', ROTEIRO.map((r, i) => `${r[0]}s→${ys[i]}`).join('  '));

let quadros = args.quadros ? String(args.quadros).split(',').map(Number) : Array.from({ length: TOTAL }, (_, i) => i);
fs.mkdirSync(PASTA, { recursive: true });
const WORKERS = Math.max(1, Math.min(Number(args.workers || 4), quadros.length));
const t0 = Date.now();
let feitos = 0;
async function trabalhador(w) {
  const browser = await navegador();
  const page = await abrir(browser, srv.url);
  const meus = quadros.filter((_, i) => i % WORKERS === w);
  for (const f of meus) {
    const s = f / FPS;
    const [y, vel] = curva(s);
    await page.evaluate(([t, y, v]) => window.__quadro(t, y, v), [T0 + s, y, vel * 0.6]);
    await page.screenshot({ path: path.join(PASTA, `f_${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 96 });
    if (++feitos % 30 === 0 || feitos === quadros.length) {
      const el = (Date.now() - t0) / 1000;
      console.log(`${feitos}/${quadros.length} quadros · ${el.toFixed(0)} s · faltam ~${((el / feitos) * (quadros.length - feitos)).toFixed(0)} s`);
    }
  }
  await browser.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, w) => trabalhador(w)));
srv.fechar();

if (!args['sem-video'] && !args.quadros) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(PASTA, 'f_%04d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-an', '-movflags', '+faststart', SAIDA], { stdio: 'inherit' });
  console.log('vídeo:', SAIDA);
}
console.log(`quadros em ${PASTA}`);
