// Peças compartilhadas pelas cenas dos Reels da MACH.
import { clamp, lerp, ease } from '../motor/tempo.js';
import { COR, medir, quebrar } from '../motor/marca.js';

/** "#rrggbb" → [r, g, b] */
export function rgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
/** Mistura duas cores hex (k = 0..1) → "rgb()" */
export function misturar(a, b, k) {
  const A = rgb(a), B = rgb(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`;
}

/**
 * Monta um parágrafo palavra por palavra (posição de cada palavra),
 * para efeitos que tratam cada palavra separadamente.
 */
export function montarParagrafo(ctx, texto, { fonte, tamanho, largura, entrelinha = 1.14, x = 90, y = 400, espaco = 0, alinhar = 'left' }) {
  const linhas = quebrar(ctx, texto, fonte, largura, espaco);
  const esp = medir(ctx, 'a a', fonte, espaco) - medir(ctx, 'aa', fonte, espaco);
  const palavras = [];
  linhas.forEach((ln, i) => {
    const wl = medir(ctx, ln, fonte, espaco);
    let px = alinhar === 'center' ? x - wl / 2 : x;
    for (const p of ln.split(' ')) {
      const w = medir(ctx, p, fonte, espaco);
      palavras.push({ t: p, x: px, base: y + i * tamanho * entrelinha + tamanho * (0.5 * (entrelinha - 1) + 0.8), w, linha: i });
      px += w + esp + espaco;
    }
  });
  return { palavras, linhas, fonte, espaco, tamanho, entrelinha, x, y, altura: linhas.length * tamanho * entrelinha };
}

/**
 * Desenha o parágrafo "acendendo": as palavras vão do apagado ao aceso conforme p (0..1).
 * contorno = true desenha só o contorno das letras (modo wireframe).
 */
export function desenharAceso(ctx, par, p, op = {}) {
  const { apagado = COR.apagado, aceso = COR.aluminio, dx = 0, dy = 0, alfa = 1, contorno = false, so = 'tudo' } = op;
  const N = par.palavras.length;
  ctx.save();
  ctx.font = par.fonte;
  ctx.letterSpacing = `${par.espaco}px`;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.globalAlpha *= alfa;
  par.palavras.forEach((w, i) => {
    const k = ease.inOutSine(clamp(p * (N + 0.6) - i));
    if (so === 'acesas' && k <= 0) return;
    if (so === 'apagadas' && k >= 1) return;
    const cor = so === 'apagadas' || k <= 0 ? apagado : so === 'acesas' || k >= 1 ? aceso : misturar(apagado, aceso, k);
    if (contorno) {
      ctx.strokeStyle = cor;
      ctx.lineWidth = op.espessura ?? 1.4;
      ctx.strokeText(w.t, w.x + dx, w.base + dy);
    } else {
      if (so === 'acesas') ctx.globalAlpha = alfa * k;
      ctx.fillStyle = cor;
      ctx.fillText(w.t, w.x + dx, w.base + dy);
    }
  });
  ctx.restore();
}

/** Linha fina de progresso (trilho + parte cheia). Só a parte cheia usa o acento. */
export function trilho(ctx, x, y, w, p, op = {}) {
  const { cor = COR.laranja, alfa = 1, base = 'rgba(223,227,231,0.16)' } = op;
  ctx.save();
  ctx.globalAlpha *= alfa;
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = cor;
  ctx.fillRect(x, y, w * clamp(p), 2);
  ctx.restore();
}

/** Formata número com vírgula decimal. */
export const num = (v, casas = 0) => v.toFixed(casas).replace('.', ',');

/**
 * Riscos de ar verticais no fundo (elemento da marca), bem discretos.
 * Cada risco dá um número inteiro de voltas durante o Reels: o último quadro
 * encaixa no primeiro (loop sem emenda).
 */
export function riscos(ctx, t, duracao, op = {}) {
  const { n = 46, alfa = 1, semente = 7 } = op;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const h1 = hashLocal(i * 13 + semente), h2 = hashLocal(i * 29 + semente * 3), h3 = hashLocal(i * 47 + semente * 5);
    const voltas = 1 + Math.floor(h1 * 3);
    const x = 30 + h2 * (1080 - 60);
    const len = 60 + h3 * 220;
    const y = ((((h1 * 7.31) % 1) * 2400 + (t / duracao) * voltas * 2400) % 2400 + 2400) % 2400 - 240;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    const a = (0.025 + 0.05 * h3) * alfa;
    g.addColorStop(0, 'rgba(223,227,231,0)');
    g.addColorStop(1, `rgba(223,227,231,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 1.5, len);
  }
  ctx.restore();
}
function hashLocal(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
