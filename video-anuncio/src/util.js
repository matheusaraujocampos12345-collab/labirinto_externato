export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** progress of t inside [a,b] → 0..1 (clamped) */
export const prog = (t, a, b) => clamp((t - a) / (b - a));

export const ease = {
  linear: (t) => t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/** deterministic hash → [0,1) */
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export const hash2 = (a, b) => hash(a * 7919 + b * 104729 + 13);

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctxOf(c) {
  return c.getContext('2d', { willReadFrequently: false });
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Draws text with optional letter spacing; returns width */
export function text(ctx, str, x, y, opts = {}) {
  const { font, color = '#fff', align = 'left', baseline = 'alphabetic', spacing = 0, alpha } = opts;
  if (font) ctx.font = font;
  ctx.letterSpacing = spacing ? `${spacing}px` : '0px';
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  if (alpha !== undefined) {
    const a = ctx.globalAlpha;
    ctx.globalAlpha = a * alpha;
    ctx.fillText(str, x, y);
    ctx.globalAlpha = a;
  } else ctx.fillText(str, x, y);
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}

export function measure(ctx, str, font, spacing = 0) {
  ctx.font = font;
  ctx.letterSpacing = spacing ? `${spacing}px` : '0px';
  const w = ctx.measureText(str).width;
  ctx.letterSpacing = '0px';
  return w;
}

/** Hex color → [r,g,b] */
export function hexRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function rgba(hex, a) {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
export function luminance(hex) {
  const [r, g, b] = hexRgb(hex).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Pre-baked film grain tile */
let grainTiles = null;
export function drawGrain(ctx, frame, alpha = 0.06) {
  if (!grainTiles) {
    grainTiles = [];
    for (let k = 0; k < 4; k++) {
      const c = makeCanvas(512, 512);
      const g = c.getContext('2d');
      const img = g.createImageData(512, 512);
      const r = rng(1000 + k);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (r() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      grainTiles.push(c);
    }
  }
  const tile = grainTiles[frame % 4];
  const ox = Math.floor(hash(frame * 3 + 1) * 512);
  const oy = Math.floor(hash(frame * 5 + 2) * 512);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(tile, x, y);
  ctx.restore();
}

export function vignette(ctx, strength = 0.6) {
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}
