// Folha de contato para conferir: captura várias rolagens e monta numa imagem só.
// Uso: node ferramentas/folha.mjs saida.png "y1,y2,..." [t] [largura] [altura]
//   y pode ser número (px) ou "marco+px" (ex.: vitrine+300). Use "marcos" para listar.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { servidor, navegador, abrir, quadro } from './comum.mjs';
const [saida, lista = 'marcos', t = '4', largura = '432', altura = '768'] = process.argv.slice(2);
const srv = await servidor();
const browser = await navegador();
const W = +largura, H = +altura;
const page = await abrir(browser, srv.url, { largura: W, altura: H, escala: W > 900 ? 1 : 1.25 });
const m = await page.evaluate(() => window.__marcos && window.__marcos());
const alt = await page.evaluate(() => window.__altura && window.__altura());
if (lista === 'marcos') { console.log(JSON.stringify({ ...m, altura: alt }, null, 1)); await browser.close(); srv.fechar(); process.exit(0); }
const ys = lista.split(',').map((s) => { const [k, d] = s.split('+'); return isNaN(+k) ? m[k] + (+d || 0) : +s; });
const tmp = fs.mkdtempSync(path.join(path.dirname(saida), 'folha-'));
const arqs = [];
for (const [i, y] of ys.entries()) {
  await quadro(page, +t + i * 0.25, y);
  await quadro(page, +t + i * 0.25 + 0.01, y);
  const f = path.join(tmp, `${i}.png`); await page.screenshot({ path: f }); arqs.push(f);
}
await browser.close(); srv.fechar();
execFileSync('python3', ['-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; ims=[Image.open(f) for f in fs]; w,h=ims[0].size
s=360/w; tw,th=int(w*s),int(h*s); cols=min(len(ims),5); rows=(len(ims)+cols-1)//cols
c=Image.new('RGB',(cols*tw+(cols-1)*8, rows*th+(rows-1)*8),(90,90,90))
for i,im in enumerate(ims): c.paste(im.resize((tw,th)),((i%cols)*(tw+8),(i//cols)*(th+8)))
c.save(sys.argv[1])`, saida, ...arqs]);
fs.rmSync(tmp, { recursive: true });
console.log('ok', ys.join(','));
