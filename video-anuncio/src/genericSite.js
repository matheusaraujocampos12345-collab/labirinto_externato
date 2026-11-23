// O "site de template": sempre o mesmo layout. Só mudam logo e cor de destaque.
import { W, H, rr, text, rgba, luminance } from './util.js';

export const CHROME_H = 140;
const SANS = '"Liberation Sans", Arial, sans-serif';

export const VARIANTS = [
  { name: 'Nexora', logo: 0, accent: '#ff3d8b' },
  { name: 'Vortiq', logo: 1, accent: '#00d9ff' },
  { name: 'Lumora', logo: 2, accent: '#ffc21a' },
  { name: 'Zentrix', logo: 3, accent: '#2ff3a0' },
  { name: 'Flowbi', logo: 4, accent: '#ff7a2f' },
  { name: 'Synkra', logo: 5, accent: '#b6ff2e' },
  { name: 'Brivora', logo: 6, accent: '#ff52e5' },
  { name: 'Optiva', logo: 7, accent: '#5ce1ff' },
  { name: 'Elevra', logo: 8, accent: '#ffe14d' },
  { name: 'Novyx', logo: 9, accent: '#00f5c8' },
  { name: 'Qualix', logo: 3, accent: '#ff5d5d' },
  { name: 'Vertika', logo: 6, accent: '#d4b0ff' },
  { name: 'Kloudi', logo: 1, accent: '#7cff6b' },
  { name: 'Axora', logo: 8, accent: '#ff9ec7' },
];

// ── ícones ──────────────────────────────────────────────────
function logoIcon(ctx, type, cx, cy, s, color, bg) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.14;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const r = s / 2;
  ctx.beginPath();
  switch (type) {
    case 0: // círculo com ponto
      ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 1: // hexágono
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      }
      ctx.closePath();
      ctx.fill();
      break;
    case 2: // triângulo
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(r * 0.9, r * 0.75);
      ctx.lineTo(-r * 0.9, r * 0.75);
      ctx.closePath();
      ctx.fill();
      break;
    case 3: // quadrado arredondado com diagonal
      ctx.roundRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.4);
      ctx.fill();
      ctx.strokeStyle = bg;
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, r * 0.35);
      ctx.lineTo(r * 0.35, -r * 0.35);
      ctx.stroke();
      break;
    case 4: // losango
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.8, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.8, 0);
      ctx.closePath();
      ctx.fill();
      break;
    case 5: // barras
      for (let k = 0; k < 3; k++) ctx.roundRect(-r * 0.85 + k * r * 0.62, r * 0.8 - r * (0.6 + k * 0.5), r * 0.42, r * (0.6 + k * 0.5), r * 0.12);
      ctx.fill();
      break;
    case 6: // anel
      ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
      ctx.lineWidth = s * 0.22;
      ctx.stroke();
      break;
    case 7: // folha
      ctx.moveTo(-r * 0.8, r * 0.8);
      ctx.quadraticCurveTo(-r * 0.8, -r * 0.8, r * 0.8, -r * 0.8);
      ctx.quadraticCurveTo(r * 0.8, r * 0.8, -r * 0.8, r * 0.8);
      ctx.fill();
      break;
    case 8: // brilho de 4 pontas
      star4(ctx, 0, 0, r, r * 0.25);
      ctx.fill();
      break;
    case 9: // zigue-zague
      ctx.moveTo(-r * 0.8, -r * 0.7);
      ctx.lineTo(r * 0.8, -r * 0.7);
      ctx.lineTo(-r * 0.8, r * 0.7);
      ctx.lineTo(r * 0.8, r * 0.7);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function star4(ctx, x, y, R, r) {
  ctx.moveTo(x, y - R);
  ctx.quadraticCurveTo(x + r * 0.35, y - r * 0.35, x + R, y);
  ctx.quadraticCurveTo(x + r * 0.35, y + r * 0.35, x, y + R);
  ctx.quadraticCurveTo(x - r * 0.35, y + r * 0.35, x - R, y);
  ctx.quadraticCurveTo(x - r * 0.35, y - r * 0.35, x, y - R);
  ctx.closePath();
}

function sparkle(ctx, x, y, R, a = 1) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = R * 1.4;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  star4(ctx, x, y, R, R * 0.18);
  ctx.fill();
  ctx.restore();
}

