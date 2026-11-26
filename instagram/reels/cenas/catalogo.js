// Moldura dos Reels "12 animações de site" (parte 2 em diante). Mesmo formato do i15:
// selo "Quer o prompt? Comenta PROMPT", título fixo, janela de navegador com um mini-site
// fictício, lista de 01 a 12 embaixo, 2 s por item (corte na batida de 120 bpm) e o fecho
// "Quer o prompt de cada uma? Comenta PROMPT." O vídeo emenda o fim no começo (loop).
// Cada cena só define os 12 efeitos: { nome, site, fx(g, u, fila, P), borrao? }.
//   g    = contexto já posicionado na área do site (850 × 510)
//   u    = segundos desde o início do item (0 a 2)
//   fila = onde vão os toques (use toque(fila, ...P(x, y), op))
//   P    = converte um ponto do site em ponto da tela
import { W, H, clamp, lerp, prog, ease, hash } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, dedo, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';

export const DUR = 27, SLOT = 2, FIM = 24;
export const JAN = { x: 90, y: 520, w: 850, h: 560, r: 32 };
export const BARRA = 50;
export const CW = JAN.w, CH = JAN.h - BARRA; // área do site: 850 × 510
export const CINZA = '#5A626C';
export const SAIRA = (px, peso = 300) => `${peso} ${px}px "Saira", sans-serif`;
export const EXP = (px, peso = 500) => `${peso} ${px}px "Saira Expandida", sans-serif`;
export const TXT = (px, peso = 400) => `${peso} ${px}px "Hanken Grotesk", sans-serif`;
export const MONO = (px, peso = 400) => `${peso} ${px}px "JetBrains Mono", monospace`;
export const FUNDO_SITE = '#0E1115', TITANIO = '#1B2026', LINHA = 'rgba(223,227,231,0.12)';

// ── peças dos mini-sites (coordenadas da área do site, 850 × 510) ──
export function texto(g, s, x, y, fonte, cor, op = {}) {
  g.font = fonte;
  g.fillStyle = cor;
  g.textAlign = op.alinhar ?? 'left';
  g.letterSpacing = `${op.esp ?? 0}px`;
  g.textBaseline = 'alphabetic';
  g.fillText(s, x, y);
  g.letterSpacing = '0px';
  g.textAlign = 'left';
}
export function largura(g, s, fonte, esp = 0) {
  g.save();
  g.font = fonte;
  g.letterSpacing = `${esp}px`;
  const w = g.measureText(s).width;
  g.restore();
  return w;
}
export function nav(g, nome, op = {}) {
  texto(g, nome.toUpperCase(), 32, 40, EXP(16), COR.aluminio, { esp: 3 });
  if (op.menu !== false) {
    g.fillStyle = 'rgba(223,227,231,0.28)';
    for (let k = 0; k < 3; k++) g.fillRect(CW - 220 + k * 62, 32, 44, 4);
  }
}
export function limpar(g, cor = FUNDO_SITE) {
  g.fillStyle = cor;
  g.fillRect(0, 0, CW, CH);
}
export function barras(g, x, y, larguras, cor = 'rgba(223,227,231,0.16)', passo = 22) {
  g.fillStyle = cor;
  larguras.forEach((w, i) => g.fillRect(x, y + i * passo, w, 8));
}
/** o círculo de toque vai para uma fila e é desenhado depois, por cima do site, em coordenadas da tela */
export function toque(fila, x, y, op = {}) {
  fila.push([x, y, { raio: op.raio ?? 30, alfa: op.alfa ?? 1, pressao: op.pressao ?? 0 }]);
}
/** aparece no começo do item e some no fim (para o círculo de toque) */
export const presenca = (u, ate = 1.98, de = 0) => ease.outCubic(prog(u, de, de + 0.14)) * (1 - ease.inCubic(prog(u, ate - 0.16, ate)));
/** pulso de pressão de um toque que começa em t0 */
export const aperto = (u, t0, dur = 0.26) => Math.sin(Math.PI * clamp((u - t0) / dur));

