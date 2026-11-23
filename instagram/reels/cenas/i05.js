// i05 — Em 30 segundos: parallax (30 s).
//   0–3 s    cena em três camadas se movendo em velocidades diferentes + gancho
//   3–12 s   as camadas se separam e ganham rótulo: fundo lento, meio, frente rápida
//   12–17 s  "Quando vale: marca, portfólio, turismo."
//   17–22 s  "Quando não vale: página de pagamento, texto longo." (a cena para)
//   22–28 s  "Qual termo eu explico na próxima? Comenta."
//   28–30 s  volta ao gancho, no mesmo quadro do início (loop)
import { W, H, clamp, lerp, prog, ease, chaves, rng } from '../motor/tempo.js';
import { COR, FONTE, ZONA, fundo, bloco, rotulo, assinatura, cantoneiras, vinheta, quebrar } from '../motor/marca.js';
import { plano, aplicarPlano, pontoPlano } from '../motor/camadas.js';
import { riscos } from './comum.js';

const DUR = 30;
// janela da cena ("a tela do site")
const FW = 1000, FH = 940, FX = 540, FY = 1060;
// a paisagem é desenhada em 860×800 e ampliada 30% dentro da janela
const LW = 860, LH = 800, ZOOM = 1.3;
// velocidade de cada camada em relação à rolagem
const VEL = [0.2, 0.5, 1];

// rolagem simulada: vai e volta a cada 6 s (5 voltas em 30 s → loop perfeito)
const rolagem = (t) => 150 * (1 - Math.cos((2 * Math.PI * (t + 1.5)) / 6));

// cordilheiras geradas uma vez (deslocamento do ponto médio: relevo natural, determinístico)
function cordilheira(semente, { base, amp, rugosidade = 0.55, n = 64, picos = [] }) {
  const r = rng(semente);
  let pts = [0, 0];
  let escala = amp;
  while (pts.length < n + 1) {
    const novo = [];
    for (let i = 0; i < pts.length - 1; i++) novo.push(pts[i], (pts[i] + pts[i + 1]) / 2 + (r() - 0.5) * escala);
    novo.push(pts[pts.length - 1]);
    pts = novo;
    escala *= rugosidade;
  }
  const m = pts.length - 1;
  return pts.map((h, i) => {
    const u = -LW / 2 - 20 + ((LW + 40) * i) / m;
    let pico = 0;
    for (const [pu, ph, pl] of picos) pico += ph * Math.exp(-(((u - pu) / pl) ** 2));
    return [u, base - h - pico];
  });
}
const MEIO = cordilheira(11, { base: 20, amp: 150, rugosidade: 0.58, picos: [[-250, 170, 120], [60, 230, 150], [330, 120, 110]] });
const FRENTE = cordilheira(29, { base: 300, amp: 70, rugosidade: 0.5, picos: [[-320, 70, 200], [220, 110, 230]] });
const ESTRELAS = (() => {
  const r = rng(5);
  return Array.from({ length: 90 }, () => [(r() - 0.5) * LW, -LH / 2 + r() * LH * 0.7, 0.8 + r() * 1.8, 0.25 + r() * 0.6]);
})();

