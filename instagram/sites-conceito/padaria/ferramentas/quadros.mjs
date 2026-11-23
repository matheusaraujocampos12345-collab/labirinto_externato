// Gera os quadros-chave para o carrossel c04 e a foto f01.
// Uso: node ferramentas/quadros.mjs
// Saída: captura/quadros/*.jpg (1080x1350, qualidade 92) e captura/primeira-tela-1080x1920.jpg
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, servidor, navegador, abrir, quadro } from './comum.mjs';

const PASTA = path.join(RAIZ, 'captura', 'quadros');
fs.mkdirSync(PASTA, { recursive: true });
const srv = await servidor();
const browser = await navegador();

// tela: [largura, altura, escala]; y: rolagem (número, [marco, px] ou [marco, 'fração do curso']);
// recorte: topo em px CSS de uma janela 432 x 540 (sem a barra do topo)
const LISTA = [
  { arq: '01-primeira-tela.jpg', tela: [432, 540, 2.5], t: 4.6, y: 0 },
  { arq: '02-pao-saindo-do-forno.jpg', tela: [432, 540, 2.5], t: 4.6, y: ['hero', 0.74] },
  { arq: '03-relogio-da-fornada.jpg', tela: [432, 768, 2.5], t: 4.6, y: ['senha', -262], recorte: 64 },
  { arq: '04-cardapio-se-montando.jpg', tela: [432, 768, 2.5], t: 4.6, y: ['cardapio', 70], recorte: 64 },
  { arq: '05-cardapio.jpg', tela: [432, 768, 2.5], t: 4.6, y: ['c-doces', -132], recorte: 62 },
  { arq: '06-mapa-e-whatsapp.jpg', tela: [432, 768, 2.5], t: 4.6, y: ['mapa', -180], recorte: 64 },
  { arq: '07-encomenda.jpg', tela: [432, 768, 2.5], t: 4.6, y: ['encomenda', 40], recorte: 64 },
  { arq: '../primeira-tela-1080x1920.jpg', tela: [432, 768, 2.5], t: 4.6, y: 0 },
];

for (const q of LISTA) {
  const [largura, altura, escala] = q.tela;
  const page = await abrir(browser, srv.url, { largura, altura, escala });
  const m = await page.evaluate(() => window.__marcos());
  let y = q.y;
  if (Array.isArray(y)) y = y[0] === 'hero' ? m.heroCurso * y[1] : m[y[0]] + y[1];
  await quadro(page, q.t - 0.1, y);
  await quadro(page, q.t, y);
  await page.waitForTimeout(150);
  const opcoes = { path: path.join(PASTA, q.arq), type: 'jpeg', quality: 92 };
  if (q.recorte != null) opcoes.clip = { x: 0, y: q.recorte, width: 432, height: 540 };
  await page.screenshot(opcoes);
  await page.close();
  console.log('ok', q.arq);
}

// a paleta: dois quadros do vídeo com o ponto de cada cor (ferramentas/paleta.html)
const p = await browser.newPage({ viewport: { width: 432, height: 540 }, deviceScaleFactor: 2.5 });
await p.goto(srv.url + 'ferramentas/paleta.html');
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: path.join(PASTA, '08-paleta.jpg'), type: 'jpeg', quality: 92 });
console.log('ok 08-paleta.jpg');
await browser.close();
srv.fechar();
