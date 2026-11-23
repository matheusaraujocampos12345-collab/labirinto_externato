// ATO 3 — O NÍVEL PREMIUM (16–25 s)
import { W, H, FPS, clamp, lerp, prog, ease, makeCanvas, rr, text, measure, drawGrain, vignette } from './util.js';
import { studioBg, dust, focusText, fitSize, DISPLAY, INTER } from './studio.js';
import { Phone3D, FRONT_Z, FLOOR_Y } from './phone3d.js';
import { drawPremiumSite, SW, SH } from './premiumSite.js';
import { A3, ACT3_START } from './timeline.js';

let phone = null;
const dofBuf = makeCanvas();
const reflBuf = makeCanvas();
let panels = null;

export function initAct3() {
  phone = new Phone3D();
  // painéis (seções do site) para o parallax da cena final do ato
  panels = [0, 1250, 620].map((s) => {
    const c = makeCanvas(SW, SH);
    drawPremiumSite(c.getContext('2d'), 6, { forceScroll: s });
    return c;
  });
}

const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function lightLevel(t) {
  return ease.inOutSine(prog(t, A3.lightIn, A3.lightIn + 0.9)) * (1 - 0.45 * ease.inOutSine(prog(t, A3.end - 0.1, A3.end + 0.35)));
}

// ── cena A: "Animação de verdade." ───────────────────────────
function sceneA(ctx, t) {
  if (t > A3.textOut + 0.7) return;
  const lines = ['Animação', 'de verdade.'];
  const size = fitSize(ctx, lines, 930, 200, -2, 176);
  const y1 = 945 - size * 0.12;
  const z = 1 + 0.07 * ease.inOutSine(prog(t, A3.lightIn, A3.textOut + 0.6));
  ctx.save();
  ctx.translate(W / 2, 900);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -900);
  focusText(ctx, t, [{ str: lines[0], y: y1 }, { str: lines[1], y: y1 + size * 1.08 }], {
    size,
    start: A3.word1,
    stagger: 0.045,
    dur: 1.0,
    lineDelay: 0.3,
    exitT: A3.textOut,
    exitDur: 0.6,
  });
  ctx.restore();
}

// ── cena B: smartphone girando ──────────────────────────────
function phonePose(t) {
  const enter = ease.outCubic(prog(t, A3.phoneIn, A3.phoneIn + 1.3));
  const rp = ease.inOutSine(prog(t, A3.phoneIn, A3.rack + 1.0));
  return {
    rotY: lerp(0.7, -0.38, rp),
    rotX: lerp(0.2, 0.05, rp),
    rotZ: lerp(-0.08, 0.03, rp),
    y: lerp(-1.7, 0, enter),
  };
}

