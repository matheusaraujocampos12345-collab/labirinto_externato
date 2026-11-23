// Gera os quadros-chave para o carrossel c04 e a foto f01.
// Uso: node ferramentas/quadros.mjs
// Saída: captura/quadros/*.jpg (1080x1350, qualidade 92) e primeira-tela-1080x1920.jpg
import fs from 'node:fs';
import path from 'node:path';
import { RAIZ, servidor, navegador, abrir, quadro } from './comum.mjs';

const PASTA = path.join(RAIZ, 'captura', 'quadros');
fs.mkdirSync(PASTA, { recursive: true });
const srv = await servidor();
const browser = await navegador();

// tela: [largura, altura, escala]; y: rolagem (número ou [marco, deslocamento]); recorte: topo em px CSS (janela de 432 x 540)
const LISTA = [
  { arq: '01-primeira-tela.jpg', tela: [432, 540, 2.5], t: 4.6, y: 0 },
  { arq: '02-cardapio-se-montando.jpg', tela: [432, 540, 2.5], t: 6, y: ['vitrine', 0.47] },
  { arq: '03-cardapio.jpg', tela: [432, 540, 2.5], t: 8, y: ['vitrine', 0.86] },
  { arq: '04-relogio.jpg', tela: [432, 768, 2.5], t: 10, y: ['relogio', -235], recorte: 64 },
  { arq: '05-paleta.jpg', tela: [432, 768, 2.5], t: 13, y: ['corte', -84], recorte: 64, extra: '&paleta=1' },
  { arq: '06-mapa.jpg', tela: [432, 768, 2.5], t: 18, y: ['endereco', 6], recorte: 64 },
  { arq: '07-encomenda-whatsapp.jpg', tela: [432, 768, 2.5], t: 16, y: ['encomenda', 150], recorte: 64 },
  { arq: '08-vapor-detalhe.jpg', tela: [432, 768, 5.0], t: 5.2, y: 0, zoom: { x: 108, y: 392, w: 216, h: 270 } },
  { arq: '../primeira-tela-1080x1920.jpg', tela: [432, 768, 2.5], t: 4.6, y: 0 },
];

for (const q of LISTA) {
  const [largura, altura, escala] = q.tela;
  const page = await abrir(browser, srv.url, { largura, altura, escala, extra: q.extra || '' });
  const m = await page.evaluate(() => window.__marcos());
  let y = q.y;
  if (Array.isArray(y)) y = y[0] === 'vitrine' ? m.vitrine + m.vitrineCurso * y[1] : m[y[0]] + y[1];
  await quadro(page, q.t - 0.1, y);
  await quadro(page, q.t, y);
  await page.waitForTimeout(150);
  const opcoes = { path: path.join(PASTA, q.arq), type: 'jpeg', quality: 92 };
  if (q.recorte != null) opcoes.clip = { x: 0, y: q.recorte, width: 432, height: 540 };
  if (q.zoom) opcoes.clip = { x: q.zoom.x, y: q.zoom.y, width: q.zoom.w, height: q.zoom.h };
  await page.screenshot(opcoes);
  await page.close();
  console.log('ok', q.arq);
}
await browser.close();
srv.fechar();
