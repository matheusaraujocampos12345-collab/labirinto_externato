// i15 — 12 animações de site · parte 1 (27 s). Mesmo formato do i14 (título fixo, janela, lista de 01 a 12,
// 2 s por item, corte na batida de 120 bpm), mas a janela é um navegador simplificado com um mini-site
// fictício e o efeito acontecendo de verdade. Gancho: "Quer o prompt? Comenta PROMPT".
// Os prompts de cada estilo estão em instagram/prompts/12-animacoes-de-site.md.
import { W, H, clamp, lerp, prog, ease, hash } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, dedo, vinheta } from '../motor/marca.js';
import { riscos, montarParagrafo, desenharAceso } from './comum.js';

const DUR = 27, SLOT = 2, FIM = 24;
const JAN = { x: 90, y: 520, w: 850, h: 560, r: 32 };
const BARRA = 50;
const CW = JAN.w, CH = JAN.h - BARRA; // área do site: 850 × 510
const CINZA = '#5A626C';
const SAIRA = (px, peso = 300) => `${peso} ${px}px "Saira", sans-serif`;
const EXP = (px, peso = 500) => `${peso} ${px}px "Saira Expandida", sans-serif`;
const TXT = (px, peso = 400) => `${peso} ${px}px "Hanken Grotesk", sans-serif`;
const MONO = (px, peso = 400) => `${peso} ${px}px "JetBrains Mono", monospace`;
const FUNDO_SITE = '#0E1115', TITANIO = '#1B2026', LINHA = 'rgba(223,227,231,0.12)';

const ITENS = [
  { nome: 'Revelar ao rolar', site: 'pousadaserraazul.com.br', fx: revelar },
  { nome: 'Parallax em camadas', site: 'vinicolavalealto.com.br', fx: parallax },
  { nome: 'Cartão 3D que inclina', site: 'barbearianavalha.com.br', fx: cartao3d },
  { nome: 'Botão magnético', site: 'clinicaleve.com.br', fx: magnetico },
  { nome: 'Texto que acende', site: 'padariaquatrohoras.com.br', fx: acende },
  { nome: 'Imagem com máscara', site: 'florlirio.com.br', fx: mascara },
  { nome: 'Cursor que vira lupa', site: 'joalheriaaurum.com.br', fx: lupa },
  { nome: 'Menu que se expande', site: 'restaurantebrasa.com.br', fx: menu, borrao: true },
  { nome: 'Números que sobem', site: 'academiaritmo.com.br', fx: numeros },
  { nome: 'Galeria que desliza', site: 'analuzfoto.com.br', fx: galeria, borrao: true },
  { nome: 'Transição entre páginas', site: 'arquiteturalinha.com.br', fx: transicao, borrao: true },
  { nome: 'Túnel 3D na abertura', site: 'estudioeco.com.br', fx: tunel, borrao: true },
];

const relogio = (t) => (((t + 0.5) % DUR) + DUR) % DUR;
const slotDe = (T) => (T < FIM ? Math.floor(T / SLOT) : -1);

// ── peças dos mini-sites (coordenadas da área do site, 850 × 510) ──
function texto(g, s, x, y, fonte, cor, op = {}) {
  g.font = fonte;
  g.fillStyle = cor;
  g.textAlign = op.alinhar ?? 'left';
  g.letterSpacing = `${op.esp ?? 0}px`;
  g.textBaseline = 'alphabetic';
  g.fillText(s, x, y);
  g.letterSpacing = '0px';
  g.textAlign = 'left';
}
function nav(g, nome, op = {}) {
  texto(g, nome.toUpperCase(), 32, 40, EXP(16), COR.aluminio, { esp: 3 });
  if (op.menu !== false) {
    g.fillStyle = 'rgba(223,227,231,0.28)';
    for (let k = 0; k < 3; k++) g.fillRect(CW - 220 + k * 62, 32, 44, 4);
  }
}
function barras(g, x, y, larguras, cor = 'rgba(223,227,231,0.16)', passo = 22) {
  g.fillStyle = cor;
  larguras.forEach((w, i) => g.fillRect(x, y + i * passo, w, 8));
}
/** o círculo de toque vai para uma fila e é desenhado depois, por cima do site, em coordenadas da tela */
function toque(fila, x, y, op = {}) {
  fila.push([x, y, { raio: op.raio ?? 30, alfa: op.alfa ?? 1, pressao: op.pressao ?? 0 }]);
}
/** foto inventada (sem banco de imagens): degradê, sol e relevo, nas cores da marca */
function foto(g, x, y, w, h, semente, op = {}) {
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, op.raio ?? 14);
  g.clip();
  const r = (n) => hash(semente * 31 + n);
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, ['#2A2F36', '#3A2A20', '#1F2A33', '#33261C'][semente % 4]);
  gr.addColorStop(1, '#0B0D10');
  g.fillStyle = gr;
  g.fillRect(x, y, w, h);
  const sx = x + w * (0.25 + r(1) * 0.5), sy = y + h * (0.25 + r(2) * 0.2), sr = Math.min(w, h) * (0.1 + r(3) * 0.08);
  const gs = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.5);
  gs.addColorStop(0, 'rgba(255,140,70,0.55)');
  gs.addColorStop(1, 'rgba(255,140,70,0)');
  g.fillStyle = gs;
  g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,160,100,0.85)';
  g.beginPath();
  g.arc(sx, sy, sr, 0, Math.PI * 2);
  g.fill();
  for (let c = 0; c < 2; c++) {
    g.fillStyle = c ? '#07090B' : '#15191F';
    g.beginPath();
    g.moveTo(x, y + h);
    for (let i = 0; i <= 10; i++) {
      const px = x + (w * i) / 10;
      const py = y + h * (0.55 + c * 0.18) - Math.sin(i * (0.9 + r(4 + c)) + r(6 + c) * 6) * h * (0.09 + 0.05 * c);
      g.lineTo(px, py);
    }
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();
  }
  g.restore();
}

