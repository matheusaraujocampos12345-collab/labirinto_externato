// i06 — 1 segundo, 30 quadros (15 s).
// Usa a montagem do logo do vídeo de 30 s (video-anuncio/src/act4.js), quadro a quadro.
//   0–1 s    os 30 quadros na velocidade normal + gancho
//   1–12 s   os mesmos 30 quadros desacelerados, com o contador "quadro 01/30"
//            (14 quadros a cada 0,5 s e 16 a cada 0,25 s: cortes sempre na batida)
//   12–14,5  velocidade normal de novo: "Cada um foi pensado."
//   14,5–15  rebobina até o primeiro quadro (loop)
import { W, H, clamp, prog, ease } from '../motor/tempo.js';
import { COR, FONTE, ZONA, fundo, bloco, rotulo, assinatura, cantoneiras } from '../motor/marca.js';
import { criarCanvas } from '../motor/tempo.js';
import { renderAct4 } from '/video-anuncio/src/act4.js';
import { BRAND } from '/video-anuncio/config.js';

// No fim do vídeo de 30 s entram o slogan e o @. Aqui o texto é outro, então ficam de fora.
BRAND.tagline = [];
BRAND.instagram = '';

const PRIMEIRO = 764; // os 30 quadros: 764–793 do vídeo de 30 s (linhas → logo travado)
const N = 30;
const FIM_NORMAL = 836; // depois dos 30, segue até os diamantes e o ESTÚDIO acenderem

let quadro, qctx;
let cache = -1;
function quadroDoAnuncio(f) {
  if (cache !== f) {
    qctx.setTransform(1, 0, 0, 1, 0, 0);
    qctx.globalAlpha = 1;
    qctx.filter = 'none';
    renderAct4(qctx, f);
    cache = f;
  }
  return quadro;
}

// índice (0..29) do quadro lento no tempo t (1–12 s)
function indiceLento(t) {
  if (t < 8) return Math.min(13, Math.floor((t - 1) / 0.5));
  return Math.min(29, 14 + Math.floor((t - 8) / 0.25));
}

const NOTAS = [
  [0, 'As linhas entram'],
  [10, 'Cada linha acha o seu lugar'],
  [24, 'O logo trava'],
];

function gancho(ctx, t, entra, sai, entrada) {
  bloco(ctx, t, { texto: 'Um segundo de animação\ntem 30 desenhos.', x: 90, y: 1072, tamanho: 70, largura: 860, entra, sai, entrada, durEntrada: 0.32, atraso: 0.04 });
  bloco(ctx, t, { estilo: 'texto', texto: 'Olha um por um.', x: 90, y: 1250, tamanho: 46, cor: COR.nevoa, entra, sai, entrada: entrada === 'corte' ? 'corte' : 'fade', durEntrada: 0.3 });
}

