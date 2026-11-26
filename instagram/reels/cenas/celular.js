// Celular genérico e o mini-site fictício "Doceria Laço", usados pelos Reels i18, i19 e i20.
// O celular é neutro (sem marca de aparelho). A tela tem 360 × 760 px de "CSS" e é desenhada
// em coordenadas próprias; os toques vão para uma fila e saem por cima, já na escala da tela.
import { clamp, lerp, prog, ease } from '../motor/tempo.js';
import { COR, dedo } from '../motor/marca.js';
import { SAIRA, EXP, TXT, MONO, TITANIO, LINHA, texto, foto as fotoReal } from './catalogo.js';
const foto = fotoReal;

export const TELA = { w: 360, h: 760 };

/** Desenha o celular centrado em (cx, cy). desenharTela(g, fila) recebe o contexto já na tela. */
export function celular(ctx, cx, cy, desenharTela, op = {}) {
  const esc = op.escala ?? 1, a = op.alfa ?? 1;
  if (a <= 0) return;
  const w = TELA.w * esc, h = TELA.h * esc, b = 12 * esc, r = 46 * esc;
  const x = cx - w / 2, y = cy - h / 2;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.save();
  ctx.filter = `blur(${28 * esc}px)`;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(x - b + 10 * esc, y - b + 30 * esc, w + 2 * b - 20 * esc, h + 2 * b - 20 * esc, r);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(x - b, y - b, w + 2 * b, h + 2 * b, r + b);
  ctx.fillStyle = '#14181D';
  ctx.fill();
  ctx.strokeStyle = 'rgba(223,227,231,0.24)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const fila = [];
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
  ctx.translate(x, y);
  ctx.scale(esc, esc);
  desenharTela(ctx, fila);
  ctx.restore();
  ctx.fillStyle = '#05070A';
  ctx.beginPath();
  ctx.arc(cx, y + 17 * esc, 6 * esc, 0, Math.PI * 2);
  ctx.fill();
  for (const [tx, ty, o] of fila) if ((o.alfa ?? 1) > 0.01) dedo(ctx, x + tx * esc, y + ty * esc, { ...o, raio: (o.raio ?? 30) * esc });
  ctx.restore();
  return { x, y, w, h, esc };
}

/** Barra de status (hora e ícones). escura = texto escuro sobre fundo claro. */
export function barraStatus(g, op = {}) {
  const cor = op.escura ? '#1B1E22' : COR.aluminio;
  if (op.fundo) {
    g.fillStyle = op.fundo;
    g.fillRect(0, 0, TELA.w, 40);
  }
  texto(g, '10:30', 28, 27, TXT(14, 600), cor);
  g.fillStyle = cor;
  for (let i = 0; i < 4; i++) g.fillRect(268 + i * 6, 22 - i * 3, 4, 5 + i * 3);
  g.strokeStyle = cor;
  g.lineWidth = 1.3;
  g.strokeRect(300.5, 15.5, 24, 12);
  g.fillRect(303, 18, 17, 7);
  g.fillRect(325, 19, 2, 5);
}

/** Pílula fixa "Pedir pelo WhatsApp" no pé da tela. */
export function pilula(g, op = {}) {
  const y = op.y ?? TELA.h - 84, a = op.alfa ?? 1;
  g.save();
  g.globalAlpha *= a;
  g.translate(TELA.w / 2, y + 27);
  const s = 1 - 0.05 * (op.pressao ?? 0);
  g.scale(s, s);
  g.fillStyle = 'rgba(0,0,0,0.4)';
  g.beginPath();
  g.roundRect(-160, -22, 320, 56, 28);
  g.fill();
  g.beginPath();
  g.roundRect(-164, -27, 328, 54, 27);
  g.fillStyle = COR.aluminio;
  g.fill();
  balao(g, -104, 0, '#0A0C0F');
  texto(g, 'Pedir pelo WhatsApp', -80, 6, TXT(17, 600), '#0A0C0F');
  g.restore();
}
/** ícone de balão de conversa */
export function balao(g, x, y, cor) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = cor;
  g.lineWidth = 2.2;
  g.lineJoin = 'round';
  g.beginPath();
  g.arc(0, -1, 10, Math.PI * 0.7, Math.PI * 2.45);
  g.lineTo(-9, 10);
  g.closePath();
  g.stroke();
  g.restore();
}

