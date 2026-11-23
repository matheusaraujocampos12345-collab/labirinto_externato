// Elementos compartilhados da estética premium (Atos 3 e 4).
import { W, H, clamp, prog, ease, hash, measure, text } from './util.js';

export const DISPLAY = '"Inter Display", "Inter", sans-serif';
export const INTER = '"Inter", sans-serif';

/** Fundo grafite com luz de estúdio suave. li = intensidade 0..1 */
export function studioBg(ctx, li, opts = {}) {
  const { cx = 540, cy = -180, warm = 0, base = '#060607' } = opts;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  if (li <= 0) return;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 1750);
  g.addColorStop(0, `rgba(${200 + warm},${204},${214 - warm},${0.26 * li})`);
  g.addColorStop(0.45, `rgba(150,154,165,${0.08 * li})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const f = ctx.createRadialGradient(540, 1780, 0, 540, 1780, 900);
  f.addColorStop(0, `rgba(255,255,255,${0.045 * li})`);
  f.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = f;
  ctx.fillRect(0, 0, W, H);
}

/** Partículas de poeira desfocadas no feixe de luz (profundidade). */
export function dust(ctx, t, li, count = 46) {
  if (li <= 0) return;
  ctx.save();
  for (let i = 0; i < count; i++) {
    const depth = hash(i * 3 + 1); // 0 = longe, 1 = perto
    const x0 = hash(i * 7 + 2) * W;
    const y0 = hash(i * 11 + 3) * H;
    const sp = 6 + depth * 26;
    const x = (x0 + Math.sin(t * 0.3 + i) * 30 + W) % W;
    const y = (((y0 - t * sp) % H) + H) % H;
    const r = 2 + depth * depth * 22;
    const lightMask = clamp(1.2 - Math.hypot(x - 540, y + 100) / 1500);
    const a = (0.05 + 0.22 * (1 - depth)) * li * lightMask * (0.6 + 0.4 * Math.sin(t * 1.3 + i * 2.1));
    if (a <= 0.004) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(depth > 0.6 ? 0.85 : 0.4, `rgba(255,255,255,${a * (depth > 0.6 ? 0.55 : 0.4)})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Texto gigante e fino que entra letra a letra com desfoque→foco.
 * lines: [{ str, y }], start: tempo do primeiro caractere.
 */
export function focusText(ctx, t, lines, opts) {
  const { size, start, stagger = 0.038, dur = 0.95, lineDelay = 0.22, weight = 200, color = '#f4f4f6', exitT = Infinity, exitDur = 0.55, spacing = -2 } = opts;
  const font = `${weight} ${size}px ${DISPLAY}`;
  const exit = ease.inOutCubic(prog(t, exitT, exitT + exitDur));
  let gi = 0;
  lines.forEach((ln, li) => {
    const total = measure(ctx, ln.str, font, spacing);
    const x0 = W / 2 - total / 2;
    for (let i = 0; i < ln.str.length; i++) {
      const ch = ln.str[i];
      const pre = measure(ctx, ln.str.slice(0, i), font, spacing);
      const s0 = start + li * lineDelay + i * stagger;
      const p = ease.outCubic(prog(t, s0, s0 + dur));
      gi++;
      if (p <= 0 || ch === ' ') continue;
      const blur = (1 - p) * 26 + exit * 22;
      const alpha = clamp(p * 1.3) * (1 - exit);
      if (alpha <= 0.003) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      text(ctx, ch, x0 + pre, ln.y + (1 - p) * 26 - exit * 50, { font, color, spacing });
      ctx.restore();
    }
  });
}

export function fitSize(ctx, strs, maxW, weight = 200, spacing = -2, maxSize = 190) {
  let best = maxSize;
  for (const s of strs) {
    const w = measure(ctx, s, `${weight} 100px ${DISPLAY}`, (spacing * 100) / maxSize);
    best = Math.min(best, Math.floor((maxW / w) * 100));
  }
  return best;
}
