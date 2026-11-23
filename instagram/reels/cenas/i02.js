// i02 — O site que todo mundo tem (20 s).
//   0–2 s      modelo 1 (foto de banco) + "Seu concorrente tem o mesmo site que você."
//   2–4,5 s    "Muda o modelo." · modelos 2 a 6, um corte a cada 0,5 s (uma batida a 120 bpm)
//   4,5–5,5 s  os modelos passam a cada 0,25 s (meia batida)
//   5,5–6,5 s  os seis sobrepostos viram uma coisa só · "Continua igual."
//   6,5–7,5 s  corte seco para o preto · "O mesmo negócio. Sob medida."
//   7,5–17,5 s a Barbearia Navalha (fictícia) sob medida, com movimento
//   17,5–19,5 s "Qual deles o seu cliente lembra?" · os seis modelos × a Navalha
//   19,5–20 s  volta ao quadro do início (loop)
import { W, H, clamp, prog, ease, chaves, criarCanvas } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, faixa } from '../motor/marca.js';
import { MODELOS } from './genericos.js';
import { desenharNavalha, FONTES_NAVALHA } from './barbearia.js';

const DUR = 20;
const QUADRO = { x: 240, y: 540, w: 600, h: 1067 };
const INICIO_N = 7.5;

// a sequência de modelos: [início, fim, índice]
const TOMADAS = [
  [0, 2, 0], [2, 2.5, 1], [2.5, 3, 2], [3, 3.5, 3], [3.5, 4, 4], [4, 4.5, 5],
  [4.5, 4.75, 0], [4.75, 5, 1], [5, 5.25, 2], [5.25, 5.5, 3],
  [19.5, 20, 0],
];

let tela, tctx, media, mctx, telaN, nctx;

const rolagemN = (tn) => chaves(tn, [[0, 0], [3.0, 0], [4.5, 1920], [6.4, 1985], [7.9, 3840], [10, 3895]], ease.inOutCubic);

