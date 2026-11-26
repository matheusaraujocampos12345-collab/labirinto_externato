// i17 — 12 animações de site · parte 3 (27 s). Mesmo formato do i15 e do i16 (moldura em catalogo.js),
// com mais 12 efeitos. Todos os negócios são fictícios.
// Os prompts de cada estilo estão em instagram/prompts/12-animacoes-de-site-parte-3.md.
import { chaves } from '../motor/tempo.js';
import { misturar } from './comum.js';
import {
  catalogo, CW, CH, SAIRA, EXP, TXT, MONO, TITANIO, LINHA,
  texto, largura, nav, limpar, barras, toque, presenca, aperto, foto, tela,
  clamp, lerp, prog, ease, hash, COR,
} from './catalogo.js';

/** desenha só a fração p (0 a 1) do comprimento total de uma lista de traços */
function tracar(g, linhas, p) {
  const comp = linhas.map((l) => l.reduce((s, pt, i) => (i ? s + Math.hypot(pt[0] - l[i - 1][0], pt[1] - l[i - 1][1]) : 0), 0));
  let resta = comp.reduce((a, b) => a + b, 0) * clamp(p);
  for (let j = 0; j < linhas.length && resta > 0; j++) {
    const l = linhas[j];
    g.beginPath();
    g.moveTo(l[0][0], l[0][1]);
    let acc = 0;
    for (let i = 1; i < l.length; i++) {
      const d = Math.hypot(l[i][0] - l[i - 1][0], l[i][1] - l[i - 1][1]);
      if (acc + d <= resta) g.lineTo(l[i][0], l[i][1]);
      else {
        const f = (resta - acc) / d;
        g.lineTo(lerp(l[i - 1][0], l[i][0], f), lerp(l[i - 1][1], l[i][1], f));
        break;
      }
      acc += d;
    }
    g.stroke();
    resta -= comp[j];
  }
}
const circ = (cx, cy, r, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2, n = 48) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = lerp(a0, a1, i / n);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

// 1 — fundo que muda de cor
const SABORES = [
  ['Pistache.', 'Da Sicília, moído aqui.', '#24301F', '#A9BC8E'],
  ['Morango.', 'Fruta inteira, sem corante.', '#36191F', '#E58E9B'],
  ['Chocolate.', '70% cacau, do sul da Bahia.', '#2A1B13', '#9A6440'],
];
const SEC = 400;
function fundoCor(g, u, fila, P) {
  const p = ease.inOutSine(prog(u, 0.1, 1.85));
  const s = p * SEC * 2;
  const f = s / SEC, i = Math.min(1, Math.floor(f)), fr = f - i;
  const cor = misturar(SABORES[i][2], SABORES[i + 1][2], ease.inOutSine(clamp((fr - 0.2) / 0.6)));
  g.fillStyle = cor;
  g.fillRect(0, 0, CW, CH);
  SABORES.forEach(([nome, desc, , bola], j) => {
    const y0 = 20 + j * SEC - s;
    if (y0 > CH || y0 + SEC + 80 < 0) return;
    const cx = 610, cy = y0 + 230;
    // casquinha
    g.save();
    g.beginPath();
    g.moveTo(cx - 74, cy + 26);
    g.lineTo(cx + 74, cy + 26);
    g.lineTo(cx, cy + 236);
    g.closePath();
    g.fillStyle = '#B98552';
    g.fill();
    g.clip();
    g.strokeStyle = 'rgba(90,50,20,0.45)';
    g.lineWidth = 2;
    for (let k = -6; k < 8; k++) {
      g.beginPath();
      g.moveTo(cx - 90 + k * 24, cy + 20);
      g.lineTo(cx - 90 + k * 24 + 130, cy + 240);
      g.moveTo(cx + 90 - k * 24, cy + 20);
      g.lineTo(cx + 90 - k * 24 - 130, cy + 240);
      g.stroke();
    }
    g.restore();
    // bola
    g.fillStyle = bola;
    g.beginPath();
    g.arc(cx, cy - 22, 94, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(cx - 94, cy - 10);
    for (let a = 0; a <= 12; a++) g.lineTo(cx - 94 + a * (188 / 12), cy + 26 + (a % 2 ? 14 : 0));
    g.lineTo(cx + 94, cy - 10);
    g.closePath();
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.2)';
    g.beginPath();
    g.ellipse(cx - 40, cy - 66, 24, 12, -0.6, 0, Math.PI * 2);
    g.fill();
    texto(g, `0${j + 1} / 03`, 32, y0 + 140, MONO(15), 'rgba(223,227,231,0.6)', { esp: 2 });
    texto(g, nome, 32, y0 + 220, SAIRA(78), COR.aluminio);
    texto(g, desc, 32, y0 + 262, TXT(21), 'rgba(223,227,231,0.72)');
  });
  nav(g, 'Sorveteria Polar');
  const [x, y] = P(790, lerp(440, 170, p));
  toque(fila, x, y, { alfa: presenca(u, 1.9, 0.04), pressao: presenca(u, 1.9, 0.04) });
}

