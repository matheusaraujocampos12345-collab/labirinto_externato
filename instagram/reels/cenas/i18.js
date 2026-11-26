// i18 — Errado × certo · 01: o botão do WhatsApp (20 s).
// Formato "certo × errado em 30 s" (aprovado em 26/11). Mesmo site fictício (Doceria Laço) nas duas versões:
// no errado, o contato está escondido no rodapé e o dedo procura; no certo, uma pílula fixa abre a conversa
// com a mensagem pronta. Sem áudio: o dono põe a música no app.
import { clamp, lerp, prog, ease } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, vinheta } from '../motor/marca.js';
import { riscos } from './comum.js';
import { TXT, MONO, TITANIO, texto } from './catalogo.js';
import { TELA, PAGINA_H, celular, doceria, pilula, barraStatus, balao, arrastar, etiqueta } from './celular.js';

const DUR = 20, VIRA = 9, FIM = 17.2;
const CX = 540, CY = 1018, ESC = 1.05;
const MAX = PAGINA_H - TELA.h;

// errado: o dedo rola, volta um pouco, rola de novo e só acha o contato no rodapé
const ROLAGEM_ERRADO = [[1.0, 1.8, 0, 380], [2.2, 2.9, 380, 720], [3.2, 3.7, 720, 600], [4.0, 4.8, 600, 960], [5.1, 6.0, 960, MAX]];
const ACHOU = 7.0;
// certo: rola um pouco (a pílula fica parada) e toca nela
const ROLAGEM_CERTO = [[9.7, 10.6, 0, 420]];
const TOQUE = 11.6, ENVIA = 13.5;

function telaErrado(g, fila, t) {
  const { s, dedo } = arrastar(t, ROLAGEM_ERRADO);
  const c = ease.outCubic(prog(t, ACHOU, ACHOU + 0.3));
  doceria(g, s, { contato: c });
  if (dedo.alfa > 0) fila.push([dedo.x, dedo.y, { alfa: dedo.alfa, pressao: dedo.pressao }]);
  // o dedo vai até o contato e toca
  const ytel = 1930 - MAX;
  const a = ease.outCubic(prog(t, 6.3, 6.6)) * (1 - ease.inCubic(prog(t, 8.2, 8.6)));
  if (a > 0) {
    const k = ease.inOutSine(prog(t, 6.3, 6.85));
    fila.push([lerp(290, 110, k), lerp(560, ytel, k), { alfa: a, pressao: Math.sin(Math.PI * prog(t, ACHOU - 0.1, ACHOU + 0.2)) }]);
  }
}

