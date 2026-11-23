// ATO 4 — CHAMADA (25–30 s): o logo MACH se monta a partir de linhas finas,
// rompe a "barreira do som" (estrondo) e os diamantes de choque acendem.
import { W, H, FPS, clamp, lerp, prog, ease, hash, text, drawGrain, vignette } from './util.js';
import { studioBg, dust } from './studio.js';
import { A4 } from './timeline.js';
import { LOGO } from './logoMach.js';
import { BRAND } from '../config.js';

const SAIRA = '"Saira", "Inter", sans-serif';
const MONO = '"JetBrains Mono", monospace';
const C = LOGO.colors;

// posição do logo na tela (unidades do logo → pixels)
const S = 1.56;
const X0 = 540 - 260 * S;
const Y0 = 600;
const px = (x) => X0 + x * S;
const py = (y) => Y0 + y * S;

const lettersPath = new Path2D(LOGO.lettersPath);
const lambdaPath = new Path2D(LOGO.lambdaPath);
const descriptorPath = new Path2D(LOGO.descriptor);
const cornerPaths = LOGO.cCorners.map((d) => new Path2D(d));

function segStart(i) {
  const ang = (hash(i * 13 + 5) - 0.5) * Math.PI * 0.9 + (i % 2 ? Math.PI / 2 : 0);
  const cx = 540 + (hash(i * 17 + 3) - 0.5) * 760;
  const cy = py(50) + (hash(i * 23 + 9) - 0.5) * 1400;
  const L = 1300 + hash(i * 29 + 1) * 700;
  return [cx - (Math.cos(ang) * L) / 2, cy - (Math.sin(ang) * L) / 2, cx + (Math.cos(ang) * L) / 2, cy + (Math.sin(ang) * L) / 2];
}

const STAGGER = 0.055;
const FLY = 0.7;

