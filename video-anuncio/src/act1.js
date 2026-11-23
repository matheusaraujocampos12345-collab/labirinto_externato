// ATO 1 — O PROBLEMA (0–13 s): busca → enxurrada de sites iguais.
import { W, H, FPS, clamp, lerp, prog, ease, makeCanvas, rr, text, measure } from './util.js';
import { drawGenericSite, VARIANTS } from './genericSite.js';
import {
  QUERY, CLICK_T, KEY_TIMES, ENTER_T, SITES_START, CUTS, CAPTION1, CAPTION2,
} from './timeline.js';

const SANS = '"Liberation Sans", Arial, sans-serif';
const INTER = '"Inter", sans-serif';

const bufOut = makeCanvas();
const bufIn = makeCanvas();
const bufSmall = makeCanvas(W / 12, H);
const bufBlur = makeCanvas();

export const variantFor = (i) => VARIANTS[i % VARIANTS.length];

export function cutIndexAt(f) {
  let ci = 0;
  for (let k = 0; k < CUTS.length; k++) if (CUTS[k].start <= f) ci = k;
  return ci;
}

function cutScroll(cut, u) {
  const s0 = cut.i > 1 && cut.i % 3 === 2 ? 360 : 0;
  const travel = cut.i === 0 ? 600 : Math.min(640, 110 + cut.dur * 13);
  const hold = cut.i < 2 ? 0.42 : 0.06;
  return s0 + travel * ease.inOutCubic(clamp((u - hold) / (1 - hold)));
}

function renderSite(ctx, ci, f) {
  const cut = CUTS[ci];
  const u = clamp((f - cut.start) / cut.dur, 0, 1.15);
  drawGenericSite(ctx, variantFor(cut.i), cutScroll(cut, Math.min(u, 1)) + Math.max(0, u - 1) * 300, f / FPS);
}

// ── cena de busca ────────────────────────────────────────────
const SUGGESTIONS = [
  'criar site para minha empresa',
  'criar site para minha empresa grátis',
  'criar site para minha empresa com ia',
  'criar site para minha empresa rápido',
];

function magnifier(ctx, x, y, s, color, lw = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x - s * 0.15, y - s * 0.15, s * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s * 0.25, y + s * 0.25);
  ctx.lineTo(x + s * 0.7, y + s * 0.7);
  ctx.stroke();
  ctx.restore();
}

function cursorArrow(ctx, x, y, s, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 40);
  ctx.lineTo(9.5, 31);
  ctx.lineTo(16.5, 47);
  ctx.lineTo(23.5, 44);
  ctx.lineTo(16.5, 28.5);
  ctx.lineTo(29, 28.5);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#111';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