// ── camadas (desenhadas no plano, origem no centro da janela) ──
function camadaFundo(ctx, s, op = {}) {
  const dy = -s * VEL[0];
  const g = ctx.createLinearGradient(0, -LH / 2, 0, LH / 2);
  g.addColorStop(0, '#080A0D');
  g.addColorStop(0.55, '#141920');
  g.addColorStop(1, '#232B35');
  ctx.fillStyle = g;
  ctx.fillRect(-LW / 2 - 40, -LH / 2 - 40, LW + 80, LH + 80);
  ctx.save();
  ctx.translate(0, dy);
  for (const [x, y, r, a] of ESTRELAS) {
    ctx.fillStyle = `rgba(223,227,231,${a})`;
    ctx.fillRect(x, y, r, r);
  }
  // horizonte curvo (brilho fino)
  ctx.strokeStyle = 'rgba(223,227,231,0.24)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 2600, 2560, Math.PI * 1.35, Math.PI * 1.65);
  ctx.stroke();
  // sol: o acento laranja da cena
  ctx.globalAlpha = 0.14 * (op.dim ?? 1);
  ctx.fillStyle = COR.laranja;
  ctx.beginPath();
  ctx.arc(190, -150, 86, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = op.dim ?? 1;
  ctx.strokeStyle = COR.laranja;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(190, -150, 86, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function serra(ctx, pts, dy, { preench, traco, larg, curvas = 0, hachura = 0 }) {
  ctx.save();
  ctx.translate(0, dy);
  const caminho = new Path2D();
  caminho.moveTo(pts[0][0], LH + 400);
  for (const [u, v] of pts) caminho.lineTo(u, v);
  caminho.lineTo(pts[pts.length - 1][0], LH + 400);
  caminho.closePath();
  ctx.fillStyle = preench;
  ctx.fill(caminho);
  ctx.save();
  ctx.clip(caminho);
  // curvas de nível (cópias da crista, cada vez mais apagadas)
  for (let k = 1; k <= curvas; k++) {
    ctx.strokeStyle = `rgba(223,227,231,${0.26 * (1 - k / (curvas + 1))})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach(([u, v], i) => {
      const y = v + k * 30 + k * k * 4;
      i ? ctx.lineTo(u, y) : ctx.moveTo(u, y);
    });
    ctx.stroke();
  }
  if (hachura) {
    ctx.fillStyle = `rgba(223,227,231,${hachura})`;
    for (let y = -LH; y < LH * 1.5; y += 16) ctx.fillRect(-LW / 2 - 20, y, LW + 40, 1);
  }
  ctx.restore();
  ctx.beginPath();
  pts.forEach(([u, v], i) => (i ? ctx.lineTo(u, v) : ctx.moveTo(u, v)));
  ctx.strokeStyle = traco;
  ctx.lineWidth = larg;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}
function camadaMeio(ctx, s) {
  serra(ctx, MEIO, -s * VEL[1], { preench: '#1D232C', traco: 'rgba(223,227,231,0.82)', larg: 2.4, curvas: 5 });
}
function camadaFrente(ctx, s) {
  serra(ctx, FRENTE, -s * VEL[2], { preench: '#0E1115', traco: '#E8EBEE', larg: 3, hachura: 0.07 });
}
const CAMADAS = [camadaFundo, camadaMeio, camadaFrente];

/** Desenha a cena num plano (flat ou desmontada). sep = afastamento entre camadas. */
function cena(ctx, t, est, op = {}) {
  const s = op.parado !== undefined ? op.parado : rolagem(t);
  const planos = [0, 1, 2].map((i) => plano({ cx: est.cx, cy: est.cy, inclinacao: est.incl, giro: est.giro, altura: (i - 1) * est.sep, escala: est.esc }));
  planos.forEach((p, i) => {
    ctx.save();
    aplicarPlano(ctx, p);
    ctx.beginPath();
    ctx.rect(-FW / 2, -FH / 2, FW, FH);
    ctx.save();
    ctx.clip();
    if (i > 0 && est.fio > 0) {
      ctx.fillStyle = `rgba(20,24,30,${0.5 * est.fio})`;
      ctx.fillRect(-FW / 2, -FH / 2, FW, FH);
    }
    ctx.globalAlpha = op.dim ?? 1;
    ctx.scale(ZOOM, ZOOM);
    CAMADAS[i](ctx, s, op);
    ctx.restore();
    if (est.fio > 0) {
      ctx.globalAlpha = est.fio;
      ctx.strokeStyle = 'rgba(223,227,231,0.85)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-FW / 2, -FH / 2, FW, FH);
    }
    ctx.restore();
  });
  return planos;
}

const PLANO_FLAT = { cx: FX, cy: FY, incl: 0, giro: 0, sep: 0, esc: 1, fio: 0 };
function estadoDesmontado(t) {
  const k = (lista) => chaves(t, lista, ease.inOutCubic);
  return {
    incl: k([[3.0, 0], [5.0, 0.95], [10.5, 0.95], [12.0, 0]]),
    giro: k([[3.0, 0], [5.0, -0.5], [10.5, -0.5], [12.0, 0]]),
    sep: k([[3.2, 0], [5.3, 560], [10.3, 560], [12.0, 0]]),
    esc: k([[3.0, 1], [5.0, 0.6], [10.5, 0.6], [12.0, 1]]),
    cx: k([[3.0, FX], [5.0, 664], [10.5, 664], [12.0, FX]]),
    cy: k([[3.0, FY], [5.0, 1072], [10.5, 1072], [12.0, FY]]),
    fio: k([[3.2, 0], [4.6, 1], [10.6, 1], [11.8, 0]]),
  };
}

function moldura(ctx, t, op = {}) {
  const a = op.alfa ?? 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(223,227,231,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(FX - FW / 2 + 0.75, FY - FH / 2 + 0.75, FW - 1.5, FH - 1.5);
  ctx.restore();
  cantoneiras(ctx, FX - FW / 2 - 14, FY - FH / 2 - 14, FW + 28, FH + 28, { tam: 24, alfa: 0.75 * a });
  // barra de rolagem da "página"
  if (op.barra !== false) {
    const s = rolagem(t) / 300;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(223,227,231,0.18)';
    ctx.fillRect(FX + FW / 2 - 18, FY - FH / 2 + 30, 2, FH - 60);
    ctx.fillStyle = 'rgba(223,227,231,0.75)';
    ctx.fillRect(FX + FW / 2 - 21, FY - FH / 2 + 30 + s * (FH - 60 - 120), 8, 120);
    ctx.restore();
  }
}

function serie(ctx, t, entra = -1) {
  rotulo(ctx, t, { texto: 'Em 30 segundos', x: 90, y: 292, entra, entrada: 'corte' });
}

function gancho(ctx, t, entra, sai, entrada = 'corte') {
  bloco(ctx, t, { texto: 'Parallax.', x: 90, y: 338, tamanho: 132, entra, sai: 1e9, entrada, espaco: -0.02 });
  bloco(ctx, t, { estilo: 'texto', texto: 'Você já viu. Só não sabia o nome.', x: 90, y: 500, tamanho: 44, cor: COR.nevoa, entra: entrada === 'corte' ? entra : entra + 0.25, sai, entrada: entrada === 'corte' ? 'corte' : 'fade', saida: 'fade' });
}

export default {
  id: 'i05',
  nome: 'i05-em-30-segundos-parallax',
  duracao: DUR,
  fps: 30,

  desenhar(ctx, t) {
    fundo(ctx);
    riscos(ctx, t, DUR, { alfa: 0.7, semente: 3 });

    if (t < 3) {
      cena(ctx, t, PLANO_FLAT);
      moldura(ctx, t);
      serie(ctx, t);
      gancho(ctx, t, -1, 2.6);
    } else if (t < 12) {
      const est = estadoDesmontado(t);
      const planos = cena(ctx, t, est);
      moldura(ctx, t, { alfa: 1 - est.fio });
      serie(ctx, t);
      bloco(ctx, t, { texto: 'Parallax.', x: 90, y: 338, tamanho: 132, entra: -1, sai: 11.2, entrada: 'corte', espaco: -0.02 });
      bloco(ctx, t, { estilo: 'texto', texto: 'Três camadas. Três velocidades.', x: 90, y: 500, tamanho: 44, cor: COR.nevoa, entra: 5.0, sai: 11.2, entrada: 'fade', saida: 'fade' });
      rotulosCamadas(ctx, t, planos);
    } else if (t < 17) {
      cena(ctx, t, PLANO_FLAT);
      moldura(ctx, t);
      serie(ctx, t);
      rotulo(ctx, t, { texto: 'Quando vale', x: 90, y: 352, entra: 12.0, entrada: 'corte', cor: COR.aluminio });
      bloco(ctx, t, { texto: 'Marca, portfólio, turismo.', x: 90, y: 398, tamanho: 74, entra: 12.0, sai: 16.6, durEntrada: 0.6 });
    } else if (t < 22) {
      // a cena para: em página de pagamento e texto longo, o movimento atrapalha
      const parado = rolagem(17);
      cena(ctx, t, PLANO_FLAT, { parado, dim: 0.22 });
      moldura(ctx, t, { barra: false });
      exemplosParados(ctx, t);
      serie(ctx, t);
      rotulo(ctx, t, { texto: 'Quando não vale', x: 90, y: 352, entra: 17.0, entrada: 'corte', cor: COR.aluminio });
      bloco(ctx, t, { texto: 'Página de pagamento, texto longo.', x: 90, y: 398, tamanho: 74, entra: 17.0, sai: 21.6, durEntrada: 0.6 });
    } else if (t < 28) {
      cena(ctx, t, PLANO_FLAT);
      moldura(ctx, t);
      serie(ctx, t);
      assinatura(ctx, t, { x: 940, y: 292, alinhar: 'right', entra: 22.5, sai: 27.4 });
      bloco(ctx, t, { texto: 'Qual termo eu explico na próxima? Comenta.', x: 90, y: 352, tamanho: 72, largura: 850, entra: 22.0, sai: 27.5, destaque: 'Comenta' });
    } else {
      cena(ctx, t, PLANO_FLAT);
      moldura(ctx, t);
      serie(ctx, t);
      gancho(ctx, t, 28.0, 1e9, 'mascara');
    }
    vinheta(ctx, 0.35);
  },

  capa(ctx) {
    fundo(ctx);
    // cena grande ao fundo, escurecida
    ctx.save();
    ctx.translate(540, 1440);
    ctx.scale(1.26, 1.26);
    ctx.beginPath();
    ctx.rect(-LW / 2, -LH / 2, LW, LH);
    ctx.clip();
    CAMADAS.forEach((c) => c(ctx, 150));
    ctx.restore();
    const g = ctx.createLinearGradient(0, 300, 0, 1500);
    g.addColorStop(0, 'rgba(10,12,15,1)');
    g.addColorStop(0.5, 'rgba(10,12,15,0.7)');
    g.addColorStop(1, 'rgba(10,12,15,0.05)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COR.fundo;
    ctx.fillRect(0, 0, W, 300);
    rotulo(ctx, 0, { texto: 'Em 30 segundos', alinhar: 'center', x: 540, y: 640, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Parallax.', alinhar: 'center', x: 540, y: 700, tamanho: 168, entrada: 'corte', espaco: -0.02 });
    bloco(ctx, 0, { estilo: 'texto', texto: 'Você já viu. Só não sabia o nome.', alinhar: 'center', x: 540, y: 920, tamanho: 50, entrada: 'corte' });
    vinheta(ctx, 0.4);
  },
};

function rotulosCamadas(ctx, t, planos) {
  const nomes = [['Fundo · lento', '0,2×'], ['Meio', '0,5×'], ['Frente · rápida', '1×']];
  const entradas = [5.0, 6.0, 7.0];
  planos.forEach((cp, i) => {
    const cantos = [[-FW / 2, -FH / 2], [FW / 2, -FH / 2], [FW / 2, FH / 2], [-FW / 2, FH / 2]].map(([u, v]) => pontoPlano(cp, u, v));
    const esq = cantos.reduce((a, b) => (b[0] < a[0] ? b : a));
    const a = ease.outCubic(prog(t, entradas[i], entradas[i] + 0.5)) * (1 - ease.inCubic(prog(t, 10.2, 10.6)));
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(223,227,231,0.5)';
    ctx.fillRect(90, esq[1] - 0.75, (esq[0] - 6 - 90) * ease.outCubic(prog(t, entradas[i], entradas[i] + 0.6)), 1.5);
    ctx.restore();
    const larg = esq[0] - 104;
    const linhas = quebrar(ctx, nomes[i][0].toLocaleUpperCase('pt-BR'), FONTE.mono(22), larg, 22 * 0.06).length;
    const topoNome = esq[1] - 14 - linhas * 34;
    rotulo(ctx, t, { texto: nomes[i][1], x: 90, y: topoNome - 58, entra: entradas[i], sai: 10.2, cor: COR.aluminio, tamanho: 34, espaco: 0.06 });
    rotulo(ctx, t, { texto: nomes[i][0], x: 90, y: topoNome, entra: entradas[i], sai: 10.2, tamanho: 22, espaco: 0.06, largura: larg, cor: '#AEB5BD' });
  });
}

function exemplosParados(ctx, t) {
  const a = ease.outCubic(prog(t, 17.1, 17.6));
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(223,227,231,0.7)';
  ctx.lineWidth = 2;
  // cartão de pagamento (esquerda)
  const x0 = FX - FW / 2 + 60, y0 = FY - FH / 2 + 150, cw = 340;
  ctx.font = FONTE.mono(20);
  ctx.letterSpacing = '3px';
  ctx.fillStyle = COR.nevoa;
  ctx.fillText('PAGAMENTO', x0, y0 - 24);
  for (let i = 0; i < 3; i++) ctx.strokeRect(x0, y0 + i * 92, cw, 62);
  ctx.fillStyle = 'rgba(223,227,231,0.25)';
  for (let i = 0; i < 3; i++) ctx.fillRect(x0 + 22, y0 + i * 92 + 28, 90 + i * 40, 6);
  ctx.fillStyle = COR.aluminio;
  ctx.fillRect(x0, y0 + 300, cw, 66);
  ctx.fillStyle = COR.fundo;
  ctx.font = FONTE.texto(26, 500);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'center';
  ctx.fillText('Pagar', x0 + cw / 2, y0 + 342);
  ctx.textAlign = 'left';
  // texto longo (direita)
  const x1 = FX + 40, y1 = y0;
  ctx.font = FONTE.mono(20);
  ctx.letterSpacing = '3px';
  ctx.fillStyle = COR.nevoa;
  ctx.fillText('TEXTO LONGO', x1, y1 - 24);
  ctx.fillStyle = 'rgba(223,227,231,0.32)';
  for (let i = 0; i < 14; i++) ctx.fillRect(x1, y1 + 8 + i * 30, i % 5 === 4 ? 180 : 320 - ((i * 37) % 60), 7);
  ctx.restore();
}
