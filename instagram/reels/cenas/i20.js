// i20 — Antes e depois · conceito: Doceria Laço (18 s). Formato "antes e depois de site" (aprovado em 26/11).
// O "antes" é um modelo pronto genérico (claro, cheio de texto, "Clique aqui"); o dedo arrasta uma alça e revela o
// "depois" no mesmo celular. No fim, os dois lado a lado e o gancho "Comenta SITE". Negócio fictício.
import { clamp, lerp, prog, ease } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';
import { MONO, texto } from './catalogo.js';
import { TELA, celular, doceria, doceriaAntiga, pilula, arrastar, etiqueta } from './celular.js';

const DUR = 18, VIRA0 = 5.3, VIRA1 = 6.7, LADO = 13.6;
const CY = 1018, ESC = 1.05;
const ROL_ANTES = [[0.7, 1.7, 0, 260], [2.1, 3.0, 260, 490], [3.6, 4.6, 490, 0]];
const ROL_DEPOIS = [[7.7, 8.9, 0, 420], [9.5, 10.7, 420, 820], [11.5, 12.8, 820, 0]];
const BOM = { titulo: ['Encomendas de', 'Natal abertas.'], botao: 'laranja', revelar: true };

function telaPrincipal(g, fila, t) {
  if (t < VIRA0) {
    const { s, dedo } = arrastar(t, ROL_ANTES);
    doceriaAntiga(g, s);
    if (dedo.alfa > 0) fila.push([dedo.x, dedo.y, { alfa: dedo.alfa, pressao: dedo.pressao }]);
    return;
  }
  if (t < VIRA1) {
    // a alça corre da direita para a esquerda e revela o depois
    const xs = lerp(TELA.w - 6, 0, ease.inOutCubic(prog(t, VIRA0 + 0.25, VIRA1)));
    doceriaAntiga(g, 0);
    g.save();
    g.beginPath();
    g.rect(xs, 0, TELA.w - xs, TELA.h);
    g.clip();
    doceria(g, 0, BOM);
    pilula(g);
    g.restore();
    g.fillStyle = COR.aluminio;
    g.fillRect(xs - 1.5, 0, 3, TELA.h);
    const cy = TELA.h / 2;
    g.beginPath();
    g.arc(xs, cy, 24, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#0A0C0F';
    for (const d of [-1, 1]) {
      g.beginPath();
      g.moveTo(xs + d * 15, cy);
      g.lineTo(xs + d * 6, cy - 7);
      g.lineTo(xs + d * 6, cy + 7);
      g.closePath();
      g.fill();
    }
    const a = ease.outCubic(prog(t, VIRA0, VIRA0 + 0.2)) * (1 - ease.inCubic(prog(t, VIRA1 - 0.05, VIRA1 + 0.2)));
    fila.push([Math.max(xs, 16), cy + 4, { alfa: a, pressao: prog(t, VIRA0 + 0.1, VIRA0 + 0.25) }]);
    return;
  }
  const { s, dedo } = arrastar(t, ROL_DEPOIS);
  doceria(g, s, BOM);
  pilula(g);
  if (dedo.alfa > 0) fila.push([dedo.x, dedo.y, { alfa: dedo.alfa, pressao: dedo.pressao }]);
}

function quadro(ctx, t) {
  fundo(ctx);
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 20 });
  rotulo(ctx, t, { texto: 'Antes e depois · conceito', x: 90, y: 292, entra: -1, entrada: 'corte' });
  bloco(ctx, t, { texto: 'Mesmo negócio.', x: 88, y: 338, tamanho: 84, entra: -1, sai: VIRA0 + 0.1, entrada: 'corte', durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Outra primeira\nimpressão.', x: 88, y: 338, tamanho: 84, entra: VIRA0 + 0.4, sai: LADO - 0.3, durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Quer o seu assim?', x: 88, y: 338, tamanho: 84, entra: LADO + 0.1 });
  const lado = ease.inOutCubic(prog(t, LADO, LADO + 0.9));
  if (t < LADO) {
    const depois = t >= (VIRA0 + VIRA1) / 2;
    const w = etiqueta(ctx, 90, 552, depois ? 'DEPOIS' : 'ANTES', { cor: depois ? COR.aluminio : 'rgba(223,227,231,0.45)' });
    texto(ctx, depois ? 'FEITO SOB MEDIDA' : 'MODELO PRONTO', 90 + w + 20, 583, MONO(22), COR.nevoa, { esp: 2 });
  } else {
    bloco(ctx, t, { estilo: 'texto', texto: 'Comenta SITE que eu te chamo no direct.', x: 90, y: 446, tamanho: 40, peso: 500, destaque: 'SITE', entra: LADO + 0.5, entrada: 'fade' });
  }
  // o celular principal encolhe para a direita; o "antes" entra à esquerda
  const esc = lerp(ESC, 0.7, lado);
  if (lado > 0) {
    celular(ctx, lerp(540, 300, lado), lerp(CY, 930, lado), (g) => doceriaAntiga(g, 0), { escala: esc, alfa: ease.outCubic(prog(t, LADO + 0.2, LADO + 0.8)) });
    const a = ease.outCubic(prog(t, LADO + 0.6, LADO + 1.0));
    ctx.save();
    ctx.globalAlpha = a;
    etiqueta(ctx, 300 - 62, 1232, 'ANTES', { cor: 'rgba(223,227,231,0.45)' });
    etiqueta(ctx, 780 - 72, 1232, 'DEPOIS', { cor: COR.aluminio });
    ctx.restore();
  }
  celular(ctx, lerp(540, 780, lado), lerp(CY, 930, lado), (g, fila) => telaPrincipal(g, fila, t), { escala: esc });
  assinatura(ctx, t, { entra: LADO + 1.2 });
  vinheta(ctx, 0.3);
}

export default {
  id: 'i20',
  nome: 'i20-antes-e-depois-doceria',
  duracao: DUR,
  fps: 30,
  desenhar(ctx, t) {
    quadro(ctx, t);
  },
  capa(ctx) {
    quadro(ctx, 16.5);
  },
};
