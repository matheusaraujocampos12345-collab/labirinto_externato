// i16 — 12 animações de site · parte 2 (27 s). Mesmo formato do i15 (moldura em catalogo.js),
// com 12 efeitos novos. Todos os negócios são fictícios.
// Os prompts de cada estilo estão em instagram/prompts/12-animacoes-de-site-parte-2.md.
import { chaves } from '../motor/tempo.js';
import {
  catalogo, CW, CH, SAIRA, EXP, TXT, MONO, FUNDO_SITE, TITANIO, LINHA,
  texto, largura, nav, limpar, barras, toque, presenca, aperto, foto, tela,
  clamp, lerp, prog, ease, COR,
} from './catalogo.js';

// 1 — letreiro que corre (acelera com a rolagem)
function faixaLetreiro(g, y, ang, cor, corTexto, frase, desloc) {
  g.save();
  g.translate(CW / 2, y);
  g.rotate(ang);
  g.fillStyle = cor;
  g.fillRect(-CW, -34, CW * 2, 68);
  g.font = EXP(26, 600);
  g.letterSpacing = '4px';
  g.textBaseline = 'middle';
  g.fillStyle = corTexto;
  const w = g.measureText(frase).width;
  const off = ((desloc % w) + w) % w;
  for (let x = -CW - off; x < CW; x += w) g.fillText(frase, x, 3);
  g.letterSpacing = '0px';
  g.restore();
}
function letreiro(g, u, fila, P) {
  limpar(g);
  const rola = ease.inOutSine(prog(u, 0.3, 1.45));
  g.save();
  g.translate(0, -rola * 70);
  nav(g, 'Hamburgueria Fumaça');
  texto(g, 'Smash na chapa.', 32, 140, SAIRA(56), COR.aluminio);
  texto(g, 'Pão de batata, cheddar inglês e fumaça de verdade.', 32, 180, TXT(20), COR.nevoa);
  // velocidade = base + impulso enquanto o dedo rola (somada passo a passo: sempre o mesmo resultado)
  let pos = 0;
  const N = 60, dt = u / N;
  for (let k = 0; k < N; k++) {
    const t = (k + 0.5) * dt;
    pos += (70 + 560 * Math.pow(Math.sin(Math.PI * prog(t, 0.3, 1.6)), 2)) * dt;
  }
  faixaLetreiro(g, 290, -0.06, COR.aluminio, '#0A0C0F', 'SMASH  ·  CHEDDAR  ·  PÃO DE BATATA  ·  BACON  ·  ', pos);
  faixaLetreiro(g, 372, 0.045, TITANIO, COR.nevoa, 'ABERTO ATÉ 23H  ·  DELIVERY  ·  RETIRADA  ·  ', -pos * 0.8);
  barras(g, 32, 470, [420, 300]);
  g.restore();
  const [x, y] = P(790, lerp(440, 190, rola));
  toque(fila, x, y, { alfa: presenca(u, 1.6, 0.15), pressao: presenca(u, 1.6, 0.15) });
}

// 2 — letras que sobem
let medidas2 = null;
function letras(g, u) {
  limpar(g);
  nav(g, 'Tinta Preta Tattoo');
  const linhas = [['Traço fino.', 160], ['Pele inteira.', 268]];
  const F = SAIRA(96);
  if (!medidas2) medidas2 = linhas.map(([s]) => [...s].map((_, i) => largura(g, s.slice(0, i), F)));
  let n = 0;
  linhas.forEach(([s, base], li) => {
    g.save();
    g.beginPath();
    g.rect(0, base - 96, CW, 120);
    g.clip();
    [...s].forEach((ch, ci) => {
      const t0 = 0.08 + (n++) * 0.04;
      const k = ease.outCubic(prog(u, t0, t0 + 0.5));
      if (k <= 0) return;
      texto(g, ch, 32 + medidas2[li][ci], base + (1 - k) * 112, F, COR.aluminio);
    });
    g.restore();
  });
  g.fillStyle = COR.laranja;
  g.fillRect(34, 306, 130 * ease.inOutCubic(prog(u, 1.05, 1.45)), 3);
  const a = ease.outCubic(prog(u, 1.15, 1.55));
  g.save();
  g.globalAlpha = a;
  texto(g, 'Agenda aberta para dezembro.', 32, 356 + (1 - a) * 14, TXT(22), COR.nevoa);
  g.beginPath();
  g.roundRect(32, 392 + (1 - a) * 14, 250, 56, 28);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 1.5;
  g.stroke();
  texto(g, 'Ver portfólio  →', 157, 427 + (1 - a) * 14, TXT(20, 500), COR.aluminio, { alinhar: 'center' });
  g.restore();
}