export function drawSearch(ctx, t) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const z = 1 + 0.08 * ease.inOutSine(prog(t, 0, 2.6));
  ctx.translate(540, 900);
  ctx.scale(z, z);
  ctx.translate(-540, -900);

  const bx = 70, by = 820, bw = 940, bh = 140;
  const focus = t >= CLICK_T;
  let typed = 0;
  for (const kt of KEY_TIMES) if (kt <= t) typed++;
  const q = QUERY.slice(0, typed);
  const dropT = typed >= 10 ? KEY_TIMES[9] : Infinity;
  const dropP = ease.outCubic(prog(t, dropT, dropT + 0.14));
  const rowH = 94;
  const dropH = (SUGGESTIONS.length * rowH + 28) * dropP;

  // caixa (barra + sugestões)
  ctx.save();
  ctx.shadowColor = focus ? 'rgba(32,33,36,0.26)' : 'rgba(32,33,36,0.14)';
  ctx.shadowBlur = focus ? 44 : 24;
  ctx.shadowOffsetY = focus ? 10 : 4;
  rr(ctx, bx, by, bw, bh + dropH, dropH > 1 ? [70, 70, 44, 44] : 70);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  rr(ctx, bx, by, bw, bh + dropH, dropH > 1 ? [70, 70, 44, 44] : 70);
  ctx.strokeStyle = focus ? 'rgba(26,115,232,0.0)' : '#dfe1e5';
  ctx.lineWidth = 2;
  ctx.stroke();

  magnifier(ctx, bx + 78, by + bh / 2, 30, '#80868b', 4.5);
  // microfone
  ctx.save();
  ctx.fillStyle = '#80868b';
  rr(ctx, bx + bw - 92, by + 44, 22, 36, 11);
  ctx.fill();
  ctx.strokeStyle = '#80868b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(bx + bw - 81, by + 66, 20, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.moveTo(bx + bw - 81, by + 86);
  ctx.lineTo(bx + bw - 81, by + 98);
  ctx.stroke();
  ctx.restore();

  const tx = bx + 130, ty = by + bh / 2 + 16;
  if (typed === 0) text(ctx, 'Pesquisar', tx, ty, { font: `44px ${SANS}`, color: '#9aa0a6' });
  const qw = text(ctx, q, tx, ty, { font: `46px ${SANS}`, color: '#202124' });
  // cursor de texto
  const typing = typed > 0 && typed < QUERY.length;
  const blink = typing || !focus ? 1 : Math.floor((t - CLICK_T) * 2.2) % 2 === 0 ? 1 : 0;
  if (focus && blink && t < ENTER_T + 0.05) {
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(tx + qw + 4, by + 40, 3.5, 62);
  }

  // sugestões
  if (dropP > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by + bh, bw, dropH);
    ctx.clip();
    ctx.fillStyle = '#e8eaed';
    ctx.fillRect(bx + 40, by + bh, bw - 80, 2);
    SUGGESTIONS.forEach((s, r) => {
      const ry = by + bh + 14 + r * rowH;
      if (r === 0 && t >= ENTER_T) {
        ctx.fillStyle = '#f1f3f4';
        ctx.fillRect(bx, ry, bw, rowH);
      }
      magnifier(ctx, bx + 80, ry + rowH / 2, 20, '#9aa0a6', 3.5);
      const pre = s.startsWith(q) ? q : '';
      const w1 = text(ctx, pre, tx, ry + rowH / 2 + 14, { font: `40px ${SANS}`, color: '#202124' });
      text(ctx, s.slice(pre.length), tx + w1, ry + rowH / 2 + 14, { font: `bold 40px ${SANS}`, color: '#202124' });
    });
    ctx.restore();
  }

  // ondulação do clique
  const rp = prog(t, CLICK_T, CLICK_T + 0.35);
  if (rp > 0 && rp < 1) {
    ctx.fillStyle = `rgba(26,115,232,${0.22 * (1 - rp)})`;
    ctx.beginPath();
    ctx.arc(330, 905, 20 + 70 * ease.outCubic(rp), 0, Math.PI * 2);
    ctx.fill();
  }

  // tecla Enter
  const kp = prog(t, ENTER_T - 0.16, ENTER_T - 0.02);
  const kout = prog(t, 2.34, 2.5);
  if (kp > 0 && kout < 1) {
    const pressed = t >= ENTER_T && t < ENTER_T + 0.12 ? 1 : 0;
    const s = (0.6 + 0.4 * ease.outBack(kp)) * (1 - 0.1 * kout);
    ctx.save();
    ctx.globalAlpha = clamp(kp * 2) * (1 - kout);
    ctx.translate(540, 1560);
    ctx.scale(s, s);
    const kw = 330, kh = 130, depth = pressed ? 4 : 14;
    rr(ctx, -kw / 2, -kh / 2 + 10, kw, kh, 26);
    ctx.fillStyle = '#c3c6cc';
    ctx.fill();
    rr(ctx, -kw / 2, -kh / 2 + 10 - depth, kw, kh, 26);
    ctx.fillStyle = pressed ? '#e4e6ea' : '#f4f5f7';
    ctx.fill();
    ctx.strokeStyle = '#c9ccd2';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'Enter  ↵', 0, 26 - depth, { font: `600 48px ${INTER}`, color: '#3c4043', align: 'center' });
    ctx.restore();
  }

  // cursor do mouse
  const mp = ease.inOutCubic(prog(t, 0.1, 0.55));
  let mx = lerp(880, 330, mp), my = lerp(1500, 905, mp);
  const drift = ease.inOutCubic(prog(t, 0.72, 1.1));
  mx += drift * 50;
  my += drift * 120;
  const click = t >= CLICK_T && t < CLICK_T + 0.1 ? 0.88 : 1;
  cursorArrow(ctx, mx, my, 1.75 * click, 1 - prog(t, 0.9, 1.15));
  ctx.restore();

  // barra de carregamento
  const lp = prog(t, ENTER_T + 0.08, 2.53);
  if (lp > 0) {
    ctx.fillStyle = '#1a73e8';
    ctx.fillRect(0, 0, W * 0.9 * ease.outCubic(lp), 10);
  }
}

// ── transições ───────────────────────────────────────────────
function smear(src, amount, vertical) {
  // desfoque direcional barato: reduz e amplia em um só eixo
  if (amount < 0.05) return src;
  const k = 1 + amount * 22;
  const sw = vertical ? W : Math.max(8, Math.round(W / k));
  const sh = vertical ? Math.max(8, Math.round(H / k)) : H;
  bufSmall.width = sw;
  bufSmall.height = sh;
  const s = bufSmall.getContext('2d');
  s.imageSmoothingQuality = 'high';
  s.drawImage(src, 0, 0, sw, sh);
  const b = bufBlur.getContext('2d');
  b.imageSmoothingQuality = 'high';
  b.drawImage(bufSmall, 0, 0, W, H);
  return bufBlur;
}