function guides(ctx, t) {
  const p = ease.inOutCubic(prog(t, A4.lines + 0.05, A4.lines + 0.85));
  const a = 0.15 * (1 - ease.inOutSine(prog(t, A4.lock + 0.05, A4.lock + 0.7)));
  if (p <= 0 || a <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(223,227,231,${a})`;
  const cx = px(260);
  for (const y of [py(0), py(100)]) ctx.fillRect(cx - W * p, y, W * 2 * p, 1);
  ctx.fillStyle = `rgba(223,227,231,${a * 0.55})`;
  ctx.fillRect(cx - W * p, py(50), W * 2 * p, 1);
  for (const x of [px(0), px(520), px(196)]) ctx.fillRect(x, py(50) - H * p, 1, H * 2 * p);
  ctx.restore();
}

function flyingLines(ctx, t) {
  ctx.save();
  ctx.lineCap = 'square';
  LOGO.segments.forEach((seg, i) => {
    const st = A4.lines + i * STAGGER;
    const p = ease.inOutCubic(prog(t, st, st + FLY));
    const a = clamp(prog(t, st, st + 0.22));
    if (a <= 0) return;
    const [sx1, sy1, sx2, sy2] = segStart(i);
    const [ux1, uy1, ux2, uy2, accent] = seg;
    const x1 = lerp(sx1, px(ux1), p), y1 = lerp(sy1, py(uy1), p);
    const x2 = lerp(sx2, px(ux2), p), y2 = lerp(sy2, py(uy2), p);
    ctx.globalAlpha = a * lerp(0.5, 1, p);
    ctx.strokeStyle = accent ? C.laranja : C.aluminio;
    ctx.lineWidth = lerp(1.2, LOGO.stroke * S, Math.pow(p, 3));
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  // cantos do C aparecem no fim
  const ca = prog(t, A4.lock - 0.18, A4.lock);
  if (ca > 0) {
    ctx.globalAlpha = ca;
    ctx.translate(X0, Y0);
    ctx.scale(S, S);
    ctx.strokeStyle = C.aluminio;
    ctx.lineWidth = LOGO.stroke;
    for (const cp of cornerPaths) ctx.stroke(cp);
  }
  ctx.restore();
}

function lockedLogo(ctx) {
  ctx.save();
  ctx.translate(X0, Y0);
  ctx.scale(S, S);
  ctx.lineWidth = LOGO.stroke;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 4;
  ctx.lineCap = 'square';
  ctx.strokeStyle = C.aluminio;
  ctx.stroke(lettersPath);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-40, -40, 620, 40 + LOGO.base);
  ctx.clip();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = C.laranja;
  ctx.stroke(lambdaPath);
  ctx.restore();
  ctx.restore();
}

function sonicBoom(ctx, t) {
  const ax = px(LOGO.lambdaCx), ay = py(0);
  for (const [delay, strength] of [[0, 1], [0.09, 0.6]]) {
    const p = prog(t, A4.lock + delay, A4.lock + delay + 1.0);
    if (p <= 0 || p >= 1) continue;
    const e = ease.outCubic(p);
    const r = 20 + e * 1100;
    ctx.save();
    ctx.globalAlpha = (1 - p) * (1 - p) * 0.5 * strength;
    ctx.strokeStyle = delay === 0 ? '#ffd2b5' : C.laranja;
    ctx.lineWidth = 2.5 * (1 - p) + 0.6;
    ctx.beginPath();
    // cone de choque: elipse achatada saindo do bico do Λ
    ctx.ellipse(ax, ay + r * 0.18, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // clarão + risco de luz horizontal
  const pulse = Math.sin(Math.PI * clamp(prog(t, A4.lock - 0.06, A4.lock + 0.8)));
  if (pulse > 0) {
    ctx.save();
    const g = ctx.createRadialGradient(ax, ay + 60, 0, ax, ay + 60, 700);
    g.addColorStop(0, `rgba(255,214,190,${0.18 * pulse})`);
    g.addColorStop(1, 'rgba(255,214,190,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const sw = 1000 * pulse;
    const hg = ctx.createLinearGradient(540 - sw, 0, 540 + sw, 0);
    hg.addColorStop(0, 'rgba(255,255,255,0)');
    hg.addColorStop(0.5, `rgba(255,255,255,${0.55 * pulse})`);
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(540 - sw, py(50) - 1, sw * 2, 2);
    ctx.restore();
  }
}

function diamonds(ctx, t) {
  LOGO.diamonds.forEach(([cx, cy, hw, hh, op], i) => {
    const st = A4.diamonds + i * 0.12;
    const p = ease.outCubic(prog(t, st, st + 0.35));
    if (p <= 0) return;
    const flicker = 0.92 + 0.08 * Math.sin(t * 31 + i * 2.1) * Math.sin(t * 13 + i);
    const x = px(cx), y = py(cy);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p * S, p * S);
    ctx.globalAlpha = op * flicker;
    ctx.shadowColor = 'rgba(255,107,26,0.9)';
    ctx.shadowBlur = 26 * (1 + (1 - p) * 2);
    ctx.fillStyle = C.laranja;
    ctx.beginPath();
    ctx.moveTo(0, -hh);
    ctx.lineTo(hw, 0);
    ctx.lineTo(0, hh);
    ctx.lineTo(-hw, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function glint(ctx, t) {
  const sweep = prog(t, A4.lock + 0.25, A4.lock + 1.15);
  if (sweep <= 0 || sweep >= 1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px(-10), py(-14), 540 * S, 120 * S);
  ctx.clip();
  ctx.globalCompositeOperation = 'source-atop';
  const sx = lerp(px(-60), px(580), ease.inOutSine(sweep));
  const g = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(px(-10), py(-14), 540 * S, 120 * S);
  ctx.restore();
}

export function renderAct4(ctx, f) {
  const t = f / FPS;
  const li = 0.5 + 0.25 * ease.inOutSine(prog(t, A4.lock - 0.3, A4.lock + 1.2));
  ctx.save();
  studioBg(ctx, li, { base: C.estratosfera });
  dust(ctx, t, li * 0.7, 30);
  const z = 1 + 0.03 * ease.inOutSine(prog(t, A4.lines, 30));
  ctx.translate(W / 2, 960);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -960);

  guides(ctx, t);
  if (t < A4.lock) flyingLines(ctx, t);
  else {
    // logo travado num canvas próprio para o brilho só passar sobre as letras
    lockLayer.getContext('2d').clearRect(0, 0, W, H);
    const lctx = lockLayer.getContext('2d');
    lockedLogo(lctx);
    glint(lctx, t);
    ctx.drawImage(lockLayer, 0, 0);
  }
  sonicBoom(ctx, t);
  diamonds(ctx, t);

  // descritor ESTÚDIO (curvas do logo)
  const dp = ease.outCubic(prog(t, A4.wordmark, A4.wordmark + 0.8));
  if (dp > 0) {
    ctx.save();
    ctx.globalAlpha = dp;
    if (dp < 0.98) ctx.filter = `blur(${((1 - dp) * 10).toFixed(1)}px)`;
    ctx.translate(X0 + (1 - dp) * 40, Y0);
    ctx.scale(S, S);
    ctx.fillStyle = C.aluminio;
    ctx.fill(descriptorPath);
    ctx.restore();
  }

  // slogan — máscara de baixo para cima
  const size = 70;
  const font = `300 ${size}px ${SAIRA}`;
  BRAND.tagline.forEach((ln, i) => {
    const st = A4.tagline + i * 0.14;
    const p = ease.outQuart(prog(t, st, st + 0.8));
    if (p <= 0) return;
    const y = 1110 + i * size * 1.24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y - size * 1.02, W, size * 1.32);
    ctx.clip();
    text(ctx, ln, W / 2, y + (1 - p) * size * 1.3, { font, color: '#ffffff', align: 'center', spacing: -0.5 });
    ctx.restore();
  });

  // contato
  const hp = ease.outCubic(prog(t, A4.handles, A4.handles + 0.8));
  if (hp > 0) {
    ctx.save();
    ctx.globalAlpha = hp;
    const contato = [BRAND.instagram, BRAND.site].filter(Boolean).join('  ·  ');
    text(ctx, contato, W / 2, 1380 + (1 - hp) * 18, { font: `400 40px ${MONO}`, color: '#c4cad1', align: 'center' });
    ctx.restore();
  }
  ctx.restore();
  vignette(ctx, 0.55);
  drawGrain(ctx, f, 0.07);
}

const lockLayer = document.createElement('canvas');
lockLayer.width = W;
lockLayer.height = H;