// 3 — antes e depois
const SALA = { x: 32, y: 74, w: 786, h: 410 };
let salas = null;
function desenharSala(depois) {
  const { w, h } = SALA;
  const c = tela(w, h), g = c.getContext('2d');
  const piso = h * 0.74;
  if (depois) {
    const pa = g.createLinearGradient(0, 0, 0, piso);
    pa.addColorStop(0, '#3E2E23');
    pa.addColorStop(1, '#2A1F18');
    g.fillStyle = pa;
  } else g.fillStyle = '#2A2D31';
  g.fillRect(0, 0, w, piso);
  g.fillStyle = depois ? '#21170F' : '#18191B';
  g.fillRect(0, piso, w, h - piso);
  g.fillStyle = depois ? '#4A3628' : '#33373C';
  g.fillRect(0, piso - 8, w, 8);
  // piso: tábuas (depois) ou manchas (antes)
  if (depois) {
    g.strokeStyle = 'rgba(255,190,140,0.07)';
    g.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(-200 + i * 110, h);
      g.lineTo(i * 75, piso);
      g.stroke();
    }
  } else {
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(560, piso + 50, 120, 18, 0, 0, Math.PI * 2);
    g.fill();
  }
  // janela
  g.fillStyle = depois ? '#6A4630' : '#3A3F45';
  g.fillRect(80, 60, 170, 170);
  if (depois) {
    const sol = g.createRadialGradient(165, 120, 0, 165, 120, 140);
    sol.addColorStop(0, 'rgba(255,170,110,0.55)');
    sol.addColorStop(1, 'rgba(255,170,110,0)');
    g.fillStyle = sol;
    g.fillRect(40, 20, 260, 260);
  }
  g.strokeStyle = depois ? '#DFE3E7' : '#4A4F56';
  g.lineWidth = 6;
  g.strokeRect(80, 60, 170, 170);
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(165, 60);
  g.lineTo(165, 230);
  g.moveTo(80, 145);
  g.lineTo(250, 145);
  g.stroke();
  if (depois) {
    // quadro, sofá, luminária e planta
    g.fillStyle = '#DFE3E7';
    g.fillRect(400, 70, 150, 104);
    foto(g, 406, 76, 138, 92, 3, { raio: 2 });
    g.fillStyle = '#4A5058';
    g.beginPath();
    g.roundRect(360, piso - 120, 320, 96, 16);
    g.fill();
    g.fillStyle = '#5A626C';
    g.beginPath();
    g.roundRect(372, piso - 108, 140, 46, 10);
    g.roundRect(528, piso - 108, 140, 46, 10);
    g.fill();
    g.fillStyle = '#3A3F46';
    g.fillRect(372, piso - 26, 12, 26);
    g.fillRect(656, piso - 26, 12, 26);
    const luz = g.createRadialGradient(700, 70, 0, 700, 70, 220);
    luz.addColorStop(0, 'rgba(255,140,70,0.35)');
    luz.addColorStop(1, 'rgba(255,140,70,0)');
    g.fillStyle = luz;
    g.fillRect(480, -150, 440, 440);
    g.strokeStyle = '#8A929B';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(700, 0);
    g.lineTo(700, 40);
    g.stroke();
    g.fillStyle = '#DFE3E7';
    g.beginPath();
    g.moveTo(676, 70);
    g.lineTo(724, 70);
    g.lineTo(710, 40);
    g.lineTo(690, 40);
    g.closePath();
    g.fill();
    g.fillStyle = '#2C3A30';
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.ellipse(735 + Math.sin(i * 1.7) * 18, piso - 70 - i * 18, 12, 30, -0.6 + i * 0.25, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#5A4030';
    g.fillRect(718, piso - 48, 36, 48);
  } else {
    // rachadura, lâmpada pelada e caixas
    g.strokeStyle = '#1A1C1F';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(470, 40);
    [[488, 80], [476, 112], [500, 150], [492, 196], [512, 230]].forEach(([x, y]) => g.lineTo(x, y));
    g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.18)';
    g.beginPath();
    g.ellipse(600, 150, 70, 40, 0.3, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#4A4F56';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(700, 0);
    g.lineTo(700, 50);
    g.stroke();
    g.fillStyle = '#5A5F66';
    g.beginPath();
    g.arc(700, 60, 11, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#3A3D42';
    g.fillRect(380, piso - 70, 110, 70);
    g.fillRect(470, piso - 44, 80, 44);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    g.strokeRect(380, piso - 70, 110, 70);
  }
  return c;
}
function antesDepois(g, u, fila, P) {
  if (!salas) salas = [desenharSala(false), desenharSala(true)];
  limpar(g);
  nav(g, 'Casa Nova Reformas');
  const { x: X, y: Y, w, h } = SALA;
  const k = chaves(u, [[0, 0.8], [0.25, 0.8], [0.95, 0.12], [1.15, 0.12], [1.7, 0.5]], ease.inOutCubic);
  const xs = X + w * k;
  g.save();
  g.beginPath();
  g.roundRect(X, Y, w, h, 16);
  g.clip();
  g.drawImage(salas[1], X, Y);
  g.beginPath();
  g.rect(X, Y, xs - X, h);
  g.clip();
  g.drawImage(salas[0], X, Y);
  g.restore();
  const etiqueta = (s, x, alinhar) => {
    const lw = largura(g, s, MONO(14, 500), 3) + 28;
    const bx = alinhar === 'right' ? x - lw : x;
    g.fillStyle = 'rgba(10,12,15,0.7)';
    g.beginPath();
    g.roundRect(bx, Y + h - 56, lw, 36, 18);
    g.fill();
    texto(g, s, bx + 14, Y + h - 32, MONO(14, 500), COR.aluminio, { esp: 3 });
  };
  g.save();
  g.beginPath();
  g.rect(X, Y, xs - X, h);
  g.clip();
  etiqueta('ANTES', X + 20, 'left');
  g.restore();
  g.save();
  g.beginPath();
  g.rect(xs, Y, X + w - xs, h);
  g.clip();
  etiqueta('DEPOIS', X + w - 20, 'right');
  g.restore();
  // alça
  g.fillStyle = COR.aluminio;
  g.fillRect(xs - 1.5, Y, 3, h);
  const cy = Y + h / 2;
  g.beginPath();
  g.arc(xs, cy, 26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0A0C0F';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(xs + s * 16, cy);
    g.lineTo(xs + s * 6, cy - 8);
    g.lineTo(xs + s * 6, cy + 8);
    g.closePath();
    g.fill();
  }
  const [tx, ty] = P(xs, cy + 2);
  toque(fila, tx, ty, { alfa: presenca(u, 1.85, 0.05), pressao: presenca(u, 1.78, 0.2) });
}

// 4 — cartões empilhados
const PASSOS = [
  ['01', 'Teste de nível', '15 minutos, on-line, sem custo.'],
  ['02', 'Turma no seu horário', 'Até 6 alunos por turma.'],
  ['03', 'Primeira aula', 'Grátis. Se gostar, você fica.'],
];
function empilhados(g, u, fila, P) {
  limpar(g);
  const s = ease.inOutSine(prog(u, 0.12, 1.8));
  nav(g, 'Escola Ponte Idiomas');
  texto(g, 'COMO FUNCIONA', 32, 98, MONO(15), COR.nevoa, { esp: 3 });
  const ent = [1, ease.inOutCubic(prog(s, 0.02, 0.46)), ease.inOutCubic(prog(s, 0.54, 0.98))];
  PASSOS.forEach(([n, titulo, desc], k) => {
    const y = lerp(CH + 20, 122 + k * 22, ent[k]);
    if (y >= CH) return;
    const cobre = (ent[k + 1] ?? 0) + (ent[k + 2] ?? 0);
    const esc = 1 - 0.045 * cobre;
    g.save();
    g.translate(CW / 2, y);
    g.scale(esc, esc);
    g.beginPath();
    g.roundRect(-393, 0, 786, 330, 22);
    g.fillStyle = ['#1B2026', '#20262D', '#262D35'][k];
    g.fill();
    g.strokeStyle = LINHA;
    g.lineWidth = 1.5;
    g.stroke();
    g.save();
    g.clip();
    texto(g, n, 361, 300, SAIRA(220, 200), 'rgba(223,227,231,0.06)', { alinhar: 'right' });
    g.restore();
    texto(g, `PASSO ${n}`, -361, 52, MONO(16, 500), k === 2 ? COR.laranja : COR.nevoa, { esp: 3 });
    texto(g, titulo, -361, 130, SAIRA(48), COR.aluminio);
    texto(g, desc, -361, 172, TXT(22), COR.nevoa);
    g.fillStyle = `rgba(6,7,9,${Math.min(0.55, 0.32 * cobre)})`;
    g.beginPath();
    g.roundRect(-393, 0, 786, 330, 22);
    g.fill();
    g.restore();
  });
  const [x, y] = P(790, lerp(450, 170, s));
  toque(fila, x, y, { alfa: presenca(u, 1.9, 0.02), pressao: presenca(u, 1.9, 0.02) });
}

// 5 — luz que segue o cursor
let cerveja = null;
function paginaCerveja(aceso) {
  const c = tela(CW, CH), g = c.getContext('2d');
  g.fillStyle = '#08090B';
  g.fillRect(0, 0, CW, CH);
  g.fillStyle = aceso ? 'rgba(223,227,231,0.35)' : 'rgba(223,227,231,0.05)';
  for (let y = 17; y < CH; y += 34) for (let x = 17; x < CW; x += 34) g.fillRect(x - 1, y - 1, 2.5, 2.5);
  texto(g, 'LÚPULO NORTE', 32, 40, EXP(16), aceso ? COR.aluminio : '#2C323A', { esp: 3 });
  texto(g, 'Feita no', 32, 200, SAIRA(68), aceso ? COR.aluminio : '#1F2329');
  texto(g, 'escuro.', 32, 272, SAIRA(68), aceso ? COR.aluminio : '#1F2329');
  texto(g, 'Fermentação lenta: 21 dias em tanque fechado.', 32, 318, TXT(20), aceso ? COR.nevoa : '#191C21');
  // garrafa
  const gx = 620;
  g.beginPath();
  g.moveTo(gx - 18, 80);
  g.lineTo(gx + 18, 80);
  g.lineTo(gx + 18, 170);
  g.bezierCurveTo(gx + 18, 200, gx + 62, 205, gx + 62, 250);
  g.lineTo(gx + 62, 472);
  g.quadraticCurveTo(gx + 62, 486, gx + 48, 486);
  g.lineTo(gx - 48, 486);
  g.quadraticCurveTo(gx - 62, 486, gx - 62, 472);
  g.lineTo(gx - 62, 250);
  g.bezierCurveTo(gx - 62, 205, gx - 18, 200, gx - 18, 170);
  g.closePath();
  if (aceso) {
    const vidro = g.createLinearGradient(gx - 62, 0, gx + 62, 0);
    vidro.addColorStop(0, '#2A1A10');
    vidro.addColorStop(0.35, '#6A3E1E');
    vidro.addColorStop(1, '#1E130B');
    g.fillStyle = vidro;
  } else g.fillStyle = '#111317';
  g.fill();
  if (aceso) {
    g.fillStyle = 'rgba(255,220,180,0.25)';
    g.fillRect(gx - 40, 260, 8, 200);
    g.fillStyle = '#DFE3E7';
    g.fillRect(gx - 62, 300, 124, 96);
    texto(g, 'LÚPULO', gx, 336, MONO(13, 700), '#0A0C0F', { alinhar: 'center', esp: 2 });
    texto(g, 'NORTE', gx, 354, MONO(13, 700), '#0A0C0F', { alinhar: 'center', esp: 2 });
    texto(g, 'IPA · 6,2%', gx, 382, MONO(12), '#5A626C', { alinhar: 'center' });
  }
  return c;
}
let mascara5 = null;
function luz(g, u, fila, P) {
  if (!cerveja) cerveja = [paginaCerveja(false), paginaCerveja(true)];
  if (!mascara5) mascara5 = tela(CW, CH);
  const mx = chaves(u, [[0, 90], [0.55, 240], [1.15, 600], [1.95, 380]], ease.inOutSine);
  const my = chaves(u, [[0, 330], [0.55, 220], [1.15, 330], [1.95, 240]], ease.inOutSine);
  const r = lerp(40, 200, ease.outCubic(prog(u, 0.0, 0.45)));
  g.drawImage(cerveja[0], 0, 0);
  const m = mascara5.getContext('2d');
  m.globalCompositeOperation = 'source-over';
  m.clearRect(0, 0, CW, CH);
  m.drawImage(cerveja[1], 0, 0);
  m.globalCompositeOperation = 'destination-in';
  const rg = m.createRadialGradient(mx, my, 0, mx, my, r);
  rg.addColorStop(0, 'rgba(0,0,0,1)');
  rg.addColorStop(0.55, 'rgba(0,0,0,0.85)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  m.fillStyle = rg;
  m.fillRect(0, 0, CW, CH);
  g.drawImage(mascara5, 0, 0);
  const brilho = g.createRadialGradient(mx, my, 0, mx, my, r);
  brilho.addColorStop(0, 'rgba(255,140,70,0.10)');
  brilho.addColorStop(1, 'rgba(255,140,70,0)');
  g.fillStyle = brilho;
  g.fillRect(0, 0, CW, CH);
  const [x, y] = P(mx, my);
  toque(fila, x, y, { raio: 12, alfa: presenca(u, 1.95) });
}

// 6 — sublinhado que desliza
const MENU6 = ['Escritório', 'Áreas', 'Equipe', 'Contato'];
let menu6 = null;
function sublinhado(g, u, fila, P) {
  limpar(g);
  texto(g, 'MOURA ADVOCACIA', 32, 40, EXP(16), COR.aluminio, { esp: 3 });
  const F = TXT(24, 500), GAP = 46;
  if (!menu6) {
    const ws = MENU6.map((s) => largura(g, s, F));
    const total = ws.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1);
    let x = (CW - total) / 2;
    menu6 = { total, x0: x, itens: ws.map((w) => { const it = { x, w }; x += w + GAP; return it; }) };
  }
  const { itens } = menu6;
  g.beginPath();
  g.roundRect(menu6.x0 - 30, 78, menu6.total + 60, 70, 35);
  g.fillStyle = TITANIO;
  g.fill();
  g.strokeStyle = LINHA;
  g.lineWidth = 1.5;
  g.stroke();
  const SEQ = [[0, 0], [0.5, 2], [1.0, 1], [1.5, 3]];
  let j = 0;
  while (j + 1 < SEQ.length && u >= SEQ[j + 1][0]) j++;
  const alvo = SEQ[j][1];
  let L = itens[alvo].x, R = itens[alvo].x + itens[alvo].w;
  if (j > 0) {
    const de = itens[SEQ[j - 1][1]], para = itens[alvo], ts = SEQ[j][0];
    const frente = ease.outCubic(prog(u, ts, ts + 0.26)), tras = ease.inOutCubic(prog(u, ts + 0.06, ts + 0.42));
    if (SEQ[j][1] > SEQ[j - 1][1]) {
      R = lerp(de.x + de.w, para.x + para.w, frente);
      L = lerp(de.x, para.x, tras);
    } else {
      L = lerp(de.x, para.x, frente);
      R = lerp(de.x + de.w, para.x + para.w, tras);
    }
  }
  g.fillStyle = 'rgba(223,227,231,0.07)';
  g.beginPath();
  g.roundRect(L - 16, 90, R - L + 32, 46, 23);
  g.fill();
  MENU6.forEach((s, i) => texto(g, s, itens[i].x, 121, F, i === alvo ? COR.aluminio : COR.nevoa));
  g.fillStyle = COR.laranja;
  g.beginPath();
  g.roundRect(L, 130, R - L, 3.5, 2);
  g.fill();
  texto(g, 'Direito de família,', 32, 262, SAIRA(54), COR.aluminio);
  texto(g, 'com calma.', 32, 324, SAIRA(54), COR.aluminio);
  barras(g, 32, 370, [520, 440, 300]);
  const c = (i) => itens[i].x + itens[i].w / 2;
  const mx = chaves(u, [[0, c(0)], [0.3, c(0)], [0.5, c(2)], [0.8, c(2)], [1.0, c(1)], [1.3, c(1)], [1.5, c(3)]], ease.inOutSine);
  const [x, y] = P(mx, 116);
  toque(fila, x, y, { raio: 16, alfa: presenca(u, 1.95) });
}

// 7 — barra de leitura
function leitura(g, u, fila, P) {
  limpar(g);
  const p = ease.inOutSine(prog(u, 0.1, 1.85));
  g.save();
  g.translate(0, -p * 640);
  texto(g, 'BLOG · CAFÉ DA MANHÃ', 32, 120, MONO(14), COR.nevoa, { esp: 3 });
  texto(g, 'Café da manhã', 32, 180, SAIRA(54), COR.aluminio);
  texto(g, 'em 5 minutos.', 32, 238, SAIRA(54), COR.aluminio);
  texto(g, '4 min de leitura', 32, 276, TXT(18), COR.nevoa);
  foto(g, 32, 304, 786, 220, 5);
  barras(g, 32, 560, [760, 720, 780, 640, 700, 420], 'rgba(223,227,231,0.16)', 24);
  texto(g, '1. Deixe a aveia de molho.', 32, 750, SAIRA(34), COR.aluminio);
  barras(g, 32, 780, [760, 700, 740, 380], 'rgba(223,227,231,0.16)', 24);
  texto(g, '2. Fruta cortada na geladeira.', 32, 920, SAIRA(34), COR.aluminio);
  barras(g, 32, 950, [760, 720, 520], 'rgba(223,227,231,0.16)', 24);
  foto(g, 32, 1040, 380, 160, 9);
  g.restore();
  // topo fixo com a barra
  g.fillStyle = 'rgba(14,17,21,0.96)';
  g.fillRect(0, 0, CW, 66);
  nav(g, 'Nutri Clara');
  g.fillStyle = 'rgba(223,227,231,0.10)';
  g.fillRect(0, 66, CW, 5);
  g.fillStyle = COR.laranja;
  g.fillRect(0, 66, CW * p, 5);
  const pct = Math.round(p * 100), faltam = Math.ceil(4 * (1 - p) - 0.001);
  const rot = faltam > 0 ? `${pct}% · faltam ${faltam} min` : '100% · leitura concluída';
  const lw = largura(g, rot, MONO(15)) + 32;
  g.fillStyle = TITANIO;
  g.beginPath();
  g.roundRect(32, CH - 66, lw, 40, 20);
  g.fill();
  texto(g, rot, 48, CH - 40, MONO(15), COR.aluminio);
  const [x, y] = P(780, lerp(440, 170, p));
  toque(fila, x, y, { alfa: presenca(u, 1.9, 0.02), pressao: presenca(u, 1.9, 0.02) });
}

// 8 — perguntas que abrem
const FAQ = [
  ['Vocês buscam o pet em casa?', 'Sim. Buscamos e levamos de volta no mesmo dia.'],
  ['Quanto tempo leva o banho?', 'Cerca de 1h30, com secagem e escovação.'],
  ['Precisa agendar?', 'Precisa. Assim o seu pet não fica esperando.'],
  ['Atendem gatos?', 'Sim, em horário separado dos cães.'],
];
function perguntas(g, u, fila, P) {
  limpar(g);
  nav(g, 'Pet Amigo');
  texto(g, 'Dúvidas', 32, 112, SAIRA(46), COR.aluminio);
  const a0 = ease.inOutCubic(prog(u, 0.28, 0.62)) * (1 - ease.inOutCubic(prog(u, 1.12, 1.46)));
  const a2 = ease.inOutCubic(prog(u, 1.12, 1.46));
  const abre = [a0, 0, a2, 0];
  const linhaY = [];
  let y = 140;
  FAQ.forEach(([q, r], i) => {
    linhaY.push(y);
    const hA = 58 * abre[i];
    g.fillStyle = LINHA;
    g.fillRect(32, y, 786, 1.5);
    texto(g, q, 32, y + 46, TXT(24, 500), COR.aluminio);
    g.save();
    g.translate(796, y + 38);
    g.rotate((abre[i] * Math.PI) / 4);
    g.strokeStyle = abre[i] > 0.5 ? COR.laranja : COR.aluminio;
    g.lineWidth = 2.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-10, 0);
    g.lineTo(10, 0);
    g.moveTo(0, -10);
    g.lineTo(0, 10);
    g.stroke();
    g.restore();
    if (hA > 1) {
      g.save();
      g.beginPath();
      g.rect(0, y + 68, CW, hA);
      g.clip();
      g.globalAlpha = abre[i];
      texto(g, r, 32, y + 94 - (1 - abre[i]) * 14, TXT(21), COR.nevoa);
      g.restore();
    }
    y += 74 + hA;
  });
  g.fillStyle = LINHA;
  g.fillRect(32, y, 786, 1.5);
  const ty = lerp(linhaY[0] + 38, linhaY[2] + 38, ease.inOutSine(prog(u, 0.75, 1.02)));
  const [x, yy] = P(700, ty + (1 - ease.outCubic(prog(u, 0, 0.22))) * 50);
  toque(fila, x, yy, { alfa: presenca(u, 1.7), pressao: aperto(u, 0.2) + aperto(u, 1.04) });
}

