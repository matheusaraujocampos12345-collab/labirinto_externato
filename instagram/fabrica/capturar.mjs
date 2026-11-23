// Tira os prints usados nos posts e stories: serve o site-mach/ num servidor local,
// abre no Chromium (Playwright) e salva em instagram/recortes/. Também tira um quadro do vídeo de 30 s.
// Uso: node instagram/fabrica/capturar.mjs
//
// Sem internet, a fonte e a biblioteca Lenis (que vêm da rede) podem não carregar.
// O script avisa quando isso acontece: confira os prints antes de usar.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(REPO, 'site-mach');
const SAIDA = path.join(REPO, 'instagram', 'recortes');
fs.mkdirSync(SAIDA, { recursive: true });

// servidor estático simples, só para esta captura
const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
const servidor = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
  const arq = path.join(SITE, rel);
  if (!arq.startsWith(SITE) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'content-type': TIPOS[path.extname(arq)] || 'application/octet-stream' });
  fs.createReadStream(arq).pipe(res);
});
await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
const URL = `http://127.0.0.1:${servidor.address().port}/`;

const browser = await playwright.chromium.launch();
async function abrir(largura, altura, escala) {
  const page = await browser.newPage({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala });
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => ({
    lenis: !!window.Lenis,
    saira: [...document.fonts].some((f) => f.family.includes('Saira') && f.status === 'loaded'),
  }));
  if (!ok.saira) console.warn('Aviso: a fonte Saira não carregou (sem internet?). Confira o print.');
  if (!ok.lenis) console.warn('Aviso: a biblioteca Lenis não carregou. O print sai igual, só a rolagem suave fica de fora.');
  await page.waitForTimeout(3000); // espera a animação de abertura assentar
  return page;
}

// 1. Primeira tela no celular e no computador (Raio-X)
for (const [nome, w, h, dpr] of [['celular', 390, 844, 3], ['computador', 1440, 900, 2]]) {
  const page = await abrir(w, h, dpr);
  const out = path.join(SAIDA, `site-${nome}-primeira-tela.png`);
  await page.screenshot({ path: out });
  console.log(path.relative(REPO, out));
  await page.close();
}

// 2. Cartão de embarque do formulário, preenchido com dados genéricos (bastidor dos stories)
{
  const page = await abrir(390, 844, 3);
  await page.fill('#f-nome', 'Você');
  await page.fill('#f-empresa', 'Sua empresa');
  await page.click('label[for=t-ins]');
  await page.click('label[for=p-mes]');
  await page.locator('#cartao').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const out = path.join(SAIDA, 'site-cartao-embarque.png');
  await page.locator('#cartao').screenshot({ path: out });
  console.log(path.relative(REPO, out));
  await page.close();
}

await browser.close();
servidor.close();

// 3. Um quadro do vídeo de 30 s (o celular com a luminária HALO, aos 19,5 s)
const video = path.join(REPO, 'video-anuncio', 'anuncio-mach-30s.mp4');
if (fs.existsSync(video)) {
  const out = path.join(SAIDA, 'filme-quadro-585.png');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', '19.5', '-i', video, '-frames:v', '1', out]);
  console.log(path.relative(REPO, out));
} else {
  console.warn('Aviso: vídeo não encontrado, quadro do filme não foi gerado.');
}
