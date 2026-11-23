// Grava o site da Padaria Quatro Horas quadro a quadro no modo de captura do próprio site
// (index.html?captura=1: cada quadro sai de window.__quadro(tempo, rolagem), sempre igual),
// com SUBQUADROS para o borrão de movimento: n fotos por quadro, espalhadas em meio intervalo
// (obturador de 180°). O motor depois faz a média (reel.subquadros = n).
// Saída: .quadros/<nome>/s_00000.jpg … (índice = quadro × n + k) e meta.json (posições por quadro).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const RAIZ = path.resolve(AQUI, '../../..');
const { servidor, navegador, abrir } = await import(path.join(RAIZ, 'instagram/sites-conceito/padaria/ferramentas/comum.mjs'));

const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : -(Math.cos(Math.PI * x) - 1) / 2);
/** rolagem que começa mais devagar (para vídeos que mudam muito no início) e termina parada */
export function curvaLentaNoInicio(t0, t1, y0, y1, k = 1.7) {
  return (t) => y0 + (y1 - y0) * Math.pow(suave((t - t0) / (t1 - t0)), k);
}

/** rolagem por chaves [[t, y], ...] com curva suave (começa e termina parada em cada chave) */
export function curva(lista) {
  return (t) => {
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) {
      const [t1, y1] = lista[i], [t0, y0] = lista[i - 1];
      if (t <= t1) return y0 + (y1 - y0) * suave((t - t0) / (t1 - t0));
    }
    return lista[lista.length - 1][1];
  };
}

/**
 * op.nome, op.duracao, op.fps (30), op.sub (4), op.obturador (0,5)
 * op.tomadas(m) → [[início, fim, rolagem(t), tempoDoSite(t)], ...]  (m = marcos do site)
 * op.toques → [[tempo, seletor], ...]  cliques reais (aplicados uma vez, na ordem)
 * op.elementos → { chave: seletor }  posições gravadas no meta.json, quadro a quadro
 */
export async function gravar(op) {
  const FPS = op.fps ?? 30, N = op.sub ?? 4, OBT = op.obturador ?? 0.5;
  const TOTAL = Math.round(op.duracao * FPS);
  const SAIDA = path.join(RAIZ, 'instagram/reels/.quadros', op.nome);
  const argv = process.argv.slice(2);
  const WORKERS = Math.max(1, Number(argv[argv.indexOf('--workers') + 1] || 2));
  fs.rmSync(SAIDA, { recursive: true, force: true });
  fs.mkdirSync(SAIDA, { recursive: true });
  const srv = await servidor();
  const meta = new Array(TOTAL);
  const t0 = Date.now();
  let feitos = 0;
  let extra = {};

  async function trabalhador(w) {
    const b = await navegador();
    const page = await abrir(b, srv.url);
    const m = await page.evaluate(() => window.__marcos());
    m.rodape = await page.evaluate(() => document.querySelector('.natal-rodape').getBoundingClientRect().top + scrollY);
    const TOM = op.tomadas(m);
    const ini = Math.floor((TOTAL * w) / WORKERS), fim = Math.floor((TOTAL * (w + 1)) / WORKERS);
    const toques = op.toques || [];
    const feitosT = new Set();
    for (let f = ini; f < fim; f++) {
      for (let k = 0; k < N; k++) {
        const t = f / FPS + (k * OBT) / (FPS * N);
        const tom = TOM.find(([a, b]) => t >= a && t < b) || TOM[TOM.length - 1];
        const y = tom[2](t), ts = tom[3](t);
        const v = (tom[2](t + 0.02) - tom[2](t - 0.02)) / 0.04;
        // cliques: os que já passaram são aplicados (inclusive quando o trabalhador começa depois deles)
        for (let i = 0; i < toques.length; i++) {
          if (toques[i][0] <= t && !feitosT.has(i) && !toques[i][2]?.soVisual) {
            feitosT.add(i);
            await page.evaluate((sel) => { const e = document.querySelector(sel); if (e) e.click(); }, toques[i][1]);
          }
        }
        await page.evaluate(([t, y, v]) => window.__quadro(t, y, v), [ts, y, v * 0.6]);
        await page.screenshot({ path: path.join(SAIDA, `s_${String(f * N + k).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
        if (k === 0) {
          meta[f] = await page.evaluate((els) => {
            const r = { y: scrollY };
            for (const [kk, s] of Object.entries(els)) {
              const e = document.querySelector(s);
              if (!e) continue;
              const bb = e.getBoundingClientRect();
              r[kk] = [bb.x, bb.y, bb.width, bb.height].map((n) => Math.round(n * 10) / 10);
            }
            return r;
          }, op.elementos || {});
        }
      }
      if (f === TOTAL - 1 && op.aoFim) extra = await op.aoFim(page);
      if (++feitos % 60 === 0) console.log(`${feitos}/${TOTAL} quadros (${feitos * N} fotos) · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await b.close();
  }
  await Promise.all(Array.from({ length: WORKERS }, (_, w) => trabalhador(w)));
  srv.fechar();
  fs.writeFileSync(path.join(SAIDA, 'meta.json'), JSON.stringify({ escala: 2.5, fps: FPS, sub: N, ...extra, quadros: meta }));
  console.log(`Gravação pronta: ${TOTAL} quadros × ${N} subquadros em ${path.relative(RAIZ, SAIDA)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  return { SAIDA, extra };
}