// 9 — item voa para a sacola
const DOCES = [['Brigadeiro belga', 'R$ 4,50'], ['Bolo de pote', 'R$ 14'], ['Torta de limão', 'R$ 89']];
function sacola(g, u, fila, P) {
  limpar(g);
  nav(g, 'Confeitaria Cacau', { menu: false });
  const voos = [[0.3, 1], [1.0, 2]];
  const bx = CW - 60, by = 34;
  DOCES.forEach(([n, preco], i) => {
    const x = 32 + i * 268;
    foto(g, x, 82, 250, 210, 11 + i);
    texto(g, n, x, 326, TXT(21, 500), COR.aluminio);
    texto(g, preco, x + 250, 326, MONO(16), COR.nevoa, { alinhar: 'right' });
    const v = voos.find(([, k]) => k === i);
    const dentro = v && u > v[0] + 0.06;
    g.beginPath();
    g.roundRect(x, 348, 250, 50, 25);
    if (dentro) {
      g.fillStyle = TITANIO;
      g.fill();
    }
    g.strokeStyle = dentro ? LINHA : COR.aluminio;
    g.lineWidth = 1.5;
    g.stroke();
    texto(g, dentro ? 'Na sacola' : 'Adicionar  +', x + 125, 380, TXT(19, 500), dentro ? COR.nevoa : COR.aluminio, { alinhar: 'center' });
  });
  barras(g, 32, 440, [380, 260]);
  // voo em arco até a sacola
  let conta = 0, pulo = 0;
  for (const [t0, i] of voos) {
    const p = prog(u, t0 + 0.06, t0 + 0.66);
    if (u > t0 + 0.66) conta++;
    pulo = Math.max(pulo, Math.sin(Math.PI * prog(u, t0 + 0.62, t0 + 0.86)));
    if (p <= 0 || p >= 1) continue;
    const e = ease.inOutSine(p);
    const sx = 32 + i * 268 + 125, sy = 187, cx = lerp(sx, bx, 0.45), cy = -120;
    const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * bx;
    const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * by;
    const r = lerp(64, 12, e);
    g.save();
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.clip();
    foto(g, x - r * 2, y - r * 1.6, r * 4, r * 3.4, 11 + i, { raio: 0 });
    g.restore();
    g.strokeStyle = COR.aluminio;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.stroke();
  }
  g.save();
  g.translate(bx, by);
  g.scale(1 + 0.14 * pulo, 1 + 0.14 * pulo);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 2.2;
  g.beginPath();
  g.roundRect(-14, -8, 28, 24, 4);
  g.stroke();
  g.beginPath();
  g.arc(0, -8, 7, Math.PI, 0);
  g.stroke();
  g.restore();
  if (conta > 0) {
    const k = ease.outCubic(prog(u, voos[0][0] + 0.66, voos[0][0] + 0.8));
    g.fillStyle = COR.laranja;
    g.beginPath();
    g.arc(bx + 16, by - 14, 12 * k, 0, Math.PI * 2);
    g.fill();
    texto(g, String(conta), bx + 16, by - 9.5, MONO(14, 700), '#0A0C0F', { alinhar: 'center' });
  }
  const btn = (i) => [32 + i * 268 + 125, 373];
  const tx = chaves(u, [[0, 420], [0.22, btn(1)[0]], [0.7, btn(1)[0]], [0.92, btn(2)[0]]], ease.inOutSine);
  const tyy = chaves(u, [[0, 470], [0.22, 373]], ease.inOutSine);
  const [x, y] = P(tx, tyy);
  toque(fila, x, y, { alfa: presenca(u, 1.6), pressao: aperto(u, 0.24) + aperto(u, 0.94) });
}