function moldura(ctx, img, q, op = {}) {
  ctx.save();
  ctx.globalAlpha *= op.alfa ?? 1;
  ctx.beginPath();
  ctx.roundRect(q.x, q.y, q.w, q.h, op.raio ?? 22);
  ctx.save();
  ctx.clip();
  if (op.desfoque) ctx.filter = `blur(${op.desfoque}px)`;
  ctx.drawImage(img, q.x, q.y, q.w, q.h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(223,227,231,0.3)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

/** desenha o modelo i na tela de 1080×1920, com uma rolagem lenta desde o começo da tomada */
function modelo(i, local, t) {
  MODELOS[i].desenhar(tctx, 40 + 90 * local, t);
  return tela;
}

function mediaDosModelos(t) {
  mctx.globalAlpha = 1;
  mctx.fillStyle = '#fff';
  mctx.fillRect(0, 0, W, H);
  MODELOS.forEach((m, i) => {
    m.desenhar(tctx, 200, t);
    mctx.globalAlpha = 1 / (i + 1); // média de verdade: cada um pesa igual
    mctx.drawImage(tela, 0, 0);
  });
  mctx.globalAlpha = 1;
  return media;
}

function abertura(ctx, t) {
  rotulo(ctx, t, { texto: 'Modelo 01 · Foto de banco', x: 90, y: 292, entrada: 'corte' });
  bloco(ctx, t, { texto: 'Seu concorrente tem o\nmesmo site que você.', x: 90, y: 330, tamanho: 66, entrada: 'corte' });
}

export default {
  id: 'i02',
  nome: 'i02-o-site-que-todo-mundo-tem',
  duracao: DUR,
  fps: 30,
  fontes: FONTES_NAVALHA,

  preparar() {
    tela = criarCanvas(W, H);
    tctx = tela.getContext('2d');
    media = criarCanvas(W, H);
    mctx = media.getContext('2d');
    telaN = criarCanvas(W, H);
    nctx = telaN.getContext('2d');
  },

  desenhar(ctx, t) {
    fundo(ctx);
    const tomada = TOMADAS.find(([a, b]) => t >= a && t < b);
    if (tomada) {
      const [a, , i] = tomada;
      // a tomada do modelo 1 continua através do loop (19,5–20 s → 0–2 s)
      const local = i === 0 && a === 0 ? t + 0.5 : t - a;
      moldura(ctx, modelo(i, local, t), QUADRO);
      if (t < 2 || t >= 19.5) abertura(ctx, t);
      else {
        if (t < 4.5) rotulo(ctx, t, { texto: `Modelo 0${i + 1} · ${MODELOS[i].nome}`, x: 90, y: 292, entrada: 'corte' });
        bloco(ctx, t, { texto: 'Muda o modelo.', x: 90, y: 330, tamanho: 66, entra: 2.0, durEntrada: 0.4 });
      }
    } else if (t < 6.5) {
      // os seis viram um só
      moldura(ctx, mediaDosModelos(t), QUADRO, { desfoque: 2 });
      rotulo(ctx, t, { texto: '6 modelos · 1 site', x: 90, y: 292, entrada: 'corte', entra: 5.5 });
      bloco(ctx, t, { texto: 'Muda o modelo.', x: 90, y: 330, tamanho: 66, entrada: 'corte', entra: 5.5 });
      bloco(ctx, t, { texto: 'Continua igual.', x: 90, y: 405, tamanho: 66, entra: 5.5, durEntrada: 0.4 });
    } else if (t < INICIO_N) {
      rotulo(ctx, t, { texto: 'O mesmo negócio. Sob medida.', alinhar: 'center', x: 540, y: 950, entra: 6.75, durEntrada: 0.35, cor: COR.aluminio });
    } else if (t < 17.5) {
      const tn = t - INICIO_N;
      desenharNavalha(ctx, rolagemN(tn), tn);
      rotulo(ctx, t, { texto: 'Mesmo negócio · sob medida', x: 90, y: 286, entra: INICIO_N, entrada: 'corte', cor: COR.aluminio, painel: { pad: 18, cor: 'rgba(10,12,15,0.78)' } });
    } else comparacao(ctx, t);
  },

  capa(ctx) {
    fundo(ctx);
    // os seis modelos ao fundo
    const w = 300, h = 533, g = 20, x0 = (W - (3 * w + 2 * g)) / 2, y0 = 417;
    MODELOS.forEach((m, i) => {
      m.desenhar(tctx, 40, 0.5);
      moldura(ctx, tela, { x: x0 + (i % 3) * (w + g), y: y0 + Math.floor(i / 3) * (h + g), w, h }, { alfa: 0.55, raio: 16 });
    });
    faixa(ctx, 0, { y: 800, h: 320, entrada: 'corte', cor: 'rgba(10,12,15,0.9)' });
    rotulo(ctx, 0, { texto: 'Template × sob medida', alinhar: 'center', x: 540, y: 842, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Seu concorrente tem o\nmesmo site que você.', alinhar: 'center', x: 540, y: 900, tamanho: 80, largura: 850, entrada: 'corte' });
  },
};

function comparacao(ctx, t) {
  bloco(ctx, t, { texto: 'Qual deles o seu\ncliente lembra?', x: 90, y: 300, tamanho: 72, entra: 17.5, durEntrada: 0.5, sai: 19.5, saida: 'corte' });
  // os seis modelos, pequenos e iguais
  rotulo(ctx, t, { texto: '6 templates', x: 90, y: 506, entra: 17.5, entrada: 'corte', sai: 19.5, saida: 'corte' });
  const w = 130, h = 231, g = 14;
  MODELOS.forEach((m, i) => {
    m.desenhar(tctx, 40, t);
    moldura(ctx, tela, { x: 90 + i * (w + g), y: 546, w, h }, { raio: 10 });
  });
  // a Navalha, grande
  rotulo(ctx, t, { texto: 'Sob medida', x: 370, y: 826, entra: 17.5, entrada: 'corte', sai: 19.5, saida: 'corte', cor: COR.aluminio });
  desenharNavalha(nctx, 0, t - INICIO_N, true);
  moldura(ctx, telaN, { x: 370, y: 866, w: 340, h: 604 }, { raio: 16 });
  assinatura(ctx, t, { entra: 17.8, sai: 19.5, saida: 'corte' });
}