function composite(ctx, A, B, type, k, T) {
  const e = ease.inOutCubic;
  const p0 = e(k / T), p1 = e((k + 1) / T);
  if (type === 'zoom') {
    const p = (p0 + p1) / 2;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, W, H);
    ctx.filter = `blur(${Math.round(p * 24)}px)`;
    ctx.translate(W / 2, H / 2);
    ctx.save();
    const sa = 1 + p * 0.6;
    ctx.scale(sa, sa);
    ctx.globalAlpha = 1 - p * 0.6;
    ctx.drawImage(A, -W / 2, -H / 2);
    ctx.restore();
    ctx.filter = `blur(${Math.round((1 - p) * 24)}px)`;
    const sb = 1.35 - 0.35 * p;
    ctx.scale(sb, sb);
    ctx.globalAlpha = p;
    ctx.drawImage(B, -W / 2, -H / 2);
    ctx.restore();
    ctx.filter = 'none';
    // flash branco
    const fl = 1 - Math.abs(p - 0.5) * 2;
    ctx.fillStyle = `rgba(255,255,255,${0.35 * fl})`;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  const vertical = type === 'slideUp';
  const speed = Math.abs(p1 - p0) * 2;
  const blurOn = speed >= 0.05;
  let AA = A, b = B;
  if (blurOn) {
    smear(A, speed, vertical);
    bufOut.getContext('2d').drawImage(bufBlur, 0, 0);
    AA = bufOut;
    b = smear(B, speed, vertical);
  }
  const N = 14;
  for (let s = 0; s < N; s++) {
    const p = lerp(p0, p1, (s + 0.5) / N);
    ctx.globalAlpha = 1 / (s + 1);
    if (type === 'whipL') {
      ctx.drawImage(AA, -p * W, 0);
      ctx.drawImage(b, (1 - p) * W, 0);
    } else if (type === 'whipR') {
      ctx.drawImage(AA, p * W, 0);
      ctx.drawImage(b, -(1 - p) * W, 0);
    } else {
      ctx.drawImage(AA, 0, -p * H);
      ctx.drawImage(b, 0, (1 - p) * H);
    }
  }
  ctx.globalAlpha = 1;
}

// ── sobreposições ────────────────────────────────────────────
function drawCounter(ctx, f) {
  if (f < SITES_START) return;
  const ci = cutIndexAt(f);
  const cut = CUTS[ci];
  const k = f - cut.start;
  const bump = 1 + 0.2 * (1 - ease.outCubic(clamp(k / 5)));
  const appear = ease.outBack(prog(f, SITES_START, SITES_START + 9));
  const label = `Site ${cut.count}`;
  const font = `800 50px ${INTER}`;
  const tw = measure(ctx, label, font);
  const pw = tw + 100, ph = 86;
  const cx = W - 44 - pw / 2, cy = 214;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(bump * appear, bump * appear);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = 'rgba(14,14,18,0.86)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ff3b3b';
  ctx.beginPath();
  ctx.arc(-pw / 2 + 40, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, label, -pw / 2 + 64, 18, { font, color: '#fff' });
  ctx.restore();
}

function captionLine(ctx, str, cy, p, out, opts = {}) {
  if (p <= 0 || out >= 1) return;
  const { inv = false, size = 66 } = opts;
  const font = `800 ${size}px ${INTER}`;
  const tw = measure(ctx, str, font);
  const padX = 34, h = size * 1.42;
  const s = (0.55 + 0.45 * ease.outBack(p)) * (1 - 0.25 * ease.inCubic(out));
  ctx.save();
  ctx.globalAlpha = clamp(p * 2.2) * (1 - out);
  ctx.translate(W / 2, cy);
  ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  rr(ctx, -tw / 2 - padX, -h / 2, tw + padX * 2, h, 20);
  ctx.fillStyle = inv ? '#0d0d10' : '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  text(ctx, str, 0, size * 0.36, { font, color: inv ? '#ffffff' : '#0d0d10', align: 'center' });
  ctx.restore();
}

export function drawCaptions(ctx, t) {
  const o1 = prog(t, CAPTION1.out - 0.2, CAPTION1.out);
  captionLine(ctx, 'Procurando um site', 306, prog(t, CAPTION1.in, CAPTION1.in + 0.4), o1);
  captionLine(ctx, 'pra sua empresa?', 404, prog(t, CAPTION1.in + 0.1, CAPTION1.in + 0.5), o1);
  const o2 = prog(t, CAPTION2.out, CAPTION2.out + 0.01);
  captionLine(ctx, 'Todos parecem…', 306, prog(t, CAPTION2.in, CAPTION2.in + 0.4), o2);
  captionLine(ctx, 'isso.', 412, prog(t, CAPTION2.in2, CAPTION2.in2 + 0.3), o2, { inv: true, size: 76 });
}

/** Renderiza um quadro do Ato 1 (função pura do quadro). */
export function renderAct1(ctx, f) {
  const t = f / FPS;
  if (f < SITES_START) {
    drawSearch(ctx, t);
  } else {
    const ci = cutIndexAt(f);
    const cut = CUTS[ci];
    const k = f - cut.start;
    if (k < cut.trLen) {
      const oc = bufOut.getContext('2d');
      if (ci === 0) drawSearch(oc, Math.min(t, 2.6));
      else renderSite(oc, ci - 1, f);
      renderSite(bufIn.getContext('2d'), ci, f);
      composite(ctx, bufOut, bufIn, cut.trans, k, cut.trLen);
    } else {
      renderSite(ctx, ci, f);
    }
  }
  drawCounter(ctx, f);
  drawCaptions(ctx, t);
}
