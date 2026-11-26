// Efeito do dia 03, versão elaborada (20 s): "Cartão 3D que inclina", explicado.
// 1) o cartão grande segue o dedo; 2) "por dentro": o cartão se desmonta em 4 camadas (sombra, base, texto,
// reflexo) numa vista em 3D; 3) os três números do efeito (12°, 8°, 900 px); 4) o cartão no site da
// Barbearia Navalha (conceito); 5) "Quer o prompt? Comenta PROMPT."
import { clamp, lerp, prog, ease } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, dedo, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';
import { JAN, BARRA, CH, TITANIO, EXP, TXT, MONO, texto, tela } from './catalogo.js';
import { ITENS } from './i15.js';

const DUR = 20;
const CX = 540, CY = 1010, CW = 800, CHC = 490, S = 2;
const A2 = 5.2, A3 = 10.6, A4 = 14.0, A5 = 17.4;
const JY = 660; // janela do site: o cartão do site fica no mesmo centro do cartão grande

let tex = null;
function texturas() {
  const mk = (fn) => {
    const c = tela(CW * S, CHC * S), g = c.getContext('2d');
    g.scale(S, S);
    fn(g);
    return c;
  };
  tex = {
    base: mk((g) => {
      g.beginPath();
      g.roundRect(0, 0, CW, CHC, 40);
      const fg = g.createLinearGradient(0, 0, CW, CHC);
      fg.addColorStop(0, '#2B323B');
      fg.addColorStop(1, '#14181D');
      g.fillStyle = fg;
      g.fill();
      g.strokeStyle = 'rgba(223,227,231,0.25)';
      g.lineWidth = 2.5;
      g.strokeRect(26, 26, CW - 52, CHC - 52);
    }),
    texto: mk((g) => {
      texto(g, 'NAVALHA', 62, 166, EXP(64), COR.aluminio, { esp: 7 });
      g.fillStyle = COR.laranja;
      g.fillRect(62, 266, 116, 5);
      texto(g, 'Corte e barba ilimitados', 62, 352, TXT(36), COR.aluminio);
      texto(g, 'MEMBRO 0427 · DESDE 2026', 62, 414, MONO(25), COR.nevoa, { esp: 4 });
    }),
    sombra: mk((g) => {
      g.filter = 'blur(26px)';
      g.fillStyle = 'rgba(0,0,0,0.75)';
      g.beginPath();
      g.roundRect(60, 60, CW - 120, CHC - 120, 40);
      g.fill();
    }),
  };
  tex.mistura = tela(CW * S, CHC * S);
}
function reflexo(g, gx, gy, alfa = 1) {
  g.save();
  g.beginPath();
  g.roundRect(0, 0, CW, CHC, 40);
  g.clip();
  const gl = g.createRadialGradient(gx, gy, 0, gx, gy, CW * 0.7);
  gl.addColorStop(0, `rgba(255,255,255,${0.24 * alfa})`);
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl;
  g.fillRect(0, 0, CW, CHC);
  g.restore();
}

