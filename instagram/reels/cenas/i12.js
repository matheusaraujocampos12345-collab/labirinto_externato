// i12 — Padaria em uso (47 s). Um cliente encomenda panetone de Natal no site da Padaria Quatro Horas,
// do começo ao fim. Base: a gravação de cenas/i12-captura.mjs (.quadros/i12-site/), com toques reais
// no site. Aqui entram a câmera (zooms suaves), o dedo, os rótulos de etapa e os textos.
//   0–3 s     primeira tela + gancho
//   3–5 s     zoom no selo "Encomendas de Natal abertas"
//   5–10,5 s  a rolagem: o pão sai do forno (zoom lento no pão)
//   10,5–13 s painel da próxima fornada (zoom rápido no LED)
//   13–16 s   Natal: luzes e o painel contando os dias
//   16–27,5 s cardápio: toque na aba Natal, "Adicionar" no panetone de 1 kg (duas vezes) e no chocotone, resumo
//   27,5–33 s a mensagem que o site monta, num balão genérico
//   33–42 s   mapa: o caminho, "6 min a pé" e o pino · "Padaria fictícia. Site de verdade."
//   42–47 s   primeira tela: "Quer um site assim? Chama no direct." e o gancho de novo (loop)
import { W, H, clamp, lerp, prog, ease, chaves, carregarImagem } from '../motor/tempo.js';
import { COR, FONTE, fundo, bloco, rotulo, assinatura, dedo, quebrar, faixa } from '../motor/marca.js';

const PASTA = '/instagram/reels/.quadros/i12-site';
const DUR = 47;
const FORNO = 'rgba(5,2,10,0.9)';
const NEON = '#E5AC68'; // "Luz do forno", da paleta do site
const PAINEL = { pad: 20, cor: 'rgba(5,2,10,0.88)', borda: 'rgba(229,172,104,0.3)' };
const E = 2.5; // px CSS → px do vídeo

let meta;

// ── câmera: tela = alvo + (ponto - foco) × escala ─────────────
const ID = { s: 1, fx: 540, fy: 960, tx: 540, ty: 960 };
function camera(t) {
  const mistura = (a, b, k) => ({ s: lerp(a.s, b.s, k), fx: lerp(a.fx, b.fx, k), fy: lerp(a.fy, b.fy, k), tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k) });
  const em = (pivo, s) => ({ s, fx: pivo[0], fy: pivo[1], tx: pivo[0], ty: pivo[1] });
  if (t < 3) return mistura(ID, em([540, 900], 1.03), ease.inOutSine(t / 3));
  if (t < 5) return mistura({ s: 1.55, fx: 782, fy: 304, tx: 540, ty: 600 }, { s: 1.62, fx: 782, fy: 304, tx: 540, ty: 600 }, ease.inOutSine((t - 3) / 2));
  if (t < 10.5) return mistura(ID, em([540, 860], 1.14), ease.inOutSine(prog(t, 7.6, 10.5)));
  if (t < 13) return mistura(ID, em([540, 860], 1.24), ease.outCubic(prog(t, 11.0, 11.4)));
  if (t < 16) return mistura(ID, em([540, 1190], 1.12), ease.inOutSine(prog(t, 13.5, 16)));
  if (t < 18.5) return ID;
  if (t < 24) return mistura(ID, em([760, 1000], 1.08), ease.inOutSine(prog(t, 19.2, 24)));
  if (t < 27.5) return mistura(ID, em([500, 1180], 1.15), ease.inOutSine(prog(t, 25.6, 27.5)));
  if (t < 33) return ID;
  if (t < 42) return mistura(ID, em([480, 990], 1.3), ease.inOutSine(prog(t, 36.0, 42)));
  return mistura(em([540, 900], 1.03), ID, ease.inOutSine(prog(t, 45.5, 47)));
}
const naTela = (c, x, y) => [c.tx + (x - c.fx) * c.s, c.ty + (y - c.fy) * c.s];

