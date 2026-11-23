// i12 — Padaria em uso (45 s). Versão calma: um cliente encomenda panetone de Natal no site da Padaria
// Quatro Horas, com rolagens lentas, pausa depois de cada movimento, borrão de movimento (4 subquadros,
// obturador de 180°) e uma ideia por tela. Base: cenas/i12-captura.mjs (.quadros/i12-site/), com toques reais.
// Tempos em cenas/i12-tempos.mjs; eventos de som em instagram/reels/i12-eventos.json.
import { W, H, clamp, lerp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, assinatura, dedo, quebrar, faixa } from '../motor/marca.js';
import { DURACAO, TOQUES, TEXTOS, ETAPAS } from './i12-tempos.mjs';

const PASTA = '/instagram/reels/.quadros/i12-site';
const N = 4;
const NEON = '#E5AC68';
const E = 2.5;
let meta;

// câmera lenta: tela = alvo + (ponto − foco) × escala
const ID = { s: 1, fx: 540, fy: 960, tx: 540, ty: 960 };
const em = (p, s) => ({ s, fx: p[0], fy: p[1], tx: p[0], ty: p[1] });
const mistura = (a, b, k) => ({ s: lerp(a.s, b.s, k), fx: lerp(a.fx, b.fx, k), fy: lerp(a.fy, b.fy, k), tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k) });
function camera(t) {
  if (t < 3) return mistura(ID, em([540, 900], 1.025), ease.inOutSine(t / 3));
  if (t < 3.8) return mistura(em([540, 900], 1.025), ID, ease.inOutSine(t - 3));
  if (t < 9.5) return mistura(ID, em([540, 860], 1.1), ease.inOutSine(prog(t, 6.5, 9.5)));
  if (t < 13.5) return mistura(ID, em([540, 1150], 1.06), ease.inOutSine(prog(t, 9.5, 13.5)));
  if (t < 34) return ID;
  if (t < 40.5) return mistura(ID, em([479, 1384], 1.15), ease.inOutSine(prog(t, 37.6, 40.5))); // zoom no pino
  return mistura(em([540, 900], 1.025), ID, ease.inOutSine(prog(t, 43.7, DURACAO)));
}
const naTela = (c, x, y) => [c.tx + (x - c.fx) * c.s, c.ty + (y - c.fy) * c.s];

/** uma ideia por tela: faixa escura no alto, texto curto */
function legenda(ctx, t, texto, [entra, sai], op = {}) {
  if (t < entra - 0.1 || t > sai + 0.6) return;
  const tam = op.tamanho ?? 56;
  const n = texto.split('\n').length;
  const y = op.y ?? 272;
  faixa(ctx, t, { y, h: n * tam * 1.16 + 56, entra, sai, cor: 'rgba(5,2,10,0.94)', linha: 'rgba(229,172,104,0.3)', durEntrada: 0.4, durSaida: 0.45 });
  bloco(ctx, t, { texto, x: 90, y: y + 28, tamanho: tam, largura: 850, entrelinha: 1.16, entra: entra + 0.1, sai, entrada: 'fade', saida: 'fade', durEntrada: 0.5, durSaida: 0.4 });
}

