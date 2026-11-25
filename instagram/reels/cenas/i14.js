// i14 — 12 animações de texto · parte 1 (27 s). Formato "catálogo": título fixo no alto, uma janela que
// mostra uma animação por vez (2 s cada, corte na batida de 120 bpm) com uma palavra que a explica, e a
// lista numerada embaixo (a da vez em laranja, as vistas em alumínio, as que faltam em cinza).
// Loop: o relógio interno T = t + 0,5 s. A 01 começa meio segundo antes do vídeo, então o primeiro quadro
// já está em movimento e o fim (T = 27) emenda no começo.
import { W, H, clamp, lerp, prog, ease, hash } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, medir, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';

const DUR = 27;
const SLOT = 2;
const FIM = 24; // T em que entra o convite final
const JAN = { x: 90, y: 520, w: 850, h: 560, r: 32 };
const CX = JAN.x + JAN.w / 2, CY = JAN.y + JAN.h / 2 + 20;
const CINZA = '#5A626C';
const SAIRA = (px, peso = 300) => `${peso} ${px}px "Saira", sans-serif`;
const EXP = (px, peso = 300) => `${peso} ${px}px "Saira Expandida", sans-serif`;

const ITENS = [
  { nome: 'Máscara subindo', palavra: 'surge', fx: mascara },
  { nome: 'Letra por letra', palavra: 'monta', fx: letraPorLetra },
  { nome: 'Caça-níquel', palavra: 'PRÊMIO', fx: cacaNiquel, borrao: true },
  { nome: 'Neon acendendo', palavra: 'aceso', fx: neon },
  { nome: 'Brilho passando', palavra: 'reluz', fx: brilho },
  { nome: 'Contorno se desenhando', palavra: 'traço', fx: contorno },
  { nome: 'Rastro de velocidade', palavra: 'veloz', fx: rastro, borrao: true },
  { nome: 'Onda de choque', palavra: 'impacto', fx: onda, borrao: true },
  { nome: 'Desfoque para foco', palavra: 'foco', fx: foco },
  { nome: 'Máquina de escrever', palavra: 'escreve', fx: maquina },
  { nome: 'Palavras que trocam', palavra: 'antes', fx: trocam, borrao: true },
  { nome: 'Texto que se pinta', palavra: 'pinta', fx: pinta },
];

const relogio = (t) => (((t + 0.5) % DUR) + DUR) % DUR;
const slotDe = (T) => (T < FIM ? Math.floor(T / SLOT) : -1);

// ── utilitários de palavra ───────────────────────────────────
function tamanho(ctx, palavra, fonte, max = 190, larg = 700) {
  const w = medir(ctx, palavra, fonte(100));
  return Math.min(max, Math.floor((larg / w) * 100));
}
function letras(ctx, palavra, fonteStr) {
  ctx.font = fonteStr;
  ctx.letterSpacing = '0px';
  const total = ctx.measureText(palavra).width;
  let x = CX - total / 2;
  return [...palavra].map((ch, i) => {
    const antes = ctx.measureText(palavra.slice(0, i)).width;
    const w = ctx.measureText(ch).width;
    return { ch, x: x + antes, w };
  });
}
const base = (S) => CY + S * 0.34;
function palavraInteira(ctx, palavra, fonteStr, y, cor, op = {}) {
  ctx.save();
  ctx.font = fonteStr;
  ctx.textAlign = 'center';
  ctx.letterSpacing = '0px';
  ctx.fillStyle = cor;
  if (op.alfa !== undefined) ctx.globalAlpha *= op.alfa;
  ctx.fillText(palavra, op.x ?? CX, y);
  ctx.restore();
}

// ── as 12 animações (u = segundos desde o começo da vez dela) ───
function mascara(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  const k = ease.outQuart(prog(u, 0.0, 0.9));
  ctx.save();
  ctx.beginPath();
  ctx.rect(JAN.x, y - S * 1.1, JAN.w, S * 1.32);
  ctx.clip();
  palavraInteira(ctx, p, SAIRA(S), y + (1 - k) * S * 1.15, COR.aluminio);
  ctx.restore();
  // a linha da máscara
  const a = 1 - ease.inOutSine(prog(u, 0.9, 1.4));
  ctx.fillStyle = `rgba(223,227,231,${0.35 * a})`;
  ctx.fillRect(CX - 320, y + S * 0.22, 640, 2);
}

