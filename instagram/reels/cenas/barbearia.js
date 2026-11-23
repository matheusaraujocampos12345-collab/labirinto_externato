// Barbearia Navalha (fictícia): a versão sob medida do i02, na tela de celular 1080×1920.
// Tipografia própria, de letreiro: Big Shoulders Stencil Display nos títulos (o estêncil já é
// feito de cortes, como a navalha), Big Shoulders Text nos rótulos e preços e Archivo no texto.
// Todas com licença OFL (ver motor/fontes/LEIA-ME.txt).
import { W, H, clamp, lerp, prog, ease } from '../motor/tempo.js';

export const FONTES_NAVALHA = [
  { familia: 'Navalha Estencil', arquivo: '/instagram/reels/motor/fontes/BigShouldersStencilDisplay-500.ttf', peso: 500 },
  { familia: 'Big Shoulders Text', arquivo: '/instagram/reels/motor/fontes/BigShouldersText-400.ttf', peso: 400 },
  { familia: 'Big Shoulders Text', arquivo: '/instagram/reels/motor/fontes/BigShouldersText-600.ttf', peso: 600 },
  { familia: 'Archivo', arquivo: '/instagram/reels/motor/fontes/Archivo-400.ttf', peso: 400 },
  { familia: 'Archivo', arquivo: '/instagram/reels/motor/fontes/Archivo-500.ttf', peso: 500 },
];

const ESTENCIL = '"Navalha Estencil", sans-serif';
const ROTULO = '"Big Shoulders Text", sans-serif';
const TEXTO = '"Archivo", sans-serif';

const C = {
  fundo: '#0F0D0B',
  osso: '#ECE5D8',
  latao: '#C49B5C',
  apoio: '#8F8576',
  linha: 'rgba(236,229,216,0.16)',
};

function txt(ctx, s, x, y, font, cor, align = 'left', esp = 0) {
  ctx.font = font;
  ctx.fillStyle = cor;
  ctx.textAlign = align;
  ctx.letterSpacing = `${esp}px`;
  ctx.fillText(s, x, y);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}

const SERVICOS = [['Corte', 'R$ 70'], ['Barba', 'R$ 50'], ['Corte e barba', 'R$ 110'], ['Toalha quente', 'R$ 30'], ['Sobrancelha', 'R$ 25']];
const HORARIOS = [['13:00', true], ['13:30', true], ['14:00', true], ['14:30', false], ['15:00', false], ['15:30', true]];

function poste(ctx, x, y, w, h, t, alfa = 1) {
  ctx.save();
  ctx.globalAlpha *= alfa;
  const capsula = new Path2D();
  capsula.roundRect(x, y, w, h, w / 2);
  ctx.save();
  ctx.clip(capsula);
  ctx.fillStyle = '#17130F';
  ctx.fillRect(x, y, w, h);
  const off = (t * 70) % 56;
  ctx.fillStyle = C.latao;
  for (let k = -2; k < h / 56 + 3; k++) {
    const yy = y + h - k * 56 + off - 56;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy - 40);
    ctx.lineTo(x + w, yy - 26);
    ctx.lineTo(x, yy + 14);
    ctx.closePath();
    ctx.fill();
  }
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(0,0,0,0.65)');
  g.addColorStop(0.45, 'rgba(0,0,0,0)');
  g.addColorStop(0.6, 'rgba(255,240,220,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  ctx.strokeStyle = C.osso;
  ctx.globalAlpha *= 0.7;
  ctx.lineWidth = 2;
  ctx.stroke(capsula);
  ctx.restore();
}

let tamPalavra = 0;
/**
 * Site sob medida da Barbearia Navalha.
 * scroll: px da página · t: segundos desde que o site apareceu (anima a abertura)
 * Se completo = true, desenha tudo já revelado (para miniaturas).
 */
