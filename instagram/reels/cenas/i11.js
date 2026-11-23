// i11 — Do zero à primeira tela (22 s). Bastidores da primeira tela do site-conceito Padaria Quatro Horas.
// Sem cronômetro e sem tempo de produção: só as etapas reais, na ordem em que foram capturadas
// (instagram/sites-conceito/padaria/captura/etapas/), e um trecho da rolagem final.
//   0–3 s      etapa 1 (rascunho em caixas) + "Do zero à primeira tela."
//   3–9 s      etapas 2, 3 e 4, cortes secos a cada 2 s (4 batidas a 120 bpm)
//   9–10,5 s   etapa 5 (movimento), ainda parada
//   10,5–20 s  a mesma tela ganha vida: rolagem real da versão final (o pão na luz, a fornada, o Natal)
//              "Cada etapa é uma decisão."
//   20–22 s    volta à etapa 1; o último quadro emenda no primeiro (loop)
import { W, H, clamp, ease, carregarImagem } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, faixa } from '../motor/marca.js';

const ETAPAS = '/instagram/sites-conceito/padaria/captura/etapas';
const ROLAGEM = '/instagram/reels/.quadros/padaria-rolagem';
const FORNO = 'rgba(5,2,10,0.94)'; // o preto do forno, da paleta do site
const NEON = '#E5AC68'; // "Luz do forno"
const LINHA = 'rgba(229,172,104,0.35)';
const Y_BAIXO = 1270; // etapas 1 a 4: entre o texto do site e o painel da fornada
const Y_ALTO = 262; // etapa 5 e rolagem: no escuro de cima, longe do pão

const LISTA = [
  { arq: '01-rascunho-em-caixas.png', nome: 'Rascunho em caixas' },
  { arq: '02-layout.png', nome: 'Layout' },
  { arq: '03-tipografia-e-cor.png', nome: 'Tipografia e cor' },
  { arq: '04-video-real.png', nome: 'Vídeo real' },
  { arq: '05-movimento.png', nome: 'Movimento' },
];
// [início, fim, etapa] no Reels
const CORTES = [[0, 3, 0], [3, 5, 1], [5, 7, 2], [7, 9, 3], [9, 10.5, 4], [20, 22, 0]];
const DUR = 22;
const ROLAGEM_INI = 4.0; // a rolagem da versão final entra com o pão já na luz, como na etapa 5

const etapaNo = (t) => CORTES.find(([a, b]) => t >= a && t < b);

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

function marcas(ctx, i, y, alfa) {
  ctx.save();
  ctx.globalAlpha = alfa;
  for (let m = 0; m < 5; m++) {
    const x = 740 + m * 42;
    if (m === i) {
      ctx.fillStyle = NEON;
      ctx.fillRect(x, y, 32, 20);
    } else if (m < i) {
      ctx.fillStyle = 'rgba(223,227,231,0.45)';
      ctx.fillRect(x, y, 32, 20);
    } else {
      ctx.strokeStyle = 'rgba(223,227,231,0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, 30.5, 18.5);
    }
  }
  ctx.restore();
}

/** faixa da etapa: rótulo em mono e cinco marcas de progresso */
function faixaEtapa(ctx, t, i, y, entra, sai, op = {}) {
  const k = faixa(ctx, t, { y, h: 112, entra, sai, cor: FORNO, linha: LINHA, entrada: 'corte', saida: op.saida ?? 'corte' });
  if (k <= 0) return;
  rotulo(ctx, t, { texto: `${String(i + 1).padStart(2, '0')} · ${LISTA[i].nome}`, x: 90, y: y + 38, tamanho: 28, espaco: 0.14, cor: COR.aluminio, entra, sai, entrada: 'corte', saida: op.saida === 'fecha' ? 'fade' : 'corte' });
  marcas(ctx, i, y + 44, k);
}

function abertura(ctx, t, entra, corte) {
  const y = Y_BAIXO - 8;
  faixa(ctx, t, { y, h: 206, entra, cor: FORNO, linha: LINHA, entrada: corte ? 'corte' : 'abre' });
  const e = corte ? entra : entra + 0.12;
  bloco(ctx, t, { texto: 'Do zero à primeira tela.', x: 90, y: y + 34, tamanho: 62, entra: e, entrada: corte ? 'corte' : 'mascara', durEntrada: 0.45 });
  rotulo(ctx, t, { texto: '01 · Rascunho em caixas', x: 90, y: y + 136, tamanho: 26, espaco: 0.14, cor: NEON, entra: e, entrada: corte ? 'corte' : 'fade' });
}

export default {
  id: 'i11',
  nome: 'i11-do-zero-a-primeira-tela',
  duracao: DUR,
  fps: 30,

  async desenhar(ctx, t, f) {
    fundo(ctx, '#05020A');
    const c = etapaNo(t);
    if (c) {
      const [a, b, i] = c;
      const local = i === 0 ? (t >= 20 ? t - 20 : t + 2) : t - a;
      const total = i === 0 ? 5 : b - a;
      await desenharEtapa(ctx, i, local, total);
    } else {
      const q = Math.min(599, Math.round(ROLAGEM_INI * 30) + (f - 315));
      const img = await carregarImagem(`${ROLAGEM}/q_${String(q).padStart(5, '0')}.png`);
      ctx.drawImage(img, 0, 0, W, H);
    }

    if (t < 3) abertura(ctx, t, -1, true);
    else if (t < 9) {
      const [a, b, i] = etapaNo(t);
      faixaEtapa(ctx, t, i, Y_BAIXO, a, b);
    } else if (t < 12.4) {
      faixaEtapa(ctx, t, 4, Y_ALTO, 9.0, 12.0, { saida: 'fecha' });
    } else if (t >= 16.5 && t < 20) {
      // sobre o escuro vazio acima do quadro de letras do cardápio
      // na faixa de baixo, no mesmo lugar dos rótulos das etapas (o alto mostra as luzes do Natal)
      const y = Y_BAIXO - 8;
      faixa(ctx, t, { y, h: 206, entra: 16.5, sai: 19.9, saida: 'corte', cor: 'rgba(5,2,10,0.985)', linha: LINHA });
      bloco(ctx, t, { texto: 'Cada etapa é uma decisão.', x: 90, y: y + 34, tamanho: 62, entra: 16.62, sai: 19.9, saida: 'corte', durEntrada: 0.5 });
      assinatura(ctx, t, { y: y + 136, entra: 17.0, sai: 19.9, saida: 'corte' });
    } else if (t >= 20) abertura(ctx, t, 20.0, false);
  },

  async capa(ctx) {
    fundo(ctx, '#05020A');
    const a = await carregarImagem(`${ETAPAS}/${LISTA[0].arq}`);
    const b = await carregarImagem(`${ETAPAS}/${LISTA[4].arq}`);
    ctx.drawImage(a, 0, 0, 540, H, 0, 0, 540, H);
    ctx.drawImage(b, 540, 0, 540, H, 540, 0, 540, H);
    ctx.fillStyle = 'rgba(229,172,104,0.8)';
    ctx.fillRect(539, 0, 2, H);
    faixa(ctx, 0, { y: 520, h: 250, cor: FORNO, linha: LINHA, entrada: 'corte' });
    rotulo(ctx, 0, { texto: '01 → 05', alinhar: 'center', x: 540, y: 560, cor: NEON, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Do zero à primeira tela.', alinhar: 'center', x: 540, y: 616, tamanho: 76, largura: 920, entrada: 'corte' });
  },
};