// 2 — foto que segue o cursor
const PROJ = [['Casa Pedra', '2025'], ['Loja Brisa', '2024'], ['Café Muro', '2024'], ['Sala Norte', '2023']];
const ROW0 = 92, ROWH = 98;
const meio = (i) => ROW0 + i * ROWH + ROWH / 2;
const curY = (t) => chaves(t, [[0, 500], [0.25, meio(0)], [0.5, meio(0) + 6], [0.68, meio(1)], [0.95, meio(1) + 6], [1.13, meio(2)], [1.4, meio(2) + 6], [1.58, meio(3)], [2, meio(3) + 6]], ease.inOutSine);
const curX = (t) => 330 + 140 * Math.sin(t * 2.2 - 0.6);
function seguir(g, u, fila, P) {
  limpar(g);
  nav(g, 'Studio Traço');
  const cx = curX(u), cy = curY(u);
  const lx = curX(u - 0.1), ly = curY(u - 0.1);
  const vx = (curX(u) - curX(u - 0.06)) / 0.06;
  PROJ.forEach(([n, ano], i) => {
    const y = ROW0 + i * ROWH;
    const k = ease.inOutSine(clamp(1 - Math.abs(cy - meio(i)) / 70));
    g.fillStyle = LINHA;
    g.fillRect(32, y, 786, 1.5);
    texto(g, n, 32 + 18 * k, y + 68, SAIRA(54), misturar('#5A626C', '#DFE3E7', k));
    texto(g, ano, 818, y + 62, MONO(16), COR.nevoa, { alinhar: 'right' });
  });
  g.fillStyle = LINHA;
  g.fillRect(32, ROW0 + 4 * ROWH, 786, 1.5);
  const vis = PROJ.map((_, i) => ease.inOutSine(clamp(1 - Math.abs(ly - meio(i)) / 62)));
  vis.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).forEach(([v, i]) => {
    if (v < 0.02) return;
    g.save();
    g.translate(lx + 40, ly - 16);
    g.rotate(clamp(vx * 0.0004, -0.12, 0.12));
    g.globalAlpha = v;
    const sc = lerp(0.7, 1, v);
    g.scale(sc, sc);
    foto(g, 0, -92, 236, 164, 60 + i, { raio: 10 });
    g.restore();
  });
  const [x, y] = P(cx, cy);
  toque(fila, x, y, { raio: 12, alfa: presenca(u, 1.95) });
}

// 3 — seção que fica presa
const ETAPAS = [
  ['Postura.', 'Coluna alinhada antes', 'de qualquer carga.'],
  ['Força.', 'Centro do corpo firme,', 'sem impacto.'],
  ['Respiração.', 'Cada movimento', 'no ritmo do ar.'],
];
function presa(g, u, fila, P) {
  limpar(g);
  const p = ease.inOutSine(prog(u, 0.08, 1.85));
  const s = p * 620;
  const centros = ETAPAS.map((_, k) => 200 + k * 300 - 20 - s);
  let ativo = 0;
  centros.forEach((c, k) => { if (Math.abs(c - 250) < Math.abs(centros[ativo] - 250)) ativo = k; });
  g.save();
  g.translate(0, -s);
  nav(g, 'Pilates Eixo');
  texto(g, 'O MÉTODO', 452, 110, MONO(15), COR.nevoa, { esp: 3 });
  ETAPAS.forEach(([t1, d1, d2], k) => {
    const y = 200 + k * 300;
    texto(g, t1, 452, y, SAIRA(58), k === ativo ? COR.aluminio : '#3E454E');
    texto(g, d1, 452, y + 42, TXT(21), k === ativo ? COR.nevoa : '#3E454E');
    texto(g, d2, 452, y + 70, TXT(21), k === ativo ? COR.nevoa : '#3E454E');
  });
  g.restore();
  // a foto da esquerda sobe com a página e fica presa no topo
  const IX = 32, IW = 380, IH = 450, iy = Math.max(30, 96 - s);
  g.save();
  g.beginPath();
  g.roundRect(IX, iy, IW, IH, 16);
  g.clip();
  foto(g, IX, iy, IW, IH, 70, { raio: 0 });
  for (let k = 1; k < 3; k++) {
    const a = ease.inOutCubic(clamp((s - (k * 300 - 150)) / 110));
    if (a <= 0) continue;
    g.save();
    g.beginPath();
    g.rect(IX, iy + IH * (1 - a), IW, IH * a);
    g.clip();
    foto(g, IX, iy, IW, IH, 70 + k, { raio: 0 });
    g.restore();
  }
  texto(g, `0${ativo + 1}`, IX + 24, iy + IH - 28, SAIRA(96, 200), 'rgba(223,227,231,0.92)');
  g.restore();
  for (let k = 0; k < 3; k++) {
    g.fillStyle = k === ativo ? COR.laranja : 'rgba(223,227,231,0.3)';
    g.beginPath();
    g.arc(IX + IW - 24, iy + 30 + k * 18, 4, 0, Math.PI * 2);
    g.fill();
  }
  const [x, y] = P(790, lerp(440, 170, p));
  toque(fila, x, y, { alfa: presenca(u, 1.9, 0.02), pressao: presenca(u, 1.9, 0.02) });
}