// ── a Doceria Laço (versão boa, escura) ──────────────────────────
export const PAGINA_H = 1980;
const DOCES = [['Bolo de brigadeiro', 'R$ 120'], ['Torta de limão', 'R$ 95'], ['Bolo de nozes', 'R$ 140'], ['Caixa de docinhos', 'R$ 60']];
/**
 * s = rolagem (px). op.titulo (2 linhas), op.botao ('contorno' | 'laranja'), op.revelar (cartões aparecem ao rolar),
 * op.contato = destaque do contato escondido no rodapé (0..1).
 */
export function doceria(g, s, op = {}) {
  const W = TELA.w;
  // sem fotos (ainda carregando): caixa vazia e, se op.girando for um tempo, um anel girando
  const foto = op.fotos === false ? (gg, x, y, w, h, _s, o = {}) => {
    gg.beginPath();
    gg.roundRect(x, y, w, h, o.raio ?? 14);
    gg.fillStyle = '#1A1F25';
    gg.fill();
    if (op.girando != null) {
      gg.strokeStyle = 'rgba(223,227,231,0.5)';
      gg.lineWidth = 2.5;
      gg.beginPath();
      const a = op.girando * 7;
      gg.arc(x + w / 2, y + h / 2, Math.min(14, h / 5), a, a + 4.2);
      gg.stroke();
    }
  } : fotoReal;
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, W, TELA.h);
  g.save();
  g.translate(0, -s);
  foto(g, 0, 0, W, 480, 7, { raio: 0 });
  const sombra = g.createLinearGradient(0, 160, 0, 480);
  sombra.addColorStop(0, 'rgba(14,17,21,0)');
  sombra.addColorStop(1, 'rgba(14,17,21,0.96)');
  g.fillStyle = sombra;
  g.fillRect(0, 0, W, 480);
  texto(g, 'DOCERIA LAÇO', 22, 76, EXP(13), COR.aluminio, { esp: 3 });
  g.fillStyle = COR.aluminio;
  for (let i = 0; i < 3; i++) g.fillRect(310, 64 + i * 7, 26, 2.5);
  const [l1, l2] = op.titulo ?? ['Bolos para o', 'fim de semana.'];
  texto(g, l1, 22, 312, SAIRA(40), COR.aluminio);
  texto(g, l2, 22, 356, SAIRA(40), COR.aluminio);
  texto(g, 'Feitos no dia, entregues em casa.', 22, 388, TXT(15), COR.nevoa);
  g.beginPath();
  g.roundRect(22, 408, 168, 48, 24);
  if (op.botao === 'laranja') {
    g.fillStyle = COR.laranja;
    g.fill();
    texto(g, 'Encomendar  →', 106, 438, TXT(16, 600), '#0A0C0F', { alinhar: 'center' });
  } else {
    g.strokeStyle = COR.aluminio;
    g.lineWidth = 1.5;
    g.stroke();
    texto(g, 'Ver cardápio', 106, 438, TXT(16, 500), COR.aluminio, { alinhar: 'center' });
  }
  texto(g, 'MAIS PEDIDOS', 22, 530, MONO(12), COR.nevoa, { esp: 3 });
  DOCES.forEach(([n, p], i) => {
    const x = 22 + (i % 2) * 162, y = 552 + Math.floor(i / 2) * 222;
    let k = 1;
    if (op.revelar) k = ease.outCubic(clamp((TELA.h * 0.94 - (y - s)) / 150 - (i % 2) * 0.15));
    if (k <= 0) return;
    g.save();
    g.globalAlpha *= k;
    g.translate(0, (1 - k) * 36);
    foto(g, x, y, 154, 150, 20 + i, { raio: 12 });
    texto(g, n, x, y + 176, TXT(14, 500), COR.aluminio);
    texto(g, p, x, y + 198, MONO(13), COR.nevoa);
    g.restore();
  });
  texto(g, 'SOBRE NÓS', 22, 1030, MONO(12), COR.nevoa, { esp: 3 });
  texto(g, 'Doce de verdade,', 22, 1072, SAIRA(28), COR.aluminio);
  texto(g, 'feito por gente.', 22, 1106, SAIRA(28), COR.aluminio);
  g.fillStyle = 'rgba(223,227,231,0.16)';
  [300, 280, 310, 200, 290, 150].forEach((w, i) => g.fillRect(22, 1136 + i * 20, w, 7));
  texto(g, 'DEPOIMENTOS', 22, 1300, MONO(12), COR.nevoa, { esp: 3 });
  g.beginPath();
  g.roundRect(22, 1318, 316, 150, 16);
  g.fillStyle = TITANIO;
  g.fill();
  texto(g, '“O bolo chegou perfeito,', 42, 1366, TXT(17, 500), COR.aluminio);
  texto(g, 'e ainda quentinho.”', 42, 1392, TXT(17, 500), COR.aluminio);
  texto(g, 'CLIENTE · FICTÍCIO', 42, 1436, MONO(11), COR.nevoa, { esp: 2 });
  texto(g, 'GALERIA', 22, 1530, MONO(12), COR.nevoa, { esp: 3 });
  for (let i = 0; i < 6; i++) foto(g, 22 + (i % 3) * 108, 1548 + Math.floor(i / 3) * 108, 100, 100, 30 + i, { raio: 8 });
  g.fillStyle = '#090B0E';
  g.fillRect(0, 1790, W, PAGINA_H - 1790);
  texto(g, 'DOCERIA LAÇO', 22, 1840, EXP(12), COR.nevoa, { esp: 3 });
  g.fillStyle = 'rgba(223,227,231,0.12)';
  [180, 140, 200].forEach((w, i) => g.fillRect(22, 1862 + i * 16, w, 6));
  texto(g, 'Fale conosco: (11) 98765-4321', 22, 1934, TXT(11), '#5A626C');
  const c = op.contato ?? 0;
  if (c > 0) {
    g.strokeStyle = `rgba(255,107,26,${c})`;
    g.lineWidth = 2.5;
    g.beginPath();
    g.roundRect(14, 1916, 186, 28, 14);
    g.stroke();
  }
  g.restore();
  // topo fixo: barra de status sobre um degradê para ler
  const topo = g.createLinearGradient(0, 0, 0, 56);
  topo.addColorStop(0, 'rgba(14,17,21,0.85)');
  topo.addColorStop(1, 'rgba(14,17,21,0)');
  g.fillStyle = topo;
  g.fillRect(0, 0, W, 56);
  barraStatus(g);
}

