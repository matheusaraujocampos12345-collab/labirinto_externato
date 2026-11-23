// "Silêncio de rádio" — aviso de que a MACH sumiu porque está num projeto gigante.
// Gera: post-silencio-4x5.png (feed) e story-silencio-9x16.mp4 (story/Reels, 8 s, radar girando).
// Uso: node anuncio-silencio/gerar.mjs   (requer Playwright e ffmpeg)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}
const ROOT = path.dirname(fileURLToPath(import.meta.url));

const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wght@300;400&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>html,body{margin:0;background:#0a0c0f}canvas{display:block}</style></head><body><canvas id="c"></canvas>
<script>
const LETRAS = new Path2D('M0 100 V0 L55 72 L110 0 V100 M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 M420 0 V100 M520 0 V100 M420 50 H520');
const LAMBDA = new Path2D('M137.68 108 L196 0 L254.32 108');
const C = { estrato: '#0a0c0f', aluminio: '#dfe3e7', aluminio2: '#b9c0c7', nevoa: '#8a929b', linha: '#252b32', laranja: '#ff6b1a' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
let cv, x, W, H, L;

function setup(modo) {
  cv = document.getElementById('c');
  W = 1080; H = modo === 'story' ? 1920 : 1350;
  cv.width = W; cv.height = H; x = cv.getContext('2d');
  L = modo === 'story'
    ? { topo: 230, cy: 800, R: 420, h1: 1390, corpo: 1480, rod: 1640, h1t: 96 }
    : { topo: 70, cy: 520, R: 330, h1: 1000, corpo: 1080, rod: 1230, h1t: 84 };
}

function texto(str, px, py, font, cor, align = 'left', spacing = 0) {
  x.font = font; x.fillStyle = cor; x.textAlign = align; x.letterSpacing = spacing + 'px'; x.fillText(str, px, py); x.letterSpacing = '0px';
}
function mascara(str, px, py, font, cor, p, align = 'center') {
  if (p <= 0) return;
  const tam = parseInt(font.match(/(\\d+)px/)[1], 10);
  x.save(); x.beginPath(); x.rect(0, py - tam * 1.05, W, tam * 1.35); x.clip();
  texto(str, px, py + (1 - easeOut(p)) * tam * 1.3, font, cor, align); x.restore();
}

// blips secundários: [ângulo°, raio relativo]
const BLIPS = [[118, 0.72], [205, 0.38], [262, 0.83], [320, 0.6], [160, 0.9]];
const ALVO = [38, 0.56];

function quadro(t) {
  const { cy, R } = L, cx = W / 2;
  // fundo
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d1118'); g.addColorStop(1, C.estrato);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(223,227,231,0.035)'; x.lineWidth = 1;
  for (let gx = 0; gx <= W; gx += 60) { x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
  for (let gy = 0; gy <= H; gy += 60) { x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }

  // topo: logo + rótulo
  x.save(); x.translate(96, L.topo); x.scale(0.25, 0.25);
  x.lineWidth = 9; x.lineJoin = 'miter'; x.lineCap = 'square'; x.strokeStyle = C.aluminio; x.stroke(LETRAS);
  x.beginPath(); x.rect(-40, -40, 620, 143.5); x.clip(); x.lineCap = 'butt'; x.strokeStyle = C.laranja; x.stroke(LAMBDA); x.restore();
  texto('SILÊNCIO DE RÁDIO', W - 96, L.topo + 22, '500 22px "JetBrains Mono"', C.laranja, 'right', 3);

  const surge = easeOut(prog(t, 0, 0.8));
  // anéis e retícula
  x.save(); x.globalAlpha = surge;
  for (let k = 1; k <= 4; k++) {
    x.strokeStyle = k === 4 ? 'rgba(223,227,231,0.35)' : 'rgba(223,227,231,0.14)'; x.lineWidth = k === 4 ? 2 : 1;
    x.beginPath(); x.arc(cx, cy, R * k / 4 * (0.9 + 0.1 * surge), 0, Math.PI * 2); x.stroke();
  }
  x.strokeStyle = 'rgba(223,227,231,0.12)';
  x.beginPath(); x.moveTo(cx - R, cy); x.lineTo(cx + R, cy); x.moveTo(cx, cy - R); x.lineTo(cx, cy + R); x.stroke();
  for (let a = 0; a < 360; a += 5) {
    const r = (a % 30 === 0 ? 22 : 10), ang = (a - 90) * Math.PI / 180;
    x.strokeStyle = a % 30 === 0 ? 'rgba(223,227,231,0.5)' : 'rgba(223,227,231,0.22)';
    x.beginPath(); x.moveTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); x.lineTo(cx + Math.cos(ang) * (R + r), cy + Math.sin(ang) * (R + r)); x.stroke();
  }
  [['000', 0], ['090', 90], ['180', 180], ['270', 270]].forEach(([s, a]) => {
    const ang = (a - 90) * Math.PI / 180, rr = R + 52;
    texto(s, cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr + 8, '400 20px "JetBrains Mono"', C.nevoa, 'center');
  });
  x.restore();

  // varredura (uma volta a cada 4 s)
  const giro = ((t / 4) % 1) * 360; // graus a partir do norte, sentido horário
  const angV = (giro - 90) * Math.PI / 180;
  if (x.createConicGradient) {
    const cg = x.createConicGradient(angV - Math.PI * 0.42, cx, cy);
    cg.addColorStop(0, 'rgba(255,107,26,0)'); cg.addColorStop(0.21, 'rgba(255,107,26,0.30)'); cg.addColorStop(0.2101, 'rgba(255,107,26,0)'); cg.addColorStop(1, 'rgba(255,107,26,0)');
    x.save(); x.globalAlpha = surge; x.fillStyle = cg; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill(); x.restore();
  }
  x.save(); x.globalAlpha = surge; x.strokeStyle = C.laranja; x.lineWidth = 2.5;
  x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(angV) * R, cy + Math.sin(angV) * R); x.stroke(); x.restore();

  // brilho de cada alvo decai depois que a varredura passa
  const brilho = (a) => { const d = ((giro - a) % 360 + 360) % 360; const desde = d / 360 * 4; return t < (a / 360) * 4 ? 0 : Math.exp(-desde * 1.1); };
  BLIPS.forEach(([a, r]) => {
    const b = brilho(a); if (b <= 0.01) return;
    const ang = (a - 90) * Math.PI / 180, bx = cx + Math.cos(ang) * R * r, by = cy + Math.sin(ang) * R * r;
    x.fillStyle = 'rgba(223,227,231,' + (0.15 + 0.6 * b) + ')'; x.beginPath(); x.arc(bx, by, 5, 0, Math.PI * 2); x.fill();
  });
  // alvo principal
  const [aA, rA] = ALVO, angA = (aA - 90) * Math.PI / 180;
  const ax = cx + Math.cos(angA) * R * rA, ay = cy + Math.sin(angA) * R * rA;
  const bA = brilho(aA), visto = t >= (aA / 360) * 4 || t > 7.9;
  if (visto) {
    const pulso = (((giro - aA) % 360 + 360) % 360) / 360;
    x.strokeStyle = 'rgba(255,107,26,' + (0.6 * (1 - pulso)) + ')'; x.lineWidth = 2;
    x.beginPath(); x.arc(ax, ay, 18 + pulso * 70, 0, Math.PI * 2); x.stroke();
    x.save(); x.translate(ax, ay); x.fillStyle = C.laranja; x.shadowColor = 'rgba(255,107,26,0.9)'; x.shadowBlur = 20 * (0.4 + bA);
    x.beginPath(); x.moveTo(0, -18); x.lineTo(12, 0); x.lineTo(0, 18); x.lineTo(-12, 0); x.closePath(); x.fill(); x.restore();
    // etiqueta
    const ex = ax + 40, ey = ay - 96, ew = 300, eh = 104;
    const ap = easeOut(prog(t, (aA / 360) * 4, (aA / 360) * 4 + 0.4));
    x.save(); x.globalAlpha = t > 7.9 ? 1 : ap;
    x.strokeStyle = 'rgba(255,107,26,0.7)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(ax + 14, ay - 14); x.lineTo(ex, ey + eh); x.stroke();
    x.fillStyle = 'rgba(10,12,15,0.88)'; x.fillRect(ex, ey, ew, eh); x.strokeRect(ex, ey, ew, eh);
    texto('PROJETO GIGANTE', ex + 18, ey + 36, '500 22px "JetBrains Mono"', C.aluminio, 'left', 1);
    x.fillStyle = C.aluminio; x.fillRect(ex + 18, ey + 50, 190, 16);
    texto('EM MONTAGEM', ex + 18, ey + 90, '400 19px "JetBrains Mono"', C.laranja, 'left', 2);
    x.restore();
  }

  // textos
  mascara('Silêncio de rádio.', cx, L.h1, '300 ' + L.h1t + 'px "Saira"', C.aluminio, prog(t, 0.9, 1.6));
  const corpo = ['A gente sumiu porque está', 'construindo algo gigante no hangar.'];
  corpo.forEach((ln, i) => mascara(ln, cx, L.corpo + i * 50, '400 38px "Hanken Grotesk"', C.aluminio2, prog(t, 1.5 + i * 0.12, 2.2 + i * 0.12)));
  x.save(); x.globalAlpha = prog(t, 2.4, 2.9);
  texto('EM BREVE  ·  @MACH.SITES', cx, L.rod, '500 24px "JetBrains Mono"', C.nevoa, 'center', 3);
  x.restore();
}

window.prepara = async (modo) => {
  setup(modo);
  await Promise.all(['300 80px Saira', '400 38px "Hanken Grotesk"', '500 22px "JetBrains Mono"', '400 20px "JetBrains Mono"'].map((f) => document.fonts.load(f, 'Aaçã')));
  return true;
};
window.desenha = (t) => { quadro(t); return true; };
</script></body></html>`;

fs.writeFileSync(path.join(ROOT, 'silencio.html'), html);
const browser = await playwright.chromium.launch();

// post estático
{
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(ROOT, 'silencio.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => window.prepara('post'));
  await page.evaluate(() => window.desenha(8.5)); // varredura logo depois do alvo
  await page.locator('#c').screenshot({ path: path.join(ROOT, 'post-silencio-4x5.png') });
  await page.close();
  console.log('post-silencio-4x5.png');
}

// story animado
{
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(ROOT, 'silencio.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => window.prepara('story'));
  const fps = 30, dur = 8;
  const ff = spawn('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart',
    path.join(ROOT, 'story-silencio-9x16.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < fps * dur; f++) {
    const url = await page.evaluate((t) => { window.desenha(t); return document.getElementById('c').toDataURL('image/png'); }, f / fps);
    const ok = ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'));
    if (!ok) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  console.log('story-silencio-9x16.mp4');
}
await browser.close();
fs.unlinkSync(path.join(ROOT, 'silencio.html'));