// 4 — ícone que se desenha
const ICONES = [
  [ // lâmpada
    [[47, 90], [47, 78], ...circ(60, 50, 30, 0.8 * Math.PI, 2.2 * Math.PI, 40), [73, 78], [73, 90]],
    [[47, 98], [73, 98]],
    [[52, 106], [68, 106]],
    [[51, 62], [55, 52], [60, 62], [65, 52], [69, 62]],
  ],
  [ // tomada
    [[24, 24], [96, 24], [96, 96], [24, 96], [24, 24]],
    circ(60, 60, 25),
    circ(51, 60, 4, -Math.PI / 2, 1.5 * Math.PI, 16),
    circ(69, 60, 4, -Math.PI / 2, 1.5 * Math.PI, 16),
  ],
  [ // raio
    [[68, 12], [34, 66], [57, 66], [49, 108], [87, 50], [63, 50], [68, 12]],
  ],
];
const SERVICOS = [['Instalação', 'Casa e comércio.'], ['Tomadas e quadros', 'Troca e adequação.'], ['Emergência 24h', 'Em até 1 hora.']];
function icones(g, u) {
  limpar(g);
  nav(g, 'Volt Instalações');
  texto(g, 'SERVIÇOS', 32, 92, MONO(15), COR.nevoa, { esp: 3 });
  SERVICOS.forEach(([t1, d], i) => {
    const x = 32 + i * 268, y = 116;
    g.beginPath();
    g.roundRect(x, y, 250, 340, 20);
    g.fillStyle = TITANIO;
    g.fill();
    g.strokeStyle = LINHA;
    g.lineWidth = 1.5;
    g.stroke();
    const p = ease.inOutCubic(prog(u, 0.12 + i * 0.28, 0.92 + i * 0.28));
    g.save();
    g.translate(x + 26, y + 30);
    g.scale(1.25, 1.25);
    if (i === 2) {
      const brilho = ease.outCubic(prog(u, 1.25, 1.6));
      if (brilho > 0) {
        const gl = g.createRadialGradient(60, 60, 0, 60, 60, 80);
        gl.addColorStop(0, `rgba(255,107,26,${0.28 * brilho})`);
        gl.addColorStop(1, 'rgba(255,107,26,0)');
        g.fillStyle = gl;
        g.fillRect(-30, -30, 180, 180);
      }
    }
    g.strokeStyle = i === 2 ? COR.laranja : COR.aluminio;
    g.lineWidth = 2.6;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    tracar(g, ICONES[i], p);
    g.restore();
    const a = ease.outCubic(prog(u, 0.6 + i * 0.28, 0.95 + i * 0.28));
    g.save();
    g.globalAlpha = a;
    texto(g, t1, x + 26, y + 250 + (1 - a) * 12, TXT(22, 500), COR.aluminio);
    texto(g, d, x + 26, y + 282 + (1 - a) * 12, TXT(18), COR.nevoa);
    g.restore();
  });
}

// 5 — contagem regressiva
function rolo(g, x, y, w, h, r, cor) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  const base = Math.floor(r);
  for (let n = base - 1; n <= base + 1; n++) {
    texto(g, String(((n % 10) + 10) % 10), x + w / 2, y + h / 2 + 33 + (n - r) * h, MONO(92, 300), cor, { alinhar: 'center' });
  }
  g.restore();
}
const GRUPOS = [['12', 'DIAS'], ['08', 'HORAS'], ['45', 'MIN'], ['37', 'SEG']];
function contagem(g, u) {
  limpar(g);
  nav(g, 'Casa Nonna Panetones');
  texto(g, 'ENCOMENDAS DE NATAL FECHAM EM', 32, 108, MONO(15), COR.nevoa, { esp: 3 });
  const BW = 168, GAP = 38, BY = 136, BH = 132;
  GRUPOS.forEach(([n, rot], gi) => {
    const bx = 32 + gi * (BW + GAP);
    g.beginPath();
    g.roundRect(bx, BY, BW, BH, 18);
    g.fillStyle = TITANIO;
    g.fill();
    g.strokeStyle = LINHA;
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = 'rgba(10,12,15,0.5)';
    g.fillRect(bx, BY + BH / 2 - 0.75, BW, 1.5);
    [...n].forEach((ch, di) => {
      const t0 = 0.1 + gi * 0.1 + di * 0.05;
      const e = ease.outCubic(prog(u, t0, t0 + 0.9));
      let alvo = Number(ch);
      if (gi === 3 && di === 1) alvo -= ease.inOutCubic(prog(u, 1.45, 1.68));
      rolo(g, bx + 8 + di * 76, BY, 76, BH, alvo + 20 * (1 - e), gi === 3 ? COR.laranja : COR.aluminio);
    });
    texto(g, rot, bx + BW / 2, BY + BH + 32, MONO(13), COR.nevoa, { alinhar: 'center', esp: 3 });
    if (gi < 3) {
      g.fillStyle = 'rgba(223,227,231,0.4)';
      g.fillRect(bx + BW + GAP / 2 - 3, BY + 46, 6, 6);
      g.fillRect(bx + BW + GAP / 2 - 3, BY + 80, 6, 6);
    }
  });
  g.beginPath();
  g.roundRect(32, 344, 340, 60, 30);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 1.5;
  g.stroke();
  texto(g, 'Encomendar panetone  →', 202, 381, TXT(20, 500), COR.aluminio, { alinhar: 'center' });
  texto(g, 'Entrega até 23/12 em toda a cidade.', 32, 452, TXT(18), COR.nevoa);
}

