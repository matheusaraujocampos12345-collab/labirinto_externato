// Fotografa o boneco 3D em vários ângulos e poses (PNG).
//   node instagram/reels/boneco/fotografar.mjs <pasta de saída>          (as 6 fotos)
//   node instagram/reels/boneco/fotografar.mjs <pasta de saída> giro     (quadros da volta de 360°)
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const playwright = createRequire(import.meta.url)('playwright');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const SAIDA = path.resolve(process.argv[2] || path.join(RAIZ, 'instagram/reels/boneco/fotos'));
fs.mkdirSync(SAIDA, { recursive: true });

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript' };
const servidor = http.createServer((req, res) => {
  const p = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));

const FOTOS = [
  ['01-frente', { az: 0 }],
  ['02-tres-quartos', { az: 0.62 }],
  ['03-lado', { az: Math.PI / 2 }],
  ['04-costas', { az: Math.PI }],
  ['05-selfie', { az: 0.45, nomePose: 'selfie' }],
  ['06-rosto', { az: 0.35, el: 0.04, alvoY: 3.72, dist: 4.6 }],
];

const browser = await playwright.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
page.on('console', (m) => (m.type() === 'error' ? console.error(m.text()) : null));
page.on('pageerror', (e) => console.error('erro na página: ' + e.message));
await page.goto(`http://127.0.0.1:${servidor.address().port}/instagram/reels/boneco/estudio.html`);
await page.waitForFunction(() => window.pronto === true, null, { timeout: 60000 });
if (process.argv[3] === 'giro') {
  // volta de 360° em 6 s (30 qps), 1080 × 1920, para o vídeo de apresentação
  const N = 180;
  for (let i = 0; i < N; i++) {
    const url = await page.evaluate((o) => window.fotografar(o), { w: 1080, h: 1920, az: 0, el: 0.05, alvoY: 2.25, dist: 15.5, giro: (i / N) * Math.PI * 2 });
    fs.writeFileSync(path.join(SAIDA, `g_${String(i).padStart(3, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(`giro: ${N} quadros`);
  FOTOS.length = 0;
}
for (const [nome, op] of FOTOS) {
  const url = await page.evaluate((o) => window.fotografar(o), op);
  fs.writeFileSync(path.join(SAIDA, nome + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('foto: ' + nome);
}
await browser.close();
servidor.close();