// 10 — título que se digita
function digita(g, u) {
  limpar(g);
  nav(g, 'Imobiliária Chave');
  texto(g, 'Seu apê em', 32, 160, SAIRA(66), COR.aluminio);
  const A = 'Pinheiros.', B = 'Moema.', PASSO = 0.055;
  let s = '', digitando = false;
  if (u < 0.12) s = '';
  else if (u < 0.12 + A.length * PASSO) { s = A.slice(0, Math.floor((u - 0.12) / PASSO) + 1); digitando = true; }
  else if (u < 0.98) s = A;
  else if (u < 1.22) { s = A.slice(0, Math.ceil(A.length * (1 - prog(u, 0.98, 1.22)))); digitando = true; }
  else if (u < 1.3) s = '';
  else if (u < 1.3 + B.length * PASSO) { s = B.slice(0, Math.floor((u - 1.3) / PASSO) + 1); digitando = true; }
  else s = B;
  texto(g, s, 32, 238, SAIRA(66), COR.aluminio);
  if (digitando || (u * 2.4) % 1 < 0.55) {
    g.fillStyle = COR.laranja;
    g.fillRect(32 + largura(g, s, SAIRA(66)) + 6, 186, 4, 62);
  }
  g.beginPath();
  g.roundRect(32, 290, 594, 64, 32);
  g.fillStyle = TITANIO;
  g.fill();
  g.strokeStyle = LINHA;
  g.lineWidth = 1.5;
  g.stroke();
  texto(g, 'Bairro, cidade ou código', 64, 329, TXT(20), '#5A626C');
  g.beginPath();
  g.roundRect(640, 290, 178, 64, 32);
  g.fillStyle = COR.aluminio;
  g.fill();
  texto(g, 'Buscar', 729, 329, TXT(20, 500), '#0A0C0F', { alinhar: 'center' });
  for (let i = 0; i < 3; i++) foto(g, 32 + i * 268, 386, 250, 160, 30 + i);
}