/** escurece de leve a parte de baixo para o texto ler bem sobre as linhas do logo */
function veu(ctx) {
  const g = ctx.createLinearGradient(0, 960, 0, 1460);
  g.addColorStop(0, 'rgba(10,12,15,0)');
  g.addColorStop(0.35, 'rgba(10,12,15,0.62)');
  g.addColorStop(1, 'rgba(10,12,15,0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 960, W, 500);
}

export default {
  id: 'i06',
  nome: 'i06-1-segundo-30-quadros',
  duracao: 15,
  fps: 30,
  fontes: [],

  preparar() {
    quadro = criarCanvas(W, H);
    qctx = quadro.getContext('2d');
  },

  desenhar(ctx, t, f) {
    if (t < 1) {
      ctx.drawImage(quadroDoAnuncio(PRIMEIRO + Math.min(N - 1, f)), 0, 0);
      veu(ctx);
      gancho(ctx, t, -1, 3.0, 'corte');
    } else if (t < 12) {
      lento(ctx, t);
    } else if (t < 14.5) {
      const fa = Math.min(FIM_NORMAL, PRIMEIRO + (f - 360));
      ctx.drawImage(quadroDoAnuncio(fa), 0, 0);
      veu(ctx);
      bloco(ctx, t, { texto: 'Cada um foi pensado.', x: 90, y: 1110, tamanho: 96, entra: 12.5, sai: 14.5, saida: 'corte' });
      assinatura(ctx, t, { entra: 13.0, sai: 14.5, saida: 'corte' });
    } else {
      // rebobina: 15 quadros de vídeo voltando de FIM_NORMAL até o primeiro
      const k = (f - 435) / 14;
      const fa = Math.round(FIM_NORMAL - (FIM_NORMAL - PRIMEIRO) * ease.inOutSine(clamp(k)));
      ctx.drawImage(quadroDoAnuncio(fa), 0, 0);
      veu(ctx);
      gancho(ctx, t, 14.5, 1e9, 'mascara');
    }
  },

  capa(ctx) {
    // a capa mostra um quadro do meio da montagem (17/30), no mesmo visual da parte lenta
    lento(ctx, 8.5, { capa: true });
    bloco(ctx, 0, { texto: 'Um segundo de animação\ntem 30 desenhos.', x: 90, y: 1058, tamanho: 70, largura: 860, entrada: 'corte' });
    bloco(ctx, 0, { estilo: 'texto', texto: 'Olha um por um.', x: 90, y: 1228, tamanho: 46, cor: COR.nevoa, entrada: 'corte' });
  },
};

// ── a parte lenta: o quadro emoldurado, contador, notas e a fita dos 30 ──
const BOX = { x: 90, y: 470, w: 850, h: 551 };
const RECORTE = { x: 0, y: 330, w: 1080, h: 700 };

function lento(ctx, t, op = {}) {
  fundo(ctx);
  const i = indiceLento(t);
  const img = quadroDoAnuncio(PRIMEIRO + i);
  ctx.drawImage(img, RECORTE.x, RECORTE.y, RECORTE.w, RECORTE.h, BOX.x, BOX.y, BOX.w, BOX.h);
  ctx.strokeStyle = 'rgba(223,227,231,0.22)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(BOX.x + 0.75, BOX.y + 0.75, BOX.w - 1.5, BOX.h - 1.5);
  cantoneiras(ctx, BOX.x - 14, BOX.y - 14, BOX.w + 28, BOX.h + 28, { tam: 26, alfa: 0.6 });

  // contador
  rotulo(ctx, t, { texto: 'Quadro', x: 90, y: 292, entrada: 'corte', entra: 1 });
  bloco(ctx, t, { estilo: 'rotulo', caixa: 'normal', texto: `${String(i + 1).padStart(2, '0')}/30`, x: 90, y: 330, tamanho: 104, peso: 300, espaco: 0.02, cor: COR.aluminio, entrada: 'corte', entra: 1 });
  rotulo(ctx, t, { texto: `t = ${(i / 30).toFixed(3).replace('.', ',')} s`, x: 940, y: 292, alinhar: 'right', entrada: 'corte', entra: 1 });
  rotulo(ctx, t, { texto: '1 quadro = 33 ms', x: 940, y: 336, alinhar: 'right', entrada: 'corte', entra: 1 });

  // gancho continua até 3 s, depois as notas do que acontece em cada trecho
  if (!op.capa) gancho(ctx, t, -1, 3.0, 'corte');
  if (t >= 3.5 && !op.capa) {
    const nota = [...NOTAS].reverse().find(([de]) => i >= de);
    const tempoDoIndice = (k) => (k < 14 ? 1 + k * 0.5 : 8 + (k - 14) * 0.25);
    const entra = Math.max(3.5, tempoDoIndice(nota[0]));
    bloco(ctx, t, { estilo: 'titulo', texto: nota[1] + '.', x: 90, y: 1080, tamanho: 60, entra, entrada: 'mascara', durEntrada: 0.45 });
  }

  // fita com os 30 quadros (entra quando o gancho sai)
  const af = op.capa ? 1 : ease.outCubic(prog(t, 3.0, 3.4));
  ctx.save();
  ctx.globalAlpha = af;
  const fx = 90, fy = 1326, fw = 850, n = N, gap = 8;
  const bw = (fw - gap * (n - 1)) / n;
  for (let k = 0; k < n; k++) {
    const x = fx + k * (bw + gap);
    if (k === i) {
      ctx.fillStyle = COR.aluminio;
      ctx.fillRect(x, fy - 8, bw, 56);
    } else if (k < i) {
      ctx.fillStyle = 'rgba(138,146,155,0.55)';
      ctx.fillRect(x, fy, bw, 40);
    } else {
      ctx.strokeStyle = 'rgba(223,227,231,0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, fy + 0.75, bw - 1.5, 38.5);
    }
  }
  ctx.restore();
  rotulo(ctx, t, { texto: '1 segundo', x: 90, y: 1394, entrada: 'fade', entra: 3.0, tamanho: 22 });
  rotulo(ctx, t, { texto: '30 quadros', x: 940, y: 1394, alinhar: 'right', entrada: 'fade', entra: 3.0, tamanho: 22 });
}
