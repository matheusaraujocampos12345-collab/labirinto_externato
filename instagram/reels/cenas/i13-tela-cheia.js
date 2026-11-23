// i13 (tela cheia) — filme de lançamento do site da Equus Genetics (equusbr.com), 16,5 s.
// 5 batidas de 2,5 s: título de verbo + substantivo que se revela letra a letra e um celular 3D genérico
// com a tela real do site (gravada por motor/capturar.mjs com cenas/equus/b*.mjs). Ondas atrás,
// luz que passa na tela, câmera em movimento. No fim, um toque, o clarão e o logo da Equus.
// Cores e fontes do próprio site: preto #030303, dourado #FFAB00, creme #F3EDE2, Playfair Display.
import { W, H, clamp, lerp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { FONTE, bloco, dedo } from '../motor/marca.js';
import { Celular } from './equus/celular.js';

const OURO = '#FFAB00', CREME = '#F3EDE2', PRETO = '#030303', TERRA = '#6C6557';
const SERIFA = '"Playfair Display", Georgia, serif';
const BATIDA = 2.5, TOQUE = 12.5, LOGO = 13.5;
export const DUR_ANIMACAO = 16.5;

const BATIDAS = [
  { titulo: [['Escolha ', 0], ['o teste.', 1]], selo: '01 — Testes genéticos', pasta: 'equus-b1-teste' },
  { titulo: [['Colete ', 0], ['o pelo.', 1]], selo: '02 — 30 a 40 fios com raiz', pasta: 'equus-b2-coleta' },
  { titulo: [['Revele ', 0], ['o DNA.', 1]], selo: '03 — Pelagem revelada pelo DNA', pasta: 'equus-b3-dna' },
  { titulo: [['Conheça ', 0], ['seu cavalo.', 1]], selo: '04 — NextGen™', pasta: 'equus-b4-nextgen' },
  { titulo: [['Planeje ', 0], ['a cobertura.', 1]], selo: '05 — NextBreed', pasta: 'equus-b5-nextbreed' },
];

// movimento do celular e da câmera em cada batida (u = 0..1)
const POSES = [
  (u) => ({ rotY: lerp(0.78, 0.12, ease.outCubic(u)), rotX: lerp(0.14, 0.04, u), rotZ: lerp(-0.05, 0, u), x: lerp(0.42, 0, ease.outCubic(u)), cam: [0, 0.05, lerp(6.0, 5.5, ease.inOutSine(u))] }),
  (u) => ({ rotY: lerp(-0.12, 0.06, u), rotX: lerp(-0.32, -0.08, ease.outCubic(u)), rotZ: lerp(0.06, 0, u), x: 0, cam: [0, lerp(0.5, 0.12, ease.inOutSine(u)), 5.4] }),
  (u) => ({ rotY: lerp(-0.24, 0.08, ease.inOutSine(u)), rotX: 0.03, rotZ: lerp(0.03, 0, u), x: 0, cam: [0, 0.02, lerp(5.8, 4.7, ease.inOutSine(u))] }),
  (u) => ({ rotY: lerp(-0.72, -0.14, ease.outCubic(u)), rotX: 0.06, rotZ: lerp(-0.05, 0, u), x: lerp(-0.4, 0, ease.outCubic(u)), cam: [0, 0.05, 5.5] }),
  (u) => ({ rotY: lerp(0.34, 0.04, ease.inOutSine(u)), rotX: 0.05, rotZ: lerp(0.12, 0, ease.outCubic(u)), x: 0, cam: [0, 0.05, lerp(5.0, 5.5, ease.inOutSine(u))] }),
];
const Y_CELULAR = -0.36; // o celular fica abaixo do título

let cel;
function poseNo(t) {
  if (t < TOQUE) {
    const i = Math.min(4, Math.floor(t / BATIDA));
    return { i, ...POSES[i]((t - i * BATIDA) / BATIDA) };
  }
  const u = prog(t, TOQUE, LOGO);
  return { i: 4, rotY: lerp(0.04, 0, u), rotX: 0.05 * (1 - u), rotZ: 0, x: 0, cam: [0, 0.05, lerp(5.5, 5.1, ease.inOutSine(u))] };
}

function fundo(ctx, t, cx, cy, brilho = 1) {
  ctx.fillStyle = PRETO;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
  g.addColorStop(0, `rgba(255,171,0,${0.16 * brilho})`);
  g.addColorStop(0.45, `rgba(255,171,0,${0.05 * brilho})`);
  g.addColorStop(1, 'rgba(255,171,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // ondas concêntricas que pulsam atrás do celular (uma por segundo, na batida)
  ctx.save();
  ctx.lineWidth = 2;
  for (let k = 0; k < 5; k++) {
    const idade = ((t % 1) + k) / 5; // 0..1
    const r = 360 + idade * 620;
    const a = (1 - idade) * 0.42 * brilho;
    ctx.strokeStyle = `rgba(255,171,0,${a})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.98, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/** título de verbo + substantivo, letra a letra (a segunda parte em itálico dourado, como no site) */
function titulo(ctx, t, partes, t0) {
  const tam = 104;
  const fonteDe = (it) => (it ? `italic 400 ${tam}px ${SERIFA}` : `400 ${tam}px ${SERIFA}`);
  let largura = 0;
  const letras = [];
  for (const [txt, it] of partes) {
    ctx.font = fonteDe(it);
    for (const ch of txt) {
      const w = ctx.measureText(ch).width;
      letras.push({ ch, it, x: largura, w });
      largura += w;
    }
  }
  const x0 = (W - largura) / 2, base = 500;
  letras.forEach((l, i) => {
    const st = t0 + 0.12 + i * 0.032;
    const k = ease.outCubic(prog(t, st, st + 0.4));
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.font = fonteDe(l.it);
    ctx.fillStyle = l.it ? OURO : CREME;
    if (k < 1) ctx.filter = `blur(${((1 - k) * 6).toFixed(1)}px)`;
    ctx.fillText(l.ch, x0 + l.x, base + (1 - k) * 26);
    ctx.restore();
  });
}

function selo(ctx, t, texto, t0) {
  bloco(ctx, t, { estilo: 'rotulo', texto, alinhar: 'center', x: 540, y: 330, tamanho: 24, espaco: 0.22, cor: OURO, entra: t0 + 0.05, entrada: 'fade', durEntrada: 0.4 });
}

/** a captura do site na tela do celular, com uma faixa de luz que passa */
async function pintarTela(i, u) {
  const b = BATIDAS[i];
  const f = Math.min(80, Math.max(0, Math.round(u * BATIDA * 30)));
  const img = await carregarImagem(`/instagram/reels/.quadros/${b.pasta}/q_${String(f).padStart(5, '0')}.png`);
  cel.desenharTela((c, w, h) => {
    c.globalCompositeOperation = 'source-over';
    c.drawImage(img, 0, 0, w, h);
    const p = ease.inOutSine(clamp((u - 0.15) / 0.7));
    if (p > 0 && p < 1) {
      const x = lerp(-w * 0.8, w * 1.6, p);
      c.save();
      c.globalCompositeOperation = 'screen';
      c.translate(x, 0);
      c.rotate(-0.35);
      const g = c.createLinearGradient(-220, 0, 220, 0);
      g.addColorStop(0, 'rgba(255,240,210,0)');
      g.addColorStop(0.5, 'rgba(255,240,210,0.28)');
      g.addColorStop(1, 'rgba(255,240,210,0)');
      c.fillStyle = g;
      c.fillRect(-220, -h, 440, h * 3);
      c.restore();
    }
  });
}

let logoImg;
export async function desenharAnimacao(ctx, t) {
  if (t >= LOGO) return cartaFinal(ctx, t);
  const p = poseNo(t);
  cel.pose({ rotX: p.rotX, rotY: p.rotY, rotZ: p.rotZ, x: p.x, y: Y_CELULAR });
  cel.olhar(p.cam, [0, p.cam[1] * 0.6, 0], 28);
  const u = t < TOQUE ? (t - p.i * BATIDA) / BATIDA : 1;
  await pintarTela(p.i, u);
  const [cx, cy] = cel.pontoDaTela(0.5, 0.5);
  fundo(ctx, t, cx, cy);
  // sombra suave sob o celular
  const g = ctx.createRadialGradient(cx, cy + 640, 0, cx, cy + 640, 380);
  g.addColorStop(0, 'rgba(0,0,0,0.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(cel.render(), 0, 0);
  if (t < TOQUE) {
    const b = BATIDAS[p.i];
    selo(ctx, t, b.selo, p.i * BATIDA);
    titulo(ctx, t, b.titulo, p.i * BATIDA);
  } else {
    // o toque: círculo de dedo na tela, ondas e clarão dourado
    const [tx, ty] = cel.pontoDaTela(0.5, 0.6);
    const ap = ease.outCubic(prog(t, TOQUE + 0.05, TOQUE + 0.3));
    const pr = Math.sin(Math.PI * clamp((t - (TOQUE + 0.3)) / 0.3));
    dedo(ctx, tx, ty + (1 - ap) * 50, { alfa: ap * (1 - prog(t, TOQUE + 0.75, TOQUE + 0.9)), pressao: pr, raio: 50, cor: CREME });
    for (let k = 0; k < 3; k++) {
      const q = prog(t, TOQUE + 0.45 + k * 0.08, TOQUE + 1.0 + k * 0.08);
      if (q <= 0 || q >= 1) continue;
      ctx.strokeStyle = `rgba(255,171,0,${(1 - q) * 0.8})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(tx, ty, 40 + q * 700, 0, Math.PI * 2);
      ctx.stroke();
    }
    const fl = ease.inCubic(prog(t, TOQUE + 0.6, LOGO));
    if (fl > 0) {
      const gr = ctx.createRadialGradient(tx, ty, 0, tx, ty, 200 + fl * 1900);
      gr.addColorStop(0, `rgba(255,236,200,${0.9 * fl})`);
      gr.addColorStop(0.45, `rgba(255,171,0,${0.4 * fl})`);
      gr.addColorStop(1, `rgba(3,3,3,${0.9 * fl})`);
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

function cartaFinal(ctx, t) {
  const u = t - LOGO;
  fundo(ctx, t, 540, 860, 0.8 * ease.outCubic(clamp(u / 0.8)));
  // o clarão some
  const fl = 1 - ease.outCubic(clamp(u / 0.6));
  if (fl > 0) {
    const gr = ctx.createRadialGradient(540, 860, 0, 540, 860, 1400);
    gr.addColorStop(0, `rgba(255,236,200,${0.85 * fl})`);
    gr.addColorStop(0.45, `rgba(255,171,0,${0.35 * fl})`);
    gr.addColorStop(1, 'rgba(3,3,3,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  const k = ease.outCubic(clamp((u - 0.1) / 0.9));
  const lw = 900, lh = (lw * logoImg.height) / logoImg.width;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.globalCompositeOperation = 'lighten';
  if (k < 1) ctx.filter = `blur(${((1 - k) * 10).toFixed(1)}px)`;
  const s = lerp(0.95, 1, k);
  ctx.translate(540, 820);
  ctx.scale(s, s);
  ctx.drawImage(logoImg, -lw / 2, -lh / 2, lw, lh);
  ctx.restore();
  const kt = ease.outCubic(clamp((u - 0.6) / 0.6));
  if (kt > 0) {
    ctx.save();
    ctx.globalAlpha = kt;
    ctx.font = `italic 400 58px ${SERIFA}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = CREME;
    ctx.fillText('Todo cavalo tem uma história.', 540, 1068 + (1 - kt) * 14);
    ctx.restore();
  }
  bloco(ctx, t, { estilo: 'rotulo', texto: 'equusbr.com', alinhar: 'center', x: 540, y: 1130, tamanho: 26, cor: OURO, entra: LOGO + 0.9, durEntrada: 0.5 });
  bloco(ctx, t, { estilo: 'rotulo', caixa: 'normal', texto: 'Site por MACH Estúdio · @mach.sites', alinhar: 'center', x: 540, y: 1380, tamanho: 24, espaco: 0.06, cor: '#9A9283', entra: LOGO + 1.3, durEntrada: 0.5 });
}

export async function prepararAnimacao() {
  cel = new Celular();
  logoImg = await carregarImagem('/instagram/reels/fontes-equus/logo-equus-4x.png');
}

export const FONTES_EQUUS = [
  { familia: 'Playfair Display', arquivo: '/instagram/reels/motor/fontes/PlayfairDisplay-Regular.ttf', peso: 400 },
  { familia: 'Playfair Display', arquivo: '/instagram/reels/motor/fontes/PlayfairDisplay-Italic.ttf', peso: 400, estilo: 'italic' },
  { familia: 'Instrument Sans', arquivo: '/instagram/reels/motor/fontes/InstrumentSans-400.ttf', peso: 400 },
];

export default {
  id: 'i13-tela-cheia',
  nome: 'i13-equus-tela-cheia',
  duracao: DUR_ANIMACAO,
  fps: 30,
  fontes: FONTES_EQUUS,
  async preparar() {
    await prepararAnimacao();
  },
  async desenhar(ctx, t) {
    await desenharAnimacao(ctx, t);
  },
  async capa(ctx) {
    // a batida 3 (o cavalo com o DNA) com o título, e o logo pequeno
    await desenharAnimacao(ctx, 6.9);
  },
};
