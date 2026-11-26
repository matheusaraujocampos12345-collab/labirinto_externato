// "Efeito do dia": um Reels curto (8,1 s, em loop) com UM efeito dos vídeos "12 animações de site"
// (partes 1, 2 e 3 = 36 efeitos). É o terceiro post do dia (9h) da rotina: reaproveita o que já existe.
// Cada arquivo em cenas/efeito-do-dia/eNN.js só chama efeitoDoDia(NN).
// Gerar: node instagram/reels/motor/render.mjs instagram/reels/cenas/efeito-do-dia/e03.js --saida instagram/reels/efeito-do-dia
import { ease, prog } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, dedo, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';
import { JAN, BARRA, CH, TITANIO, MONO, texto } from './catalogo.js';
import { ITENS as P1 } from './i15.js';
import { ITENS as P2 } from './i16.js';
import { ITENS as P3 } from './i17.js';

export const TODOS = [
  ...P1.map((it, i) => ({ ...it, parte: 1, n: i + 1 })),
  ...P2.map((it, i) => ({ ...it, parte: 2, n: i + 1 })),
  ...P3.map((it, i) => ({ ...it, parte: 3, n: i + 1 })),
];
const CICLO = 2.7, VOLTAS = 3, DUR = CICLO * VOLTAS;
const JY = 640; // a janela desce um pouco em relação ao catálogo: o título pode ter duas linhas

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function efeitoDoDia(num) {
  const it = TODOS[num - 1];
  if (!it) throw new Error(`efeito ${num} não existe (1 a ${TODOS.length})`);
  const nn = String(num).padStart(2, '0');

  function janela(ctx, u) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(JAN.x, JY, JAN.w, JAN.h, JAN.r);
    ctx.fillStyle = '#161A1F';
    ctx.fill();
    ctx.strokeStyle = 'rgba(223,227,231,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = TITANIO;
    ctx.fillRect(JAN.x, JY, JAN.w, BARRA);
    ctx.fillStyle = 'rgba(223,227,231,0.25)';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(JAN.x + 34 + k * 22, JY + 25, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(10,12,15,0.6)';
    ctx.beginPath();
    ctx.roundRect(JAN.x + 130, JY + 10, 520, 30, 15);
    ctx.fill();
    texto(ctx, it.site, JAN.x + 390, JY + 31, MONO(17), COR.nevoa, { alinhar: 'center' });
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(JAN.x, JY + BARRA, JAN.w, CH, [0, 0, JAN.r, JAN.r]);
    ctx.clip();
    ctx.translate(JAN.x, JY + BARRA);
    const fila = [];
    it.fx(ctx, u, fila, (x, y) => [JAN.x + x, JY + BARRA + y]);
    ctx.restore();
    for (const [x, y, op] of fila) if (op.alfa > 0.01) dedo(ctx, x, y, op);
    // na volta do loop, um escurecimento rápido esconde o corte
    const escuro = Math.max(prog(u, CICLO - 0.18, CICLO), 1 - prog(u, 0, 0.12));
    if (escuro > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(JAN.x, JY + BARRA, JAN.w, CH, [0, 0, JAN.r, JAN.r]);
      ctx.fillStyle = `rgba(14,17,21,${0.85 * escuro})`;
      ctx.fill();
      ctx.restore();
    }
  }

  function quadro(ctx, t) {
    const u = ((t % CICLO) + CICLO) % CICLO;
    fundo(ctx);
    riscos(ctx, t, DUR, { alfa: 0.6, semente: 40 + num });
    rotulo(ctx, t, { texto: `Efeito do dia · ${nn}`, x: 90, y: 292, entra: -1, entrada: 'corte' });
    const caixa = bloco(ctx, t, { texto: it.nome + '.', x: 88, y: 338, tamanho: 84, entra: -1, entrada: 'corte', largura: 852 });
    bloco(ctx, t, { estilo: 'texto', texto: 'Quer o prompt? Comenta PROMPT.', x: 90, y: Math.max(462, caixa.base + 18), tamanho: 40, peso: 500, destaque: 'PROMPT', entra: -1, entrada: 'corte' });
    janela(ctx, u);
    // progresso do loop e de onde o efeito veio
    ctx.fillStyle = 'rgba(223,227,231,0.12)';
    ctx.fillRect(JAN.x, JY + JAN.h + 26, JAN.w, 3);
    ctx.fillStyle = COR.aluminio;
    ctx.fillRect(JAN.x, JY + JAN.h + 26, JAN.w * ease.linear(Math.min(1, u / 2)), 3);
    bloco(ctx, t, { estilo: 'rotulo', caixa: 'normal', texto: `do vídeo "12 animações de site" · parte ${it.parte}`, x: 90, y: JY + JAN.h + 52, tamanho: 22, espaco: 0.04, entra: -1, entrada: 'corte' });
    assinatura(ctx, t, { entra: -1, entrada: 'corte' });
    vinheta(ctx, 0.3);
  }

  return {
    id: `e${nn}`,
    nome: `e${nn}-efeito-do-dia-${slug(it.nome)}`,
    duracao: DUR,
    fps: 30,
    obturador: 0.5,
    subquadros: (t) => {
      if (!it.borrao) return 1;
      const u = ((t % CICLO) + CICLO) % CICLO, [a, b] = Array.isArray(it.borrao) ? it.borrao : [0, 1.7];
      return u >= a && u < b ? 4 : 1;
    },
    desenhar(ctx, t) {
      quadro(ctx, t);
    },
    capa(ctx) {
      quadro(ctx, 1.0);
    },
  };
}
