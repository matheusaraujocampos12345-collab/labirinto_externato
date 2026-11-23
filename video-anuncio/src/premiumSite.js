// O site premium exibido na tela do smartphone (marca fictícia "HALO").
import { clamp, prog, ease, lerp, rr, text } from './util.js';

export const SW = 740;
export const SH = 1584;
const DISPLAY = '"Inter Display", "Inter", sans-serif';
const INTER = '"Inter", sans-serif';

function lamp(ctx, cx, cy, R, glow = 1) {
  ctx.save();
  // halo de luz
  const g = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 2.3);
  g.addColorStop(0, `rgba(255,176,96,${0.32 * glow})`);
  g.addColorStop(0.5, `rgba(255,140,60,${0.1 * glow})`);
  g.addColorStop(1, 'rgba(255,140,60,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - R * 2.4, cy - R * 2.4, R * 4.8, R * 4.8);
  // haste e base
  ctx.strokeStyle = '#3a3633';
  ctx.lineWidth = R * 0.035;
  ctx.beginPath();
  ctx.moveTo(cx, cy + R * 1.04);
  ctx.lineTo(cx, cy + R * 1.55);
  ctx.stroke();
  const bg = ctx.createLinearGradient(cx - R * 0.5, 0, cx + R * 0.5, 0);
  bg.addColorStop(0, '#1d1b1a');
  bg.addColorStop(0.5, '#5a534d');
  bg.addColorStop(1, '#1d1b1a');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 1.58, R * 0.5, R * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  // anel
  ctx.shadowColor = `rgba(255,170,90,${0.9 * glow})`;
  ctx.shadowBlur = R * 0.35;
  const rg = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rg.addColorStop(0, '#fff6e8');
  rg.addColorStop(0.45, '#ffd7a1');
  rg.addColorStop(1, '#ff9d45');
  ctx.strokeStyle = rg;
  ctx.lineWidth = R * 0.1;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = R * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.985, Math.PI * 1.05, Math.PI * 1.7);
  ctx.stroke();
  ctx.restore();
  // reflexo no chão
  const fg = ctx.createRadialGradient(cx, cy + R * 1.6, 0, cx, cy + R * 1.6, R * 1.2);
  fg.addColorStop(0, `rgba(255,170,90,${0.22 * glow})`);
  fg.addColorStop(1, 'rgba(255,170,90,0)');
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.ellipse(cx, cy + R * 1.6, R * 1.2, R * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

function maskLine(ctx, str, x, y, size, p, font, color = '#fff') {
  if (p <= 0) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, y - size * 1.0, SW, size * 1.25);
  ctx.clip();
  text(ctx, str, x, y + (1 - ease.outQuart(p)) * size * 1.2, { font, color, spacing: -1 });
  ctx.restore();
}

/**
 * @param ctx contexto 2D (SW×SH)
 * @param tau segundos desde que o celular entrou em cena
 */
export function drawPremiumSite(ctx, tau, opts = {}) {
  const { forceScroll } = opts;
  ctx.save();
  ctx.fillStyle = '#0a0a0b';
  ctx.fillRect(0, 0, SW, SH);
  const scroll = forceScroll ?? 1250 * ease.inOutCubic(prog(tau, 1.35, 3.25));

  ctx.save();
  ctx.translate(0, -scroll);
  // ── hero ──
  const lampY = 560 + scroll * 0.42; // parallax: o objeto anda mais devagar
  const glow = 0.9 + 0.1 * Math.sin(tau * 2.2);
  lamp(ctx, SW / 2, lampY, 190, glow);
  const hp1 = prog(tau, 0.25, 1.05), hp2 = prog(tau, 0.4, 1.2);
  maskLine(ctx, 'Luz que', 48, 1030, 112, hp1, `200 112px ${DISPLAY}`);
  maskLine(ctx, 'se move.', 48, 1150, 112, hp2, `200 112px ${DISPLAY}`);
  const sp = ease.outCubic(prog(tau, 0.75, 1.4));
  ctx.globalAlpha = sp;
  text(ctx, 'A nova luminária HALO. Edição 01.', 48, 1232 + (1 - sp) * 20, { font: `400 26px ${INTER}`, color: '#8d8d93' });
  rr(ctx, 48, 1280 + (1 - sp) * 20, 230, 70, 35);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, 'Conheça  →', 163, 1324 + (1 - sp) * 20, { font: `500 26px ${INTER}`, color: '#fff', align: 'center' });
  ctx.globalAlpha = 1;

  // ── seção 2 ──
  text(ctx, '01 — DESIGN', 48, 1520, { font: `500 22px ${INTER}`, color: '#7d7d84', spacing: 5 });
  const py = 1560;
  ctx.save();
  rr(ctx, 40, py, SW - 80, 600, 30);
  const pg = ctx.createLinearGradient(0, py, 0, py + 600);
  pg.addColorStop(0, '#2a1a0e');
  pg.addColorStop(1, '#0f0c0a');
  ctx.fillStyle = pg;
  ctx.fill();
  ctx.clip();
  lamp(ctx, SW / 2, py + 260 + (scroll - 900) * -0.22, 130, 1); // parallax interno
  ctx.restore();
  const s2 = clamp((scroll - 700) / 450);
  maskLine(ctx, 'Desenhada', 48, 2290, 96, s2, `200 96px ${DISPLAY}`);
  maskLine(ctx, 'para durar.', 48, 2392, 96, clamp(s2 * 1.15 - 0.15), `200 96px ${DISPLAY}`);
  ctx.restore();

  // ── barra superior fixa ──
  const navBg = ctx.createLinearGradient(0, 0, 0, 190);
  navBg.addColorStop(0, 'rgba(10,10,11,1)');
  navBg.addColorStop(0.75, 'rgba(10,10,11,0.85)');
  navBg.addColorStop(1, 'rgba(10,10,11,0)');
  ctx.fillStyle = navBg;
  ctx.fillRect(0, 0, SW, 190);
  text(ctx, '10:08', 64, 58, { font: `600 26px ${INTER}`, color: '#f2f2f2' });
  ctx.fillStyle = '#f2f2f2';
  for (let k = 0; k < 4; k++) {
    rr(ctx, 560 + k * 11, 50 - k * 5, 7, 6 + k * 5, 2);
    ctx.fill();
  }
  rr(ctx, 618, 36, 46, 22, 6);
  ctx.strokeStyle = '#f2f2f2';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, 621, 39, 32, 16, 3);
  ctx.fill();
  // câmera frontal (furo)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(SW / 2, 48, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b1b1d';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'HALO', 48, 146, { font: `300 34px ${DISPLAY}`, color: '#fff', spacing: 12 });
  ctx.fillStyle = '#fff';
  ctx.fillRect(626, 124, 66, 2);
  ctx.fillRect(646, 140, 46, 2);
  ctx.restore();
}