function letraPorLetra(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S), L = letras(ctx, p, SAIRA(S));
  L.forEach((l, i) => {
    const k = ease.outCubic(prog(u, i * 0.12, i * 0.12 + 0.45));
    if (k <= 0) return;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.font = SAIRA(S);
    ctx.fillStyle = COR.aluminio;
    const s = lerp(0.6, 1, k);
    ctx.translate(l.x + l.w / 2, y - S * 0.3);
    ctx.scale(s, s);
    ctx.fillText(l.ch, -l.w / 2, S * 0.3 + (1 - k) * 24);
    ctx.restore();
  });
}

const ALFABETO = 'ABCDEFGHIJLMNOPRSTUVXZ';
function cacaNiquel(ctx, u, p) {
  const S = tamanho(ctx, p, (px) => SAIRA(px, 300), 180, 660), y = base(S), L = letras(ctx, p, SAIRA(S));
  const lh = S * 1.05;
  ctx.save();
  ctx.beginPath();
  ctx.rect(JAN.x, y - S * 0.95, JAN.w, S * 1.2);
  ctx.clip();
  ctx.font = SAIRA(S);
  ctx.textAlign = 'center';
  ctx.fillStyle = COR.aluminio;
  L.forEach((l, i) => {
    const para = 0.55 + i * 0.16;
    const giros = 9 + i * 2;
    const k = ease.outCubic(prog(u, 0, para));
    const pos = (1 - k) * giros; // quantas letras faltam passar
    const base0 = Math.floor(pos), frac = pos - base0;
    for (let j = -1; j <= 1; j++) {
      const n = base0 + j;
      const ch = n === 0 ? l.ch : ALFABETO[Math.floor(hash(i * 97 + n * 13) * ALFABETO.length)];
      ctx.fillText(ch, l.x + l.w / 2, y + (frac - j) * lh);
    }
  });
  ctx.restore();
  // as bordas do visor
  const g = ctx.createLinearGradient(0, y - S * 0.95, 0, y + S * 0.25);
  g.addColorStop(0, 'rgba(27,32,38,1)');
  g.addColorStop(0.18, 'rgba(27,32,38,0)');
  g.addColorStop(0.82, 'rgba(27,32,38,0)');
  g.addColorStop(1, 'rgba(27,32,38,1)');
  ctx.fillStyle = g;
  ctx.fillRect(JAN.x, y - S * 0.95, JAN.w, S * 1.2);
}

function neon(ctx, u, p) {
  const S = tamanho(ctx, p, (px) => EXP(px, 300), 170, 680), y = base(S), f = EXP(S, 300);
  // tubo apagado
  ctx.save();
  ctx.font = f;
  ctx.textAlign = 'center';
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(223,227,231,0.14)';
  ctx.strokeText(p, CX, y);
  ctx.restore();
  // pisca até firmar (padrão fixo, sem acaso)
  const PISCA = [[0.12, 0.18], [0.3, 0.34], [0.44, 0.56], [0.62, 0.66], [0.72, 9]];
  const on = PISCA.some(([a, b]) => u >= a && u < b);
  if (!on) return;
  const firme = ease.outCubic(prog(u, 0.72, 1.1));
  ctx.save();
  ctx.font = f;
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255,107,26,0.9)';
  ctx.shadowBlur = 50 * (0.6 + 0.4 * firme);
  ctx.fillStyle = COR.laranja;
  ctx.fillText(p, CX, y);
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#FFD7BD';
  ctx.globalAlpha = 0.85;
  ctx.fillText(p, CX, y);
  ctx.restore();
}

let aux = null;
function camadaAux() {
  if (!aux) {
    aux = document.createElement('canvas');
    aux.width = W;
    aux.height = H;
  }
  const g = aux.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.filter = 'none';
  g.clearRect(0, 0, W, H);
  return g;
}