// ── etapas ────────────────────────────────────────────────────
const ETAPAS = ['Ver', 'Escolher', 'Pedir', 'Chegar'];
function etapaDe(t) {
  if (t < 16 || t >= 42) return 0;
  if (t < 27.5) return 1;
  if (t < 33) return 2;
  return 3;
}
/** trilha das 4 etapas, embaixo da zona segura: a atual acesa */
function trilha(ctx, t) {
  const atual = etapaDe(t);
  const y = 1384, h = 56;
  ctx.save();
  ctx.fillStyle = 'rgba(5,2,10,0.86)';
  ctx.beginPath();
  ctx.roundRect(70, y, 940, h, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(229,172,104,0.28)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = FONTE.mono(22, 500);
  ctx.letterSpacing = '3px';
  ctx.textBaseline = 'middle';
  const larg = 940 / 4;
  ETAPAS.forEach((n, i) => {
    const x = 70 + i * larg + 26;
    const on = i === atual;
    ctx.fillStyle = on ? NEON : 'rgba(223,227,231,0.42)';
    ctx.fillText(`0${i + 1}`, x, y + h / 2 + 1);
    ctx.fillStyle = on ? COR.aluminio : 'rgba(223,227,231,0.42)';
    ctx.fillText(n.toUpperCase(), x + 48, y + h / 2 + 1);
    if (on) {
      ctx.fillStyle = NEON;
      ctx.fillRect(70 + i * larg + 14, y + h - 4, larg - 28, 3);
    }
  });
  ctx.restore();
}

/** texto curto da etapa numa faixa de largura total (no alto, ou embaixo com op.y) */
function legenda(ctx, t, texto, entra, sai, op = {}) {
  const tam = op.tamanho ?? 46;
  const n = texto.split('\n').length;
  const y = op.y ?? 272;
  const h = n * tam * 1.16 + 52;
  faixa(ctx, t, { y, h, entra, sai, cor: 'rgba(5,2,10,0.95)', linha: 'rgba(229,172,104,0.3)', entrada: op.entrada === 'corte' ? 'corte' : 'abre', saida: 'corte', durEntrada: 0.3 });
  bloco(ctx, t, { texto, x: 90, y: y + 26, tamanho: tam, largura: 850, entrelinha: 1.16, entra: op.entrada === 'corte' ? entra : entra + 0.1, sai, saida: 'corte', durEntrada: 0.4, entrada: op.entrada ?? 'mascara' });
}

function gancho(ctx, t, entra, corte) {
  const a = corte ? 1 : ease.outCubic(prog(t, entra, entra + 0.4));
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 1080, 0, 1380);
  g.addColorStop(0, 'rgba(5,2,10,0)');
  g.addColorStop(0.3, 'rgba(5,2,10,0.82)');
  g.addColorStop(1, 'rgba(5,2,10,0.82)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 1080, W, 300);
  ctx.restore();
  rotulo(ctx, t, { texto: 'Feito para · padaria', x: 90, y: 1150, tamanho: 22, cor: NEON, entra, entrada: corte ? 'corte' : 'fade' });
  bloco(ctx, t, { texto: 'Um cliente pedindo panetone.\nDo começo ao fim.', x: 90, y: 1190, tamanho: 56, entrelinha: 1.14, entra, entrada: corte ? 'corte' : 'mascara', durEntrada: 0.4, atraso: 0.06 });
}

// toques: [tempo, chave no meta]
const TOQUES = [[17.0, 'aba'], [19.5, 'mais1'], [20.5, 'mais1'], [21.5, 'mais2'], [27.0, 'zap']];
function dedos(ctx, t, c) {
  for (const [tt, k] of TOQUES) {
    if (t < tt - 0.35 || t > tt + 0.45) continue;
    const f = Math.max(0, Math.round((tt - 0.05) * 30));
    const r = meta.quadros[Math.min(f, meta.quadros.length - 1)][k];
    if (!r) continue;
    const [x, y] = naTela(c, (r[0] + r[2] / 2) * E, (r[1] + r[3] / 2) * E);
    const alfa = ease.outCubic(prog(t, tt - 0.35, tt - 0.15)) * (1 - ease.inCubic(prog(t, tt + 0.2, tt + 0.45)));
    const pressao = Math.sin(Math.PI * clamp((t - (tt - 0.12)) / 0.3));
    dedo(ctx, x, y + (1 - ease.outCubic(prog(t, tt - 0.35, tt - 0.12))) * 40, { alfa, pressao, raio: 44 });
  }
}

/** o balão com a mensagem que o site montou (genérico: só o texto, sem cara de aplicativo) */
function balao(ctx, t) {
  const linhas = meta.mensagem.split('\n').filter((l, i, a) => l.trim() || i < a.length - 1);
  const fonte = FONTE.texto(44);
  const L = [];
  for (const l of linhas) L.push(...quebrar(ctx, l || ' ', fonte, 700));
  const lh = 62, pad = 46, w = 820, h = pad * 2 + L.length * lh + 34;
  const x = 130, y = 760 - h / 2 + 140;
  const k = ease.outCubic(prog(t, 28.2, 28.8));
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = k;
  ctx.translate(0, (1 - k) * 40);
  ctx.fillStyle = '#2A2426';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 30);
  ctx.fill();
  // rabinho do balão
  ctx.beginPath();
  ctx.moveTo(x + w - 60, y + h - 2);
  ctx.lineTo(x + w + 6, y + h + 30);
  ctx.lineTo(x + w - 14, y + h - 30);
  ctx.closePath();
  ctx.fill();
  ctx.font = fonte;
  ctx.textBaseline = 'alphabetic';
  L.forEach((l, i) => {
    const a = ease.outCubic(prog(t, 28.6 + i * 0.35, 28.9 + i * 0.35));
    ctx.globalAlpha = k * a;
    ctx.fillStyle = i === 0 ? '#FAF1DF' : '#E9DCC6';
    ctx.font = i === 0 ? FONTE.texto(44, 500) : fonte;
    ctx.fillText(l, x + pad, y + pad + 40 + i * lh);
  });
  ctx.globalAlpha = k * ease.outCubic(prog(t, 30.2, 30.6));
  ctx.font = FONTE.mono(22);
  ctx.fillStyle = 'rgba(223,227,231,0.5)';
  ctx.textAlign = 'right';
  ctx.fillText('15:48', x + w - 34, y + h - 26);
  ctx.restore();
}

