// ATO 2 — A QUEBRA (13–16 s): glitch → preto absoluto → "E se o seu fosse diferente?"
import { W, H, FPS, clamp, prog, ease, rng, makeCanvas, text, measure } from './util.js';
import { renderAct1 } from './act1.js';
import { GLITCH_START, BLACK_START, REVEAL_START, ACT3_START } from './timeline.js';

const DISPLAY = '"Inter Display", "Inter", sans-serif';

const base = makeCanvas();
const work = makeCanvas();
const pix = makeCanvas(W / 16, H / 16);
const wctx = work.getContext('2d', { willReadFrequently: true });

/** Imagem-base congelada / gaguejando entre os últimos sites. */
function baseFrameFor(f, r) {
  const g = (f - GLITCH_START) / (BLACK_START - GLITCH_START);
  const frozen = GLITCH_START - 1;
  let src = frozen;
  const roll = r();
  if (roll < 0.25 + g * 0.35) src = frozen - 1 - Math.floor(r() * (6 + g * 30));
  return src;
}

export function renderGlitch(ctx, f) {
  const g = clamp((f - GLITCH_START) / (BLACK_START - GLITCH_START - 1));
  const r = rng(9000 + f * 31);
  const bctx = base.getContext('2d');
  renderAct1(bctx, baseFrameFor(f, r));

  // 1) fatias horizontais deslocadas
  wctx.drawImage(base, 0, 0);
  const slices = 4 + Math.floor(g * 26);
  for (let k = 0; k < slices; k++) {
    const y = Math.floor(r() * H);
    const h = 4 + Math.floor(r() * (24 + g * 180));
    const dx = (r() - 0.5) * 2 * (16 + g * 320);
    wctx.drawImage(base, 0, y, W, h, dx, y, W, h);
    if (r() < 0.3) wctx.drawImage(base, 0, y, W, h, dx - W * Math.sign(dx), y, W, h);
  }

  // 2) blocos corrompidos (macroblocos)
  const blocks = Math.floor(3 + g * 34);
  for (let k = 0; k < blocks; k++) {
    const bw = 48 * (1 + Math.floor(r() * 5));
    const bh = 32 * (1 + Math.floor(r() * 4));
    const bx = Math.floor((r() * W) / 48) * 48;
    const by = Math.floor((r() * H) / 32) * 32;
    const kind = r();
    if (kind < 0.4) {
      const sx = Math.floor(r() * (W - bw)), sy = Math.floor(r() * (H - bh));
      wctx.drawImage(base, sx, sy, bw, bh, bx, by, bw, bh);
    } else if (kind < 0.7) {
      // pixelado
      const p = pix.getContext('2d');
      p.imageSmoothingEnabled = false;
      p.clearRect(0, 0, pix.width, pix.height);
      p.drawImage(base, bx, by, bw, bh, 0, 0, Math.max(2, bw / 16), Math.max(2, bh / 16));
      wctx.imageSmoothingEnabled = false;
      wctx.drawImage(pix, 0, 0, Math.max(2, bw / 16), Math.max(2, bh / 16), bx, by, bw, bh);
      wctx.imageSmoothingEnabled = true;
    } else {
      const cols = ['#ff00d4', '#00ff9c', '#00e1ff', '#ffffff', '#000000', '#7a2ff2'];
      wctx.globalAlpha = 0.55 + r() * 0.45;
      wctx.globalCompositeOperation = r() < 0.5 ? 'difference' : 'source-over';
      wctx.fillStyle = cols[Math.floor(r() * cols.length)];
      wctx.fillRect(bx, by, bw, bh);
      wctx.globalAlpha = 1;
      wctx.globalCompositeOperation = 'source-over';
    }
  }

  // 3) separação RGB + linhas de ruído (por pixel)
  const img = wctx.getImageData(0, 0, W, H);
  const src = new Uint8ClampedArray(img.data);
  const d = img.data;
  const shiftBase = Math.round(6 + g * 46);
  let rowShift = shiftBase;
  for (let y = 0; y < H; y++) {
    if (y % 24 === 0) rowShift = Math.round(shiftBase * (0.4 + r() * 1.2));
    const noisyRow = r() < 0.01 + g * 0.05;
    const row = y * W * 4;
    for (let x = 0; x < W; x++) {
      const i = row + x * 4;
      const xr = Math.min(W - 1, x + rowShift);
      const xb = Math.max(0, x - rowShift);
      d[i] = src[row + xr * 4];
      d[i + 2] = src[row + xb * 4 + 2];
      if (noisyRow) {
        const n = (r() * 255) | 0;
        d[i] = d[i + 1] = d[i + 2] = n;
      }
    }
  }
  // quantização de cor crescente
  if (g > 0.35) {
    const q = Math.max(16, Math.round(64 * g));
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(d[i] / q) * q;
      d[i + 1] = Math.round(d[i + 1] / q) * q;
      d[i + 2] = Math.round(d[i + 2] / q) * q;
    }
  }
  wctx.putImageData(img, 0, 0);

  ctx.drawImage(work, 0, 0);
  // linhas de varredura
  ctx.fillStyle = `rgba(0,0,0,${0.12 + g * 0.18})`;
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
  // flashes / inversão
  if (r() < 0.12 + g * 0.25) {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, Math.floor(r() * H * 0.6), W, Math.floor(H * (0.1 + r() * 0.5)));
    ctx.globalCompositeOperation = 'source-over';
  }
  // perda de sinal no final
  if (g > 0.7) {
    const bands = Math.floor((g - 0.7) * 30);
    ctx.fillStyle = '#000';
    for (let k = 0; k < bands; k++) ctx.fillRect(0, Math.floor(r() * H), W, Math.floor(20 + r() * 220 * g));
  }
}

/** Preto absoluto + texto revelado por máscara (de baixo para cima). */
export function renderBreak(ctx, f) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  renderBreakText(ctx, f);
}

export function renderBreakText(ctx, f) {
  const t = f / FPS;
  if (f < REVEAL_START) return;
  const t0 = REVEAL_START / FPS;
  const lines = ['E se o seu', 'fosse diferente?'];
  const size = 104;
  const font = `300 ${size}px ${DISPLAY}`;
  const lh = size * 1.22;
  const exit = ease.inOutCubic(prog(t, ACT3_START / FPS - 0.12, ACT3_START / FPS + 0.3));
  const y0 = H / 2 - lh / 2 + size * 0.35 - exit * 40;
  ctx.save();
  if (exit > 0) ctx.filter = `blur(${(exit * 18).toFixed(1)}px)`;
  ctx.globalAlpha = 1 - exit;
  lines.forEach((ln, i) => {
    const p = ease.outQuart(prog(t, t0 + i * 0.14, t0 + i * 0.14 + 0.75));
    const y = y0 + i * lh;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - size * 1.02, W, lh + 6);
    ctx.clip();
    text(ctx, ln, W / 2, y + (1 - p) * lh * 1.05, { font, color: '#ffffff', align: 'center', spacing: -1.5 });
    ctx.restore();
  });
  ctx.restore();
}