/** foto inventada (sem banco de imagens): degradê, sol e relevo, nas cores da marca */
export function foto(g, x, y, w, h, semente, op = {}) {
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, op.raio ?? 14);
  g.clip();
  const r = (n) => hash(semente * 31 + n);
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, ['#2A2F36', '#3A2A20', '#1F2A33', '#33261C'][semente % 4]);
  gr.addColorStop(1, '#0B0D10');
  g.fillStyle = gr;
  g.fillRect(x, y, w, h);
  const sx = x + w * (0.25 + r(1) * 0.5), sy = y + h * (0.25 + r(2) * 0.2), sr = Math.min(w, h) * (0.1 + r(3) * 0.08);
  const gs = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
  gs.addColorStop(0, 'rgba(255,140,70,0.55)');
  gs.addColorStop(1, 'rgba(255,140,70,0)');
  g.fillStyle = gs;
  g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,160,100,0.85)';
  g.beginPath();
  g.arc(sx, sy, sr, 0, Math.PI * 2);
  g.fill();
  for (let c = 0; c < 2; c++) {
    g.fillStyle = c ? '#07090B' : '#15191F';
    g.beginPath();
    g.moveTo(x, y + h);
    for (let i = 0; i <= 10; i++) {
      const px = x + (w * i) / 10;
      const py = y + h * (0.55 + c * 0.18) - Math.sin(i * (0.9 + r(4 + c)) + r(6 + c) * 6) * h * (0.09 + 0.05 * c);
      g.lineTo(px, py);
    }
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();
  }
  g.restore();
}
/** canvas auxiliar (desenhado uma vez e guardado) */
export function tela(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ── a página do Reels ──────────────────────────────────────────
export function catalogo({ id, nome, parte, itens, semente = 15, capa = 2.2 }) {
  const relogio = (t) => (((t + 0.5) % DUR) + DUR) % DUR;
  const slotDe = (T) => (T < FIM ? Math.floor(T / SLOT) : -1);

  function cabecalho(ctx) {
    ctx.save();
    ctx.font = FONTE.mono(24, 500);
    ctx.letterSpacing = '4px';
    const w = ctx.measureText('QUER O PROMPT? COMENTA PROMPT').width + 36;
    ctx.strokeStyle = 'rgba(223,227,231,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(90, 268, w, 48, 24);
    ctx.stroke();
    ctx.restore();
    bloco(ctx, 99, { estilo: 'rotulo', texto: 'Quer o prompt? Comenta PROMPT', x: 108, y: 278, tamanho: 24, peso: 500, espaco: 0.16, cor: COR.aluminio, destaque: 'PROMPT', entrada: 'corte', largura: 820 });
    bloco(ctx, 99, { texto: '12 animações de site', x: 88, y: 336, tamanho: 84, espaco: -0.01, entrada: 'corte' });
    bloco(ctx, 99, { estilo: 'rotulo', caixa: 'normal', texto: `parte ${parte} · @mach.sites`, x: 90, y: 444, tamanho: 26, espaco: 0.06, entrada: 'corte' });
  }

  function janela(ctx, T, i) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(JAN.x, JAN.y, JAN.w, JAN.h, JAN.r);
    ctx.fillStyle = '#161A1F';
    ctx.fill();
    ctx.strokeStyle = 'rgba(223,227,231,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();
    if (i >= 0) {
      // barra do navegador simplificado
      ctx.fillStyle = TITANIO;
      ctx.fillRect(JAN.x, JAN.y, JAN.w, BARRA);
      ctx.fillStyle = 'rgba(223,227,231,0.25)';
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(JAN.x + 34 + k * 22, JAN.y + 25, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(10,12,15,0.6)';
      ctx.beginPath();
      ctx.roundRect(JAN.x + 130, JAN.y + 10, 520, 30, 15);
      ctx.fill();
      ctx.font = MONO(17);
      ctx.fillStyle = COR.nevoa;
      ctx.textAlign = 'center';
      ctx.fillText(itens[i].site, JAN.x + 390, JAN.y + 31);
      ctx.textAlign = 'left';
      ctx.restore();
      // o mini-site
      const u = T - i * SLOT;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(JAN.x, JAN.y + BARRA, JAN.w, CH, [0, 0, JAN.r, JAN.r]);
      ctx.clip();
      ctx.translate(JAN.x, JAN.y + BARRA);
      const fila = [];
      const P = (x, y) => [JAN.x + x, JAN.y + BARRA + y];
      itens[i].fx(ctx, u, fila, P);
      ctx.restore();
      for (const [x, y, op] of fila) if (op.alfa > 0.01) dedo(ctx, x, y, op);
      bloco(ctx, 99, { estilo: 'rotulo', texto: `${String(i + 1).padStart(2, '0')} / 12`, x: 940 - 28, y: JAN.y + 13, tamanho: 22, alinhar: 'right', entrada: 'corte' });
    } else {
      ctx.restore();
      const u = T - FIM;
      bloco(ctx, u, { texto: 'Quer o prompt\nde cada uma?', alinhar: 'center', x: 515, y: 640, tamanho: 76, entrelinha: 1.12, entra: 0, durEntrada: 0.6 });
      bloco(ctx, u, { estilo: 'texto', texto: 'Comenta PROMPT.', alinhar: 'center', x: 515, y: 860, tamanho: 52, peso: 500, destaque: 'PROMPT', entra: 0.35, entrada: 'fade', durEntrada: 0.5 });
    }
  }

  function lista(ctx, i) {
    const x0 = [90, 520], y0 = 1116, passo = 52;
    itens.forEach((it, k) => {
      const col = k < 6 ? 0 : 1, lin = k % 6;
      const cor = i < 0 ? COR.aluminio : k === i ? COR.laranja : k < i ? COR.aluminio : CINZA;
      const corNum = i < 0 ? COR.nevoa : k === i ? COR.laranja : k < i ? COR.nevoa : '#3E454E';
      bloco(ctx, 99, { estilo: 'rotulo', caixa: 'normal', texto: String(k + 1).padStart(2, '0'), x: x0[col], y: y0 + lin * passo + 3, tamanho: 30, espaco: 0, cor: corNum, entrada: 'corte' });
      bloco(ctx, 99, { estilo: 'texto', texto: it.nome, x: x0[col] + 50, y: y0 + lin * passo, tamanho: 34, peso: k === i ? 500 : 400, cor, entrada: 'corte', largura: 900 });
    });
  }

  function quadro(ctx, t) {
    const T = relogio(t);
    const i = slotDe(T);
    fundo(ctx);
    riscos(ctx, t, DUR, { alfa: 0.6, semente });
    cabecalho(ctx);
    janela(ctx, T, i);
    lista(ctx, i);
    vinheta(ctx, 0.3);
  }

  return {
    id,
    nome,
    duracao: DUR,
    fps: 30,
    obturador: 0.5,
    subquadros: (t) => {
      const T = relogio(t), i = slotDe(T);
      if (i < 0 || !itens[i].borrao) return 1;
      const u = T - i * SLOT, [a, b] = Array.isArray(itens[i].borrao) ? itens[i].borrao : [0, 1.7];
      return u >= a && u < b ? 4 : 1;
    },
    desenhar(ctx, t) {
      quadro(ctx, t);
    },
    capa(ctx) {
      // capa = um momento escolhido do vídeo (em segundos do relógio da cena)
      quadro(ctx, capa - 0.5);
    },
  };
}

export { W, H, clamp, lerp, prog, ease, hash, COR };