// 1 — revelar ao rolar
function revelar(g, u, ctx, P) {
  const s = ease.inOutCubic(prog(u, 0.15, 1.5)) * 430;
  g.save();
  g.translate(0, -s);
  nav(g, 'Pousada Serra Azul');
  texto(g, 'Silêncio a 1.200 m.', 32, 150, SAIRA(54), COR.aluminio);
  texto(g, 'Seis quartos, uma lareira e a serra inteira.', 32, 192, TXT(20), COR.nevoa);
  texto(g, 'QUARTOS', 32, 330, MONO(15), COR.nevoa, { esp: 3 });
  for (let i = 0; i < 3; i++) {
    const x = 32 + i * 270, y = 352;
    const k = ease.outCubic(clamp((CH * 0.96 - (y - s)) / 170 - i * 0.12));
    if (k <= 0) continue;
    g.save();
    g.globalAlpha = k;
    g.translate(0, (1 - k) * 50);
    foto(g, x, y, 250, 170, 2 + i);
    texto(g, ['Suíte Vale', 'Suíte Mata', 'Chalé Pico'][i], x, y + 206, TXT(20, 500), COR.aluminio);
    texto(g, ['R$ 480', 'R$ 520', 'R$ 690'][i], x + 250, y + 206, MONO(17), COR.nevoa, { alinhar: 'right' });
    g.restore();
  }
  const k2 = ease.outCubic(clamp((CH * 0.96 - (680 - s)) / 160));
  if (k2 > 0) {
    g.save();
    g.beginPath();
    g.rect(0, 640, CW, 70);
    g.clip();
    texto(g, 'Café da manhã na varanda.', 32, 690 + (1 - k2) * 60, SAIRA(44), COR.aluminio);
    g.restore();
  }
  g.restore();
  const a = ease.outCubic(prog(u, 0.0, 0.15)) * (1 - ease.inCubic(prog(u, 1.5, 1.7)));
  const [x, y] = P(780, lerp(420, 150, ease.inOutCubic(prog(u, 0.15, 1.5))));
  toque(ctx, x, y, { alfa: a, pressao: a });
}

// 2 — parallax em camadas
function serra(g, base, amp, f, ph, cor, linha) {
  // relevo suave: soma de duas ondas longas, amostrada a cada 10 px
  const yDe = (x) => base - amp * (0.62 * (0.5 + 0.5 * Math.sin(x * f + ph)) + 0.38 * (0.5 + 0.5 * Math.sin(x * f * 2.2 + ph * 1.7)));
  g.beginPath();
  g.moveTo(0, CH + 400);
  for (let x = 0; x <= CW; x += 10) g.lineTo(x, yDe(x));
  g.lineTo(CW, CH + 400);
  g.closePath();
  g.fillStyle = cor;
  g.fill();
  g.beginPath();
  for (let x = 0; x <= CW; x += 10) (x ? g.lineTo(x, yDe(x)) : g.moveTo(x, yDe(x)));
  g.strokeStyle = linha;
  g.lineWidth = 2;
  g.stroke();
}
function parallax(g, u, ctx, P) {
  const s = ease.inOutSine(prog(u, 0.1, 1.9)) * 300;
  const ceu = g.createLinearGradient(0, 0, 0, CH);
  ceu.addColorStop(0, '#07090C');
  ceu.addColorStop(1, '#1A2028');
  g.fillStyle = ceu;
  g.fillRect(0, 0, CW, CH);
  g.save();
  g.translate(0, -s * 0.15);
  g.strokeStyle = COR.laranja;
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(610, 170, 60, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(255,107,26,0.12)';
  g.fill();
  g.restore();
  g.save();
  g.translate(0, -s * 0.4);
  serra(g, 380, 130, 0.0062, 1.2, '#151A21', 'rgba(223,227,231,0.45)');
  g.restore();
  g.save();
  g.translate(0, -s * 0.75);
  serra(g, 480, 95, 0.0045, 3.1, '#0C0F13', 'rgba(223,227,231,0.85)');
  // fileiras de videira
  g.strokeStyle = 'rgba(223,227,231,0.18)';
  g.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.moveTo(-50, 560 + i * 40);
    g.lineTo(CW + 50, 520 + i * 52);
    g.stroke();
  }
  g.restore();
  g.save();
  g.translate(0, -s * 1.0);
  nav(g, 'Vinícola Vale Alto');
  texto(g, 'Safra de altitude.', 32, 190, SAIRA(56), COR.aluminio);
  g.restore();
  const a = ease.outCubic(prog(u, 0.0, 0.12)) * (1 - ease.inCubic(prog(u, 1.8, 1.98)));
  const [x, y] = P(780, lerp(420, 170, ease.inOutSine(prog(u, 0.1, 1.9))));
  toque(ctx, x, y, { alfa: a, pressao: a });
}