/** cartão inteiro inclinado (rx, ry), com perspectiva, desenhado em fatias verticais */
function cartao(ctx, rx, ry, op = {}) {
  const esc = op.escala ?? 1, cx = op.cx ?? CX, cy = op.cy ?? CY, a = op.alfa ?? 1;
  if (a <= 0) return;
  const m = tex.mistura.getContext('2d');
  m.setTransform(S, 0, 0, S, 0, 0);
  m.clearRect(0, 0, CW, CHC);
  m.drawImage(tex.base, 0, 0, CW, CHC);
  m.drawImage(tex.texto, 0, 0, CW, CHC);
  reflexo(m, CW * (0.5 - ry * 1.3), CHC * (0.5 + rx * 1.3));
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.save();
  ctx.filter = `blur(${30 * esc}px)`;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.ellipse(cx - ry * 140 * esc, cy + (CHC / 2 + 46) * esc, CW * 0.42 * esc, 34 * esc, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const D = 1700, N = 96, w = CW * esc, h = CHC * esc;
  const proj = (x, y) => {
    const X = x * Math.cos(ry) + y * Math.sin(rx) * Math.sin(ry);
    const Y = y * Math.cos(rx);
    const Z = -x * Math.sin(ry) + y * Math.sin(rx) * Math.cos(ry);
    const k = D / (D + Z);
    return [cx + X * k, cy + Y * k];
  };
  for (let i = 0; i < N; i++) {
    const x0 = -w / 2 + (w * i) / N, x1 = x0 + w / N;
    const [ax, ay] = proj(x0, -h / 2), [, by] = proj(x0, h / 2), [bx] = proj(x1, -h / 2);
    ctx.drawImage(tex.mistura, (i * tex.mistura.width) / N, 0, tex.mistura.width / N, tex.mistura.height, ax, ay, Math.max(1, bx - ax + 0.6), by - ay);
  }
  ctx.restore();
}

/** vista "explodida": cada camada num plano, em projeção ortográfica (sem perspectiva) */
function explodido(ctx, t) {
  const gira = ease.inOutCubic(prog(t, A2 + 0.1, A2 + 1.2)) * (1 - ease.inOutCubic(prog(t, A3 - 0.75, A3)));
  const sep = ease.inOutCubic(prog(t, A2 + 0.9, A2 + 2.0)) * (1 - ease.inOutCubic(prog(t, A3 - 1.05, A3 - 0.35)));
  const th = -0.95 * gira, ph = (-0.5 + 0.08 * Math.sin((t - A2) * 0.9)) * gira;
  const esc = lerp(1, 0.78, gira);
  const P = (x, y, z) => {
    const y1 = y * Math.cos(th) - z * Math.sin(th), z1 = y * Math.sin(th) + z * Math.cos(th);
    const x2 = x * Math.cos(ph) + z1 * Math.sin(ph);
    return [CX + x2 * esc, CY + 130 * gira + y1 * esc];
  };
  const camadas = [
    ['SOMBRA', -0.9, (g) => g.drawImage(tex.sombra, 0, 0, CW, CHC)],
    ['BASE', 0, (g) => g.drawImage(tex.base, 0, 0, CW, CHC)],
    ['TEXTO', 1, (g) => g.drawImage(tex.texto, 0, 0, CW, CHC)],
    ['REFLEXO', 2, (g) => reflexo(g, CW * 0.35, CHC * 0.3, 1.6)],
  ];
  const rotulos = [];
  for (const [nome, k, desenha] of camadas) {
    const z = -k * 170 * sep; // para cima na tela = mais perto de quem olha
    const [ox, oy] = P(-CW / 2, -CHC / 2, z), [ux, uy] = P(-CW / 2 + 1, -CHC / 2, z), [vx, vy] = P(-CW / 2, -CHC / 2 + 1, z);
    ctx.save();
    ctx.setTransform(ux - ox, uy - oy, vx - ox, vy - oy, ox, oy);
    if (nome === 'REFLEXO' && sep > 0.05) {
      // contorno fino para a camada transparente aparecer
      ctx.strokeStyle = `rgba(223,227,231,${0.35 * sep})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, CW, CHC, 40);
      ctx.stroke();
    }
    if (nome === 'TEXTO' && sep > 0.05) {
      ctx.strokeStyle = `rgba(223,227,231,${0.2 * sep})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.roundRect(0, 0, CW, CHC, 40);
      ctx.stroke();
    }
    desenha(ctx);
    ctx.restore();
    rotulos.push([nome, P(CW / 2, 0, z)]);
  }
  const a = ease.outCubic(prog(t, A2 + 1.8, A2 + 2.3)) * (1 - ease.inCubic(prog(t, A3 - 1.2, A3 - 0.9)));
  if (a > 0) {
    ctx.save();
    ctx.globalAlpha = a;
    rotulos.forEach(([nome, [x, y]], i) => {
      const ly = y;
      ctx.strokeStyle = 'rgba(223,227,231,0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 8, ly);
      ctx.lineTo(905, ly);
      ctx.stroke();
      ctx.fillStyle = i === 3 ? COR.laranja : COR.aluminio;
      ctx.beginPath();
      ctx.arc(x + 8, ly, 5, 0, Math.PI * 2);
      ctx.fill();
      texto(ctx, nome, 940, ly - 12, MONO(24, 500), i === 3 ? COR.laranja : COR.aluminio, { alinhar: 'right', esp: 4 });
    });
    ctx.restore();
  }
}

function numeros(ctx, t) {
  const itens = [['12°', 'para os lados'], ['8°', 'para cima e para baixo'], ['900 px', 'de perspectiva']];
  itens.forEach(([n, d], i) => {
    const t0 = A3 + 0.35 + i * 0.8;
    const a = ease.outCubic(prog(t, t0, t0 + 0.4)) * (1 - ease.inCubic(prog(t, A4 - 0.25, A4)));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    const y = 1336 + i * 52 + (1 - a) * 14;
    texto(ctx, n, 90, y, MONO(38, 500), i === 0 ? COR.laranja : COR.aluminio);
    texto(ctx, d, 260, y, TXT(34), COR.nevoa);
    ctx.restore();
  });
}

function janela(ctx, t, a) {
  if (a <= 0) return;
  const u = t - A4 + 0.2;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.roundRect(JAN.x, JY, JAN.w, JAN.h, JAN.r);
  ctx.fillStyle = '#161A1F';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = TITANIO;
  ctx.fillRect(JAN.x, JY, JAN.w, BARRA);
  ctx.fillStyle = 'rgba(10,12,15,0.6)';
  ctx.beginPath();
  ctx.roundRect(JAN.x + 130, JY + 10, 520, 30, 15);
  ctx.fill();
  texto(ctx, 'barbearianavalha.com.br', JAN.x + 390, JY + 31, MONO(17), COR.nevoa, { alinhar: 'center' });
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(JAN.x, JY + BARRA, JAN.w, CH, [0, 0, JAN.r, JAN.r]);
  ctx.clip();
  ctx.translate(JAN.x, JY + BARRA);
  const fila = [];
  ITENS[2].fx(ctx, Math.min(u, 1.95), fila, (x, y) => [JAN.x + x, JY + BARRA + y]);
  ctx.restore();
  for (const [x, y, op] of fila) if (op.alfa > 0.01) dedo(ctx, x, y, op);
  ctx.restore();
}

function quadro(ctx, t) {
  if (!tex) texturas();
  fundo(ctx);
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 43 });
  rotulo(ctx, t, { texto: 'Efeito do dia · 03', x: 90, y: 292, entra: -1, entrada: 'corte' });
  bloco(ctx, t, { texto: 'Esse cartão segue\no seu dedo.', x: 88, y: 338, tamanho: 84, entra: -1, sai: A2 - 0.3, entrada: 'corte', durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Por dentro,\nsão 4 camadas.', x: 88, y: 338, tamanho: 84, entra: A2, sai: A3 - 0.3, durSaida: 0.3 });
  bloco(ctx, t, { texto: 'E três números.', x: 88, y: 338, tamanho: 84, entra: A3, sai: A4 - 0.3, durSaida: 0.3 });
  bloco(ctx, t, { texto: 'No site, vira o\ncartão do clube.', x: 88, y: 338, tamanho: 84, entra: A4, sai: A5 - 0.3, durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Quer o prompt?', x: 88, y: 338, tamanho: 84, entra: A5 });
  bloco(ctx, t, { estilo: 'texto', texto: 'Comenta PROMPT que eu mando no direct.', x: 90, y: 444, tamanho: 40, peso: 500, destaque: 'PROMPT', entra: A5 + 0.35, entrada: 'fade' });

  if (t < A2) {
    // 1 — o cartão segue o dedo
    const ang = lerp(-2.4, 3.4, ease.inOutSine(prog(t, 0.2, 4.6)));
    const mx = CX + Math.cos(ang) * 360, my = CY + Math.sin(ang) * 220;
    const forca = ease.outCubic(prog(t, 0, 0.4)) * (1 - ease.inOutCubic(prog(t, 4.5, 5.1)));
    const ry = clamp((mx - CX) / CW, -0.6, 0.6) * 0.75 * forca, rx = -clamp((my - CY) / CHC, -0.6, 0.6) * 0.6 * forca;
    cartao(ctx, rx, ry);
    const a = (1 - ease.inCubic(prog(t, 4.4, 4.8)));
    dedo(ctx, mx, my, { alfa: a, pressao: 0.6 });
  } else if (t < A3) {
    explodido(ctx, t);
  } else if (t < A4 + 0.6) {
    // 3 — os números: inclinação real do efeito (12° e 8°), devagar
    const k = t - A3;
    const ry = 0.21 * Math.sin(k * 2.2) * ease.outCubic(prog(t, A3, A3 + 0.4));
    const rx = 0.14 * Math.sin(k * 1.5 + 0.8) * ease.outCubic(prog(t, A3, A3 + 0.4));
    // na passagem para o site, o cartão encolhe até o tamanho e o lugar do cartão do site
    const vai = ease.inOutCubic(prog(t, A4 - 0.5, A4 + 0.3));
    cartao(ctx, rx * (1 - vai), ry * (1 - vai), { escala: lerp(1, 440 / CW, vai), cx: lerp(CX, JAN.x + 425, vai), cy: lerp(CY, JY + BARRA + 300, vai), alfa: 1 - prog(t, A4 + 0.2, A4 + 0.6) });
    numeros(ctx, t);
    janela(ctx, t, ease.outCubic(prog(t, A4 - 0.2, A4 + 0.5)));
  } else {
    janela(ctx, t, 1 - 0.65 * ease.inOutCubic(prog(t, A5, A5 + 0.6)));
  }
  assinatura(ctx, t, { entra: A5 + 0.8 });
  vinheta(ctx, 0.3);
}

export default {
  id: 'e03b',
  nome: 'e03-cartao-3d-que-inclina-explicado',
  duracao: DUR,
  fps: 30,
  desenhar(ctx, t) {
    quadro(ctx, t);
  },
  capa(ctx) {
    quadro(ctx, A2 + 2.6);
  },
};