// ── a Doceria Laço "antes" (modelo pronto, claro e genérico) ─────
export function doceriaAntiga(g, s) {
  const W = TELA.w;
  g.fillStyle = '#F1F1F1';
  g.fillRect(0, 0, W, TELA.h);
  g.save();
  g.translate(0, -s);
  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 40, W, 58);
  g.fillStyle = '#9AA0A6';
  for (let i = 0; i < 3; i++) g.fillRect(18, 58 + i * 8, 22, 3);
  texto(g, 'Doceria Laço', W / 2, 76, TXT(20, 700), '#B0476B', { alinhar: 'center' });
  g.save();
  g.beginPath();
  g.rect(0, 98, W, 200);
  g.clip();
  foto(g, 0, 98, W, 200, 7, { raio: 0 });
  g.fillStyle = 'rgba(255,255,255,0.42)';
  g.fillRect(0, 98, W, 200);
  g.restore();
  texto(g, 'PROMOÇÃO!!!', W / 2, 210, TXT(30, 800), '#C0392B', { alinhar: 'center' });
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i === 0 ? '#555' : '#BBB';
    g.beginPath();
    g.arc(W / 2 - 27 + i * 18, 284, 4, 0, Math.PI * 2);
    g.fill();
  }
  texto(g, 'Bem-vindo ao nosso site!', W / 2, 346, TXT(21, 700), '#333333', { alinhar: 'center' });
  texto(g, 'A Doceria Laço nasceu de um sonho e hoje', 20, 380, TXT(13), '#666666');
  g.fillStyle = '#C8C8C8';
  [318, 300, 322, 290, 310, 316, 260, 305, 318, 200].forEach((w, i) => g.fillRect(20, 392 + i * 15, w, 6));
  g.fillStyle = '#2F6FDE';
  g.fillRect(W / 2 - 60, 556, 120, 36);
  texto(g, 'Clique aqui', W / 2, 580, TXT(14, 600), '#FFFFFF', { alinhar: 'center' });
  texto(g, 'Nossos Produtos', 20, 640, TXT(18, 700), '#333333');
  for (let i = 0; i < 4; i++) {
    const x = 20 + (i % 2) * 164, y = 658 + Math.floor(i / 2) * 176;
    g.fillStyle = '#FFFFFF';
    g.fillRect(x, y, 156, 164);
    g.save();
    g.filter = 'saturate(0.35)';
    foto(g, x + 6, y + 6, 144, 104, 20 + i, { raio: 0 });
    g.restore();
    texto(g, DOCES[i][0], x + 8, y + 130, TXT(12, 600), '#444444');
    texto(g, 'Consulte o preço', x + 8, y + 150, TXT(11), '#2F6FDE');
  }
  texto(g, 'Contato', 20, 1050, TXT(18, 700), '#333333');
  g.fillStyle = '#C8C8C8';
  [260, 220, 280].forEach((w, i) => g.fillRect(20, 1066 + i * 15, w, 6));
  g.fillStyle = '#3A3A3A';
  g.fillRect(0, 1130, W, 120);
  texto(g, '© Todos os direitos reservados', W / 2, 1194, TXT(11), '#AAAAAA', { alinhar: 'center' });
  g.restore();
  barraStatus(g, { escura: true, fundo: '#FFFFFF' });
}

