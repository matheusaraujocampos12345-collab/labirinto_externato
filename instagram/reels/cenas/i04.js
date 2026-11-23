// i04 — Caixa-preta #1: o texto que acende com a rolagem (40 s).
// Motion feito por código. Cenas:
//   A  0–3 s e 35–40 s  efeito pronto (o próprio gancho acende) — fecha o loop
//   B  3–10 s           "O que é: o texto acompanha o seu dedo." (o dedo controla o efeito)
//   C  10–25 s          as três camadas em wireframe, com rótulos
//   D  25–35 s          "Pra que serve: o cliente lê a frase inteira, no ritmo dele."
import { W, H, clamp, lerp, prog, ease, chaves } from '../motor/tempo.js';
import { COR, FONTE, ZONA, fundo, bloco, rotulo, assinatura, dedo, cantoneiras, vinheta, medir, quebrar } from '../motor/marca.js';
import { plano, aplicarPlano, pontoPlano } from '../motor/camadas.js';
import { montarParagrafo, desenharAceso, trilho, num, misturar, riscos } from './comum.js';

const GANCHO = 'Esse efeito está nos sites mais premiados do mundo. Abrimos a caixa-preta.';
const O_QUE_E = 'O texto acompanha o seu dedo.';
const FRASE_C = 'Cada palavra acende quando você chega nela.';
const PRA_QUE = 'O cliente lê a frase inteira, no ritmo dele.';

let parA, parB, parC, parD, parCapa;

// progresso do efeito na cena A: anda em velocidade constante e atravessa o loop
const VEL_A = 7.4;
const pA = (t) => (t >= 35 ? (t - 35) / VEL_A : Math.min(1, (t + 5) / VEL_A));

// dedo da cena B: [t, y, pressionado]
const DEDO_Y = [[3.5, 1390], [3.75, 1390], [5.75, 1050], [6.25, 1050], [7.25, 1220], [9.0, 890]];
const dedoY = (t) => chaves(t, DEDO_Y, ease.inOutSine);
const pB = (t) => clamp((1390 - dedoY(t)) / 500);

// cena C: plano 800×470 desmontado em três camadas
const PW = 800, PH = 470;
const k = (t, lista) => chaves(t, lista, ease.inOutCubic);
function estadoC(t) {
  return {
    incl: k(t, [[11.5, 0], [13.5, 0.95], [22.5, 0.95], [24.5, 0]]),
    giro: k(t, [[11.5, 0], [13.5, -0.5], [22.5, -0.5], [24.5, 0]]),
    sep: k(t, [[11.5, 0], [13.8, 400], [22.3, 400], [24.5, 0]]),
    esc: k(t, [[11.5, 1], [13.5, 0.82], [22.5, 0.82], [24.5, 1]]), // camadas 30% maiores
    cx: k(t, [[11.5, 540], [13.5, 668], [22.5, 668], [24.5, 540]]),
    cy: k(t, [[11.5, 860], [13.5, 905], [22.5, 905], [24.5, 860]]),
    fio: k(t, [[11.6, 0], [13.0, 1], [23.0, 1], [24.4, 0]]),
    p: chaves(t, [[10.0, 0], [11.5, 0.55], [18.0, 0.55], [19.5, 0.12], [22.0, 1], [25, 1]], ease.inOutSine),
  };
}

export default {
  id: 'i04',
  nome: 'i04-caixa-preta-1',
  duracao: 40,
  fps: 30,

  preparar(ctx) {
    parA = montarParagrafo(ctx, GANCHO, { fonte: FONTE.titulo(92), tamanho: 92, largura: 850, entrelinha: 1.13, x: 90, y: 500, espaco: -1 });
    parB = montarParagrafo(ctx, O_QUE_E, { fonte: FONTE.titulo(128), tamanho: 128, largura: 850, entrelinha: 1.1, x: 90, y: 500, espaco: -1.5 });
    parC = montarParagrafo(ctx, FRASE_C, { fonte: FONTE.titulo(80), tamanho: 80, largura: 700, entrelinha: 1.12, x: -350, y: -150, espaco: -1 });
    parD = montarParagrafo(ctx, PRA_QUE, { fonte: FONTE.titulo(112), tamanho: 112, largura: 850, entrelinha: 1.12, x: 90, y: 500, espaco: -1.2 });
    parCapa = montarParagrafo(ctx, GANCHO, { fonte: FONTE.titulo(96), tamanho: 96, largura: 850, entrelinha: 1.12, x: 90, y: 720, espaco: -1 });
  },

  desenhar(ctx, t) {
    fundo(ctx);
    riscos(ctx, t, 40, { alfa: 0.9 });
    if (t < 3 || t >= 35) cenaA(ctx, t);
    else if (t < 10) cenaB(ctx, t);
    else if (t < 25) cenaC(ctx, t);
    else cenaD(ctx, t);
    vinheta(ctx, 0.35);
  },

  capa(ctx) {
    fundo(ctx);
    rotulo(ctx, 0, { texto: 'Caixa-preta #1', x: 90, y: 620, entrada: 'corte' });
    trilho(ctx, 90, 670, 850, 0.72);
    desenharAceso(ctx, parCapa, 0.72, { apagado: '#4A525C' });
    vinheta(ctx, 0.35);
  },
};

