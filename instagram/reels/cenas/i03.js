// i03 — Feito para padaria (episódio 1) (19 s). Padaria Quatro Horas. Versão calma:
// rolagens lentas com pausa depois de cada movimento, borrão de movimento (4 subquadros, obturador de
// 180°) e uma ideia por tela. Base: cenas/i03-captura.mjs (.quadros/i03-site/).
//   0–3 s      primeira tela · "Esse site é de uma padaria."
//   3–9,5 s    o pão sai do forno devagar · "O pão sai com a rolagem."
//   9,5–14,5 s a aba Natal e o cardápio · "O cardápio muda no Natal."
//   14,5–19 s  primeira tela · "Padaria fictícia. Site de verdade." e o gancho volta (loop)
import { W, H, clamp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { COR, fundo, bloco, assinatura, faixa } from '../motor/marca.js';

const PASTA = '/instagram/reels/.quadros/i03-site';
const N = 4;
const DUR = 19;

/** escurece suave uma faixa da tela, sem borda dura, para o texto ler sem tampar nada */
function veu(ctx, y0, y1, alfa) {
  if (alfa <= 0) return;
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(5,2,10,0)');
  g.addColorStop(0.3, `rgba(5,2,10,${alfa})`);
  g.addColorStop(0.7, `rgba(5,2,10,${alfa})`);
  g.addColorStop(1, 'rgba(5,2,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

/** texto calmo sobre a boca escura do forno (primeira tela), entre o texto do site e o painel */
function textoForno(ctx, t, texto, entra, sai, op = {}) {
  const a = (op.corte ? 1 : ease.outCubic(prog(t, entra, entra + 0.5))) * (t >= sai ? 1 - ease.inOutSine(prog(t, sai, sai + 0.5)) : 1);
  ctx.save();
  ctx.globalAlpha = a;
  veu(ctx, 1150, 1480, 0.82);
  ctx.restore();
  bloco(ctx, t, { texto, x: 90, y: op.y ?? 1250, tamanho: op.tamanho ?? 60, entrelinha: 1.14, entra, sai, entrada: op.corte ? 'corte' : 'fade', saida: 'fade', durEntrada: 0.6, durSaida: 0.5 });
}

export default {
  id: 'i03',
  nome: 'i03-feito-para-padaria',
  duracao: DUR,
  fps: 30,
  subquadros: N,
  obturador: 0.5,

  async desenhar(ctx, t, f, k) {
    fundo(ctx, '#05020A');
    const img = await carregarImagem(`${PASTA}/s_${String(f * N + k).padStart(5, '0')}.jpg`);
    // avanço de câmera bem lento na primeira tela (e volta a 1 no fim, para emendar)
    const z = t < 3 ? 1 + 0.025 * ease.inOutSine(t / 3) : t < 3.8 ? 1 + 0.025 * (1 - ease.inOutSine(t - 3)) : t >= 14.5 ? 1 + 0.025 * (1 - ease.inOutSine(prog(t, 14.5, DUR))) : 1;
    ctx.save();
    ctx.translate(W / 2, H * 0.45);
    ctx.scale(z, z);
    ctx.drawImage(img, -W / 2, -H * 0.45, W, H);
    ctx.restore();

    if (t < 3.6) textoForno(ctx, t, 'Esse site é de\numa padaria.', -1, 3.0, { corte: true });
    if (t >= 6.4 && t < 9.5) {
      // embaixo do pão, no chão escuro do forno
      ctx.save();
      ctx.globalAlpha = ease.outCubic(prog(t, 6.4, 6.9)) * (1 - ease.inOutSine(prog(t, 9.0, 9.45)));
      veu(ctx, 1110, 1400, 0.75);
      ctx.restore();
      bloco(ctx, t, { texto: 'O pão sai com a rolagem.', x: 90, y: 1215, tamanho: 54, entra: 6.5, sai: 9.0, entrada: 'fade', saida: 'fade', durEntrada: 0.6 });
    }
    if (t >= 9.5 && t < 14.5) {
      // embaixo, longe das abas e do topo da seção de Natal
      faixa(ctx, t, { y: 1300, h: 140, entra: 10.6, sai: 14.0, cor: 'rgba(5,2,10,0.92)', linha: 'rgba(229,172,104,0.3)', durEntrada: 0.4, durSaida: 0.4 });
      bloco(ctx, t, { texto: 'O cardápio muda no Natal.', x: 90, y: 1336, tamanho: 54, entra: 10.8, sai: 14.0, entrada: 'fade', saida: 'fade', durEntrada: 0.5 });
    }
    if (t >= 14.5) {
      if (t < 18.6) textoForno(ctx, t, 'Padaria fictícia.\nSite de verdade.', 14.8, 18.0);
      if (t < 18.6) assinatura(ctx, t, { y: 1400, entra: 15.3, sai: 18.0, cor: COR.aluminio });
      if (t >= 18.3) textoForno(ctx, t, 'Esse site é de\numa padaria.', 18.4, 1e9);
    }
  },

  async capa(ctx) {
    fundo(ctx, '#05020A');
    // o pão inteiro na luz, e o gancho no escuro embaixo dele
    const img = await carregarImagem(`${PASTA}/s_${String(250 * N).padStart(5, '0')}.jpg`);
    ctx.drawImage(img, 0, 0, W, H);
    veu(ctx, 960, 1420, 0.85);
    bloco(ctx, 0, { texto: 'Esse site é de\numa padaria.', alinhar: 'center', x: 540, y: 1060, tamanho: 80, entrelinha: 1.12, entrada: 'corte' });
  },
};