/**
 * Rolagem com o dedo: arrastos = [[t0, t1, s0, s1], ...]. Devolve a rolagem e o dedo
 * (sobe a tela para rolar para baixo; some entre um arrasto e outro).
 */
export function arrastar(t, arrastos, op = {}) {
  let s = arrastos[0][2];
  let dedoOp = { x: op.x ?? 290, y: 0, alfa: 0, pressao: 0 };
  for (const [t0, t1, s0, s1] of arrastos) {
    if (t >= t0) s = lerp(s0, s1, ease.inOutSine(prog(t, t0, t1)));
    if (t >= t0 - 0.18 && t <= t1 + 0.14) {
      const k = prog(t, t0, t1), desce = s1 >= s0;
      const yA = op.yBaixo ?? 600, yB = op.yAlto ?? 260;
      dedoOp = {
        x: op.x ?? 290,
        y: desce ? lerp(yA, yB, ease.inOutSine(k)) : lerp(yB, yA, ease.inOutSine(k)),
        alfa: ease.outCubic(prog(t, t0 - 0.18, t0)) * (1 - ease.inCubic(prog(t, t1, t1 + 0.14))),
        pressao: ease.outCubic(prog(t, t0 - 0.12, t0)) * (1 - prog(t, t1, t1 + 0.1)),
      };
    }
  }
  return { s, dedo: dedoOp };
}

/** etiqueta em pílula (ERRADO / CERTO / ANTES / DEPOIS) em coordenadas do quadro */
export function etiqueta(ctx, x, y, s, op = {}) {
  ctx.save();
  ctx.globalAlpha *= op.alfa ?? 1;
  ctx.font = MONO(22, 500);
  ctx.letterSpacing = '4px';
  const w = ctx.measureText(s).width + 36;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 46, 23);
  if (op.cheia) {
    ctx.fillStyle = op.cor ?? COR.laranja;
    ctx.fill();
  } else {
    ctx.strokeStyle = op.cor ?? 'rgba(223,227,231,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.fillStyle = op.cheia ? '#0A0C0F' : op.cor ?? COR.aluminio;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x + 18, y + 24);
  ctx.restore();
  return w;
}

export { LINHA };