/** o gancho, sobre a boca escura do forno (primeira tela) */
function gancho(ctx, t, entra, sai, corte) {
  const a = (corte ? 1 : ease.outCubic(prog(t, entra, entra + 0.5))) * (t >= sai ? 1 - ease.inOutSine(prog(t, sai, sai + 0.5)) : 1);
  if (a > 0) {
    const g = ctx.createLinearGradient(0, 1150, 0, 1480);
    g.addColorStop(0, 'rgba(5,2,10,0)');
    g.addColorStop(0.3, `rgba(5,2,10,${0.82 * a})`);
    g.addColorStop(0.7, `rgba(5,2,10,${0.82 * a})`);
    g.addColorStop(1, 'rgba(5,2,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 1150, W, 330);
  }
  bloco(ctx, t, { texto: 'Um cliente pedindo\npanetone.', x: 90, y: 1236, tamanho: 60, entrelinha: 1.14, entra, sai, entrada: corte ? 'corte' : 'fade', saida: 'fade', durEntrada: 0.6, durSaida: 0.5 });
}

/** trilha das etapas: uma linha discreta embaixo, sem painel */
const NOMES = ['Ver', 'Escolher', 'Pedir', 'Chegar'];
function trilha(ctx, t) {
  const atual = (ETAPAS.find(([a, b]) => t >= a && t < b) || ETAPAS[0])[2];
  // no mapa a trilha sai: o pino e o "6 min a pé" ficam embaixo
  const a = 1 - ease.inOutSine(prog(t, 35.0, 35.6)) * (1 - ease.inOutSine(prog(t, 40.4, 40.6)));
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 1340, 0, 1470);
  g.addColorStop(0, 'rgba(5,2,10,0)');
  g.addColorStop(0.45, 'rgba(5,2,10,0.88)');
  g.addColorStop(1, 'rgba(5,2,10,0.88)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 1340, W, 130);
  ctx.save();
  ctx.font = FONTE.mono(20, 400);
  ctx.letterSpacing = '3px';
  ctx.textBaseline = 'alphabetic';
  let x = 90;
  NOMES.forEach((n, i) => {
    const txt = `0${i + 1} ${n.toUpperCase()}`;
    ctx.fillStyle = i === atual ? NEON : 'rgba(223,227,231,0.38)';
    ctx.fillText(txt, x, 1424);
    x += ctx.measureText(txt).width + 44;
  });
  ctx.restore();
  ctx.restore();
}

function dedos(ctx, t, c) {
  for (const [tt, k] of TOQUES) {
    if (t < tt - 0.45 || t > tt + 0.55) continue;
    const f = Math.max(0, Math.round((tt - 0.05) * 30));
    const r = meta.quadros[Math.min(f, meta.quadros.length - 1)][k];
    if (!r) continue;
    const [x, y] = naTela(c, (r[0] + r[2] / 2) * E, (r[1] + r[3] / 2) * E);
    const alfa = ease.outCubic(prog(t, tt - 0.45, tt - 0.2)) * (1 - ease.inCubic(prog(t, tt + 0.25, tt + 0.55)));
    const pressao = Math.sin(Math.PI * clamp((t - (tt - 0.12)) / 0.32));
    dedo(ctx, x, y + (1 - ease.outCubic(prog(t, tt - 0.45, tt - 0.12))) * 36, { alfa, pressao, raio: 44 });
  }
}

/** a mensagem que o site montou, num balão genérico (só o texto, sem cara de aplicativo) */
function balao(ctx, t) {
  const [entra, sai] = TEXTOS.mensagem;
  const linhas = meta.mensagem.split('\n').filter((l) => l.trim());
  const fonte = FONTE.texto(46);
  const L = [];
  for (const l of linhas) L.push(...quebrar(ctx, l, fonte, 720));
  const lh = 66, pad = 50, w = 840, h = pad * 2 + L.length * lh;
  const x = 120, y = 900 - h / 2;
  const k = ease.outCubic(prog(t, entra + 0.2, entra + 0.8)) * (1 - ease.inOutSine(prog(t, sai, sai + 0.4)));
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(0, (1 - k) * 30);
  ctx.fillStyle = '#2A2426';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 32);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w - 64, y + h - 2);
  ctx.lineTo(x + w + 6, y + h + 32);
  ctx.lineTo(x + w - 14, y + h - 32);
  ctx.closePath();
  ctx.fill();
  ctx.textBaseline = 'alphabetic';
  L.forEach((l, i) => {
    ctx.font = i === 0 ? FONTE.texto(46, 500) : fonte;
    ctx.fillStyle = i === 0 ? '#FAF1DF' : '#E9DCC6';
    ctx.fillText(l, x + pad, y + pad + 46 + i * lh);
  });
  ctx.restore();
}