// 11 — rolagem na horizontal
const ORIGENS = [
  ['Sul de Minas', '1.150 M · AMARELO'],
  ['Mogiana', '1.000 M · MUNDO NOVO'],
  ['Cerrado Mineiro', '1.100 M · CATUAÍ'],
  ['Chapada Diamantina', '1.200 M · BOURBON'],
  ['Montanhas do ES', '1.050 M · ARARA'],
];
function horizontal(g, u, fila, P) {
  limpar(g);
  const p = ease.inOutSine(prog(u, 0.12, 1.85));
  nav(g, 'Café Origem');
  texto(g, 'Nossas origens', 32, 120, SAIRA(46), COR.aluminio);
  const atual = Math.min(5, 1 + Math.round(p * 4));
  texto(g, `${String(atual).padStart(2, '0')} / 05`, 818, 120, MONO(16), COR.nevoa, { alinhar: 'right' });
  ORIGENS.forEach(([n, d], i) => {
    const x = 32 + i * 324 - p * 810;
    if (x > CW || x + 300 < 0) return;
    foto(g, x, 150, 300, 236, 40 + i);
    texto(g, n, x, 420, TXT(22, 500), COR.aluminio);
    texto(g, d, x, 448, MONO(13), COR.nevoa, { esp: 1 });
  });
  g.fillStyle = 'rgba(223,227,231,0.12)';
  g.fillRect(32, 482, 786, 3);
  g.fillStyle = COR.laranja;
  g.fillRect(32, 482, 786 * (0.2 + 0.8 * p), 3);
  const [x, y] = P(700, lerp(440, 170, p));
  toque(fila, x, y, { alfa: presenca(u, 1.9, 0.04), pressao: presenca(u, 1.9, 0.04) });
}