function chat(g, t, fila) {
  const W = TELA.w;
  g.fillStyle = '#0C0F13';
  g.fillRect(0, 0, W, TELA.h);
  g.fillStyle = TITANIO;
  g.fillRect(0, 0, W, 104);
  barraStatus(g);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 2.4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(30, 62);
  g.lineTo(20, 72);
  g.lineTo(30, 82);
  g.stroke();
  g.fillStyle = '#3A2A20';
  g.beginPath();
  g.arc(66, 72, 20, 0, Math.PI * 2);
  g.fill();
  texto(g, 'DL', 66, 77, MONO(13, 500), COR.aluminio, { alinhar: 'center' });
  texto(g, 'Doceria Laço', 98, 68, TXT(17, 600), COR.aluminio);
  texto(g, 'online', 98, 88, TXT(13), COR.nevoa);
  const enviada = t >= ENVIA + 0.08;
  // caixa de texto com a mensagem pronta
  g.beginPath();
  g.roundRect(12, 672, 280, 70, 24);
  g.fillStyle = '#1F252C';
  g.fill();
  if (!enviada) {
    texto(g, 'Oi! Quero encomendar um', 30, 701, TXT(15), COR.aluminio);
    texto(g, 'bolo para sábado.', 30, 722, TXT(15), COR.aluminio);
  } else texto(g, 'Mensagem', 30, 712, TXT(15), '#5A626C');
  g.save();
  g.translate(324, 707);
  g.scale(1 - 0.08 * Math.sin(Math.PI * prog(t, ENVIA - 0.12, ENVIA + 0.16)), 1 - 0.08 * Math.sin(Math.PI * prog(t, ENVIA - 0.12, ENVIA + 0.16)));
  g.fillStyle = COR.aluminio;
  g.beginPath();
  g.arc(0, 0, 24, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0A0C0F';
  g.beginPath();
  g.moveTo(-8, -9);
  g.lineTo(10, 0);
  g.lineTo(-8, 9);
  g.lineTo(-4, 0);
  g.closePath();
  g.fill();
  g.restore();
  // balões
  if (enviada) {
    const k = ease.outCubic(prog(t, ENVIA + 0.08, ENVIA + 0.4));
    g.save();
    g.globalAlpha *= k;
    g.translate(0, (1 - k) * 30);
    g.beginPath();
    g.roundRect(W - 16 - 236, 520, 236, 78, [18, 18, 4, 18]);
    g.fillStyle = '#2A323C';
    g.fill();
    texto(g, 'Oi! Quero encomendar um', W - 236, 550, TXT(15), COR.aluminio);
    texto(g, 'bolo para sábado.', W - 236, 571, TXT(15), COR.aluminio);
    texto(g, '10:31', W - 54, 590, MONO(10), COR.nevoa, { alinhar: 'right' });
    g.strokeStyle = COR.nevoa;
    g.lineWidth = 1.5;
    for (const dx of [0, 5]) {
      g.beginPath();
      g.moveTo(W - 48 + dx, 586);
      g.lineTo(W - 45 + dx, 589);
      g.lineTo(W - 39 + dx, 582);
      g.stroke();
    }
    g.restore();
  }
  const digitando = t >= ENVIA + 0.9 && t < ENVIA + 2.0;
  if (digitando) {
    g.beginPath();
    g.roundRect(16, 616, 70, 40, [18, 18, 18, 4]);
    g.fillStyle = TITANIO;
    g.fill();
    for (let i = 0; i < 3; i++) {
      g.fillStyle = `rgba(223,227,231,${0.35 + 0.5 * Math.max(0, Math.sin(t * 9 - i * 0.9))})`;
      g.beginPath();
      g.arc(36 + i * 15, 636, 4, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (t >= ENVIA + 2.0) {
    const k = ease.outCubic(prog(t, ENVIA + 2.0, ENVIA + 2.3));
    g.save();
    g.globalAlpha *= k;
    g.translate(0, (1 - k) * 20);
    g.beginPath();
    g.roundRect(16, 616, 218, 46, [18, 18, 18, 4]);
    g.fillStyle = TITANIO;
    g.fill();
    texto(g, 'Oi! Temos sim. Qual sabor?', 32, 645, TXT(15), COR.aluminio);
    g.restore();
  }
  const a = ease.outCubic(prog(t, ENVIA - 0.45, ENVIA - 0.2)) * (1 - ease.inCubic(prog(t, ENVIA + 0.3, ENVIA + 0.55)));
  if (a > 0) fila.push([324, 707 + (1 - ease.outCubic(prog(t, ENVIA - 0.45, ENVIA - 0.15))) * 40, { alfa: a, pressao: Math.sin(Math.PI * prog(t, ENVIA - 0.12, ENVIA + 0.16)) }]);
}

function telaCerto(g, fila, t) {
  const troca = ease.inOutCubic(prog(t, TOQUE + 0.15, TOQUE + 0.6));
  const { s, dedo } = arrastar(t, ROLAGEM_CERTO);
  const pr = Math.sin(Math.PI * prog(t, TOQUE - 0.12, TOQUE + 0.16));
  if (troca < 1) {
    g.save();
    g.translate(-troca * TELA.w * 0.3, 0);
    doceria(g, s);
    pilula(g, { pressao: pr });
    g.restore();
  }
  if (troca > 0) {
    g.save();
    g.translate((1 - troca) * TELA.w, 0);
    chat(g, t, fila);
    g.restore();
  }
  if (dedo.alfa > 0) fila.push([dedo.x, dedo.y, { alfa: dedo.alfa, pressao: dedo.pressao }]);
  // o dedo vai até a pílula
  const a = ease.outCubic(prog(t, 10.9, 11.2)) * (1 - ease.inCubic(prog(t, TOQUE + 0.25, TOQUE + 0.5)));
  if (a > 0) {
    const k = ease.inOutSine(prog(t, 10.9, TOQUE - 0.1));
    fila.push([lerp(290, 250, k), lerp(540, TELA.h - 57, k), { alfa: a, pressao: pr }]);
  }
}

function quadro(ctx, t) {
  fundo(ctx);
  riscos(ctx, t, DUR, { alfa: 0.6, semente: 18 });
  rotulo(ctx, t, { texto: 'Errado × certo · 01', x: 90, y: 292, entra: -1, entrada: 'corte' });
  const certo = t >= VIRA;
  // títulos
  bloco(ctx, t, { texto: 'Onde fica o botão\ndo WhatsApp?', x: 88, y: 338, tamanho: 80, entra: -1, sai: VIRA - 0.35, entrada: 'corte', durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Fixo na tela.\nMensagem pronta.', x: 88, y: 338, tamanho: 80, entra: VIRA, sai: FIM - 0.3, durSaida: 0.3 });
  bloco(ctx, t, { texto: 'Confere no\nseu site hoje.', x: 88, y: 338, tamanho: 80, entra: FIM });
  // etiqueta e contador
  if (!certo) {
    const w = etiqueta(ctx, 90, 552, 'ERRADO');
    const seg = clamp(t - 0.8, 0, ACHOU - 0.8);
    const txt = t < ACHOU ? `PROCURANDO HÁ ${seg.toFixed(1).replace('.', ',')} S` : `${(ACHOU - 0.8).toFixed(1).replace('.', ',')} S PARA ACHAR O CONTATO`;
    if (t >= 0.8) texto(ctx, txt, 90 + w + 20, 583, MONO(22), COR.nevoa, { esp: 2 });
  } else if (t < FIM) {
    const w = etiqueta(ctx, 90, 552, 'CERTO', { cheia: true });
    if (t >= TOQUE) texto(ctx, t < ENVIA ? '1 TOQUE. MENSAGEM PRONTA.' : 'PEDIDO FEITO.', 90 + w + 20, 583, MONO(22), COR.aluminio, { esp: 2 });
  } else {
    bloco(ctx, t, { estilo: 'texto', texto: 'Salva este vídeo para não esquecer.', x: 90, y: 548, tamanho: 36, cor: COR.nevoa, entra: FIM + 0.3, entrada: 'fade' });
  }
  const alfaCel = t < FIM ? 1 : 1 - 0.55 * ease.inOutCubic(prog(t, FIM, FIM + 0.6));
  celular(ctx, CX, CY, (g, fila) => (certo ? telaCerto(g, fila, t) : telaErrado(g, fila, t)), { alfa: alfaCel, escala: ESC });
  // corte seco na virada (um quadro claro, sem flash forte)
  if (t >= VIRA && t < VIRA + 0.12) {
    ctx.fillStyle = `rgba(10,12,15,${1 - prog(t, VIRA, VIRA + 0.12)})`;
    ctx.fillRect(0, 600, 1080, 840);
  }
  assinatura(ctx, t, { entra: FIM + 0.6 });
  vinheta(ctx, 0.3);
}

export default {
  id: 'i18',
  nome: 'i18-errado-certo-botao-whatsapp',
  duracao: DUR,
  fps: 30,
  desenhar(ctx, t) {
    quadro(ctx, t);
  },
  capa(ctx) {
    quadro(ctx, 3.5);
  },
};
