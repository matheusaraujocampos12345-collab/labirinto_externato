// i19 — Como um site abre em 1 segundo (24 s). Formato "animação que explica tecnologia" (aprovado em 26/11).
// O toque no link, o pedido indo até o servidor, a página voltando em partes (estrutura, estilo, fotos) e o
// celular montando a tela, com um cronômetro em "tempo de verdade" (o vídeo mostra a cena em câmera lenta).
// Depois, o mesmo caminho num site pesado: as fotos chegam quando o cliente já saiu.
// Os tempos são de exemplo (um site rápido e um pesado), não medições de um site real.
// Referência de aviação da peça: só a régua M 0.40 → M 1.20 no fecho.
import { clamp, lerp, prog, ease, chaves } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';
import { TXT, MONO, EXP, TITANIO, LINHA, texto } from './catalogo.js';
import { TELA, celular, doceria, barraStatus } from './celular.js';

const DUR = 24;
const PH = { x: 290, y: 1086, esc: 0.72 };
const SRV = { x: 800, y: 960 };
const IDA = [[455, 960], [580, 790], [705, 925]];
const VOLTA = [[705, 1010], [580, 1210], [455, 1130]];
const LIMPO = 2.4, TOQUE1 = 3.0, PESADO = 13.8, TOQUE2 = 14.0, SAIU = 17.6, FECHO = 19.8;

const bez = ([a, b, c], k) => [
  (1 - k) * (1 - k) * a[0] + 2 * (1 - k) * k * b[0] + k * k * c[0],
  (1 - k) * (1 - k) * a[1] + 2 * (1 - k) * k * b[1] + k * k * c[1],
];
const num = (v, c = 2) => v.toFixed(c).replace('.', ',');

// tempo "de verdade" mostrado no cronômetro
const v1 = (t) => chaves(t, [[TOQUE1, 0], [5.4, 0.12], [7.6, 0.3], [8.4, 0.45], [9.6, 0.8], [10.8, 0.92]], ease.linear);
const v2 = (t) => chaves(t, [[TOQUE2, 0], [14.5, 0.3], [15.0, 0.6], [15.6, 1.4], [19.2, 4.6]], ease.linear);

// pacotes que voltam do servidor: [nome, sai, chega, largura, altura]
const PACOTES1 = [['HTML', 6.6, 7.6, 84, 40], ['CSS', 7.3, 8.4, 70, 40], ['FOTOS', 8.0, 9.6, 110, 56]];
const PACOTES2 = [['HTML', 14.5, 15.0, 84, 40], ['CSS', 14.9, 15.6, 70, 40], ['FOTOS', 15.4, 19.2, 170, 96]];

function linkBio(g, pr) {
  g.fillStyle = '#101317';
  g.fillRect(0, 0, TELA.w, TELA.h);
  barraStatus(g);
  g.fillStyle = '#3A2A20';
  g.beginPath();
  g.arc(TELA.w / 2, 190, 52, 0, Math.PI * 2);
  g.fill();
  texto(g, 'DL', TELA.w / 2, 202, MONO(28, 500), COR.aluminio, { alinhar: 'center' });
  texto(g, 'doceria.laco', TELA.w / 2, 290, TXT(22, 600), COR.aluminio, { alinhar: 'center' });
  texto(g, 'Bolos e doces por encomenda.', TELA.w / 2, 320, TXT(16), COR.nevoa, { alinhar: 'center' });
  g.save();
  g.translate(TELA.w / 2, 404);
  g.scale(1 - 0.05 * pr, 1 - 0.05 * pr);
  g.beginPath();
  g.roundRect(-140, -32, 280, 64, 32);
  g.fillStyle = COR.aluminio;
  g.fill();
  texto(g, 'doceria-laco.com.br', 0, 7, TXT(18, 600), '#0A0C0F', { alinhar: 'center' });
  g.restore();
  g.fillStyle = 'rgba(223,227,231,0.1)';
  for (let i = 0; i < 6; i++) g.fillRect(16 + (i % 3) * 112, 470 + Math.floor(i / 3) * 112, 104, 104);
}
/** só o HTML, sem estilo: página branca, letra padrão, links azuis */
function soHtml(g) {
  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 0, TELA.w, TELA.h);
  barraStatus(g, { escura: true, fundo: '#FFFFFF' });
  g.fillStyle = '#000';
  g.font = '700 26px serif';
  g.fillText('Doceria Laço', 14, 86);
  g.font = '400 17px serif';
  g.fillStyle = '#1A0DAB';
  ['Início', 'Cardápio', 'Contato'].forEach((s, i) => {
    g.fillText(s, 14 + i * 90, 118);
    g.fillRect(14 + i * 90, 121, g.measureText(s).width, 1);
  });
  g.fillStyle = '#000';
  g.font = '700 22px serif';
  g.fillText('Bolos para o fim de semana.', 14, 168);
  g.font = '400 16px serif';
  ['Feitos no dia, entregues em casa.', 'Mais pedidos', '• Bolo de brigadeiro — R$ 120', '• Torta de limão — R$ 95', '• Bolo de nozes — R$ 140'].forEach((s, i) => g.fillText(s, 14, 200 + i * 26));
  g.strokeStyle = '#999';
  g.strokeRect(14.5, 340.5, 120, 90);
  g.font = '400 13px serif';
  g.fillStyle = '#666';
  g.fillText('[imagem]', 42, 390);
}
function carregando(g, t) {
  g.fillStyle = '#FFFFFF';
  g.fillRect(0, 0, TELA.w, TELA.h);
  barraStatus(g, { escura: true, fundo: '#FFFFFF' });
  g.fillStyle = '#E4E6E8';
  g.fillRect(0, 40, TELA.w, 3);
  g.fillStyle = '#5A626C';
  g.fillRect(0, 40, TELA.w * (0.15 + 0.5 * prog(t, 0, 2)), 3);
}
function feed(g) {
  g.fillStyle = '#0B0D10';
  g.fillRect(0, 0, TELA.w, TELA.h);
  barraStatus(g);
  for (let i = 0; i < 3; i++) {
    const y = 70 + i * 236;
    g.fillStyle = 'rgba(223,227,231,0.14)';
    g.beginPath();
    g.arc(32, y + 14, 14, 0, Math.PI * 2);
    g.fill();
    g.fillRect(56, y + 8, 120, 10);
    g.fillStyle = 'rgba(223,227,231,0.07)';
    g.fillRect(0, y + 40, TELA.w, 180);
  }
}