// 12 — cortina ao carregar
function contador(g, u, cy) {
  const n = Math.round(100 * ease.inOutSine(prog(u, 0.05, 0.85)));
  texto(g, 'HOTEL ATLÂNTICO', CW / 2, cy - 84, MONO(15), COR.nevoa, { alinhar: 'center', esp: 5 });
  texto(g, String(n).padStart(3, '0'), CW / 2, cy + 40, MONO(112, 300), COR.aluminio, { alinhar: 'center' });
  g.fillStyle = 'rgba(223,227,231,0.14)';
  g.fillRect(CW / 2 - 160, cy + 80, 320, 2);
  g.fillStyle = COR.laranja;
  g.fillRect(CW / 2 - 160, cy + 80, 320 * (n / 100), 2);
}
function cortina(g, u) {
  const rev = ease.inOutCubic(prog(u, 0.95, 1.45));
  if (rev > 0) {
    const z = lerp(1.18, 1, ease.outCubic(prog(u, 0.95, 1.95)));
    g.save();
    g.translate(CW / 2, CH / 2);
    g.scale(z, z);
    g.translate(-CW / 2, -CH / 2);
    foto(g, 0, 0, CW, CH, 6, { raio: 0 });
    g.restore();
    const som = g.createLinearGradient(0, CH * 0.4, 0, CH);
    som.addColorStop(0, 'rgba(6,7,10,0)');
    som.addColorStop(1, 'rgba(6,7,10,0.8)');
    g.fillStyle = som;
    g.fillRect(0, 0, CW, CH);
    nav(g, 'Hotel Atlântico');
    const tt = ease.outCubic(prog(u, 1.25, 1.75));
    g.save();
    g.beginPath();
    g.rect(0, 320, CW, 100);
    g.clip();
    texto(g, 'Atlântico.', 32, 404 + (1 - tt) * 100, SAIRA(88), COR.aluminio);
    g.restore();
    g.save();
    g.globalAlpha = ease.outCubic(prog(u, 1.45, 1.85));
    texto(g, 'Frente para o mar, desde 1962.', 32, 452, TXT(22), COR.aluminio);
    g.restore();
  }
  // as duas metades levam o contador junto
  const d = rev * (CH / 2 + 30), cy = CH / 2;
  for (const [y0, dir] of [[0, -1], [cy, 1]]) {
    g.save();
    g.translate(0, dir * d);
    g.beginPath();
    g.rect(0, y0, CW, CH / 2 + 0.5);
    g.clip();
    g.fillStyle = '#07080A';
    g.fillRect(0, y0, CW, CH / 2 + 0.5);
    contador(g, u, cy);
    g.restore();
  }
}