// 6 — mapa de entrega
let mapa = null;
function desenharMapa() {
  const c = tela(CW, CH), g = c.getContext('2d');
  g.fillStyle = '#101317';
  g.fillRect(0, 0, CW, CH);
  g.save();
  g.translate(CW / 2, CH / 2);
  g.rotate(-0.18);
  g.strokeStyle = '#1B2128';
  g.lineWidth = 8;
  for (let x = -720; x <= 720; x += 74) {
    g.beginPath();
    g.moveTo(x, -620);
    g.lineTo(x, 620);
    g.stroke();
  }
  for (let y = -620; y <= 620; y += 62) {
    g.beginPath();
    g.moveTo(-720, y);
    g.lineTo(720, y);
    g.stroke();
  }
  g.restore();
  g.fillStyle = '#141C17';
  g.fillRect(90, 300, 150, 96);
  g.fillStyle = '#132029';
  g.beginPath();
  g.moveTo(-20, 430);
  g.bezierCurveTo(200, 370, 380, 530, 600, 450);
  g.bezierCurveTo(720, 410, 800, 480, 880, 440);
  g.lineTo(880, 488);
  g.bezierCurveTo(800, 528, 720, 458, 600, 498);
  g.bezierCurveTo(380, 578, 200, 418, -20, 478);
  g.closePath();
  g.fill();
  g.strokeStyle = '#262D35';
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(-20, 130);
  g.lineTo(880, 340);
  g.moveTo(330, -20);
  g.lineTo(560, 540);
  g.stroke();
  texto(g, 'AV. DAS PALMEIRAS', 640, 300, MONO(11), '#4A525C', { esp: 2 });
  return c;
}
function mapaEntrega(g, u) {
  if (!mapa) mapa = desenharMapa();
  g.drawImage(mapa, 0, 0);
  const cx = 540, cy = 290;
  const R = 180 * ease.inOutCubic(prog(u, 0.58, 1.18));
  if (R > 1) {
    g.beginPath();
    g.arc(cx, cy, R, 0, Math.PI * 2);
    g.fillStyle = 'rgba(223,227,231,0.07)';
    g.fill();
    g.setLineDash([10, 9]);
    g.lineDashOffset = -u * 40;
    g.strokeStyle = 'rgba(223,227,231,0.6)';
    g.lineWidth = 2;
    g.stroke();
    g.setLineDash([]);
  }
  for (let k = 0; k < 2; k++) {
    const q = prog(u, 1.0 + k * 0.45, 1.8 + k * 0.45);
    if (q <= 0 || q >= 1) continue;
    g.beginPath();
    g.arc(cx, cy, q * 180, 0, Math.PI * 2);
    g.strokeStyle = `rgba(255,107,26,${0.55 * (1 - q)})`;
    g.lineWidth = 2;
    g.stroke();
  }
  const q = prog(u, 0.12, 0.5);
  if (q > 0) {
    g.fillStyle = `rgba(0,0,0,${0.5 * q})`;
    g.beginPath();
    g.ellipse(cx, cy + 3, 6 + 10 * q, 4 + 2 * q, 0, 0, Math.PI * 2);
    g.fill();
    const py = lerp(cy - 320, cy, ease.inCubic(q));
    const amassa = 1 - 0.12 * Math.sin(Math.PI * prog(u, 0.5, 0.66));
    g.save();
    g.translate(cx, py);
    g.scale(1 + (1 - amassa) * 0.6, amassa);
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(-8, -18, -24, -30, -24, -46);
    g.arc(0, -46, 24, Math.PI, 0);
    g.bezierCurveTo(24, -30, 8, -18, 0, 0);
    g.fillStyle = COR.laranja;
    g.fill();
    g.fillStyle = '#0A0C0F';
    g.beginPath();
    g.arc(0, -46, 8, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  const som = g.createLinearGradient(0, 0, 0, 80);
  som.addColorStop(0, 'rgba(10,12,15,0.92)');
  som.addColorStop(1, 'rgba(10,12,15,0)');
  g.fillStyle = som;
  g.fillRect(0, 0, CW, 80);
  nav(g, 'Pizzaria Forno Velho');
  const a = ease.outCubic(prog(u, 1.12, 1.45));
  if (a > 0) {
    g.save();
    g.globalAlpha = a;
    g.translate(0, (1 - a) * 14);
    g.beginPath();
    g.roundRect(32, 78, 300, 100, 18);
    g.fillStyle = 'rgba(14,17,21,0.94)';
    g.fill();
    g.strokeStyle = LINHA;
    g.lineWidth = 1.5;
    g.stroke();
    texto(g, 'Entregamos até 5 km.', 54, 120, TXT(22, 500), COR.aluminio);
    texto(g, 'TEMPO MÉDIO · 35 MIN', 54, 154, MONO(13), COR.nevoa, { esp: 2 });
    g.restore();
  }
}

// 7 — botão que confirma
function confirma(g, u, fila, P) {
  limpar(g);
  nav(g, 'Studio Bela');
  texto(g, 'Agendar horário', 32, 108, SAIRA(44), COR.aluminio);
  [['NOME', 'Mariana Costa'], ['SERVIÇO', 'Corte e escova'], ['DIA', 'Sábado, 10h']].forEach(([r, v], i) => {
    const y = 136 + i * 74;
    texto(g, r, 32, y + 14, MONO(12), COR.nevoa, { esp: 3 });
    g.beginPath();
    g.roundRect(32, y + 24, 786, 42, 10);
    g.fillStyle = TITANIO;
    g.fill();
    texto(g, v, 50, y + 52, TXT(19), COR.aluminio);
  });
  const by = 376, bh = 64;
  const enc = ease.inOutCubic(prog(u, 0.36, 0.64));
  const w = lerp(786, bh, enc);
  const pr = aperto(u, 0.2, 0.22);
  const ok = ease.inOutCubic(prog(u, 1.1, 1.3));
  g.save();
  g.translate(CW / 2, by + bh / 2);
  g.scale(1 - 0.04 * pr, 1 - 0.04 * pr);
  g.beginPath();
  g.roundRect(-w / 2, -bh / 2, w, bh, bh / 2);
  g.fillStyle = misturar('#DFE3E7', '#FF6B1A', ok);
  g.fill();
  const ta = 1 - prog(u, 0.3, 0.42);
  if (ta > 0) {
    g.globalAlpha = ta;
    texto(g, 'Confirmar horário', 0, 8, TXT(21, 500), '#0A0C0F', { alinhar: 'center' });
    g.globalAlpha = 1;
  }
  g.strokeStyle = '#0A0C0F';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (enc > 0.9 && u < 1.2) {
    g.globalAlpha = 1 - prog(u, 1.06, 1.16);
    g.lineWidth = 3.5;
    g.beginPath();
    g.arc(0, 0, 15, u * 10, u * 10 + Math.PI * 1.3);
    g.stroke();
    g.globalAlpha = 1;
  }
  const pc = ease.outCubic(prog(u, 1.2, 1.45));
  if (pc > 0) {
    g.lineWidth = 4;
    tracar(g, [[[-12, 1], [-4, 9], [13, -9]]], pc);
  }
  g.restore();
  const ma = ease.outCubic(prog(u, 1.4, 1.75));
  g.save();
  g.globalAlpha = ma;
  texto(g, 'Pronto. Te esperamos sábado, 10h.', CW / 2, 482 + (1 - ma) * 10, TXT(21), COR.aluminio, { alinhar: 'center' });
  g.restore();
  const [x, y] = P(CW / 2 + 150, lerp(490, by + bh / 2, ease.outCubic(prog(u, 0, 0.18))));
  toque(fila, x, y, { alfa: presenca(u, 0.5), pressao: pr });
}

// 8 — cartão que vira
const PROD = [
  { nome: 'Granola da casa', preco: 'R$ 32', semente: 80, itens: ['Aveia e castanha-do-pará', 'Adoçada só com mel', 'Sem conservante', 'Pote de 500 g'] },
  { nome: 'Mel de laranjeira', preco: 'R$ 38', semente: 81, itens: ['Florada de laranjeira', 'Cru, sem aquecer', 'Do interior de SP', 'Pote de 300 g'] },
];
const FW = 300, FH = 380;
let faces = null;
function face(pr, verso) {
  const c = tela(FW * 2, FH * 2), g = c.getContext('2d');
  g.scale(2, 2);
  g.beginPath();
  g.roundRect(0, 0, FW, FH, 20);
  g.fillStyle = verso ? '#222930' : TITANIO;
  g.fill();
  g.save();
  g.clip();
  if (!verso) {
    foto(g, 0, 0, FW, 230, pr.semente, { raio: 0 });
    texto(g, pr.nome, 22, 274, TXT(23, 500), COR.aluminio);
    texto(g, pr.preco, 22, 306, MONO(17), COR.nevoa);
    texto(g, 'TOQUE PARA VER', 22, 352, MONO(12), '#5A626C', { esp: 2 });
  } else {
    texto(g, 'O QUE TEM', 22, 44, MONO(12), COR.nevoa, { esp: 3 });
    texto(g, pr.nome, 22, 82, TXT(23, 500), COR.aluminio);
    pr.itens.forEach((s, i) => {
      g.fillStyle = 'rgba(223,227,231,0.5)';
      g.fillRect(22, 126 + i * 40 - 6, 10, 2);
      texto(g, s, 42, 126 + i * 40, TXT(17), COR.aluminio);
    });
    g.beginPath();
    g.roundRect(22, 306, 256, 50, 25);
    g.fillStyle = COR.aluminio;
    g.fill();
    texto(g, `Adicionar · ${pr.preco}`, 150, 337, TXT(18, 500), '#0A0C0F', { alinhar: 'center' });
  }
  g.restore();
  g.strokeStyle = LINHA;
  g.lineWidth = 1.5;
  g.beginPath();
  g.roundRect(0.75, 0.75, FW - 1.5, FH - 1.5, 20);
  g.stroke();
  return c;
}
/** desenha o cartão girado em torno do eixo vertical, com perspectiva, em fatias */
function girar(g, cv, cx, cy, w, h, ry) {
  const D = 1100, N = 60;
  const proj = (x, y) => {
    const k = D / (D - x * Math.sin(ry));
    return [cx + x * Math.cos(ry) * k, cy + y * k];
  };
  for (let i = 0; i < N; i++) {
    const x0 = -w / 2 + (w * i) / N, x1 = x0 + w / N;
    const [ax, ay] = proj(x0, -h / 2), [, by] = proj(x0, h / 2), [bx] = proj(x1, -h / 2);
    const sw = bx - ax;
    if (sw < 0.05) continue;
    g.drawImage(cv, (i * cv.width) / N, 0, cv.width / N, cv.height, ax, ay, sw + 0.6, by - ay);
  }
  const sombra = 0.4 * Math.abs(Math.sin(ry));
  if (sombra > 0.01) {
    const c = [proj(-w / 2, -h / 2), proj(w / 2, -h / 2), proj(w / 2, h / 2), proj(-w / 2, h / 2)];
    g.beginPath();
    c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fillStyle = `rgba(0,0,0,${sombra})`;
    g.fill();
  }
}
function cartaoVira(g, u, fila, P) {
  if (!faces) faces = PROD.map((pr) => [face(pr, false), face(pr, true)]);
  limpar(g);
  nav(g, 'Empório Grão');
  const viradas = [0.25, 0.95];
  PROD.forEach((pr, i) => {
    const cx = 255 + i * 340, cy = 282;
    const ang = Math.PI * ease.inOutCubic(prog(u, viradas[i] + 0.06, viradas[i] + 0.62));
    const ergue = 1 + 0.06 * Math.sin(ang);
    g.save();
    g.filter = 'blur(14px)';
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.beginPath();
    g.ellipse(cx, cy + 200, 130 * Math.max(0.3, Math.abs(Math.cos(ang))), 14, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const ry = ang <= Math.PI / 2 ? ang : ang - Math.PI;
    girar(g, faces[i][ang <= Math.PI / 2 ? 0 : 1], cx, cy, FW * ergue, FH * ergue, ry);
  });
  const tx = chaves(u, [[0, 255], [0.6, 255], [0.85, 595]], ease.inOutSine);
  const ty = chaves(u, [[0, 480], [0.2, 300]], ease.inOutSine);
  const [x, y] = P(tx, ty);
  toque(fila, x, y, { alfa: presenca(u, 1.4), pressao: aperto(u, 0.22) + aperto(u, 0.92) });
}

// 9 — zoom ao rolar
let mar = null;
function desenharMar() {
  const c = tela(CW, CH), g = c.getContext('2d');
  const hz = 300;
  const ceu = g.createLinearGradient(0, 0, 0, hz);
  ceu.addColorStop(0, '#141B26');
  ceu.addColorStop(1, '#4A2E20');
  g.fillStyle = ceu;
  g.fillRect(0, 0, CW, hz);
  const brilho = g.createRadialGradient(560, 270, 0, 560, 270, 230);
  brilho.addColorStop(0, 'rgba(255,150,80,0.5)');
  brilho.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = brilho;
  g.fillRect(0, 0, CW, hz);
  g.fillStyle = 'rgba(255,170,110,0.95)';
  g.beginPath();
  g.arc(560, 268, 44, 0, Math.PI * 2);
  g.fill();
  const agua = g.createLinearGradient(0, hz, 0, CH);
  agua.addColorStop(0, '#1C2330');
  agua.addColorStop(1, '#07090C');
  g.fillStyle = agua;
  g.fillRect(0, hz, CW, CH - hz);
  for (let y = hz + 5, k = 0; y < CH; y += 9, k++) {
    const f = (y - hz) / (CH - hz);
    const w = 130 * (1 - f) + 24;
    g.fillStyle = `rgba(255,170,110,${0.55 * (1 - f)})`;
    g.fillRect(560 - w / 2 + (hash(k) - 0.5) * 30, y, w, 2.5);
    g.fillStyle = 'rgba(223,227,231,0.05)';
    g.fillRect(0, y + 4, CW, 1);
  }
  g.fillStyle = '#241B14';
  g.beginPath();
  g.moveTo(0, CH);
  g.lineTo(0, 450);
  g.bezierCurveTo(260, 420, 520, 470, CW, 440);
  g.lineTo(CW, CH);
  g.closePath();
  g.fill();
  return c;
}
function zoomRolar(g, u, fila, P) {
  if (!mar) mar = desenharMar();
  limpar(g);
  const p = ease.inOutCubic(prog(u, 0.15, 1.45));
  g.save();
  g.globalAlpha = 1 - clamp(p * 1.5);
  texto(g, 'CASA PARA 8 PESSOAS', CW / 2, 100 - p * 80, MONO(14), COR.nevoa, { alinhar: 'center', esp: 3 });
  texto(g, 'Pé na areia.', CW / 2, 160 - p * 80, SAIRA(64), COR.aluminio, { alinhar: 'center' });
  g.restore();
  const x = lerp(250, 0, p), y = lerp(196, 0, p), w = lerp(350, CW, p), h = lerp(210, CH, p);
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, lerp(18, 0, p));
  g.clip();
  const z = Math.max(w / CW, h / CH) * lerp(1.3, 1, p);
  g.translate(x + w / 2, y + h / 2);
  g.scale(z, z);
  g.drawImage(mar, -CW / 2, -CH / 2);
  g.restore();
  nav(g, 'Refúgio Maré');
  const a = ease.outCubic(prog(u, 1.35, 1.75));
  if (a > 0) {
    g.save();
    g.globalAlpha = a;
    texto(g, 'Sua semana começa aqui.', 32, 470 + (1 - a) * 16, SAIRA(50), COR.aluminio);
    g.restore();
  }
  const [tx, ty] = P(790, lerp(440, 170, p));
  toque(fila, tx, ty, { alfa: presenca(u, 1.55, 0.04), pressao: presenca(u, 1.55, 0.04) });
}

// 10 — estrelas que acendem
function estrela(g, cx, cy, r) {
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r;
    const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
    k ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.closePath();
}
const AVAL = [
  ['“Perdi o medo', 'de dentista.”', 'CARLA M. · HÁ 2 SEMANAS'],
  ['“Explicaram tudo', 'antes de começar.”', 'RAFAEL T. · HÁ 1 MÊS'],
  ['“Meu filho saiu', 'sorrindo.”', 'JULIANA P. · HÁ 3 DIAS'],
];
function estrelas(g, u) {
  limpar(g);
  nav(g, 'Odonto Riso');
  const k = ease.inOutCubic(prog(u, 0.1, 1.0));
  texto(g, (4.9 * k).toFixed(1).replace('.', ','), 32, 196, MONO(100, 300), COR.aluminio);
  for (let i = 0; i < 5; i++) {
    const cx = 264 + i * 54, cy = 140;
    estrela(g, cx, cy, 22);
    g.strokeStyle = 'rgba(223,227,231,0.35)';
    g.lineWidth = 1.5;
    g.stroke();
    const f = clamp(4.9 * k - i);
    if (f > 0) {
      g.save();
      estrela(g, cx, cy, 22);
      g.clip();
      g.fillStyle = COR.laranja;
      g.fillRect(cx - 22, cy - 22, 44 * f, 44);
      g.restore();
    }
  }
  texto(g, `${Math.round(312 * k)} avaliações de pacientes`, 242, 196, TXT(19), COR.nevoa);
  AVAL.forEach(([l1, l2, quem], i) => {
    const e = ease.outCubic(prog(u, 0.75 + i * 0.2, 1.35 + i * 0.2));
    if (e <= 0) return;
    const x = 32 + i * 356 + (1 - e) * 420, y = 250;
    g.save();
    g.globalAlpha = e;
    g.beginPath();
    g.roundRect(x, y, 336, 200, 18);
    g.fillStyle = TITANIO;
    g.fill();
    g.strokeStyle = LINHA;
    g.lineWidth = 1.5;
    g.stroke();
    for (let s = 0; s < 5; s++) {
      estrela(g, x + 34 + s * 24, y + 38, 9);
      g.fillStyle = COR.aluminio;
      g.fill();
    }
    texto(g, l1, x + 24, y + 96, TXT(24, 500), COR.aluminio);
    texto(g, l2, x + 24, y + 128, TXT(24, 500), COR.aluminio);
    texto(g, quem, x + 24, y + 172, MONO(12), COR.nevoa, { esp: 2 });
    g.restore();
  });
}

// 11 — filtro que reorganiza
const PECAS = ['vestido', 'camisa', 'calca', 'vestido', 'camisa', 'vestido', 'calca', 'camisa'];
const NOME_PECA = { vestido: 'VESTIDO', camisa: 'CAMISA', calca: 'CALÇA' };
const ABAS = [['Tudo', null], ['Vestidos', 'vestido'], ['Camisas', 'camisa'], ['Calças', 'calca']];
const TW = (786 - 48) / 4, TH = 160;
const LAYOUTS = ABAS.map(([, cat]) => {
  let j = 0;
  return PECAS.map((c) => {
    if (cat && c !== cat) return null;
    const k = j++;
    return { x: 32 + (k % 4) * (TW + 16), y: 150 + Math.floor(k / 4) * (TH + 16) };
  });
});
let abas11 = null;
function filtro(g, u, fila, P) {
  limpar(g);
  nav(g, 'Ateliê Linho');
  const F = TXT(20, 500);
  if (!abas11) {
    let x = 32;
    abas11 = ABAS.map(([s]) => {
      const w = largura(g, s, F) + 36, a = { x, w };
      x += w + 8;
      return a;
    });
  }
  const passos = [[0.3, 0, 2], [1.05, 2, 1]];
  let de = 0, para = 0, e = 1;
  for (const [t0, a, b] of passos) if (u >= t0) { de = a; para = b; e = ease.inOutCubic(prog(u, t0 + 0.08, t0 + 0.58)); }
  const A = abas11[de], B = abas11[para];
  g.beginPath();
  g.roundRect(lerp(A.x, B.x, e), 84, lerp(A.w, B.w, e), 42, 21);
  g.fillStyle = COR.aluminio;
  g.fill();
  const ativa = e > 0.5 ? para : de;
  ABAS.forEach(([s], i) => texto(g, s, abas11[i].x + 18, 112, F, i === ativa ? '#0A0C0F' : COR.nevoa));
  const n = PECAS.filter((c) => !ABAS[ativa][1] || c === ABAS[ativa][1]).length;
  texto(g, `${n} peças`, 818, 112, MONO(15), COR.nevoa, { alinhar: 'right' });
  PECAS.forEach((c, i) => {
    const la = LAYOUTS[de][i], lb = LAYOUTS[para][i];
    if (!la && !lb) return;
    const pa = la ?? lb, pb = lb ?? la;
    // quem sai some na primeira metade; quem entra aparece na segunda; quem fica só muda de lugar
    const alfa = la && lb ? 1 : la ? 1 - clamp(e / 0.45) : clamp((e - 0.55) / 0.45);
    const sc = la && lb ? 1 : lerp(0.85, 1, alfa);
    if (alfa <= 0.01) return;
    g.save();
    g.globalAlpha = alfa;
    g.translate(lerp(pa.x, pb.x, e) + TW / 2, lerp(pa.y, pb.y, e) + TH / 2);
    g.scale(sc, sc);
    foto(g, -TW / 2, -TH / 2, TW, TH, 90 + i, { raio: 12 });
    texto(g, NOME_PECA[c], -TW / 2 + 12, TH / 2 - 12, MONO(11, 500), COR.aluminio, { esp: 2 });
    g.restore();
  });
  const meioAba = (i) => abas11[i].x + abas11[i].w / 2;
  const tx = chaves(u, [[0, meioAba(2) + 40], [0.22, meioAba(2)], [0.75, meioAba(2)], [0.98, meioAba(1)]], ease.inOutSine);
  const ty = chaves(u, [[0, 330], [0.22, 105]], ease.inOutSine);
  const [x, y] = P(tx, ty);
  toque(fila, x, y, { alfa: presenca(u, 1.6), pressao: aperto(u, 0.26) + aperto(u, 1.0) });
}

// 12 — logo de partículas
let alvo = null;
function prepararAlvo() {
  const c = tela(CW, CH), g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#fff';
  g.font = EXP(112, 500);
  g.textAlign = 'center';
  g.letterSpacing = '4px';
  g.fillText('FAÍSCA', CW / 2, 300);
  const d = g.getImageData(0, 0, CW, CH).data;
  alvo = [];
  for (let y = 0; y < CH; y += 5) for (let x = 0; x < CW; x += 5) if (d[(y * CW + x) * 4 + 3] > 128) alvo.push([x, y]);
}
function particulas(g, u) {
  if (!alvo) prepararAlvo();
  limpar(g, '#07080A');
  alvo.forEach(([tx, ty], i) => {
    const sx = (hash(i * 3 + 1) * 1.2 - 0.1) * CW, sy = (hash(i * 3 + 2) * 1.2 - 0.1) * CH;
    const atraso = hash(i * 7 + 5) * 0.4;
    const e = ease.inOutCubic(prog(u, 0.1 + atraso, 0.95 + atraso));
    const giro = Math.sin(e * Math.PI) * 60 * (hash(i * 11) - 0.5) * 2;
    const deriva = (1 - e) * 8;
    const x = lerp(sx, tx, e) + giro + Math.sin(u * 2.2 + i) * deriva;
    const y = lerp(sy, ty, e) - giro * 0.5 + Math.cos(u * 1.9 + i * 1.3) * deriva;
    const b = e >= 1 ? 0.8 + 0.2 * Math.sin(u * 9 + i * 0.7) : lerp(0.4, 1, e);
    g.fillStyle = hash(i * 13 + 3) < 0.1 ? `rgba(255,107,26,${b})` : `rgba(223,227,231,${b})`;
    g.fillRect(x - 1.7, y - 1.7, 3.4, 3.4);
  });
  nav(g, 'Estúdio Faísca');
  const a = ease.outCubic(prog(u, 1.3, 1.65));
  if (a > 0) {
    g.save();
    g.globalAlpha = a;
    texto(g, 'Marcas que acendem.', CW / 2, 372 + (1 - a) * 12, TXT(24), COR.nevoa, { alinhar: 'center' });
    g.restore();
  }
}

const ITENS = [
  { nome: 'Fundo que muda de cor', site: 'sorveteriapolar.com.br', fx: fundoCor },
  { nome: 'Foto que segue o mouse', site: 'studiotraco.com.br', fx: seguir },
  { nome: 'Seção que fica presa', site: 'pilateseixo.com.br', fx: presa },
  { nome: 'Ícone que se desenha', site: 'voltinstalacoes.com.br', fx: icones },
  { nome: 'Contagem regressiva', site: 'casanonna.com.br', fx: contagem },
  { nome: 'Mapa de entrega', site: 'fornovelho.com.br', fx: mapaEntrega },
  { nome: 'Botão que confirma', site: 'studiobela.com.br', fx: confirma },
  { nome: 'Cartão que vira', site: 'emporiograo.com.br', fx: cartaoVira },
  { nome: 'Zoom ao rolar', site: 'refugiomare.com.br', fx: zoomRolar },
  { nome: 'Estrelas que acendem', site: 'odontoriso.com.br', fx: estrelas },
  { nome: 'Filtro que reorganiza', site: 'atelielinho.com.br', fx: filtro },
  { nome: 'Logo de partículas', site: 'estudiofaisca.com.br', fx: particulas, borrao: [0.1, 1.4] },
];

export default catalogo({ id: 'i17', nome: 'i17-12-animacoes-de-site-parte-3', parte: 3, itens: ITENS, semente: 17, palavra: 'EFEITOS', capa: 7 * 2 + 0.64 });

export { ITENS };
