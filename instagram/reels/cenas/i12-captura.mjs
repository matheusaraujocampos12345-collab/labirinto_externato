// Gravação do i12 ("Padaria em uso"): o site da Padaria Quatro Horas filmado como um cliente usando,
// quadro a quadro, no modo de captura do próprio site (index.html?captura=1, relógio fixo em
// quarta, 9/12/2026, 15h47). As interações são reais: a rolagem, o toque na aba Natal e os toques
// em "Adicionar" e "+" mudam o site de verdade; o resumo e a mensagem do WhatsApp saem do site.
// Uso, da raiz do repositório:
//   node instagram/reels/cenas/i12-captura.mjs [--workers 2]
// Saída: instagram/reels/.quadros/i12-site/q_00000.png… e meta.json (posições dos elementos por quadro)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, '../../..');
const { servidor, navegador, abrir } = await import(path.join(RAIZ, 'instagram/sites-conceito/padaria/ferramentas/comum.mjs'));

const FPS = 30;
export const DURACAO = 47;
const SAIDA = path.join(RAIZ, 'instagram/reels/.quadros/i12-site');
const argv = process.argv.slice(2);
const WORKERS = Math.max(1, Number(argv[argv.indexOf('--workers') + 1] || 2));

const suave = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : -(Math.cos(Math.PI * x) - 1) / 2);
/** rolagem por chaves [[t, y], ...] com curva suave entre elas */
function curva(lista) {
  return (t) => {
    if (t <= lista[0][0]) return lista[0][1];
    for (let i = 1; i < lista.length; i++) {
      const [t1, y1] = lista[i], [t0, y0] = lista[i - 1];
      if (t <= t1) return y0 + (y1 - y0) * suave((t - t0) / (t1 - t0));
    }
    return lista[lista.length - 1][1];
  };
}

// Tomadas: [início, fim, rolagem(t), tempo do site(t)] — os saltos de rolagem caem nos cortes do Reels.
// "marcos" vêm do próprio site (window.__marcos()).
function tomadas(m) {
  const tSite = (t) => 3 + t; // o letreiro já está aceso
  return [
    [0, 5, () => 0, (t) => 3 + t * 0], // primeira tela parada (o site não muda sem rolagem)
    [5, 10.5, curva([[5, 0], [5.4, 0], [9.0, m.heroCurso], [10.5, m.heroCurso + 16]]), tSite],
    [10.5, 13, curva([[10.5, m.senha - 290], [13, m.senha - 276]]), tSite],
    [13, 16, curva([[13, m.natal - 70], [16, m.natal - 44]]), tSite],
    [16, 18.5, curva([[16, m.cardapio - 90], [17.0, m.cardapio - 60], [17.5, m.cardapio - 60], [18.5, m['c-natal'] - 118]]), tSite],
    // a aba leva ao topo da seção; o cliente desce um pouco para ver o panetone de 1 kg e o chocotone
    [18.5, 24, curva([[18.5, m['c-natal'] - 118], [19.2, m['c-natal'] + 12], [24, m['c-natal'] + 22]]), tSite],
    [24, 33, curva([[24, m['c-natal'] + 22], [25.5, m.rodape - 380], [33, m.rodape - 366]]), tSite],
    [33, 42, curva([[33, m.mapa - 620], [35.5, m.mapa - 150], [42, m.mapa - 136]]), tSite],
    [42, DURACAO, () => 0, () => 3], // primeira tela de novo, no mesmo estado do começo (loop)
  ];
}

// Toques reais no site: [tempo, seletor, o que é]
export const TOQUES = [
  [17.0, '.abas [data-aba="c-natal"]', 'aba Natal'],
  [19.5, '[data-natal="1"] .qtd-mais', 'Adicionar panetone 1 kg'],
  [20.5, '[data-natal="1"] .qtd-mais', '+1 panetone 1 kg'],
  [21.5, '[data-natal="2"] .qtd-mais', 'Adicionar chocotone'],
];

const ELEMENTOS = {
  aba: '.abas [data-aba="c-natal"]',
  mais1: '[data-natal="1"] .qtd-mais',
  qtd1: '[data-natal="1"] .qtd',
  item1: '[data-natal="1"]',
  mais2: '[data-natal="2"] .qtd-mais',
  qtd2: '[data-natal="2"] .qtd',
  item2: '[data-natal="2"]',
  resumo: '.natal-rodape [data-escolhidos]',
  zap: '.natal-rodape [data-zap-natal]',
  senha: '.senha',
  prazo: '.natal-prazo',
  mapa: '.mapa',
  selo: '.selo-natal',
};

fs.mkdirSync(SAIDA, { recursive: true });
const srv = await servidor();
const t0 = Date.now();
let feitos = 0;
const TOTAL = Math.round(DURACAO * FPS);
const meta = new Array(TOTAL);
let mensagem = '';

async function trabalhador(w) {
  const b = await navegador();
  const page = await abrir(b, srv.url);
  const m = await page.evaluate(() => window.__marcos());
  m.rodape = await page.evaluate(() => document.querySelector('.natal-rodape').getBoundingClientRect().top + scrollY);
  const TOM = tomadas(m);
  const ini = Math.floor((TOTAL * w) / WORKERS), fim = Math.floor((TOTAL * (w + 1)) / WORKERS);
  const feitosToques = new Set();
  for (let f = ini; f < fim; f++) {
    const t = f / FPS;
    const tom = TOM.find(([a, b]) => t >= a && t < b) || TOM[TOM.length - 1];
    const y = tom[2](t), ts = tom[3](t);
    const v = (tom[2](t + 0.02) - tom[2](t - 0.02)) / 0.04;
    // toques: os de quantidade são aplicados mesmo que o trabalhador comece depois deles
    const agora = TOQUES.filter(([tt], i) => tt <= t && !feitosToques.has(i) && (tt > t - 1 / FPS || !TOQUES[i][2].startsWith('aba')));
    for (const toq of agora) {
      feitosToques.add(TOQUES.indexOf(toq));
      await page.evaluate((sel) => document.querySelector(sel).click(), toq[1]);
    }
    await page.evaluate(([t, y, v]) => window.__quadro(t, y, v), [ts, y, v * 0.6]);
    await page.screenshot({ path: path.join(SAIDA, `q_${String(f).padStart(5, '0')}.png`), type: 'png' });
    meta[f] = await page.evaluate((els) => {
      const r = { y: scrollY };
      for (const [k, s] of Object.entries(els)) {
        const e = document.querySelector(s);
        if (!e) continue;
        const b = e.getBoundingClientRect();
        r[k] = [b.x, b.y, b.width, b.height].map((n) => Math.round(n * 10) / 10);
        if (k === 'resumo') r.resumoTexto = e.textContent.trim();
      }
      return r;
    }, ELEMENTOS);
    if (f === fim - 1 && w === WORKERS - 1) {
      const href = await page.evaluate(() => document.querySelector('.natal-rodape [data-zap-natal]').href);
      mensagem = decodeURIComponent(href.split('text=')[1] || '');
    }
    if (++feitos % 60 === 0) console.log(`${feitos}/${TOTAL} quadros · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await b.close();
}
await Promise.all(Array.from({ length: WORKERS }, (_, w) => trabalhador(w)));
srv.fechar();
fs.writeFileSync(path.join(SAIDA, 'meta.json'), JSON.stringify({ escala: 2.5, fps: FPS, toques: TOQUES, mensagem, quadros: meta }));
console.log(`Gravação pronta: ${TOTAL} quadros em ${path.relative(RAIZ, SAIDA)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
console.log('Mensagem do WhatsApp:\n' + mensagem);