const ITENS = [
  { nome: 'Letreiro que corre', site: 'hamburgueriafumaca.com.br', fx: letreiro, borrao: true },
  { nome: 'Letras que sobem', site: 'tintapretatattoo.com.br', fx: letras },
  { nome: 'Antes e depois', site: 'casanovareformas.com.br', fx: antesDepois },
  { nome: 'Cartões empilhados', site: 'escolaponte.com.br', fx: empilhados },
  { nome: 'Luz que segue o cursor', site: 'lupulonorte.com.br', fx: luz },
  { nome: 'Sublinhado que desliza', site: 'mouraadvocacia.com.br', fx: sublinhado },
  { nome: 'Barra de leitura', site: 'nutriclara.com.br/blog', fx: leitura },
  { nome: 'Perguntas que abrem', site: 'petamigo.com.br', fx: perguntas },
  { nome: 'Item voa para a sacola', site: 'confeitariacacau.com.br', fx: sacola },
  { nome: 'Título que se digita', site: 'imobiliariachave.com.br', fx: digita },
  { nome: 'Rolagem na horizontal', site: 'cafeorigem.com.br', fx: horizontal },
  { nome: 'Cortina ao carregar', site: 'hotelatlantico.com.br', fx: cortina, borrao: [0.92, 1.5] },
];

export default catalogo({ id: 'i16', nome: 'i16-12-animacoes-de-site-parte-2', parte: 2, itens: ITENS, semente: 16, capa: 2 * 2 + 0.95 });

export { ITENS };
