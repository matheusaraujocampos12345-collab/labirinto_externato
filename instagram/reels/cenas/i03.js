// i03 — Feito para padaria (episódio 1) (17 s).
// Base: a rolagem do site-conceito Casca & Miolo (instagram/sites-conceito/padaria/captura/rolagem-bruta.mp4),
// extraída em .quadros/padaria-rolagem/ (o gerar-todos.sh faz isso).
// Os textos da MACH entram numa faixa na cor do forno da padaria, para não brigar com o site.
//   0–10 s    primeira tela (pão, vapor), a rolagem começa, o balcão se monta e a fornada "12 minutos"
//   10–13 s   o corte do pão e as cores: "Padaria fictícia. Site de verdade."
//   13–16 s   o mapa: "Qual negócio eu faço na próxima?" · "Vota no próximo nicho no domingo."
//   16–17 s   volta à primeira tela; o último quadro emenda no primeiro (loop)
import { W, H, carregarImagem } from '../motor/tempo.js';
import { COR, fundo, bloco, rotulo, assinatura, faixa } from '../motor/marca.js';

const PASTA = '/instagram/reels/.quadros/padaria-rolagem';
const FORNO = 'rgba(31,10,3,0.94)'; // "Forno", o escuro da paleta da padaria
const LINHA = 'rgba(242,233,216,0.16)';
const Y = 980; // a faixa fica na boca do forno: o pão continua à mostra

// trechos da rolagem: [início no Reels, fim no Reels, início na rolagem] (segundos)
const TRECHOS = [
  [0, 10, 1.0], // primeira tela → balcão → fornada
  [10, 13, 13.0], // corte do pão e paleta
  [13, 16, 16.5], // mapa
  [16, 17, 0.0], // primeira tela de novo: termina onde o Reels começa
];

function quadroDaRolagem(t) {
  const [a, , ini] = TRECHOS.find(([a, b]) => t >= a && t < b) || TRECHOS[TRECHOS.length - 1];
  return Math.min(584, Math.round((ini + (t - a)) * 30));
}

function gancho(ctx, t, entra, sai, corte) {
  faixa(ctx, t, { y: Y, h: 252, entra, sai, cor: FORNO, linha: LINHA, entrada: corte ? 'corte' : 'abre' });
  const e = corte ? entra : entra + 0.12;
  rotulo(ctx, t, { texto: 'Feito para · episódio 1', x: 90, y: Y + 34, tamanho: 22, entra: e, sai, entrada: corte ? 'corte' : 'fade', saida: 'fade' });
  bloco(ctx, t, { texto: 'Esse site é de uma padaria.\nNinguém acredita.', x: 90, y: Y + 78, tamanho: 58, entrelinha: 1.14, entra: e, sai, entrada: corte ? 'corte' : 'mascara', durEntrada: 0.4, atraso: 0.06 });
}

export default {
  id: 'i03',
  nome: 'i03-feito-para-padaria',
  duracao: 17,
  fps: 30,

  async desenhar(ctx, t) {
    fundo(ctx);
    const img = await carregarImagem(`${PASTA}/q_${String(quadroDaRolagem(t)).padStart(5, '0')}.png`);
    ctx.drawImage(img, 0, 0, W, H);

    if (t < 3) gancho(ctx, t, -1, 2.3, true); // sai antes de o título do balcão passar por trás
    if (t >= 10 && t < 13) {
      faixa(ctx, t, { y: Y, h: 210, entra: 10.5, sai: 12.9, saida: 'corte', cor: FORNO, linha: LINHA });
      bloco(ctx, t, { texto: 'Padaria fictícia.\nSite de verdade.', x: 90, y: Y + 40, tamanho: 60, entrelinha: 1.14, entra: 10.62, sai: 12.9, saida: 'corte' });
    }
    if (t >= 13 && t < 16) {
      faixa(ctx, t, { y: Y, h: 300, entra: 13.0, sai: 15.9, saida: 'corte', cor: FORNO, linha: LINHA });
      bloco(ctx, t, { texto: 'Qual negócio eu faço na próxima?', x: 90, y: Y + 36, tamanho: 56, largura: 820, entrelinha: 1.14, entra: 13.12, sai: 15.9, saida: 'corte' });
      bloco(ctx, t, { estilo: 'texto', texto: 'Vota no próximo nicho no domingo.', x: 90, y: Y + 180, tamanho: 34, cor: COR.aluminio, entra: 13.6, sai: 15.9, entrada: 'fade', saida: 'corte' });
      assinatura(ctx, t, { y: Y + 240, entra: 14.0, sai: 15.9, saida: 'corte' });
    }
    if (t >= 16) gancho(ctx, t, 16.0, 1e9, false);
  },

  async capa(ctx) {
    fundo(ctx);
    const img = await carregarImagem(`${PASTA}/q_00030.png`);
    ctx.drawImage(img, 0, 0, W, H);
    // a faixa da padaria com o gancho, no centro (o perfil corta a capa em 4:5)
    faixa(ctx, 0, { y: 820, h: 330, cor: 'rgba(31,10,3,0.92)', linha: LINHA, entrada: 'corte' });
    rotulo(ctx, 0, { texto: 'Feito para · episódio 1', alinhar: 'center', x: 540, y: 862, entrada: 'corte' });
    bloco(ctx, 0, { texto: 'Esse site é de uma padaria.\nNinguém acredita.', alinhar: 'center', x: 540, y: 924, tamanho: 66, largura: 850, entrelinha: 1.16, entrada: 'corte' });
  },
};
