// i03 — Feito para padaria (episódio 1) (17,5 s). Padaria Quatro Horas, "a padaria que acorda às 4h".
// Base: a rolagem do site-conceito (instagram/sites-conceito/padaria/captura/rolagem-bruta.mp4),
// extraída em .quadros/padaria-rolagem/ (o gerar-todos.sh faz isso). O vídeo do forno dentro do site
// é do Coverr (licença permite editar e usar comercialmente; aqui ele aparece editado, dentro do Reels).
// Regra desta peça: nenhum texto nosso cobre o pão saindo do forno.
//   0–2 s      primeira tela parada, com um avanço lento de câmera + gancho
//   2–9,5 s    a rolagem: o forno abre, o pão chega na luz, PÃO QUENTE acende, painel da fornada
//   9,5–13 s   o quadro de letras do cardápio se monta · "Padaria fictícia. Site de verdade." (no alto, no escuro)
//   13–16 s    o mapa do bairro de madrugada · "Qual negócio eu faço na próxima?" · "Vota no domingo."
//   16–17,5 s  volta à primeira tela parada; o último quadro é o primeiro (loop)
import { W, H, clamp, prog, ease, carregarImagem } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, faixa } from '../motor/marca.js';

const PASTA = '/instagram/reels/.quadros/padaria-rolagem';
const FORNO = '#05020A'; // o preto de dentro do forno (paleta do site)
const NEON = '#E5AC68'; // "Luz do forno": o tubo do letreiro
const LINHA_NEON = 'rgba(229,172,104,0.35)';
const DUR = 17.5;

// trechos: [início no Reels, fim no Reels, início na rolagem, segura no último quadro?]
const TRECHOS = [
  [0, 2, null], // primeira tela parada (quadro 0)
  [2, 9.5, 1.3], // a rolagem começa em 1,3 s na gravação
  [9.5, 13, 10.0], // cardápio
  [13, 16, 18.0], // mapa (os últimos 2 s da gravação, depois segura)
  [16, DUR, null], // primeira tela parada de novo
];

function quadroDaRolagem(t) {
  const [a, , ini] = TRECHOS.find(([a, b]) => t >= a && t < b) || TRECHOS[TRECHOS.length - 1];
  if (ini === null) return 0;
  return Math.min(599, Math.round((ini + (t - a)) * 30));
}

// avanço lento de câmera na primeira tela parada; volta a 1 suave no fim (loop sem emenda)
function zoom(t) {
  const Z = 0.04;
  if (t < 2) return 1 + Z * ease.inOutSine(t / 2);
  if (t < 3) return 1 + Z * (1 - ease.inOutSine(t - 2));
  if (t >= 16) return 1 + Z * (1 - ease.inOutSine((t - 16) / (DUR - 16)));
  return 1;
}

/** escurece suave uma faixa da tela (sem borda dura), para o texto ler sem tampar nada */
function veu(ctx, y0, y1, alfa = 0.78) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(5,2,10,0)');
  g.addColorStop(0.3, `rgba(5,2,10,${alfa})`);
  g.addColorStop(0.7, `rgba(5,2,10,${alfa})`);
  g.addColorStop(1, 'rgba(5,2,10,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, y1 - y0);
}

// o gancho fica na boca escura do forno, entre o texto do site e o painel da fornada
function gancho(ctx, t, entra, sai, corte) {
  const a = corte ? 1 : ease.outCubic(prog(t, entra, entra + 0.4));
  const s = t >= sai ? 1 - ease.inCubic(prog(t, sai, sai + 0.45)) : 1;
  ctx.save();
  ctx.globalAlpha = a * s;
  veu(ctx, 1230, 1520);
  ctx.restore();
  rotulo(ctx, t, { texto: 'Feito para · episódio 1', x: 90, y: 1284, tamanho: 22, cor: NEON, entra, sai, entrada: corte ? 'corte' : 'fade', saida: 'fade' });
  bloco(ctx, t, { texto: 'Esse site é de uma padaria.\nNinguém acredita.', x: 90, y: 1318, tamanho: 52, entrelinha: 1.14, entra, sai, entrada: corte ? 'corte' : 'mascara', durEntrada: 0.4, atraso: 0.06 });
}

export default {
  id: 'i03',
  nome: 'i03-feito-para-padaria',
  duracao: DUR,
  fps: 30,

  async desenhar(ctx, t) {
    fundo(ctx, FORNO);
    const img = await carregarImagem(`${PASTA}/q_${String(quadroDaRolagem(t)).padStart(5, '0')}.png`);
    const z = zoom(t);
    ctx.save();
    ctx.translate(W / 2, H * 0.45);
    ctx.scale(z, z);
    ctx.drawImage(img, -W / 2, -H * 0.45, W, H);
    ctx.restore();

    if (t < 2.6) gancho(ctx, t, -1, 2.0, true);
    if (t >= 9.5 && t < 13) {
      // no alto, sobre o escuro vazio acima do quadro de letras
      bloco(ctx, t, { texto: 'Padaria fictícia.\nSite de verdade.', x: 90, y: 270, tamanho: 60, entrelinha: 1.14, entra: 10.0, sai: 12.3, durEntrada: 0.5 }); // sai antes de o cardápio subir
    }
    if (t >= 13 && t < 16) {
      faixa(ctx, t, { y: 232, h: 500, entra: 13.0, sai: 15.9, saida: 'corte', cor: 'rgba(5,2,10,0.97)', linha: LINHA_NEON });
      rotulo(ctx, t, { texto: 'Episódio 2', x: 90, y: 276, tamanho: 22, cor: NEON, entra: 13.1, sai: 15.9, saida: 'corte' });
      bloco(ctx, t, { texto: 'Qual negócio eu faço na próxima?', x: 90, y: 318, tamanho: 58, largura: 820, entrelinha: 1.14, entra: 13.1, sai: 15.9, saida: 'corte' });
      bloco(ctx, t, { estilo: 'texto', texto: 'Vota no próximo nicho no domingo.', x: 90, y: 488, tamanho: 36, cor: COR.aluminio, entra: 13.6, sai: 15.9, entrada: 'fade', saida: 'corte' });
      assinatura(ctx, t, { y: 566, entra: 14.0, sai: 15.9, saida: 'corte' });
    }
    if (t >= 16) gancho(ctx, t, 16.0, 1e9, false);
  },

  async capa(ctx) {
    fundo(ctx, FORNO);
    // o pão na luz, com a plaquinha de preço; o gancho fica no escuro de cima, sem tampar o pão
    const img = await carregarImagem(`${PASTA}/q_00165.png`);
    ctx.drawImage(img, 0, 0, W, H);
    veu(ctx, 330, 1000, 0.85);
    rotulo(ctx, 0, { texto: 'Feito para · episódio 1', alinhar: 'center', x: 540, y: 520, cor: NEON, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Esse site é de uma padaria.\nNinguém acredita.', alinhar: 'center', x: 540, y: 574, tamanho: 66, largura: 850, entrelinha: 1.16, entrada: 'corte' });
  },
};