// 3 — cartão 3D que inclina
let cartaoCv = null;
function cartao3d(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  nav(g, 'Barbearia Navalha');
  texto(g, 'CLUBE NAVALHA', 32, 100, MONO(15), COR.nevoa, { esp: 3 });
  const cw = 440, ch = 270, ccx = CW / 2, ccy = 300;
  // o cursor dá uma volta em torno do cartão
  const ang = lerp(-2.4, 3.2, ease.inOutSine(prog(u, 0.0, 1.95)));
  const mx = ccx + Math.cos(ang) * 200, my = ccy + Math.sin(ang) * 110;
  const ry = clamp((mx - ccx) / cw, -0.6, 0.6) * 0.75, rx = -clamp((my - ccy) / ch, -0.6, 0.6) * 0.6;
  if (!cartaoCv) {
    cartaoCv = document.createElement('canvas');
    cartaoCv.width = cw * 2;
    cartaoCv.height = ch * 2;
  }
  const c = cartaoCv.getContext('2d');
  c.setTransform(2, 0, 0, 2, 0, 0);
  c.clearRect(0, 0, cw, ch);
  c.beginPath();
  c.roundRect(0, 0, cw, ch, 22);
  const fg = c.createLinearGradient(0, 0, cw, ch);
  fg.addColorStop(0, '#2B323B');
  fg.addColorStop(1, '#14181D');
  c.fillStyle = fg;
  c.fill();
  c.save();
  c.clip();
  c.strokeStyle = 'rgba(223,227,231,0.25)';
  c.lineWidth = 1.5;
  c.strokeRect(14, 14, cw - 28, ch - 28);
  c.fillStyle = COR.laranja;
  c.fillRect(34, 150, 64, 3);
  texto(c, 'NAVALHA', 34, 92, EXP(36), COR.aluminio, { esp: 4 });
  texto(c, 'Corte e barba ilimitados', 34, 196, TXT(20), COR.aluminio);
  texto(c, 'MEMBRO 0427 · DESDE 2026', 34, 232, MONO(14), COR.nevoa, { esp: 2 });
  // reflexo que acompanha a inclinação
  const gx = cw * (0.5 - ry * 1.3), gy = ch * (0.5 + rx * 1.3);
  const gl = c.createRadialGradient(gx, gy, 0, gx, gy, cw * 0.7);
  gl.addColorStop(0, 'rgba(255,255,255,0.22)');
  gl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gl;
  c.fillRect(0, 0, cw, ch);
  c.restore();
  // sombra
  g.save();
  g.filter = 'blur(18px)';
  g.fillStyle = 'rgba(0,0,0,0.55)';
  g.beginPath();
  g.ellipse(ccx - ry * 60, ccy + ch / 2 + 18, cw * 0.42, 22, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  // projeção em perspectiva, em fatias verticais
  const D = 900, N = 64;
  const proj = (x, y) => {
    const X = x * Math.cos(ry) + y * Math.sin(rx) * Math.sin(ry);
    const Y = y * Math.cos(rx);
    const Z = -x * Math.sin(ry) + y * Math.sin(rx) * Math.cos(ry);
    const k = D / (D + Z);
    return [ccx + X * k, ccy + Y * k];
  };
  for (let i = 0; i < N; i++) {
    const x0 = -cw / 2 + (cw * i) / N, x1 = x0 + cw / N;
    const [ax, ay] = proj(x0, -ch / 2), [bx, by] = proj(x0, ch / 2), [cx2] = proj(x1, -ch / 2);
    g.drawImage(cartaoCv, (i * cw * 2) / N, 0, (cw * 2) / N, ch * 2, ax, ay, Math.max(1, cx2 - ax + 0.6), by - ay);
  }
  const [x, y] = P(mx, my);
  toque(ctx, x, y, { alfa: ease.outCubic(prog(u, 0, 0.15)) * (1 - ease.inCubic(prog(u, 1.85, 1.98))) });
}

// 4 — botão magnético
function magnetico(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  nav(g, 'Clínica Leve');
  texto(g, 'Consulta sem fila.', 32, 150, SAIRA(54), COR.aluminio);
  texto(g, 'Atendimento em até 2 dias úteis.', 32, 192, TXT(20), COR.nevoa);
  const bx = CW / 2, by = 360;
  // o cursor chega por baixo, ronda o botão, clica e sai
  const mx = lerp(lerp(140, bx + 70, ease.inOutSine(prog(u, 0.0, 0.7))), lerp(bx + 70, bx + 10, 1), ease.inOutSine(prog(u, 0.7, 1.0)));
  const my = lerp(480, by + 22, ease.inOutSine(prog(u, 0.0, 0.7))) + (u > 1.0 ? lerp(0, -18, ease.inOutSine(prog(u, 1.0, 1.2))) : 0);
  const sai = ease.inOutSine(prog(u, 1.45, 1.95));
  const cx = lerp(mx, 760, sai), cy = lerp(my, 470, sai);
  const dx = cx - bx, dy = cy - by, d = Math.hypot(dx, dy);
  const atr = clamp(1 - d / 260);
  const ox = dx * 0.32 * ease.inOutSine(atr), oy = dy * 0.32 * ease.inOutSine(atr);
  const clique = Math.sin(Math.PI * clamp((u - 1.15) / 0.25));
  const cheio = ease.outCubic(prog(u, 1.15, 1.3)) * (1 - ease.inOutSine(prog(u, 1.6, 1.9)));
  g.save();
  g.translate(bx + ox, by + oy);
  g.scale(1 - 0.05 * clique, 1 - 0.05 * clique);
  g.beginPath();
  g.roundRect(-160, -40, 320, 80, 40);
  g.fillStyle = cheio > 0.01 ? `rgba(255,107,26,${cheio})` : 'rgba(0,0,0,0)';
  g.fill();
  g.strokeStyle = cheio > 0.5 ? COR.laranja : COR.aluminio;
  g.lineWidth = 2;
  g.stroke();
  texto(g, 'Agendar consulta  →', ox * 0.25, 8, TXT(22, 500), cheio > 0.5 ? '#0A0C0F' : COR.aluminio, { alinhar: 'center' });
  g.restore();
  const [x, y] = P(cx, cy);
  toque(ctx, x, y, { alfa: ease.outCubic(prog(u, 0, 0.12)) * (1 - ease.inCubic(prog(u, 1.85, 1.98))), pressao: clique });
}

// 5 — texto que acende com a rolagem
let par5 = null;
function acende(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  const s = ease.inOutSine(prog(u, 0.05, 1.75));
  nav(g, 'Padaria Quatro Horas');
  texto(g, 'A HISTÓRIA', 32, 108, MONO(15), COR.nevoa, { esp: 3 });
  if (!par5) par5 = montarParagrafo(g, 'O forno acende às 4h. Às 6h o pão já está no balcão, ainda cantando.', { fonte: SAIRA(48), tamanho: 48, largura: 760, entrelinha: 1.18, x: 32, y: 140, espaco: -0.5 });
  desenharAceso(g, par5, s, { dy: -24 * s });
  // trilho de rolagem
  g.fillStyle = 'rgba(223,227,231,0.12)';
  g.fillRect(CW - 22, 80, 2, 380);
  g.fillStyle = COR.laranja;
  g.fillRect(CW - 22, 80, 2, 380 * s);
  const a = ease.outCubic(prog(u, 0, 0.12)) * (1 - ease.inCubic(prog(u, 1.78, 1.96)));
  const [x, y] = P(760, lerp(440, 200, s));
  toque(ctx, x, y, { alfa: a, pressao: a });
}

// 6 — imagem com máscara
let flor = null;
function desenharFlor() {
  flor = document.createElement('canvas');
  flor.width = CW;
  flor.height = CH;
  const g = flor.getContext('2d');
  const gr = g.createRadialGradient(CW * 0.62, CH * 0.5, 20, CW * 0.62, CH * 0.5, CW * 0.8);
  gr.addColorStop(0, '#3A2418');
  gr.addColorStop(1, '#0A0C0F');
  g.fillStyle = gr;
  g.fillRect(0, 0, CW, CH);
  for (let i = 0; i < 26; i++) {
    const x = hash(i * 7) * CW, y = hash(i * 11) * CH, r = 10 + hash(i * 13) * 40;
    const b = g.createRadialGradient(x, y, 0, x, y, r);
    b.addColorStop(0, 'rgba(255,170,110,0.16)');
    b.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = b;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.save();
  g.translate(CW * 0.62, CH * 0.52);
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i < 8; i++) {
      g.save();
      g.rotate((i / 8) * Math.PI * 2 + k * 0.4);
      const pg = g.createLinearGradient(0, 0, 0, -170 + k * 45);
      pg.addColorStop(0, ['#FF6B1A', '#FF8A48', '#FFB585'][k]);
      pg.addColorStop(1, ['rgba(255,107,26,0.2)', 'rgba(255,138,72,0.3)', 'rgba(255,200,160,0.5)'][k]);
      g.fillStyle = pg;
      g.beginPath();
      g.ellipse(0, -(85 - k * 22), 34 - k * 7, 88 - k * 22, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  g.fillStyle = '#2A1A10';
  g.beginPath();
  g.arc(0, 0, 20, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
function mascara(g, u) {
  if (!flor) desenharFlor();
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  const k = ease.inOutCubic(prog(u, 0.05, 1.15));
  const w = lerp(90, CW - 64, k), h = lerp(36, CH - 110, ease.inOutCubic(prog(u, 0.0, 1.0)));
  const x = (CW - w) / 2, y = 80 + (CH - 110 - h) / 2;
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, lerp(18, 22, k));
  g.clip();
  const z = lerp(1.3, 1, k);
  g.translate(CW / 2, 80 + (CH - 110) / 2);
  g.scale(z, z);
  g.drawImage(flor, -CW / 2, -(80 + (CH - 110) / 2));
  g.restore();
  nav(g, 'Floricultura Lírio');
  const a = ease.outCubic(prog(u, 1.0, 1.5));
  g.save();
  g.globalAlpha = a;
  texto(g, 'Lírio.', 64, 440 + (1 - a) * 20, SAIRA(72), COR.aluminio);
  g.restore();
}

// 7 — cursor que vira lupa
let joia = null;
function desenharJoia() {
  joia = document.createElement('canvas');
  joia.width = CW;
  joia.height = CH;
  const g = joia.getContext('2d');
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  nav(g, 'Joalheria Aurum');
  texto(g, 'Solitário 18k', 32, 140, SAIRA(46), COR.aluminio);
  texto(g, 'R$ 4.900', 32, 180, MONO(18), COR.nevoa);
  // o anel
  const cx = 540, cy = 300;
  g.save();
  g.translate(cx, cy);
  g.lineWidth = 26;
  const ouro = g.createLinearGradient(-150, -60, 150, 60);
  ouro.addColorStop(0, '#8A5A2A');
  ouro.addColorStop(0.45, '#F0B07A');
  ouro.addColorStop(0.7, '#C0743A');
  ouro.addColorStop(1, '#6A3E18');
  g.strokeStyle = ouro;
  g.beginPath();
  g.ellipse(0, 40, 150, 62, 0, 0, Math.PI * 2);
  g.stroke();
  // inscrição bem pequena no aro (só dá para ler com a lupa)
  g.fillStyle = '#3A220E';
  g.font = MONO(7, 500);
  g.letterSpacing = '1px';
  g.textAlign = 'center';
  g.fillText('AURUM · 18K · 2026', 0, 106);
  g.letterSpacing = '0px';
  // a pedra
  g.translate(0, -26);
  g.fillStyle = '#DFE3E7';
  g.beginPath();
  g.moveTo(-40, 0);
  g.lineTo(-24, -26);
  g.lineTo(24, -26);
  g.lineTo(40, 0);
  g.lineTo(0, 44);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(10,12,15,0.5)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-40, 0);
  g.lineTo(40, 0);
  g.moveTo(-24, -26);
  g.lineTo(0, 44);
  g.lineTo(24, -26);
  g.moveTo(-12, -26);
  g.lineTo(-20, 0);
  g.moveTo(12, -26);
  g.lineTo(20, 0);
  g.stroke();
  g.restore();
}
function lupa(g, u, ctx, P) {
  if (!joia) desenharJoia();
  g.drawImage(joia, 0, 0);
  // caminho: entra pela esquerda, para na pedra, desce até a inscrição do aro
  const mx = u < 0.6 ? lerp(120, 540, ease.inOutSine(prog(u, 0, 0.6))) : u < 1.2 ? 540 : lerp(540, 560, ease.inOutSine(prog(u, 1.2, 1.7)));
  const my = u < 0.6 ? lerp(430, 290, ease.inOutSine(prog(u, 0, 0.6))) : u < 1.2 ? 280 : lerp(280, 398, ease.inOutSine(prog(u, 1.2, 1.7)));
  const r = lerp(10, 92, ease.inOutCubic(prog(u, 0.45, 0.8)));
  const zoom = lerp(1, 2.6, ease.inOutCubic(prog(u, 0.45, 0.8)));
  if (r > 12) {
    g.save();
    g.beginPath();
    g.arc(mx, my, r, 0, Math.PI * 2);
    g.clip();
    g.translate(mx, my);
    g.scale(zoom, zoom);
    g.drawImage(joia, -mx, -my);
    g.restore();
    g.strokeStyle = COR.aluminio;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(mx, my, r, 0, Math.PI * 2);
    g.stroke();
  } else {
    g.strokeStyle = COR.aluminio;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(mx, my, 10, 0, Math.PI * 2);
    g.stroke();
  }
}

// 8 — menu que se expande
function menu(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  foto(g, 32, 150, CW - 64, 330, 1, { raio: 16 });
  texto(g, 'BRASA', 32, 40, EXP(16), COR.aluminio, { esp: 3 });
  texto(g, 'Fogo baixo, mesa longa.', 32, 120, SAIRA(46), COR.aluminio);
  const ix = CW - 56, iy = 34;
  const k = ease.inOutCubic(prog(u, 0.45, 1.05));
  if (k > 0) {
    g.save();
    g.beginPath();
    g.arc(ix, iy, k * 1050, 0, Math.PI * 2);
    g.fillStyle = TITANIO;
    g.fill();
    g.clip();
    ['Cardápio', 'Reservas', 'Eventos', 'Contato'].forEach((item, i) => {
      const a = ease.outCubic(prog(u, 0.75 + i * 0.09, 1.25 + i * 0.09));
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      texto(g, item, 48, 150 + i * 84 + (1 - a) * 40, SAIRA(58), i === 1 ? COR.laranja : COR.aluminio);
      texto(g, `0${i + 1}`, CW - 48, 150 + i * 84 + (1 - a) * 40, MONO(16), COR.nevoa, { alinhar: 'right' });
      g.restore();
    });
    g.restore();
  }
  // ícone: três linhas viram um X
  const x = ease.inOutCubic(prog(u, 0.45, 0.8));
  g.save();
  g.translate(ix, iy);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-16, lerp(-9, 0, x));
  g.lineTo(16, lerp(-9, 0, x) + lerp(0, 0, x));
  g.stroke();
  g.save();
  g.rotate(x * Math.PI * 0.25);
  g.beginPath();
  g.moveTo(-16, 0);
  g.lineTo(16, 0);
  g.stroke();
  g.restore();
  g.save();
  g.rotate(-x * Math.PI * 0.25);
  g.globalAlpha = 1;
  g.beginPath();
  g.moveTo(-16, lerp(9, 0, x));
  g.lineTo(16, lerp(9, 0, x));
  g.stroke();
  g.restore();
  g.restore();
  const pr = Math.sin(Math.PI * clamp((u - 0.3) / 0.3));
  const [tx, ty] = P(ix, iy);
  toque(ctx, tx, ty + (1 - ease.outCubic(prog(u, 0.0, 0.35))) * 40, { alfa: ease.outCubic(prog(u, 0.0, 0.2)) * (1 - ease.inCubic(prog(u, 0.6, 0.8))), pressao: pr });
}

// 9 — números que sobem
function numeros(g, u) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  nav(g, 'Academia Ritmo');
  texto(g, 'Treino com hora marcada.', 32, 140, SAIRA(46), COR.aluminio);
  const dados = [[1200, '', 'alunos ativos'], [14, '', 'anos de casa'], [98, '%', 'voltam no mês seguinte']];
  dados.forEach(([n, suf, rot], i) => {
    const x = 32 + i * 275, k = ease.outExpo(prog(u, 0.1 + i * 0.12, 1.5 + i * 0.12));
    const v = Math.round(n * k);
    const s = (v >= 1000 ? v.toLocaleString('pt-BR') : String(v)) + suf;
    texto(g, s, x, 300, SAIRA(76), i === 2 ? COR.laranja : COR.aluminio);
    g.fillStyle = 'rgba(223,227,231,0.12)';
    g.fillRect(x, 330, 240, 3);
    g.fillStyle = i === 2 ? COR.laranja : COR.aluminio;
    g.fillRect(x, 330, 240 * k, 3);
    texto(g, rot.toUpperCase(), x, 370, MONO(14), COR.nevoa, { esp: 2 });
  });
  barras(g, 32, 440, [520, 380]);
}

// 10 — galeria que desliza
function galeria(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  nav(g, 'Ana Luz Fotografia');
  texto(g, 'Casamentos', 32, 116, SAIRA(40), COR.aluminio);
  const desloc = ease.outCubic(prog(u, 0.2, 1.45)) * 864;
  for (let i = 0; i < 7; i++) {
    const x = 32 + i * 288 - desloc;
    if (x > CW || x + 264 < 0) continue;
    foto(g, x, 150, 264, 300, 7 + i, { raio: 14 });
  }
  for (let i = 0; i < 5; i++) {
    const at = Math.round(desloc / 288) === i;
    g.fillStyle = at ? COR.laranja : 'rgba(223,227,231,0.3)';
    g.beginPath();
    g.arc(CW / 2 - 48 + i * 24, 478, at ? 5 : 4, 0, Math.PI * 2);
    g.fill();
  }
  const arr = ease.inOutCubic(prog(u, 0.15, 0.75));
  const a = ease.outCubic(prog(u, 0, 0.15)) * (1 - ease.inCubic(prog(u, 0.75, 0.95)));
  const [x, y] = P(lerp(700, 220, arr), 300);
  toque(ctx, x, y, { alfa: a, pressao: a });
}

// 11 — transição entre páginas
function transicao(g, u, ctx, P) {
  g.fillStyle = FUNDO_SITE;
  g.fillRect(0, 0, CW, CH);
  const k = ease.inOutCubic(prog(u, 0.55, 1.15));
  const resto = 1 - ease.outCubic(prog(u, 0.5, 0.8));
  g.save();
  g.globalAlpha = resto;
  nav(g, 'Arquitetura Linha');
  texto(g, 'Projetos', 32, 112, SAIRA(40), COR.aluminio);
  g.restore();
  const cards = [[32, 140], [442, 140], [32, 330], [442, 330]];
  cards.forEach(([x, y], i) => {
    if (i === 1) return;
    g.save();
    g.globalAlpha = resto;
    foto(g, x, y, 376, 170, 20 + i, { raio: 12 });
    g.restore();
  });
  // o cartão escolhido vira a página inteira
  const [x0, y0] = cards[1];
  const x = lerp(x0, 0, k), y = lerp(y0, 0, k), w = lerp(376, CW, k), h = lerp(170, 300, k);
  foto(g, x, y, w, h, 21, { raio: lerp(12, 0, k) });
  const t2 = ease.outCubic(prog(u, 1.05, 1.5));
  if (t2 > 0) {
    g.save();
    g.globalAlpha = t2;
    texto(g, 'Casa Pedra', 32, 370 + (1 - t2) * 24, SAIRA(54), COR.aluminio);
    texto(g, 'RESIDENCIAL · 2025 · 320 m²', 32, 410 + (1 - t2) * 24, MONO(15), COR.nevoa, { esp: 2 });
    barras(g, 32, 440, [600, 520], 'rgba(223,227,231,0.16)', 20);
    g.restore();
  }
  const pr = Math.sin(Math.PI * clamp((u - 0.32) / 0.28));
  const [tx, ty] = P(x0 + 188, y0 + 85);
  toque(ctx, tx, ty + (1 - ease.outCubic(prog(u, 0.0, 0.3))) * 40, { alfa: ease.outCubic(prog(u, 0, 0.18)) * (1 - ease.inCubic(prog(u, 0.55, 0.75))), pressao: pr });
}

// 12 — túnel 3D na abertura
function tunel(g, u) {
  g.fillStyle = '#06070A';
  g.fillRect(0, 0, CW, CH);
  const fase = u * 0.38 + 0.03 * ease.inCubic(clamp(u / 0.3));
  const N = 22;
  const cx = CW / 2, cy = CH / 2 + 6;
  // linhas de fuga dos cantos
  g.strokeStyle = 'rgba(223,227,231,0.12)';
  g.lineWidth = 1.5;
  for (const [x, y] of [[0, 0], [CW, 0], [0, CH], [CW, CH]]) {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(cx + (x - cx) * 0.05, cy + (y - cy) * 0.05);
    g.stroke();
  }
  g.save();
  g.translate(cx, cy);
  for (let k = N - 1; k >= 0; k--) {
    const z = ((k / N - fase) % 1 + 1) % 1; // 0 = perto, 1 = longe
    const s = 1 / (z * 7 + 0.55);
    const a = clamp((1 - z) * 2.2) * clamp((1.75 - s) / 0.5);
    if (a <= 0.01) continue;
    g.globalAlpha = a;
    g.strokeStyle = k % 6 === 0 ? COR.laranja : 'rgba(223,227,231,0.75)';
    g.lineWidth = Math.max(1, 2.4 * s);
    g.beginPath();
    g.roundRect(-CW * 0.48 * s, -CH * 0.46 * s, CW * 0.96 * s, CH * 0.92 * s, 30 * s);
    g.stroke();
  }
  g.restore();
  g.globalAlpha = 1;
  nav(g, 'Estúdio Eco', { menu: false });
  texto(g, 'Entre no som.', cx, cy + 22, SAIRA(56), COR.aluminio, { alinhar: 'center' });
}

// ── página ───────────────────────────────────────────────────
function cabecalho(ctx) {
  ctx.save();
  ctx.font = FONTE.mono(24, 500);
  ctx.letterSpacing = '4px';
  const w = ctx.measureText('QUER O PROMPT? COMENTA PROMPT').width + 36;
  ctx.strokeStyle = 'rgba(223,227,231,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(90, 268, w, 48, 24);
  ctx.stroke();
  ctx.restore();
  bloco(ctx, 99, { estilo: 'rotulo', texto: 'Quer o prompt? Comenta PROMPT', x: 108, y: 278, tamanho: 24, peso: 500, espaco: 0.16, cor: COR.aluminio, destaque: 'PROMPT', entrada: 'corte', largura: 820 });
  bloco(ctx, 99, { texto: '12 animações de site', x: 88, y: 336, tamanho: 84, espaco: -0.01, entrada: 'corte' });
  bloco(ctx, 99, { estilo: 'rotulo', caixa: 'normal', texto: 'parte 1 · @mach.sites', x: 90, y: 444, tamanho: 26, espaco: 0.06, entrada: 'corte' });
}

function janela(ctx, T, i) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(JAN.x, JAN.y, JAN.w, JAN.h, JAN.r);
  ctx.fillStyle = '#161A1F';
  ctx.fill();
  ctx.strokeStyle = 'rgba(223,227,231,0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();
  if (i >= 0) {
    // barra do navegador simplificado
    ctx.fillStyle = TITANIO;
    ctx.fillRect(JAN.x, JAN.y, JAN.w, BARRA);
    ctx.fillStyle = 'rgba(223,227,231,0.25)';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(JAN.x + 34 + k * 22, JAN.y + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(10,12,15,0.6)';
    ctx.beginPath();
    ctx.roundRect(JAN.x + 130, JAN.y + 10, 520, 30, 15);
    ctx.fill();
    ctx.font = MONO(17);
    ctx.fillStyle = COR.nevoa;
    ctx.textAlign = 'center';
    ctx.fillText(ITENS[i].site, JAN.x + 390, JAN.y + 31);
    ctx.textAlign = 'left';
    ctx.restore();
    // o mini-site
    const u = T - i * SLOT;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(JAN.x, JAN.y + BARRA, JAN.w, CH, [0, 0, JAN.r, JAN.r]);
    ctx.clip();
    ctx.translate(JAN.x, JAN.y + BARRA);
    const fila = [];
    const P = (x, y) => [JAN.x + x, JAN.y + BARRA + y];
    ITENS[i].fx(ctx, u, fila, P);
    ctx.restore();
    for (const [x, y, op] of fila) if (op.alfa > 0.01) dedo(ctx, x, y, op);
    bloco(ctx, 99, { estilo: 'rotulo', texto: `${String(i + 1).padStart(2, '0')} / 12`, x: 940 - 28, y: JAN.y + 13, tamanho: 22, alinhar: 'right', entrada: 'corte' });
  } else {
    ctx.restore();
    const u = T - FIM;
    bloco(ctx, u, { texto: 'Quer o prompt\nde cada uma?', alinhar: 'center', x: 515, y: 640, tamanho: 76, entrelinha: 1.12, entra: 0, durEntrada: 0.6 });
    bloco(ctx, u, { estilo: 'texto', texto: 'Comenta PROMPT.', alinhar: 'center', x: 515, y: 860, tamanho: 52, peso: 500, destaque: 'PROMPT', entra: 0.35, entrada: 'fade', durEntrada: 0.5 });
  }
}

function lista(ctx, i) {
  const x0 = [90, 520], y0 = 1116, passo = 52;
  ITENS.forEach((it, k) => {
    const col = k < 6 ? 0 : 1, lin = k % 6;
    const cor = i < 0 ? COR.aluminio : k === i ? COR.laranja : k < i ? COR.aluminio : CINZA;
    const corNum = i < 0 ? COR.nevoa : k === i ? COR.laranja : k < i ? COR.nevoa : '#3E454E';
    bloco(ctx, 99, { estilo: 'rotulo', caixa: 'normal', texto: String(k + 1).padStart(2, '0'), x: x0[col], y: y0 + lin * passo + 3, tamanho: 30, espaco: 0, cor: corNum, entrada: 'corte' });
    bloco(ctx, 99, { estilo: 'texto', texto: it.nome, x: x0[col] + 50, y: y0 + lin * passo, tamanho: 34, peso: k === i ? 500 : 400, cor, entrada: 'corte', largura: 900 });
  });
}

function quadro(ctx, t) {
  const T = relogio(t);
  const i = slotDe(T);
  fundo(ctx);
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 15 });
  cabecalho(ctx);
  janela(ctx, T, i);
  lista(ctx, i);
  vinheta(ctx, 0.3);
}

export default {
  id: 'i15',
  nome: 'i15-12-estilos-de-animacao',
  duracao: DUR,
  fps: 30,
  obturador: 0.5,
  subquadros: (t) => {
    const T = relogio(t), i = slotDe(T);
    return i >= 0 && ITENS[i].borrao && T - i * SLOT < 1.6 ? 4 : 1;
  },
  desenhar(ctx, t) {
    quadro(ctx, t);
  },
  capa(ctx) {
    // o cartão 3D inclinado (03), com 01–02 vistas
    quadro(ctx, 2 * SLOT + 0.7 - 0.5);
  },
};