function cabecalho(ctx, t, titulo, p, entra) {
  rotulo(ctx, t, { texto: titulo, x: 90, y: 292, entra, entrada: 'corte' });
  rotulo(ctx, t, { texto: `rolagem ${String(Math.round(p * 100)).padStart(2, '0')}%`, x: 940, y: 292, alinhar: 'right', entra, entrada: 'corte' });
  trilho(ctx, 90, 352, 850, p);
}

// ── A: efeito pronto ─────────────────────────────────────────
function cenaA(ctx, t) {
  const p = pA(t);
  cabecalho(ctx, t, 'Caixa-preta #1', p, -1);
  desenharAceso(ctx, parA, p, { dy: -36 * p });
}

// ── B: o que é ───────────────────────────────────────────────
function cenaB(ctx, t) {
  const p = pB(t);
  cabecalho(ctx, t, 'O que é', p, 3);
  desenharAceso(ctx, parB, p);
  // trilho do dedo
  const x = 800;
  ctx.save();
  ctx.fillStyle = 'rgba(223,227,231,0.12)';
  ctx.fillRect(x - 1, 890, 2, 500);
  for (let i = 0; i <= 10; i++) ctx.fillRect(x - (i % 5 ? 6 : 12), 890 + i * 50, i % 5 ? 12 : 24, 1.5);
  ctx.restore();
  const aparece = ease.outCubic(prog(t, 3.5, 3.75)) * (1 - ease.inCubic(prog(t, 9.0, 9.3)));
  const pressao = ease.inOutSine(prog(t, 3.65, 3.8)) * (1 - ease.inOutSine(prog(t, 8.95, 9.1)));
  dedo(ctx, x, dedoY(t), { alfa: aparece, pressao });
}