function brilho(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  const g = camadaAux();
  palavraInteira(g, p, SAIRA(S), y, '#A9B0B8');
  g.globalCompositeOperation = 'source-atop';
  for (const [a, b, larg, int] of [[0.15, 1.0, 140, 1], [1.15, 1.85, 90, 0.6]]) {
    const k = ease.inOutSine(prog(u, a, b));
    if (k <= 0 || k >= 1) continue;
    const x = lerp(CX - 520, CX + 520, k);
    g.save();
    g.translate(x, y - S * 0.35);
    g.rotate(0.35);
    const gr = g.createLinearGradient(-larg, 0, larg, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, `rgba(255,255,255,${int})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(-larg, -S, larg * 2, S * 2);
    g.restore();
  }
  ctx.drawImage(aux, 0, 0);
}

function contorno(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  const k = ease.inOutCubic(prog(u, 0.0, 1.1));
  ctx.save();
  ctx.font = SAIRA(S);
  ctx.textAlign = 'center';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = COR.aluminio;
  ctx.setLineDash([k * 900, 4000]);
  ctx.strokeText(p, CX, y);
  ctx.setLineDash([]);
  ctx.restore();
  const f = ease.outCubic(prog(u, 1.0, 1.5));
  if (f > 0) palavraInteira(ctx, p, SAIRA(S), y, COR.aluminio, { alfa: f });
}

function rastro(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  const xDe = (uu) => lerp(CX - 1100, CX, ease.outExpo(prog(uu, 0.0, 0.8)));
  const parada = prog(u, 0.55, 1.0);
  for (let k = 7; k >= 1; k--) {
    const a = 0.32 * (1 - k / 8) * (1 - parada);
    if (a <= 0.01) continue;
    palavraInteira(ctx, p, SAIRA(S), y, COR.nevoa, { x: xDe(u - k * 0.035), alfa: a });
  }
  palavraInteira(ctx, p, SAIRA(S), y, COR.aluminio, { x: xDe(u) });
}

function onda(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S), L = letras(ctx, p, SAIRA(S));
  // anéis saindo do centro da palavra
  for (const [a, int] of [[0.08, 1], [0.2, 0.5]]) {
    const k = prog(u, a, a + 0.9);
    if (k <= 0 || k >= 1) continue;
    const r = 30 + ease.outCubic(k) * 520;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(JAN.x, JAN.y, JAN.w, JAN.h, JAN.r);
    ctx.clip();
    ctx.strokeStyle = `rgba(255,107,26,${(1 - k) * (1 - k) * 0.9 * int})`;
    ctx.lineWidth = 3 * (1 - k) + 1;
    ctx.beginPath();
    ctx.ellipse(CX, y - S * 0.35, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // as letras tremem um instante (0,08–0,38 s) e assentam
  const tremor = (1 - prog(u, 0.08, 0.38)) * (u >= 0.08 ? 1 : 0);
  const entra = ease.outCubic(prog(u, 0, 0.12));
  ctx.save();
  ctx.font = SAIRA(S);
  ctx.fillStyle = COR.aluminio;
  ctx.globalAlpha = entra;
  L.forEach((l, i) => {
    const q = Math.floor(u * 60);
    const dx = (hash(i * 31 + q) - 0.5) * 18 * tremor;
    const dy = (hash(i * 53 + q + 7) - 0.5) * 14 * tremor;
    ctx.fillText(l.ch, l.x + dx, y + dy);
  });
  ctx.restore();
}

function foco(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  const k = ease.outCubic(prog(u, 0.0, 1.0));
  ctx.save();
  ctx.translate(CX, y - S * 0.35);
  const s = lerp(1.12, 1, k);
  ctx.scale(s, s);
  ctx.translate(-CX, -(y - S * 0.35));
  if (k < 1) ctx.filter = `blur(${((1 - k) * 30).toFixed(1)}px)`;
  palavraInteira(ctx, p, SAIRA(S), y, COR.aluminio, { alfa: lerp(0.3, 1, k) });
  ctx.restore();
}

function maquina(ctx, u, p) {
  const S = 140, f = FONTE.mono(S, 300), y = base(S);
  ctx.font = f;
  ctx.letterSpacing = '0px';
  const larg = ctx.measureText(p).width;
  const x0 = CX - larg / 2;
  const n = clamp(Math.floor((u - 0.1) / 0.11) + 1, 0, p.length);
  const txt = p.slice(0, n);
  ctx.fillStyle = COR.aluminio;
  ctx.textAlign = 'left';
  ctx.fillText(txt, x0, y);
  const xc = x0 + ctx.measureText(txt).width + 6;
  const pisca = n >= p.length ? Math.floor((u - (0.1 + p.length * 0.11)) / 0.5) % 2 === 0 : true;
  if (pisca) {
    ctx.fillStyle = COR.laranja;
    ctx.fillRect(xc, y - S * 0.78, 10, S * 0.92);
  }
}

function trocam(ctx, u, p) {
  const S = 170, y = base(S);
  const k = ease.inOutCubic(prog(u, 0.6, 1.05));
  ctx.save();
  ctx.beginPath();
  ctx.rect(JAN.x, y - S * 1.0, JAN.w, S * 1.25);
  ctx.clip();
  palavraInteira(ctx, 'antes', SAIRA(S), y - k * S * 1.2, COR.nevoa);
  palavraInteira(ctx, 'depois', SAIRA(S), y + (1 - k) * S * 1.2, COR.aluminio);
  ctx.restore();
}

function pinta(ctx, u, p) {
  const S = tamanho(ctx, p, SAIRA), y = base(S);
  ctx.font = SAIRA(S);
  const larg = ctx.measureText(p).width;
  palavraInteira(ctx, p, SAIRA(S), y, '#2E343C');
  const k = ease.inOutCubic(prog(u, 0.1, 1.2));
  const x = CX - larg / 2 - 20 + (larg + 40) * k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(JAN.x, JAN.y, x - JAN.x, JAN.h);
  ctx.clip();
  palavraInteira(ctx, p, SAIRA(S), y, COR.laranja);
  ctx.restore();
  if (k > 0 && k < 1) {
    ctx.fillStyle = 'rgba(255,190,150,0.8)';
    ctx.fillRect(x - 1, y - S * 0.85, 2, S * 1.05);
  }
}

// ── página ───────────────────────────────────────────────────
function cabecalho(ctx) {
  // selo
  ctx.save();
  ctx.font = FONTE.mono(24, 500);
  ctx.letterSpacing = '4px';
  const selo = 'SALVA PRA USAR NO SEU SITE';
  const w = ctx.measureText(selo).width + 36;
  ctx.strokeStyle = 'rgba(223,227,231,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(90, 268, w, 48, 24);
  ctx.stroke();
  ctx.restore();
  bloco(ctx, 99, { estilo: 'rotulo', texto: 'Salva pra usar no seu site', x: 108, y: 278, tamanho: 24, peso: 500, espaco: 0.16, cor: COR.aluminio, entrada: 'corte', largura: 800 });
  bloco(ctx, 99, { texto: '12 animações de texto', x: 88, y: 336, tamanho: 84, espaco: -0.01, entrada: 'corte' });
  bloco(ctx, 99, { estilo: 'rotulo', caixa: 'normal', texto: 'parte 1 · @mach.sites', x: 90, y: 444, tamanho: 26, espaco: 0.06, entrada: 'corte' });
}

function janela(ctx, T, i) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(JAN.x, JAN.y, JAN.w, JAN.h, JAN.r);
  const g = ctx.createLinearGradient(0, JAN.y, 0, JAN.y + JAN.h);
  g.addColorStop(0, '#1F252C');
  g.addColorStop(1, '#161A1F');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(223,227,231,0.10)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.clip();
  if (i >= 0) {
    const u = T - i * SLOT;
    ITENS[i].fx(ctx, u, ITENS[i].palavra);
    ctx.restore();
    bloco(ctx, 99, { estilo: 'rotulo', texto: `${String(i + 1).padStart(2, '0')} / 12`, x: 122, y: 548, tamanho: 24, entrada: 'corte' });
  } else {
    ctx.restore();
    const u = T - FIM;
    bloco(ctx, u, { texto: 'Qual você quer\nno seu site?', alinhar: 'center', x: CX, y: 640, tamanho: 76, entrelinha: 1.12, entra: 0, durEntrada: 0.6 });
    bloco(ctx, u, { estilo: 'texto', texto: 'Comenta o número.', alinhar: 'center', x: CX, y: 860, tamanho: 48, destaque: 'número', entra: 0.35, entrada: 'fade', durEntrada: 0.5 });
  }
}

function lista(ctx, T, i) {
  const x0 = [90, 548], y0 = 1116, passo = 52;
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
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 14 });
  cabecalho(ctx);
  janela(ctx, T, i);
  lista(ctx, T, i);
  vinheta(ctx, 0.3);
}

export default {
  id: 'i14',
  nome: 'i14-12-animacoes-de-texto',
  duracao: DUR,
  fps: 30,
  obturador: 0.5,
  // borrão de movimento só nas animações rápidas
  subquadros: (t) => {
    const i = slotDe(relogio(t));
    return i >= 0 && ITENS[i].borrao && relogio(t) - i * SLOT < 1.3 ? 4 : 1;
  },

  desenhar(ctx, t) {
    quadro(ctx, t);
  },

  capa(ctx) {
    // o neon aceso (04), com 01–03 vistas
    quadro(ctx, 3 * SLOT + 1.5 - 0.5);
  },
};