function cardIcon(ctx, k, cx, cy, s) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 0.16;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (k === 0) {
    // raio
    ctx.moveTo(0.18, -1);
    ctx.lineTo(-0.6, 0.15);
    ctx.lineTo(-0.05, 0.15);
    ctx.lineTo(-0.22, 1);
    ctx.lineTo(0.6, -0.2);
    ctx.lineTo(0.05, -0.2);
    ctx.closePath();
    ctx.fill();
  } else if (k === 1) {
    // escudo
    ctx.moveTo(0, -0.95);
    ctx.lineTo(0.72, -0.62);
    ctx.lineTo(0.72, 0.02);
    ctx.quadraticCurveTo(0.72, 0.68, 0, 1);
    ctx.quadraticCurveTo(-0.72, 0.68, -0.72, 0.02);
    ctx.lineTo(-0.72, -0.62);
    ctx.closePath();
    ctx.fill();
  } else {
    // gráfico subindo
    ctx.roundRect(-0.8, 0.15, 0.36, 0.75, 0.08);
    ctx.roundRect(-0.18, -0.25, 0.36, 1.15, 0.08);
    ctx.roundRect(0.44, -0.75, 0.36, 1.65, 0.08);
    ctx.fill();
  }
  ctx.restore();
}

// ── bolhas 3D brilhantes ─────────────────────────────────────
const BUBBLES = [
  [40, -70, 170, 0],
  [-220, -20, 122, 1],
  [240, 75, 112, 2],
  [-75, 150, 128, 2],
  [160, 230, 64, 1],
  [-285, 205, 56, 0],
  [330, -150, 50, 1],
  [-150, -215, 38, 2],
];
const BPAL = [
  ['#fff0fe', '#f59bff', '#9a45ff', '#3b138f'],
  ['#effcff', '#8fe1ff', '#4f6bff', '#1d2190'],
  ['#fff3f8', '#ffa6d6', '#c447ff', '#4d118c'],
];

function bubble(ctx, x, y, r, pal) {
  ctx.save();
  // corpo
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.42, r * 0.04, x, y, r * 1.02);
  g.addColorStop(0, pal[0]);
  g.addColorStop(0.32, pal[1]);
  g.addColorStop(0.74, pal[2]);
  g.addColorStop(1, pal[3]);
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(40,10,120,0.45)';
  ctx.shadowBlur = r * 0.5;
  ctx.shadowOffsetY = r * 0.25;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // reflexo iridescente
  ctx.save();
  ctx.clip();
  ctx.globalCompositeOperation = 'screen';
  const g2 = ctx.createRadialGradient(x + r * 0.15, y + r * 0.2, r * 0.55, x, y, r * 1.0);
  g2.addColorStop(0, 'rgba(90,255,250,0)');
  g2.addColorStop(1, 'rgba(110,255,245,0.65)');
  ctx.fillStyle = g2;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  const g3 = ctx.createLinearGradient(x - r, y + r, x + r, y - r);
  g3.addColorStop(0, 'rgba(255,120,200,0.35)');
  g3.addColorStop(0.5, 'rgba(255,255,255,0)');
  ctx.fillStyle = g3;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
  // brilho especular
  const h = ctx.createRadialGradient(x - r * 0.38, y - r * 0.45, 0, x - r * 0.38, y - r * 0.45, r * 0.45);
  h.addColorStop(0, 'rgba(255,255,255,0.98)');
  h.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  h.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = h;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.45, r * 0.45, r * 0.32, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.45, y - r * 0.52, r * 0.1, r * 0.06, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r - 1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ── página ──────────────────────────────────────────────────
const HERO_H = 1330;

