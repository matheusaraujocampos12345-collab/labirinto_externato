// Exporta os SVGs do logo para PNG (fundo transparente) e gera a folha de marca.
// Uso: node marca-mach/exportar_png.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SVG = path.join(ROOT, 'svg');
const PNG = path.join(ROOT, 'png');
fs.mkdirSync(PNG, { recursive: true });

const jobs = [];
for (const v of ['escuro', 'claro', 'branco', 'preto']) {
  jobs.push([`assinatura-${v}.svg`, 2400]);
  jobs.push([`logotipo-${v}.svg`, 2400]);
  jobs.push([`simbolo-${v}.svg`, 800]);
}
jobs.push(['avatar.svg', 1080, 'avatar-1080.png']);
jobs.push(['avatar.svg', 512, 'favicon-512.png']);

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const [file, width, outName] of jobs) {
  const svg = fs.readFileSync(path.join(SVG, file), 'utf8');
  const [, , vw, vh] = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/).slice(1).map(Number);
  const height = Math.round((width * vh) / vw);
  await page.setViewportSize({ width, height });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${width}" height="${height}" style="display:block" `)}</body></html>`);
  const out = outName || file.replace('.svg', '.png');
  await page.screenshot({ path: path.join(PNG, out), omitBackground: true });
  console.log('png/' + out, `${width}×${height}`);
}

// folha de marca (prévia)
const read = (f) => fs.readFileSync(path.join(SVG, f), 'utf8').replace('<svg ', '<svg style="display:block;width:100%;height:auto" ');
const sheet = `<html><head><style>
  body{margin:0;font-family:"JetBrains Mono",monospace;background:#0A0C0F;color:#8A929B}
  .grid{display:grid;grid-template-columns:1fr 1fr;width:1600px}
  .cell{padding:72px 80px;display:grid;gap:28px;align-content:center;min-height:420px}
  .d{background:#0A0C0F}.l{background:#DFE3E7;color:#4a5058}.t{background:#1B2026}
  .lab{font-size:14px;letter-spacing:.08em;text-transform:uppercase}
  .row{display:flex;gap:56px;align-items:center}
</style></head><body><div class="grid">
  <div class="cell d"><span class="lab">Assinatura · fundo escuro</span><div style="width:620px">${read('assinatura-escuro.svg')}</div></div>
  <div class="cell l"><span class="lab">Assinatura · fundo claro</span><div style="width:620px">${read('assinatura-claro.svg')}</div></div>
  <div class="cell t"><span class="lab">Logotipo · uma cor</span><div style="width:560px">${read('logotipo-branco.svg')}</div></div>
  <div class="cell l"><span class="lab">Logotipo · uma cor</span><div style="width:560px">${read('logotipo-preto.svg')}</div></div>
  <div class="cell d"><span class="lab">Símbolo e avatar</span><div class="row"><div style="width:110px">${read('simbolo-escuro.svg')}</div><div style="width:220px">${read('avatar.svg')}</div><div style="width:64px">${read('avatar.svg')}</div></div></div>
  <div class="cell l"><span class="lab">Símbolo · fundo claro</span><div class="row"><div style="width:110px">${read('simbolo-claro.svg')}</div><div style="width:56px">${read('simbolo-preto.svg')}</div><div style="width:28px">${read('simbolo-claro.svg')}</div></div></div>
</div></body></html>`;
await page.setViewportSize({ width: 1600, height: 900 });
await page.setContent(sheet);
await page.screenshot({ path: path.join(ROOT, 'folha-de-marca.png'), fullPage: true });
console.log('folha-de-marca.png');
await browser.close();