export function desenharNavalha(ctx, scroll, t, completo = false) {
  const T = completo ? 99 : t;
  ctx.save();
  ctx.fillStyle = C.fundo;
  ctx.fillRect(0, 0, W, H);
  ctx.translate(0, -scroll);

  // ── abertura ──
  const aNav = ease.outCubic(prog(T, 0.0, 0.5));
  ctx.globalAlpha = aNav;
  txt(ctx, 'NAVALHA', 70, 122, `500 44px ${ESTENCIL}`, C.osso, 'left', 6);
  txt(ctx, 'AGENDAR →', 1010, 120, `600 30px ${ROTULO}`, C.latao, 'right', 4);
  ctx.fillStyle = C.linha;
  ctx.fillRect(70, 162, 940, 1.5);
  txt(ctx, 'BARBEARIA · DESDE 1998', 70, 450, `600 30px ${ROTULO}`, C.apoio, 'left', 8);
  ctx.globalAlpha = 1;

  // a palavra em estêncil, "cortada" por uma lâmina que passa
  if (!tamPalavra) {
    ctx.font = `500 100px ${ESTENCIL}`;
    ctx.letterSpacing = '0px';
    tamPalavra = Math.floor((940 / ctx.measureText('NAVALHA').width) * 100);
  }
  const base = 840, capa = tamPalavra * 0.72;
  const linhaY = Math.round(base - capa * 0.52);
  const lam = ease.inOutCubic(prog(T, 0.25, 1.05));
  const laminaX = lerp(-120, 1200, lam);
  const assenta = ease.outCubic(prog(T, 0.8, 1.6));
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, base - capa - 40, Math.max(0, laminaX), capa + 80);
  ctx.clip();
  ctx.font = `500 ${tamPalavra}px ${ESTENCIL}`;
  ctx.fillStyle = C.osso;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, base - capa - 40, W, linhaY - (base - capa - 40));
  ctx.clip();
  ctx.fillText('NAVALHA', 70 + (1 - assenta) * 18, base);
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, linhaY, W, 200);
  ctx.clip();
  ctx.fillText('NAVALHA', 70 - (1 - assenta) * 18, base);
  ctx.restore();
  ctx.restore();
  if (lam > 0 && lam < 1) {
    const g = ctx.createLinearGradient(laminaX - 360, 0, laminaX, 0);
    g.addColorStop(0, 'rgba(196,155,92,0)');
    g.addColorStop(1, 'rgba(232,200,150,1)');
    ctx.fillStyle = g;
    ctx.fillRect(laminaX - 360, linhaY - 1.5, 360, 3);
  }
  const fio = (1 - assenta) * (lam > 0 ? 1 : 0);
  if (fio > 0) {
    ctx.fillStyle = `rgba(196,155,92,${0.55 * fio})`;
    ctx.fillRect(70, linhaY - 0.75, Math.min(laminaX, 1010) - 70, 1.5);
  }

  const aSub = ease.outCubic(prog(T, 1.1, 1.7));
  ctx.globalAlpha = aSub;
  txt(ctx, 'Corte, barba e silêncio.', 70, 935 + (1 - aSub) * 16, `400 50px ${TEXTO}`, C.osso);
  const aDet = ease.outCubic(prog(T, 1.35, 1.95));
  ctx.globalAlpha = aDet;
  txt(ctx, 'TER–SÁB  ·  9H–20H', 70, 1012, `600 30px ${ROTULO}`, C.apoio, 'left', 5);
  txt(ctx, 'RUA DAS ACÁCIAS, 214', 70, 1056, `600 30px ${ROTULO}`, C.apoio, 'left', 5);
  const aBtn = ease.outCubic(prog(T, 1.6, 2.2));
  const by = 1160 + (1 - aBtn) * 20;
  ctx.globalAlpha = aBtn;
  ctx.strokeStyle = C.osso;
  ctx.lineWidth = 2;
  ctx.strokeRect(70, by, 440, 104);
  txt(ctx, 'AGENDAR HORÁRIO', 106, by + 66, `600 36px ${ROTULO}`, C.osso, 'left', 4);
  ctx.fillStyle = C.latao;
  ctx.fillRect(416, by + 50, 54, 2.5);
  ctx.beginPath();
  ctx.moveTo(470, by + 51);
  ctx.lineTo(456, by + 41);
  ctx.lineTo(456, by + 61);
  ctx.fill();
  ctx.globalAlpha = 1;
  const aPoste = ease.outCubic(prog(T, 1.2, 2.0));
  poste(ctx, 800, 1120 - (1 - aPoste) * 40, 78, 520, t, aPoste);
  ctx.fillStyle = C.latao;
  ctx.globalAlpha = aPoste;
  ctx.fillRect(791, 1100 - (1 - aPoste) * 40, 96, 10);
  ctx.fillRect(791, 1650 - (1 - aPoste) * 40, 96, 10);
  ctx.globalAlpha = 1;

  // ── serviços: quadro de preços de barbearia ──
  const Y2 = 1920;
  txt(ctx, 'SERVIÇOS', 70, Y2 + 470, `600 30px ${ROTULO}`, C.apoio, 'left', 8);
  txt(ctx, 'O MENU', 66, Y2 + 650, `500 180px ${ESTENCIL}`, C.osso, 'left', 2);
  SERVICOS.forEach(([n, p], k) => {
    const y = Y2 + 760 + k * 140;
    const vis = completo ? 1 : ease.outCubic(clamp((scroll + H * 0.92 - y) / 260));
    if (vis <= 0) return;
    ctx.globalAlpha = vis;
    const dx = (1 - vis) * 50;
    ctx.font = `600 64px ${ROTULO}`;
    ctx.letterSpacing = '2px';
    const wn = ctx.measureText(n.toUpperCase()).width;
    txt(ctx, n.toUpperCase(), 70 + dx, y + 80, `600 64px ${ROTULO}`, C.osso, 'left', 2);
    ctx.font = `600 50px ${ROTULO}`;
    ctx.letterSpacing = '2px';
    const wp = ctx.measureText(p).width;
    txt(ctx, p, 1010 - dx * 0.4, y + 78, `600 50px ${ROTULO}`, C.latao, 'right', 2);
    // pontilhado entre o nome e o preço
    ctx.fillStyle = 'rgba(236,229,216,0.35)';
    for (let x = 70 + dx + wn + 24; x < 1010 - wp - 24; x += 18) ctx.fillRect(x, y + 74, 5, 5);
  });
  ctx.globalAlpha = 1;

  // ── horário ──
  const Y3 = 3840;
  txt(ctx, 'PRÓXIMO HORÁRIO LIVRE', 70, Y3 + 470, `600 30px ${ROTULO}`, C.apoio, 'left', 8);
  txt(ctx, '14:30', 60, Y3 + 760, `500 330px ${ESTENCIL}`, C.osso, 'left', 4);
  txt(ctx, 'HOJE  ·  COM RAFAEL', 70, Y3 + 840, `600 30px ${ROTULO}`, C.apoio, 'left', 5);
  const sel = completo ? 1 : ease.inOutCubic(prog(t, 8.4, 8.9));
  const alvo = 3;
  HORARIOS.forEach(([h, ocupado], k) => {
    const x = 70 + (k % 3) * 320, y = Y3 + 910 + Math.floor(k / 3) * 140;
    ctx.strokeStyle = ocupado ? 'rgba(236,229,216,0.2)' : 'rgba(236,229,216,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 300, 110);
    txt(ctx, h, x + 150, y + 72, `600 44px ${ROTULO}`, ocupado ? 'rgba(236,229,216,0.3)' : C.osso, 'center', 3);
    if (ocupado) {
      ctx.fillStyle = 'rgba(236,229,216,0.3)';
      ctx.fillRect(x + 92, y + 56, 116, 2);
    }
  });
  if (sel > 0) {
    const x = 70 + (alvo % 3) * 320, y = Y3 + 910 + Math.floor(alvo / 3) * 140;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, 300 * sel, 110);
    ctx.clip();
    ctx.fillStyle = C.latao;
    ctx.fillRect(x, y, 300, 110);
    txt(ctx, '14:30', x + 150, y + 72, `600 44px ${ROTULO}`, C.fundo, 'center', 3);
    ctx.restore();
  }
  const aRes = completo ? 1 : ease.outCubic(prog(t, 9.3, 9.9));
  ctx.globalAlpha = aRes;
  ctx.fillStyle = C.osso;
  ctx.fillRect(70, Y3 + 1230 + (1 - aRes) * 24, 940, 124);
  txt(ctx, 'RESERVAR 14:30', 540, Y3 + 1310 + (1 - aRes) * 24, `600 48px ${ROTULO}`, C.fundo, 'center', 4);
  ctx.globalAlpha = 1;
  ctx.restore();
}