function drawHero(ctx, v, t) {
  // fundo degradê roxo-azul
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, HERO_H - 40);
  ctx.bezierCurveTo(780, HERO_H + 70, 320, HERO_H - 90, 0, HERO_H + 30);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, W, HERO_H);
  g.addColorStop(0, '#7a2ff2');
  g.addColorStop(0.5, '#5b47f5');
  g.addColorStop(1, '#2e78ff');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // manchas de luz (brilho exagerado)
  const b1 = ctx.createRadialGradient(920, 260, 0, 920, 260, 520);
  b1.addColorStop(0, 'rgba(255,110,220,0.55)');
  b1.addColorStop(1, 'rgba(255,110,220,0)');
  ctx.fillStyle = b1;
  ctx.fillRect(0, 0, W, HERO_H + 100);
  const b2 = ctx.createRadialGradient(80, 1000, 0, 80, 1000, 560);
  b2.addColorStop(0, 'rgba(0,225,255,0.42)');
  b2.addColorStop(1, 'rgba(0,225,255,0)');
  ctx.fillStyle = b2;
  ctx.fillRect(0, 0, W, HERO_H + 100);
  ctx.restore();

  // nav
  logoIcon(ctx, v.logo, 92, 72, 50, '#ffffff', '#6a3cf3');
  text(ctx, v.name, 132, 88, { font: `bold 42px ${SANS}`, color: '#fff' });
  ctx.fillStyle = '#fff';
  for (let k = 0; k < 3; k++) {
    rr(ctx, 960, 52 + k * 16, 60, 7, 4);
    ctx.fill();
  }

  // selo
  ctx.save();
  ctx.font = `bold 28px ${SANS}`;
  const label = 'Novo: soluções com IA';
  const lw = ctx.measureText(label).width + 90;
  rr(ctx, W / 2 - lw / 2, 196, lw, 62, 31);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = v.accent;
  ctx.beginPath();
  star4(ctx, W / 2 - lw / 2 + 38, 227, 15, 3);
  ctx.fill();
  text(ctx, label, W / 2 + 20, 237, { font: `bold 28px ${SANS}`, color: '#fff', align: 'center' });
  ctx.restore();

  // título
  ctx.save();
  ctx.shadowColor = 'rgba(30,10,90,0.35)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 6;
  text(ctx, 'Eleve seu negócio', W / 2, 432, { font: `bold 94px ${SANS}`, color: '#fff', align: 'center' });
  text(ctx, 'ao próximo nível', W / 2, 537, { font: `bold 94px ${SANS}`, color: v.accent, align: 'center' });
  ctx.restore();

  // subtítulo
  text(ctx, 'Soluções inovadoras e tecnologia de ponta', W / 2, 618, { font: `36px ${SANS}`, color: 'rgba(255,255,255,0.86)', align: 'center' });
  text(ctx, 'para transformar a sua empresa.', W / 2, 664, { font: `36px ${SANS}`, color: 'rgba(255,255,255,0.86)', align: 'center' });

  // botão "Comece agora"
  const bw = 500, bh = 112, bx = W / 2 - bw / 2, by = 718;
  ctx.save();
  ctx.shadowColor = rgba(v.accent, 0.75);
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 12;
  rr(ctx, bx, by, bw, bh, bh / 2);
  const bg = ctx.createLinearGradient(bx, by, bx, by + bh);
  bg.addColorStop(0, v.accent);
  bg.addColorStop(1, v.accent);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  // brilho "glossy"
  ctx.clip();
  const gl = ctx.createLinearGradient(0, by, 0, by + bh);
  gl.addColorStop(0, 'rgba(255,255,255,0.45)');
  gl.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  gl.addColorStop(0.51, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fillRect(bx, by, bw, bh);
  // reflexo passando
  const sx = bx - 200 + ((t * 700) % (bw + 400));
  const sh = ctx.createLinearGradient(sx - 60, 0, sx + 60, 0);
  sh.addColorStop(0, 'rgba(255,255,255,0)');
  sh.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh;
  ctx.fillRect(bx, by, bw, bh);
  ctx.restore();
  const dark = luminance(v.accent) > 0.6;
  text(ctx, 'Comece agora  →', W / 2, by + 72, { font: `bold 42px ${SANS}`, color: dark ? '#1a1240' : '#fff', align: 'center' });
  text(ctx, 'Grátis por 14 dias • Sem cartão de crédito', W / 2, by + bh + 46, { font: `26px ${SANS}`, color: 'rgba(255,255,255,0.7)', align: 'center' });

  // ilustração de bolhas 3D
  const cx = W / 2, cy = 1135;
  // anel brilhante atrás
  ctx.save();
  ctx.translate(cx, cy + 20);
  ctx.rotate(-0.35);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 400, 120, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  BUBBLES.forEach(([dx, dy, r, p], k) => {
    const fy = Math.sin(t * 1.7 + k * 1.3) * 9;
    bubble(ctx, cx + dx, cy + dy + fy, r, BPAL[p]);
  });
  sparkle(ctx, cx - 300, cy - 190, 26, 0.9);
  sparkle(ctx, cx + 360, cy + 40, 20, 0.8);
  sparkle(ctx, cx + 110, cy - 300, 16, 0.8);
  sparkle(ctx, cx - 30, cy + 270, 14, 0.7);
}

const CARDS = [
  ['Rápido', 'Resultados em', 'tempo recorde.'],
  ['Seguro', 'Proteção total', 'para seus dados.'],
  ['Escalável', 'Cresça sem', 'limites.'],
];