export default {
  id: 'i12',
  nome: 'i12-padaria-em-uso',
  duracao: DURACAO,
  fps: 30,
  subquadros: N,
  obturador: 0.5,

  async preparar() {
    meta = await (await fetch(`${PASTA}/meta.json`)).json();
  },

  async desenhar(ctx, t, f, k) {
    fundo(ctx, '#05020A');
    const c = camera(t);
    const img = await carregarImagem(`${PASTA}/s_${String(f * N + k).padStart(5, '0')}.jpg`);
    ctx.save();
    const [m0, m1] = TEXTOS.mensagem;
    if (t >= m0 - 0.3 && t < 34) ctx.filter = `blur(${(9 * ease.outCubic(prog(t, m0 - 0.3, m0 + 0.3)) * (1 - ease.inOutSine(prog(t, m1 + 0.1, 34)))).toFixed(1)}px)`;
    ctx.translate(c.tx, c.ty);
    ctx.scale(c.s, c.s);
    ctx.drawImage(img, -c.fx, -c.fy, W, H);
    ctx.restore();

    if (t < 3.6) gancho(ctx, t, -1, TEXTOS.gancho[1], true);
    legenda(ctx, t, 'Aba Natal.', TEXTOS.aba);
    legenda(ctx, t, '2 panetones e 1 chocotone.', TEXTOS.itens);
    legenda(ctx, t, 'O pedido se monta sozinho.', TEXTOS.pedido);
    if (t >= TEXTOS.mensagem[0] - 0.3 && t < 34.5) {
      const d = ease.outCubic(prog(t, TEXTOS.mensagem[0] - 0.3, TEXTOS.mensagem[0] + 0.3)) * (1 - ease.inOutSine(prog(t, TEXTOS.mensagem[1] + 0.1, 34)));
      ctx.fillStyle = `rgba(5,2,10,${0.7 * d})`;
      ctx.fillRect(0, 0, W, H);
      legenda(ctx, t, 'A mensagem já sai pronta.', TEXTOS.mensagem);
      balao(ctx, t);
    }
    legenda(ctx, t, '6 minutos a pé.', TEXTOS.mapa);
    if (t >= 40.5) {
      const [c0, c1] = TEXTOS.convite;
      const v = ease.outCubic(prog(t, 40.5, 41.0)) * (1 - ease.inOutSine(prog(t, c1, c1 + 0.6)));
      if (v > 0) {
        ctx.fillStyle = `rgba(5,2,10,${0.9 * v})`;
        ctx.fillRect(0, 0, W, H);
      }
      bloco(ctx, t, { texto: 'Quer um site assim?\nChama no direct.', x: 90, y: 720, tamanho: 84, entrelinha: 1.12, entra: c0, sai: c1, entrada: 'fade', saida: 'fade', destaque: 'direct', durEntrada: 0.6 });
      assinatura(ctx, t, { y: 950, tamanho: 30, cor: COR.aluminio, entra: c0 + 0.4, sai: c1 });
      if (t >= TEXTOS.volta[0]) gancho(ctx, t, TEXTOS.volta[0], 1e9, false);
    }
    dedos(ctx, t, c);
    trilha(ctx, t);
  },

  async capa(ctx) {
    fundo(ctx, '#05020A');
    // o cardápio com o pedido escolhido, e o gancho no alto
    const img = await carregarImagem(`${PASTA}/s_${String(650 * N).padStart(5, '0')}.jpg`);
    ctx.drawImage(img, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, 260, 0, 1000);
    g.addColorStop(0, 'rgba(5,2,10,0.94)');
    g.addColorStop(0.7, 'rgba(5,2,10,0.94)');
    g.addColorStop(1, 'rgba(5,2,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 260, W, 740);
    bloco(ctx, 0, { texto: 'Um cliente pedindo\npanetone.', alinhar: 'center', x: 540, y: 520, tamanho: 76, entrelinha: 1.12, entrada: 'corte' });
  },
};