/** a tela do celular em cada momento */
function tela(g, fila, t) {
  if (t < PESADO) {
    if (t < TOQUE1 + 0.15) {
      const pr = Math.sin(Math.PI * prog(t, TOQUE1 - 0.12, TOQUE1 + 0.16));
      linkBio(g, pr);
      const a = ease.outCubic(prog(t, LIMPO, LIMPO + 0.3)) * (1 - ease.inCubic(prog(t, TOQUE1 + 0.15, TOQUE1 + 0.4)));
      fila.push([TELA.w / 2 + 60, 404 + (1 - ease.outCubic(prog(t, LIMPO, TOQUE1 - 0.1))) * 120, { alfa: Math.max(a, t < TOQUE1 ? 0 : a), pressao: pr }]);
      return;
    }
    if (t < 7.6) return carregando(g, t - TOQUE1);
    if (t < 8.4) return soHtml(g);
    if (t < 9.6) return doceria(g, 0, { fotos: false });
    return doceria(g, 0);
  }
  if (t < TOQUE2 + 0.15) {
    const pr = Math.sin(Math.PI * prog(t, TOQUE2 - 0.12, TOQUE2 + 0.16));
    linkBio(g, pr);
    fila.push([TELA.w / 2 + 60, 404, { alfa: ease.outCubic(prog(t, PESADO, PESADO + 0.15)), pressao: pr }]);
    return;
  }
  // depois que a pessoa sai, o feed desliza por cima
  const sai = ease.inOutCubic(prog(t, SAIU, SAIU + 0.45));
  g.save();
  g.translate(sai * TELA.w * 0.4, 0);
  if (t < 15.0) carregando(g, t - TOQUE2);
  else if (t < 15.6) soHtml(g);
  else doceria(g, 0, { fotos: false, girando: t });
  g.restore();
  if (sai > 0) {
    g.save();
    g.translate(-(1 - sai) * TELA.w, 0);
    feed(g);
    g.restore();
  }
  // gesto de voltar: o dedo puxa da borda esquerda
  const a = ease.outCubic(prog(t, SAIU - 0.3, SAIU - 0.1)) * (1 - ease.inCubic(prog(t, SAIU + 0.45, SAIU + 0.65)));
  if (a > 0) fila.push([lerp(12, 250, ease.inOutSine(prog(t, SAIU - 0.1, SAIU + 0.45))), 420, { alfa: a, pressao: 1 }]);
}