function drawBelow(ctx, v, scroll) {
  // cards
  const cw = 312, ch = 360, gap = 22, x0 = (W - (cw * 3 + gap * 2)) / 2, y0 = 1335;
  CARDS.forEach(([title, l1, l2], k) => {
    const x = x0 + k * (cw + gap);
    ctx.save();
    ctx.shadowColor = 'rgba(60,40,150,0.22)';
    ctx.shadowBlur = 44;
    ctx.shadowOffsetY = 16;
    rr(ctx, x, y0, cw, ch, 34);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    const icx = x + cw / 2, icy = y0 + 92;
    const ig = ctx.createLinearGradient(icx - 56, icy - 56, icx + 56, icy + 56);
    ig.addColorStop(0, v.accent);
    ig.addColorStop(1, '#6a3cf3');
    ctx.fillStyle = ig;
    ctx.beginPath();
    ctx.arc(icx, icy, 56, 0, Math.PI * 2);
    ctx.fill();
    cardIcon(ctx, k, icx, icy, 28);
    text(ctx, title, icx, y0 + 214, { font: `bold 40px ${SANS}`, color: '#1b1740', align: 'center' });
    text(ctx, l1, icx, y0 + 268, { font: `26px ${SANS}`, color: '#6c6896', align: 'center' });
    text(ctx, l2, icx, y0 + 302, { font: `26px ${SANS}`, color: '#6c6896', align: 'center' });
  });

  // prova social
  text(ctx, 'Mais de 10.000 empresas', W / 2, 1830, { font: `bold 56px ${SANS}`, color: '#1b1740', align: 'center' });
  text(ctx, 'confiam na ' + v.name, W / 2, 1896, { font: `bold 56px ${SANS}`, color: '#1b1740', align: 'center' });
  for (let k = 0; k < 4; k++) {
    const x = 70 + k * 240;
    ctx.fillStyle = '#d9d6ee';
    ctx.beginPath();
    ctx.arc(x + 30, 1990, 22, 0, Math.PI * 2);
    ctx.fill();
    rr(ctx, x + 62, 1978, 130, 24, 12);
    ctx.fill();
  }
  // faixa de números
  ctx.save();
  rr(ctx, 45, 2080, W - 90, 300, 40);
  const g = ctx.createLinearGradient(45, 2080, W - 45, 2380);
  g.addColorStop(0, '#7a2ff2');
  g.addColorStop(1, '#2e78ff');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
  [['98%', 'satisfação'], ['24/7', 'suporte'], ['+10k', 'clientes']].forEach(([n, l], k) => {
    const x = 45 + (W - 90) * ((k + 0.5) / 3);
    text(ctx, n, x, 2225, { font: `bold 76px ${SANS}`, color: '#fff', align: 'center' });
    text(ctx, l, x, 2285, { font: `30px ${SANS}`, color: 'rgba(255,255,255,0.8)', align: 'center' });
  });
  // depoimento
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,150,0.18)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  rr(ctx, 45, 2450, W - 90, 330, 36);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = v.accent;
  for (let k = 0; k < 5; k++) {
    ctx.beginPath();
    star4(ctx, 110 + k * 48, 2520, 20, 6);
    ctx.fill();
  }
  text(ctx, '“Simplesmente incrível! Mudou', 100, 2610, { font: `italic 38px ${SANS}`, color: '#1b1740' });
  text(ctx, 'completamente a nossa empresa.”', 100, 2660, { font: `italic 38px ${SANS}`, color: '#1b1740' });
  const ag = ctx.createLinearGradient(100, 2690, 160, 2750);
  ag.addColorStop(0, v.accent);
  ag.addColorStop(1, '#6a3cf3');
  ctx.fillStyle = ag;
  ctx.beginPath();
  ctx.arc(130, 2722, 30, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, 'Ana P., CEO', 180, 2734, { font: `bold 30px ${SANS}`, color: '#6c6896' });
}

function drawChrome(ctx, v) {
  ctx.fillStyle = '#f2f2f6';
  ctx.fillRect(0, 0, W, CHROME_H);
  text(ctx, '10:08', 56, 46, { font: `bold 30px ${SANS}`, color: '#111' });
  // ícones de status
  ctx.fillStyle = '#111';
  for (let k = 0; k < 4; k++) {
    rr(ctx, 880 + k * 13, 40 - k * 6, 9, 8 + k * 6, 2);
    ctx.fill();
  }
  rr(ctx, 952, 24, 54, 26, 7);
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  rr(ctx, 956, 28, 38, 18, 4);
  ctx.fill();
  // barra de endereço
  rr(ctx, 36, 68, W - 72, 60, 30);
  ctx.fillStyle = '#e3e3ea';
  ctx.fill();
  // cadeado
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(80, 92, 8, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#555';
  rr(ctx, 69, 92, 22, 18, 3);
  ctx.fill();
  text(ctx, v.name.toLowerCase() + '.com.br', W / 2, 108, { font: `30px ${SANS}`, color: '#333', align: 'center' });
}

/** Desenha o site genérico (viewport 1080×1920) com rolagem. */
export function drawGenericSite(ctx, v, scroll, t) {
  ctx.save();
  ctx.fillStyle = '#f4f3ff';
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.rect(0, CHROME_H, W, H - CHROME_H);
  ctx.clip();
  ctx.translate(0, CHROME_H - scroll);
  if (scroll < HERO_H + 80) drawHero(ctx, v, t);
  drawBelow(ctx, v, scroll);
  ctx.restore();
  drawChrome(ctx, v);
}