// ── C: as camadas ────────────────────────────────────────────
function cenaC(ctx, t) {
  const e = estadoC(t);
  rotulo(ctx, t, { texto: 'Por dentro: 3 camadas', x: 90, y: 292, entra: 12.0, sai: 23.5 });
  // um pouco de luz atrás das camadas
  if (e.fio > 0) {
    const g = ctx.createRadialGradient(e.cx, e.cy, 0, e.cx, e.cy, 760);
    g.addColorStop(0, `rgba(223,227,231,${0.08 * e.fio})`);
    g.addColorStop(1, 'rgba(223,227,231,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const planoDe = (i) => plano({ cx: e.cx, cy: e.cy, inclinacao: e.incl, giro: e.giro, altura: (i - 1) * e.sep, escala: e.esc });
  const camadas = [planoDe(0), planoDe(1), planoDe(2)];
  const N = parC.palavras.length;
  const fracao = (i) => ease.inOutSine(clamp(e.p * (N + 0.6) - i));

  // 1 — texto apagado
  emPlano(ctx, camadas[0], () => {
    placa(ctx, e.fio);
    desenharAceso(ctx, parC, 0, { alfa: 1 - e.fio });
    if (e.fio > 0) desenharAceso(ctx, parC, 0, { contorno: true, apagado: '#C4CAD1', alfa: e.fio, espessura: 2.2 });
  });
  // 2 — máscara (o que já foi lido fica aceso)
  emPlano(ctx, camadas[1], () => {
    placa(ctx, e.fio);
    ctx.save();
    ctx.beginPath();
    parC.palavras.forEach((w, i) => {
      const f = fracao(i);
      if (f > 0) ctx.rect(w.x - 6, w.base - parC.tamanho * 0.86, (w.w + 12) * f, parC.tamanho * 1.12);
    });
    ctx.clip();
    if (e.fio > 0) {
      ctx.globalAlpha = e.fio;
      ctx.strokeStyle = 'rgba(223,227,231,0.34)';
      ctx.lineWidth = 2;
      for (let x = -PW; x < PW; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, -PH / 2);
        ctx.lineTo(x + PH, PH / 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    desenharAceso(ctx, parC, 1, { aceso: COR.aluminio });
    ctx.restore();
    if (e.fio > 0) {
      ctx.save();
      ctx.globalAlpha = e.fio * 0.9;
      ctx.strokeStyle = COR.aluminio;
      ctx.lineWidth = 2;
      parC.palavras.forEach((w, i) => {
        const f = fracao(i);
        if (f > 0) ctx.strokeRect(w.x - 6, w.base - parC.tamanho * 0.86, (w.w + 12) * f, parC.tamanho * 1.12);
      });
      ctx.restore();
    }
  });
  // 3 — linha do tempo ligada à rolagem (só aparece desmontado)
  if (e.fio > 0) {
    emPlano(ctx, camadas[2], () => {
      ctx.globalAlpha = e.fio;
      placa(ctx, 1);
      linhaDoTempo(ctx, e.p, N);
    });
  }

  // rótulos: texto acima de uma linha fina que vai até o canto esquerdo da camada
  const nomes = [['01', 'Texto apagado'], ['02', 'Máscara'], ['03', 'Linha do tempo ligada à rolagem']];
  const entradas = [13.8, 15.0, 16.2];
  camadas.forEach((cp, i) => {
    const cantos = [[-PW / 2, -PH / 2], [PW / 2, -PH / 2], [PW / 2, PH / 2], [-PW / 2, PH / 2]].map(([u, v]) => pontoPlano(cp, u, v));
    const esq = cantos.reduce((a, b) => (b[0] < a[0] ? b : a));
    const a = ease.outCubic(prog(t, entradas[i], entradas[i] + 0.5)) * (1 - ease.inCubic(prog(t, 22.2, 22.6)));
    if (a <= 0) return;
    const larg = esq[0] - 116;
    const fonteNome = FONTE.mono(21);
    const linhas = quebrar(ctx, nomes[i][1].toLocaleUpperCase('pt-BR'), fonteNome, larg, 21 * 0.08).length;
    const topo = esq[1] - 14 - 36 - linhas * 32;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(223,227,231,0.6)';
    ctx.fillRect(90, esq[1] - 0.75, (esq[0] - 6 - 90) * ease.outCubic(prog(t, entradas[i], entradas[i] + 0.6)), 1.5);
    ctx.restore();
    rotulo(ctx, t, { texto: nomes[i][0], x: 90, y: topo, entra: entradas[i], sai: 22.2, cor: COR.aluminio, tamanho: 26 });
    rotulo(ctx, t, { texto: nomes[i][1], x: 90, y: topo + 38, entra: entradas[i], sai: 22.2, tamanho: 21, espaco: 0.08, entrelinha: 1.5, largura: larg, cor: '#AEB5BD' });
  });
}

function emPlano(ctx, p, fn) {
  ctx.save();
  aplicarPlano(ctx, p);
  fn();
  ctx.restore();
}

function placa(ctx, fio) {
  if (fio <= 0) return;
  ctx.save();
  ctx.globalAlpha *= fio;
  ctx.fillStyle = 'rgba(30,36,44,0.92)';
  ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
  ctx.strokeStyle = 'rgba(223,227,231,0.85)';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-PW / 2, -PH / 2, PW, PH);
  cantoneiras(ctx, -PW / 2 + 14, -PH / 2 + 14, PW - 28, PH - 28, { tam: 22, alfa: 0.85, espessura: 2.2 });
  ctx.restore();
}

function linhaDoTempo(ctx, p, N) {
  const x0 = -330, x1 = 300, y = 30;
  ctx.save();
  ctx.font = FONTE.mono(22);
  ctx.letterSpacing = '3px';
  ctx.fillStyle = '#B4BBC3';
  ctx.fillText('LINHA DO TEMPO', x0, -150);
  ctx.fillText('0%', x0, 110);
  ctx.textAlign = 'right';
  ctx.fillText('100%', x1, 110);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(223,227,231,0.6)';
  ctx.fillRect(x0, y - 1, x1 - x0, 2.5);
  // um quadro-chave por palavra
  for (let i = 0; i < N; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / N;
    const aceso = p * (N + 0.6) - i >= 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    if (aceso) {
      ctx.fillStyle = COR.aluminio;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(223,227,231,0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  }
  // agulha (o acento laranja da cena)
  const px = lerp(x0, x1, p);
  ctx.fillStyle = COR.laranja;
  ctx.fillRect(px - 1.5, y - 70, 3, 140);
  ctx.beginPath();
  ctx.moveTo(px - 10, y - 82);
  ctx.lineTo(px + 10, y - 82);
  ctx.lineTo(px, y - 68);
  ctx.closePath();
  ctx.fill();
  // barra de rolagem ligada à agulha
  const sx = 352, sy0 = -190, sy1 = 190;
  ctx.fillStyle = 'rgba(223,227,231,0.25)';
  ctx.fillRect(sx - 1, sy0, 2, sy1 - sy0);
  ctx.fillStyle = COR.aluminio;
  ctx.fillRect(sx - 6, lerp(sy0, sy1 - 70, p), 12, 70);
  ctx.strokeStyle = 'rgba(223,227,231,0.35)';
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px, y - 70);
  ctx.lineTo(px, -120);
  ctx.lineTo(sx - 12, -120);
  ctx.lineTo(sx - 12, lerp(sy0, sy1 - 70, p) + 35);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#B4BBC3';
  ctx.fillText('ROLAGEM', 170, -150);
  ctx.restore();
}

// ── D: pra que serve ─────────────────────────────────────────
function cenaD(ctx, t) {
  const p = chaves(t, [[25.4, 0], [31.4, 1]], ease.linear);
  cabecalho(ctx, t, 'Pra que serve', p, 25);
  desenharAceso(ctx, parD, p, { dy: -30 * p });
  assinatura(ctx, t, { entra: 31.5, sai: 34.6 });
}