function servidor(ctx, t, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  const recebe = Math.sin(Math.PI * prog(t, 5.3, 5.9)) + Math.sin(Math.PI * prog(t, 14.45, 14.75));
  for (let i = 0; i < 3; i++) {
    const y = SRV.y - 86 + i * 62;
    ctx.beginPath();
    ctx.roundRect(SRV.x - 95, y, 190, 50, 10);
    ctx.fillStyle = TITANIO;
    ctx.fill();
    ctx.strokeStyle = LINHA;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(223,227,231,0.14)';
    for (let k = 0; k < 4; k++) ctx.fillRect(SRV.x - 75, y + 12 + k * 8, 90, 3);
    for (let k = 0; k < 2; k++) {
      const pisca = 0.25 + 0.75 * clamp(recebe + (Math.sin(t * 13 + i * 2 + k * 3) > 0.6 ? 0.4 : 0));
      ctx.fillStyle = `rgba(223,227,231,${pisca})`;
      ctx.beginPath();
      ctx.arc(SRV.x + 56 + k * 16, y + 25, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  texto(ctx, 'SERVIDOR', SRV.x, SRV.y + 140, MONO(22), COR.nevoa, { alinhar: 'center', esp: 4 });
  ctx.restore();
}

function caminhos(ctx, a) {
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.setLineDash([6, 10]);
  ctx.strokeStyle = 'rgba(223,227,231,0.22)';
  ctx.lineWidth = 2;
  for (const [p0, p1, p2] of [IDA, VOLTA]) {
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo(...p1, ...p2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function pedido(ctx, t, t0, t1) {
  const k = prog(t, t0, t1);
  if (k <= 0 || k >= 1) return;
  const e = ease.inOutSine(k);
  for (let r = 0; r < 6; r++) {
    const [x, y] = bez(IDA, clamp(e - r * 0.025));
    ctx.fillStyle = `rgba(255,107,26,${(1 - r / 6) * 0.9})`;
    ctx.beginPath();
    ctx.arc(x, y, 11 - r * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pacotes(ctx, t, lista) {
  for (const [nome, t0, t1, w, h] of lista) {
    const k = prog(t, t0, t1);
    if (k <= 0 || k >= 1) continue;
    const [x, y] = bez(VOLTA, ease.inOutSine(k));
    const a = ease.outCubic(prog(k, 0, 0.12)) * (1 - ease.inCubic(prog(k, 0.88, 1)));
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
    ctx.fillStyle = '#20262D';
    ctx.fill();
    ctx.strokeStyle = 'rgba(223,227,231,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    texto(ctx, nome, x, y + 7, MONO(nome === 'FOTOS' && w > 150 ? 24 : 19, 500), COR.aluminio, { alinhar: 'center', esp: 2 });
    ctx.restore();
  }
}

function cronometro(ctx, t) {
  const pesado = t >= PESADO;
  const v = pesado ? v2(t) : t >= TOQUE1 ? v1(t) : 0;
  const escala = pesado ? 5 : 1;
  const a = ease.outCubic(prog(t, LIMPO, LIMPO + 0.4)) * (1 - ease.inCubic(prog(t, FECHO - 0.4, FECHO)));
  if (a <= 0) return;
  const troca = pesado ? ease.outCubic(prog(t, PESADO, PESADO + 0.3)) : 1 - ease.inCubic(prog(t, PESADO - 0.3, PESADO));
  ctx.save();
  ctx.globalAlpha *= a;
  const pronto = !pesado && t >= 10.8;
  const cor = pronto ? COR.laranja : pesado && t >= SAIU ? COR.nevoa : COR.aluminio;
  texto(ctx, `${num(v)} s`, 88, 662, MONO(104, 300), cor);
  const x0 = 90, x1 = 940, y = 694;
  ctx.fillStyle = 'rgba(223,227,231,0.14)';
  ctx.fillRect(x0, y, x1 - x0, 3);
  ctx.fillStyle = pronto ? COR.laranja : COR.aluminio;
  ctx.fillRect(x0, y, (x1 - x0) * clamp(v / escala), 3);
  ctx.globalAlpha *= troca;
  const marcas = pesado ? [0, 1, 2, 3, 4, 5] : [0, 0.25, 0.5, 0.75, 1];
  marcas.forEach((m) => {
    const x = lerp(x0, x1, m / escala);
    ctx.fillStyle = 'rgba(223,227,231,0.3)';
    ctx.fillRect(x - 1, y - 8, 2, 19);
    texto(ctx, `${pesado ? m : num(m, 2)} s`, x, y + 42, MONO(18), COR.nevoa, { alinhar: m === 0 ? 'left' : m === escala ? 'right' : 'center' });
  });
  ctx.restore();
}

function regua(ctx, t) {
  const a = ease.outCubic(prog(t, FECHO + 0.5, FECHO + 0.9));
  if (a <= 0) return;
  const k = ease.inOutCubic(prog(t, FECHO + 1.0, FECHO + 2.6));
  const x0 = 150, x1 = 930, y = 1000;
  ctx.save();
  ctx.globalAlpha *= a;
  for (let i = 0; i <= 40; i++) {
    const x = lerp(x0, x1, i / 40), grande = i % 10 === 0;
    ctx.fillStyle = i / 40 <= k ? COR.aluminio : 'rgba(223,227,231,0.25)';
    ctx.fillRect(x - 1, y - (grande ? 30 : 14), 2, grande ? 30 : 14);
  }
  const xm = lerp(x0, x1, k);
  ctx.fillStyle = COR.laranja;
  ctx.beginPath();
  ctx.moveTo(xm, y + 12);
  ctx.lineTo(xm + 14, y + 40);
  ctx.lineTo(xm - 14, y + 40);
  ctx.closePath();
  ctx.fill();
  texto(ctx, 'M 0.40', x0, y + 84, MONO(26), COR.nevoa, { alinhar: 'left' });
  if (k < 0.85) texto(ctx, 'M 1.20', x1, y + 84, MONO(26), COR.nevoa, { alinhar: 'right' });
  texto(ctx, `M ${(0.4 + 0.8 * k).toFixed(2)}`, xm, y - 56, MONO(34, 500), COR.aluminio, { alinhar: 'center' });
  ctx.restore();
}

function quadro(ctx, t) {
  fundo(ctx);
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 19 });
  rotulo(ctx, t, { texto: 'Como um site abre', x: 90, y: 292, entra: -1, entrada: 'corte' });
  // textos de cada passo
  bloco(ctx, t, { texto: '1 segundo.', x: 90, y: 330, tamanho: 132, espaco: -0.02, entra: -1, sai: LIMPO - 0.3, entrada: 'corte', durSaida: 0.3 });
  bloco(ctx, t, { estilo: 'texto', texto: 'É o que um site rápido leva para abrir.', x: 90, y: 492, tamanho: 40, cor: COR.nevoa, entra: -1, sai: LIMPO - 0.3, entrada: 'corte', saida: 'fade', durSaida: 0.3 });
  const passos = [
    ['1. Você toca no link.', LIMPO, 5.6],
    ['2. O pedido vai\naté o servidor.', 5.6, 8.0],
    ['3. A página volta em\npartes: estrutura,\nestilo e fotos.', 8.0, 10.4],
    ['4. O celular monta\na tela.', 10.4, PESADO - 0.2],
    ['Num site pesado, as fotos\nchegam por último.', PESADO, FECHO - 0.3],
    ['A MACH mede isso\nem cada site.', FECHO, 99],
  ];
  for (const [s, e, d] of passos) bloco(ctx, t, { texto: s, x: 88, y: 338, tamanho: s.split('\n').length > 2 ? 56 : 64, entra: e, sai: d, durSaida: 0.25, durEntrada: 0.5 });
  bloco(ctx, t, { estilo: 'texto', texto: 'E o cliente já foi.', x: 90, y: 492, tamanho: 40, cor: COR.aluminio, entra: SAIU + 0.3, sai: FECHO - 0.3, entrada: 'fade', saida: 'fade' });
  cronometro(ctx, t);
  // palco
  const palco = 1 - ease.inCubic(prog(t, FECHO - 0.4, FECHO));
  if (palco > 0) {
    caminhos(ctx, palco * ease.outCubic(prog(t, LIMPO, LIMPO + 0.4)));
    servidor(ctx, t, palco * ease.outCubic(prog(t, LIMPO, LIMPO + 0.4)));
    pedido(ctx, t, 3.8, 5.4);
    pedido(ctx, t, 14.1, 14.5);
    pacotes(ctx, t, t < PESADO ? PACOTES1 : PACOTES2);
    const chegou = !(t < PESADO) ? 0 : Math.sin(Math.PI * prog(t, 10.7, 11.2));
    celular(ctx, PH.x, PH.y, (g, fila) => tela(g, fila, t), { escala: PH.esc * (1 + 0.04 * chegou), alfa: palco });
    ctx.save();
    ctx.globalAlpha *= palco;
    texto(ctx, 'SEU CELULAR', PH.x, 1408, MONO(22), COR.nevoa, { alinhar: 'center', esp: 4 });
    ctx.restore();
  }
  regua(ctx, t);
  bloco(ctx, t, { estilo: 'texto', texto: 'Manda para quem tem site.', x: 90, y: 1200, tamanho: 40, cor: COR.aluminio, entra: FECHO + 2.4, entrada: 'fade' });
  assinatura(ctx, t, { entra: FECHO + 2.8 });
  vinheta(ctx, 0.3);
}

export default {
  id: 'i19',
  nome: 'i19-como-um-site-abre-em-1-segundo',
  duracao: DUR,
  fps: 30,
  desenhar(ctx, t) {
    quadro(ctx, t);
  },
  capa(ctx) {
    quadro(ctx, 1.6);
  },
};
