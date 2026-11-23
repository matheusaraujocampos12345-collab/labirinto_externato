// Gravação do i12 ("Padaria em uso", 45 s): um cliente encomenda panetone no site da Padaria Quatro
// Horas, com toques reais (aba Natal, "Adicionar", "+"), 4 subquadros por quadro (borrão de movimento),
// rolagens lentas e pausas de ~1 s depois de cada movimento. Também escreve instagram/reels/i12-eventos.json
// com o segundo de cada evento de som.
// Uso, da raiz do repositório: node instagram/reels/cenas/i12-captura.mjs [--workers 2]
import fs from 'node:fs';
import path from 'node:path';
import { gravar, curva, curvaLentaNoInicio, RAIZ } from './padaria-gravar.mjs';
import { DURACAO, TOQUES, TEXTOS } from './i12-tempos.mjs';

const ELEMENTOS = {
  aba: '.abas [data-aba="c-natal"]',
  mais1: '[data-natal="1"] .qtd-mais',
  mais2: '[data-natal="2"] .qtd-mais',
  zap: '.natal-rodape [data-zap-natal]',
  mapa: '.mapa',
};

let rolagemMapa = null, marcos = null;
const tomadas = (m) => {
  marcos = m;
  rolagemMapa = curva([[34.0, m.mapa - 670], [34.3, m.mapa - 670], [38.0, m.mapa - 250], [40.5, m.mapa - 244]]);
  return [
    [0, 3, () => 0, () => 3], // primeira tela, parada
    [3, 9.5, (t) => (t < 8.3 ? curvaLentaNoInicio(3.2, 8.3, 0, m.heroCurso)(Math.max(3.2, t)) : m.heroCurso + 8 * ((t - 8.3) / 1.2)), (t) => 3 + t], // o pão sai do forno (devagar no começo)
    [9.5, 13.5, curva([[9.5, m.natal - 70], [13.5, m.natal - 40]]), (t) => 3 + t], // Natal: luzes e o painel dos dias
    // cardápio (já perto da seção de Natal): parado, toque na aba Natal (14,5 s), a página desce até a seção e para
    [13.5, 22.5, curva([[13.5, m['c-natal'] - 300], [14.8, m['c-natal'] - 300], [17.4, m['c-natal'] + 12], [22.5, m['c-natal'] + 20]]), (t) => 3 + t],
    // corte seco para o resumo e o botão do WhatsApp; desce só um pouco, devagar
    [22.5, 29, curva([[22.5, m.rodape - 420], [24.6, m.rodape - 330], [29, m.rodape - 322]]), (t) => 3 + t],
    [29, 34, () => m.rodape - 322, (t) => 3 + t], // a mensagem (o site fica parado e desfocado ao fundo)
    [34, 40.5, rolagemMapa, (t) => 3 + t], // o mapa: o caminho se desenha até o pino
    [40.5, DURACAO, () => 0, () => 3], // primeira tela de novo (convite e volta do loop)
  ];
};

const { extra } = await gravar({
  nome: 'i12-site',
  duracao: DURACAO,
  tomadas,
  toques: TOQUES.filter(([, , o]) => !o?.soVisual).map(([t, k]) => [t, ELEMENTOS[k]]),
  elementos: ELEMENTOS,
  aoFim: async (page) => {
    const href = await page.evaluate(() => document.querySelector('.natal-rodape [data-zap-natal]').href);
    return { mensagem: decodeURIComponent(href.split('text=')[1] || '') };
  },
});

// eventos de som: o caminho do mapa começa e termina conforme a rolagem (regra do próprio site, js/secoes.js)
const vh = 768;
const achar = (alvo) => {
  for (let t = 34; t < 40.5; t += 1 / 120) if (marcos.mapa - rolagemMapa(t) <= alvo) return Math.round(t * 100) / 100;
  return null;
};
const eventos = [
  { t: 0.0, evento: 'letreiro', nota: 'abertura com o letreiro de neon aceso' },
  { t: 3.6, evento: 'assadeira', nota: 'a mão puxa a assadeira e o pão sai do forno' },
  ...TOQUES.map(([t, k, o]) => ({ t, evento: o.evento, nota: o.nota })),
  { t: TEXTOS.mensagem[0], evento: 'mensagem', nota: 'o balão com a mensagem pronta aparece' },
  { t: achar(vh * 0.8), evento: 'caminho', nota: 'o caminho começa a se desenhar no mapa' },
  { t: achar(vh * 0.35), evento: 'pino', nota: 'o caminho chega ao pino da padaria (6 min a pé)' },
  { t: TEXTOS.convite[0], evento: 'convite', nota: '"Quer um site assim? Chama no direct."' },
  { t: TEXTOS.volta[0], evento: 'volta', nota: 'o gancho volta: o vídeo emenda no começo' },
  { t: DURACAO, evento: 'loop', nota: 'fim do vídeo = primeiro quadro' },
];
fs.writeFileSync(
  path.join(RAIZ, 'instagram/reels/i12-eventos.json'),
  JSON.stringify({ video: 'i12-padaria-em-uso.mp4', duracao: DURACAO, fps: 30, eventos }, null, 2) + '\n',
);
console.log('Eventos:', eventos.map((e) => `${e.t}s ${e.evento}`).join(' · '));
console.log('Mensagem:', extra.mensagem);
