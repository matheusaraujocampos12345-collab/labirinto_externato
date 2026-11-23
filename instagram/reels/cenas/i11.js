// i11 — Do zero à primeira tela (22 s). Bastidores da primeira tela do site-conceito Casca & Miolo.
// Sem cronômetro e sem tempo de produção: só as etapas, na ordem em que foram capturadas
// (instagram/sites-conceito/padaria/captura/etapas/), e um trecho da rolagem final.
//   0–3 s      etapa 1 (rascunho em caixas) + "Do zero à primeira tela."
//   3–9 s      etapas 2, 3 e 4, cortes secos a cada 2 s (4 batidas a 120 bpm)
//   9–10,5 s   etapa 5 (movimento), ainda parada
//   10,5–20 s  a primeira tela ganha vida: rolagem real do site; "Cada etapa é uma decisão."
//   20–22 s    volta à etapa 1; o último quadro emenda no primeiro (loop)
import { W, H, clamp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, rotulo, assinatura, faixa } from '../motor/marca.js';

const ETAPAS = '/instagram/sites-conceito/padaria/captura/etapas';
const ROLAGEM = '/instagram/reels/.quadros/padaria-rolagem';
const FORNO = 'rgba(31,10,3,0.94)';
const LINHA = 'rgba(242,233,216,0.16)';
const Y = 980;

const LISTA = [
  { arq: '01-rascunho-em-caixas.png', nome: 'Rascunho em caixas' },
  { arq: '02-layout.png', nome: 'Layout' },
  { arq: '03-tipografia-e-cor.png', nome: 'Tipografia e cor' },
  { arq: '04-ilustracao.png', nome: 'Ilustração' },
  { arq: '05-movimento.png', nome: 'Movimento' },
];
// [início, fim, etapa] no Reels
const CORTES = [[0, 3, 0], [3, 5, 1], [5, 7, 2], [7, 9, 3], [9, 10.5, 4], [20, 22, 0]];
const DUR = 22;

function etapaNo(t) {
  return CORTES.find(([a, b]) => t >= a && t < b);
}

/** imagem da etapa com um avanço lento de câmera (a etapa 1 continua através do loop) */
async function desenharEtapa(ctx, i, local, total) {
  const img = await carregarImagem(`${ETAPAS}/${LISTA[i].arq}`);
  const z = 1 + 0.035 * clamp(local / total);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(z, z);
  ctx.drawImage(img, -W / 2, -H / 2, W, H);
  ctx.restore();
}

/** faixa da etapa: rótulo em mono e cinco marcas de progresso */
function faixaEtapa(ctx, t, i, entra, sai, op = {}) {
  const h = op.h ?? 112;
  const k = faixa(ctx, t, { y: Y, h, entra, sai, cor: FORNO, linha: LINHA, entrada: op.corte ? 'corte' : 'abre', saida: op.saida ?? 'corte' });
  if (k <= 0) return;
  const ty = Y + (op.yTexto ?? 38);
  rotulo(ctx, t, { texto: `${String(i + 1).padStart(2, '0')} · ${LISTA[i].nome}`, x: 90, y: ty, tamanho: 28, espaco: 0.14, cor: COR.aluminio, entra: op.corte ? entra : entra + 0.1, sai, entrada: op.corte ? 'corte' : 'fade', saida: op.saida === 'fecha' ? 'fade' : 'corte' });
  // marcas 1–5 à direita
  ctx.save();
  ctx.globalAlpha = k;
  for (let m = 0; m < 5; m++) {
    const x = 740 + m * 42, y = ty + 6;
    if (m <= i) {
      ctx.fillStyle = m === i ? COR.aluminio : 'rgba(223,227,231,0.45)';
      ctx.fillRect(x, y, 32, 20);
    } else {
      ctx.strokeStyle = 'rgba(223,227,231,0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, 30.5, 18.5);
    }
  }
  ctx.restore();
}

function abertura(ctx, t, entra, corte) {
  faixa(ctx, t, { y: Y, h: 214, entra, cor: FORNO, linha: LINHA, entrada: corte ? 'corte' : 'abre' });
  const e = corte ? entra : entra + 0.12;
  bloco(ctx, t, { texto: 'Do zero à primeira tela.', x: 90, y: Y + 36, tamanho: 62, entra: e, entrada: corte ? 'corte' : 'mascara', durEntrada: 0.45 });
  rotulo(ctx, t, { texto: '01 · Rascunho em caixas', x: 90, y: Y + 140, tamanho: 26, espaco: 0.14, entra: e, entrada: corte ? 'corte' : 'fade' });
}

export default {
  id: 'i11',
  nome: 'i11-do-zero-a-primeira-tela',
  duracao: DUR,
  fps: 30,

  async desenhar(ctx, t, f) {
    fundo(ctx);
    const c = etapaNo(t);
    if (c) {
      const [a, b, i] = c;
      // etapa 1: o trecho do fim (20–22 s) e o do começo (0–3 s) formam uma tomada só
      const local = i === 0 ? (t >= 20 ? t - 20 : t + 2) : t - a;
      const total = i === 0 ? 5 : b - a;
      await desenharEtapa(ctx, i, local, total);
    } else {
      // 10,5–20 s: a rolagem real do site, do começo
      const q = Math.min(584, f - 315);
      const img = await carregarImagem(`${ROLAGEM}/q_${String(q).padStart(5, '0')}.png`);
      ctx.drawImage(img, 0, 0, W, H);
    }

    if (t < 3) abertura(ctx, t, -1, true);
    else if (t < 9) {
      const i = etapaNo(t)[2];
      faixaEtapa(ctx, t, i, etapaNo(t)[0], etapaNo(t)[1], { corte: true });
    } else if (t < 12.6) {
      faixaEtapa(ctx, t, 4, 9.0, 12.0, { corte: true, saida: 'fecha' });
    } else if (t >= 16 && t < 20) {
      faixa(ctx, t, { y: Y, h: 214, entra: 16.0, sai: 19.9, saida: 'corte', cor: FORNO, linha: LINHA });
      bloco(ctx, t, { texto: 'Cada etapa é uma decisão.', x: 90, y: Y + 36, tamanho: 62, entra: 16.12, sai: 19.9, saida: 'corte', durEntrada: 0.5 });
      assinatura(ctx, t, { y: Y + 140, entra: 16.6, sai: 19.9, saida: 'corte' });
    } else if (t >= 20) abertura(ctx, t, 20.0, false);
  },

  async capa(ctx) {
    fundo(ctx);
    // metade rascunho, metade primeira tela pronta
    const a = await carregarImagem(`${ETAPAS}/${LISTA[0].arq}`);
    const b = await carregarImagem(`${ETAPAS}/${LISTA[4].arq}`);
    ctx.drawImage(a, 0, 0, 540, H, 0, 0, 540, H);
    ctx.drawImage(b, 540, 0, 540, H, 540, 0, 540, H);
    ctx.fillStyle = 'rgba(223,227,231,0.7)';
    ctx.fillRect(539, 0, 2, H);
    faixa(ctx, 0, { y: 840, h: 250, cor: FORNO, linha: LINHA, entrada: 'corte' });
    rotulo(ctx, 0, { texto: '01 → 05', alinhar: 'center', x: 540, y: 880, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Do zero à primeira tela.', alinhar: 'center', x: 540, y: 936, tamanho: 76, largura: 920, entrada: 'corte' });
  },
};