export default {
  id: 'i12',
  nome: 'i12-padaria-em-uso',
  duracao: DUR,
  fps: 30,

  async preparar() {
    meta = await (await fetch(`${PASTA}/meta.json`)).json();
  },

  async desenhar(ctx, t, f) {
    fundo(ctx, '#05020A');
    const c = camera(t);
    const img = await carregarImagem(`${PASTA}/q_${String(f).padStart(5, '0')}.png`);
    ctx.save();
    if (t >= 27.5 && t < 33) ctx.filter = `blur(${(8 * ease.outCubic(prog(t, 27.5, 28.0))).toFixed(1)}px)`;
    ctx.translate(c.tx, c.ty);
    ctx.scale(c.s, c.s);
    ctx.drawImage(img, -c.fx, -c.fy, W, H);
    ctx.restore();

    // 01 · Ver
    if (t < 3) gancho(ctx, t, -1, true);
    if (t >= 8.5 && t < 10.5) legenda(ctx, t, 'O pão sai do forno\nenquanto ele rola.', 8.5, 10.4, { y: 1150 });
    if (t >= 10.5 && t < 13) legenda(ctx, t, 'A próxima fornada, ao vivo.', 11.5, 12.9);
    if (t >= 13 && t < 16) legenda(ctx, t, 'O Natal entra sozinho em dezembro.', 13.5, 15.9, { y: 250, tamanho: 42 });
    // 02 · Escolher
    if (t >= 16 && t < 27.5) {
      legenda(ctx, t, 'Aba Natal.', 16.6, 19.4);
      legenda(ctx, t, '2 panetones de 1 kg.', 19.5, 21.4, { entrada: 'corte' });
      legenda(ctx, t, '2 panetones de 1 kg.\nE 1 chocotone.', 21.5, 24.0, { entrada: 'corte' });
      legenda(ctx, t, 'O resumo se monta sozinho.', 24.5, 27.4);
    }
    // 03 · Pedir
    if (t >= 27.5 && t < 33) {
      ctx.fillStyle = `rgba(5,2,10,${0.72 * ease.outCubic(prog(t, 27.5, 28.0))})`;
      ctx.fillRect(0, 0, W, H);
      legenda(ctx, t, 'A mensagem já sai pronta.', 27.6, 32.9);
      rotulo(ctx, t, { texto: 'Mensagem pronta', x: 130, y: 556, tamanho: 26, cor: NEON, entra: 28.2, sai: 32.9, saida: 'corte' });
      balao(ctx, t);
    }
    // 04 · Chegar
    if (t >= 33 && t < 42) {
      legenda(ctx, t, '6 min a pé até a porta.', 34.0, 38.9);
      legenda(ctx, t, 'Padaria fictícia.\nSite de verdade.', 39.0, 41.9, { tamanho: 52, entrada: 'corte' });
    }
    // fim: o convite e o gancho de novo
    if (t >= 42) {
      const v = (t < 45.5 ? 1 : 1 - ease.inOutSine(prog(t, 45.5, 46.2))) * ease.outCubic(prog(t, 42, 42.3));
      if (v > 0) {
        ctx.fillStyle = `rgba(5,2,10,${0.93 * v})`;
        ctx.fillRect(0, 0, W, H);
      }
      bloco(ctx, t, { texto: 'Quer um site assim?\nChama no direct.', x: 90, y: 700, tamanho: 84, entrelinha: 1.12, entra: 42.2, sai: 45.4, destaque: 'direct', durEntrada: 0.5 });
      assinatura(ctx, t, { y: 930, tamanho: 30, cor: COR.aluminio, entra: 42.7, sai: 45.4 });
      if (t >= 45.5) gancho(ctx, t, 45.6, false);
    }

    dedos(ctx, t, c);
    trilha(ctx, t);
  },

  async capa(ctx) {
    fundo(ctx, '#05020A');
    // o cardápio com o pedido escolhido, e o gancho no alto
    const img = await carregarImagem(`${PASTA}/q_00700.png`);
    ctx.drawImage(img, 0, 0, W, H);
    const g = ctx.createLinearGradient(0, 260, 0, 1000);
    g.addColorStop(0, 'rgba(5,2,10,0.93)');
    g.addColorStop(0.7, 'rgba(5,2,10,0.93)');
    g.addColorStop(1, 'rgba(5,2,10,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 260, W, 740);
    rotulo(ctx, 0, { texto: 'Feito para · padaria', alinhar: 'center', x: 540, y: 470, cor: NEON, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Um cliente pedindo panetone.\nDo começo ao fim.', alinhar: 'center', x: 540, y: 524, tamanho: 58, largura: 850, entrelinha: 1.14, entrada: 'corte' });
  },
};
