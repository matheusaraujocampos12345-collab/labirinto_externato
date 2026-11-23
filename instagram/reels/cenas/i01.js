// i01 — Isso não é vídeo (15 s). Usa a gravação do site da MACH feita por motor/capturar.mjs
// (cenas/i01-captura.mjs → .quadros/i01-site/). Grave antes de renderizar.
//   0–1,5 s   a primeira tela já em movimento: "Isso não é vídeo."
//   1–2,5 s   "É um site." · o dedo aparece e começa a rolar
//   2–6 s     a régua: a rolagem acelera e o medidor sobe (medidor e contador trazidos para a zona segura)
//   6–9 s     o estrondo ao passar de M 1,0 (cai em 6,5 s, na batida)
//   9–12 s    o cartão de embarque se preenche ao vivo
//   12–15 s   volta à primeira tela: "Comenta SITE que eu te mostro como ficaria o seu." e fecha o loop
import { W, H, clamp, lerp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { COR, fundo, bloco, assinatura, dedo, cantoneiras } from '../motor/marca.js';

const PASTA = '/instagram/reels/.quadros/i01-site';
let meta;

const GESTOS = [
  [1.9, 2.8, 1250, 880],
  [3.0, 3.8, 1300, 800],
  [4.0, 4.8, 1300, 760],
  [5.0, 5.9, 1300, 700],
];

function textoAbertura(ctx, t, entra, sai, entrada) {
  const op = { x: 90, tamanho: 72, largura: 420, entrelinha: 1.12, sombra: true };
  bloco(ctx, t, { ...op, texto: 'Isso não é\nvídeo.', y: 300, entra, sai, entrada, durEntrada: 0.6 });
}

/** recorta um elemento da gravação (retângulo em px CSS) e desenha em outro lugar */
function trazer(ctx, img, r, escala, dx, dy, alinhar = 'left') {
  const k = meta.escala;
  const sx = r.x * k - 2, sy = r.y * k - 2, sw = r.w * k + 4, sh = r.h * k + 4;
  const w = sw * escala, h = sh * escala;
  const x = alinhar === 'right' ? dx - w : dx;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 24;
  ctx.drawImage(img, sx, sy, sw, sh, x, dy - h / 2, w, h);
  ctx.restore();
}

export default {
  id: 'i01',
  nome: 'i01-isso-nao-e-video',
  duracao: 15,
  fps: 30,

  async preparar() {
    meta = await (await fetch(`${PASTA}/meta.json`)).json();
  },

  async desenhar(ctx, t, f) {
    fundo(ctx);
    const img = await carregarImagem(`${PASTA}/q_${String(f).padStart(5, '0')}.png`);
    ctx.drawImage(img, 0, 0, W, H);
    const q = meta.quadros[f];

    // a régua: medidor e contador do site vêm para a zona segura (o rodapé fica sob a interface)
    // entra quando a seção dos templates ocupa a tela (rolagem 450–700 px)
    const aRegua = t < 6 ? ease.inOutSine(clamp((q.y - 450) / 250)) : 0;
    if (aRegua > 0) {
      ctx.save();
      ctx.globalAlpha = aRegua;
      const g = ctx.createLinearGradient(0, 1450, 0, 1620);
      g.addColorStop(0, 'rgba(10,12,15,0)');
      g.addColorStop(1, 'rgba(10,12,15,0.96)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 1450, W, 470);
      const m = q['#medidor'];
      if (m && m.opacidade > 0.5) trazer(ctx, img, m, 0.86, 90, 1390);
      const c = q['.contador'];
      if (c && c.y > 0 && c.y + c.h < meta.altura) trazer(ctx, img, c, 0.86, 940, 1390, 'right');
      ctx.restore();
    }

    // abertura e fechamento
    if (t < 3) {
      textoAbertura(ctx, t, -1, 2.3, 'corte');
      bloco(ctx, t, { texto: 'É um site.', x: 90, y: 500, tamanho: 64, entra: 1.0, sai: 2.3, durEntrada: 0.55, sombra: true });
    }
    if (t >= 12) {
      const escuro = 1 - ease.inOutSine(prog(t, 14.0, 14.6));
      if (escuro > 0) {
        ctx.fillStyle = `rgba(10,12,15,${0.9 * escuro})`;
        ctx.fillRect(0, 0, W, H);
      }
      bloco(ctx, t, { texto: 'Comenta SITE que eu te mostro como ficaria o seu.', x: 90, y: 560, tamanho: 84, largura: 820, entra: 12.0, sai: 13.9, durEntrada: 0.6, destaque: 'SITE' });
      assinatura(ctx, t, { y: 900, entra: 12.4, sai: 13.9 });
      textoAbertura(ctx, t, 14.3, 1e9, 'mascara');
    }

    // o dedo que rola a página
    for (const [a, b, y0, y1] of GESTOS) {
      if (t < a - 0.15 || t > b + 0.2) continue;
      const alfa = ease.outCubic(prog(t, a - 0.12, a)) * (1 - ease.inCubic(prog(t, b, b + 0.18)));
      const p = ease.inOutSine(prog(t, a, b));
      dedo(ctx, 820, lerp(y0, y1, p), { alfa, pressao: alfa });
    }
  },

  async capa(ctx) {
    fundo(ctx);
    const img = await carregarImagem(`${PASTA}/q_00000.png`);
    ctx.drawImage(img, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, 640, 0, 860);
    g.addColorStop(0, 'rgba(10,12,15,0)');
    g.addColorStop(1, 'rgba(10,12,15,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 640, W, 220);
    ctx.fillStyle = COR.fundo;
    ctx.fillRect(0, 860, W, H - 860);
    bloco(ctx, 0, { texto: 'Isso não é vídeo.', alinhar: 'center', x: 540, y: 920, tamanho: 104, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'É um site.', alinhar: 'center', x: 540, y: 1050, tamanho: 104, entrada: 'corte' });
    bloco(ctx, 0, { estilo: 'rotulo', texto: 'Rolagem real · site da MACH', alinhar: 'center', x: 540, y: 1230, entrada: 'corte' });
  },
};