function sceneB(ctx, t, li) {
  if (t < A3.phoneIn || t > A3.word2 + 1.3) return;
  const tau = t - A3.phoneIn;
  phone.setPose(phonePose(t));
  const pose = phonePose(t);
  phone.updateScreen((sctx) => {
    drawPremiumSite(sctx, tau);
    // reflexo de luz no vidro que desliza conforme o celular gira
    const sx = lerp(-SW * 0.9, SW * 1.6, (0.7 - pose.rotY) / 1.08);
    const g = sctx.createLinearGradient(sx - 260, 0, sx + 260, SH * 0.35);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.09)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, SW, SH);
  });

  // câmera: dolly lento → macro no detalhe da borda
  const d = lerp(6.7, 5.35, ease.inOutSine(prog(t, A3.phoneIn, A3.macro + 0.4)));
  const wide = { pos: [0, 0.07, d], target: [0, 0.0, 0] };
  const m = ease.inOutCubic(prog(t, A3.macro, A3.macro + 1.45));
  const tgtV = phone.localToWorld(0.3, 0.36, FRONT_Z * 0.5);
  const tgt = [tgtV.x, tgtV.y, tgtV.z];
  const macroPos = [tgt[0] + 0.5, tgt[1] + 0.12, tgt[2] + 1.05];
  const pos = lerp3(wide.pos, macroPos, m);
  const target = lerp3(wide.target, tgt, m);
  phone.setCamera(pos, target, lerp(28, 30, m));
  const gl = phone.render(m < 0.6);

  const entryBlur = 24 * (1 - ease.outCubic(prog(t, A3.phoneIn, A3.phoneIn + 1.0)));
  const rack = ease.inOutCubic(prog(t, A3.rack, A3.rack + 0.75));
  const rackBlur = 32 * rack;
  const alpha = clamp(prog(t, A3.phoneIn, A3.phoneIn + 0.5)) * (1 - 0.6 * rack) * (1 - ease.inOutSine(prog(t, A3.word2 + 0.5, A3.word2 + 1.25)));

  // reflexo no piso
  if (m < 0.6) {
    const fy = phone.projectXYZ(0, FLOOR_Y, 0);
    const rctx = reflBuf.getContext('2d');
    rctx.clearRect(0, 0, W, H);
    rctx.drawImage(phone.reflCanvas, 0, 0);
    rctx.globalCompositeOperation = 'destination-in';
    const g = rctx.createLinearGradient(0, fy[1], 0, fy[1] + 520);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    rctx.fillStyle = g;
    rctx.fillRect(0, 0, W, H);
    rctx.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.globalAlpha = 0.2 * alpha * (1 - m / 0.6) * li;
    ctx.filter = `blur(${(4 + entryBlur + rackBlur).toFixed(1)}px)`;
    ctx.drawImage(reflBuf, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  const blur = entryBlur + rackBlur;
  if (blur > 0.5) {
    ctx.filter = `blur(${blur.toFixed(1)}px)`;
    ctx.drawImage(gl, 0, 0);
    ctx.filter = 'none';
  } else {
    ctx.drawImage(gl, 0, 0);
    // profundidade de campo rasa no macro
    if (m > 0.02) {
      const [fx, fy] = phone.project(tgtV);
      const dctx = dofBuf.getContext('2d');
      dctx.clearRect(0, 0, W, H);
      dctx.filter = `blur(${(18 * m).toFixed(1)}px)`;
      dctx.drawImage(gl, 0, 0);
      dctx.filter = 'none';
      dctx.globalCompositeOperation = 'destination-out';
      const rg = dctx.createRadialGradient(fx, fy, 160, fx, fy, 760);
      rg.addColorStop(0, 'rgba(0,0,0,1)');
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      dctx.fillStyle = rg;
      dctx.fillRect(0, 0, W, H);
      dctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(dofBuf, 0, 0);
    }
  }
  ctx.restore();
}

// ── cena C: "Feita sob medida." + números ───────────────────
function drawPanels(ctx, t) {
  const cfg = [
    // painel, x, y inicial, escala, velocidade px/s, desfoque, início
    [0, -150, 1580, 0.5, 120, 14, A3.rack - 0.05],
    [1, 800, 1520, 0.34, 70, 4, A3.rack + 0.1],
    [2, 600, 300, 0.26, 40, 7, A3.rack + 0.2],
  ];
  for (const [pi, x, y0, s, v, b, st] of cfg) {
    const lt = t - st;
    if (lt < 0 || lt > 2.2) continue;
    const a = ease.inOutSine(clamp(lt / 0.6)) * (1 - ease.inOutSine(prog(lt, 1.3, 2.2)));
    if (a <= 0.01) continue;
    const y = y0 - v * lt - 40 * ease.outCubic(clamp(lt / 1.5));
    const w = SW * s, h = SH * s * 0.75;
    ctx.save();
    ctx.globalAlpha = 0.5 * a;
    ctx.filter = `blur(${b}px)`;
    rr(ctx, x, y, w, h, 28 * s);
    ctx.clip();
    ctx.drawImage(panels[pi], 0, 0, SW, SH * 0.75, x, y, w, h);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.35 * a;
    ctx.filter = `blur(${b}px)`;
    rr(ctx, x, y, w, h, 28 * s);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
}

function sceneC(ctx, t) {
  if (t < A3.rack) return;
  drawPanels(ctx, t);
  const exitT = A3.end - 0.15;
  const lines = ['Feita sob', 'medida.'];
  const size = fitSize(ctx, lines, 900, 200, -2, 176);
  const y1 = 700;
  const z = 1 + 0.045 * ease.inOutSine(prog(t, A3.word2, A3.end + 0.3));
  ctx.save();
  ctx.translate(W / 2, 960);
  ctx.scale(z, z);
  ctx.translate(-W / 2, -960);
  focusText(ctx, t, [{ str: lines[0], y: y1 }, { str: lines[1], y: y1 + size * 1.08 }], {
    size,
    start: A3.word2,
    stagger: 0.045,
    dur: 1.0,
    lineDelay: 0.28,
    exitT,
    exitDur: 0.5,
  });

  const exit = ease.inOutCubic(prog(t, exitT, exitT + 0.5));
  // linha fina
  const lp = ease.inOutCubic(prog(t, A3.numbers - 0.25, A3.numbers + 0.55));
  const ly = 1010;
  ctx.fillStyle = `rgba(255,255,255,${0.28 * (1 - exit)})`;
  ctx.fillRect(W / 2 - 410 * lp, ly, 820 * lp, 1.5);

  // números contando
  const stats = [
    { x: 215, from: 0, to: 60, fmt: (v) => `${v}`, label: 'FPS' },
    { x: 540, from: 0, to: 100, fmt: (v) => `${v}%`, label: 'SOB MEDIDA' },
    { x: 865, from: 47, to: 0, fmt: (v) => `${v}`, label: 'TEMPLATES' },
  ];
  stats.forEach((s, i) => {
    const st = A3.numbers + i * 0.14;
    const a = ease.outCubic(prog(t, st, st + 0.6));
    if (a <= 0) return;
    const c = ease.outExpo(prog(t, st + 0.05, st + 1.75));
    const v = Math.round(lerp(s.from, s.to, c));
    ctx.save();
    ctx.globalAlpha = a * (1 - exit);
    const blur = (1 - a) * 14 + exit * 16;
    if (blur > 0.4) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    text(ctx, s.fmt(v), s.x, 1188 + (1 - a) * 22, { font: `200 132px ${DISPLAY}`, color: '#f4f4f6', align: 'center', spacing: -3 });
    text(ctx, s.label, s.x + 3, 1266 + (1 - a) * 22, { font: `500 28px ${INTER}`, color: '#9a9aa2', align: 'center', spacing: 6 });
    ctx.restore();
    if (i > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.14 * a * (1 - exit)})`;
      ctx.fillRect(s.x - 165, 1085, 1.5, 200);
    }
  });
  ctx.restore();
}

export function renderAct3(ctx, f) {
  const t = f / FPS;
  const li = lightLevel(t);
  ctx.save();
  studioBg(ctx, li);
  dust(ctx, t, li);
  sceneA(ctx, t);
  sceneB(ctx, t, li);
  sceneC(ctx, t);
  vignette(ctx, 0.55);
  drawGrain(ctx, f, 0.07);
  ctx.restore();
}
