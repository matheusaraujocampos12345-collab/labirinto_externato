// Anúncio do lançamento do site da MACH: post 4:5 (1080×1350) e story 9:16 (1080×1920).
// Usa uma prévia real do site (site-previa.png), borrada, com uma faixa nítida "escaneada".
// Uso: node anuncio-lancamento/gerar.mjs
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
const previa = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'site-previa.png')).toString('base64');

const logo = `<svg class="logo" viewBox="-10 -14 544 124" aria-hidden="true">
  <clipPath id="pe"><rect x="-40" y="-40" width="620" height="143.5"/></clipPath>
  <g fill="none" stroke-width="9" stroke-linejoin="miter" stroke-miterlimit="4">
    <path d="M0 100 V0 L55 72 L110 0 V100 M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 M420 0 V100 M520 0 V100 M420 50 H520" stroke="#DFE3E7" stroke-linecap="square"/>
    <path d="M137.68 108 L196 0 L254.32 108" stroke="#FF6B1A" clip-path="url(#pe)"/>
  </g></svg>`;

function pagina({ w, h, story }) {
  const telaH = story ? 860 : 640;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wdth,wght@75..125,200..700&family=Hanken+Grotesk:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
:root { --estrato:#0a0c0f; --linha:#252b32; --aluminio:#dfe3e7; --aluminio2:#b9c0c7; --nevoa:#8a929b; --laranja:#ff6b1a; }
* { box-sizing: border-box; }
body { margin: 0; }
#q { position: relative; width: ${w}px; height: ${h}px; overflow: hidden; color: var(--aluminio); font-family: "Hanken Grotesk", sans-serif;
  background: radial-gradient(70% 45% at 70% 0%, #151b26 0%, rgba(21,27,38,0) 60%), linear-gradient(180deg, #0b0e13, var(--estrato) 70%);
  display: flex; flex-direction: column; align-items: center; padding: ${story ? 230 : 64}px 96px 0; }
canvas { position: absolute; inset: 0; z-index: 0; }
#q > *:not(canvas) { position: relative; z-index: 1; }
.topo { width: 100%; display: flex; justify-content: space-between; align-items: center; }
.logo { width: 128px; height: auto; }
.mono { font-family: "JetBrains Mono", monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--nevoa); font-size: 20px; }
.laranja { color: var(--laranja); }
h1 { font-family: "Saira", sans-serif; font-weight: 300; font-size: ${story ? 92 : 80}px; line-height: 1.02; letter-spacing: -.02em; margin: ${story ? 56 : 44}px 0 0; text-align: center; max-width: 880px; }
.tela-wrap { position: relative; margin-top: ${story ? 60 : 40}px; padding: 18px; }
.c { position: absolute; width: 44px; height: 44px; border: 0 solid var(--laranja); }
.c1 { left: 0; top: 0; border-width: 3px 0 0 3px; } .c2 { right: 0; top: 0; border-width: 3px 3px 0 0; }
.c3 { left: 0; bottom: 0; border-width: 0 0 3px 3px; } .c4 { right: 0; bottom: 0; border-width: 0 3px 3px 0; }
.tela { position: relative; height: ${telaH}px; aspect-ratio: 390 / 844; border-radius: 46px; overflow: hidden; background: #000;
  box-shadow: 0 0 0 10px #1b2026, 0 0 0 11px #2f3640, 0 50px 90px rgba(0,0,0,.6); }
.tela img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.borrada { filter: blur(16px) brightness(.62) saturate(.9); transform: scale(1.08); }
.nitida { clip-path: inset(38% 0 44% 0); }
.scan { position: absolute; left: -6%; right: -6%; height: 2px; background: var(--laranja); box-shadow: 0 0 18px 4px rgba(255,107,26,.5); }
.scan.s1 { top: 38%; } .scan.s2 { top: 56%; }
.selo { position: absolute; left: 50%; top: 18%; transform: translateX(-50%); padding: 12px 20px; background: rgba(10,12,15,.8); box-shadow: inset 0 0 0 1px rgba(255,107,26,.6); color: var(--laranja); font-size: 18px; white-space: nowrap; }
.progresso { width: ${story ? 640 : 560}px; margin-top: ${story ? 44 : 34}px; display: grid; gap: 12px; }
.progresso .linha1 { display: flex; justify-content: space-between; }
.barra { height: 8px; background: #1b2026; box-shadow: inset 0 0 0 1px var(--linha); position: relative; }
.barra i { position: absolute; left: 0; top: 0; bottom: 0; width: 82%; background: var(--laranja); box-shadow: 0 0 16px rgba(255,107,26,.5); }
.barra b { position: absolute; top: -6px; bottom: -6px; width: 2px; background: var(--estrato); }
.breve { font-family: "Saira", sans-serif; font-weight: 400; font-size: ${story ? 54 : 46}px; margin: ${story ? 46 : 34}px 0 0; letter-spacing: -.01em; }
.cta { margin-top: 14px; font-size: 20px; color: var(--aluminio2); }
</style></head><body><div id="q"><canvas id="c" width="${w}" height="${h}"></canvas>
  <div class="topo">${logo}<span class="mono laranja">Lançamento</span></div>
  <h1>O site da MACH está saindo do hangar.</h1>
  <div class="tela-wrap">
    <i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>
    <div class="tela">
      <img class="borrada" src="${previa}" alt="">
      <img class="nitida" src="${previa}" alt="">
      <i class="scan s1"></i><i class="scan s2"></i>
      <span class="selo mono">Em montagem</span>
    </div>
  </div>
  <div class="progresso">
    <div class="linha1"><span class="mono">Em montagem</span><span class="mono laranja">Pré-voo</span></div>
    <div class="barra"><i></i><b style="left:25%"></b><b style="left:50%"></b><b style="left:75%"></b></div>
  </div>
  <p class="breve">Lançamento em breve.</p>
  <p class="cta mono">${story ? 'Ative o lembrete abaixo' : 'Ative as notificações para ver primeiro'}</p>
</div>
<script>
const c = document.getElementById('c'), x = c.getContext('2d');
let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < ${story ? 260 : 190}; i++) {
  const px = r() * c.width, py = r() * c.height, d = r(), len = 30 + 170 * d * d;
  x.strokeStyle = 'rgba(214,226,240,' + (0.03 + 0.14 * d * d) + ')';
  x.lineWidth = 1 + 1.4 * d; x.beginPath(); x.moveTo(px, py - len); x.lineTo(px, py); x.stroke();
}
</script></body></html>`;
}

const browser = await playwright.chromium.launch();
for (const [nome, w, h, story] of [['post-lancamento-4x5', 1080, 1350, false], ['story-lancamento-9x16', 1080, 1920, true]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(pagina({ w, h, story }), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ROOT, `${nome}.png`) });
  console.log(nome + '.png');
  await page.close();
}
await browser.close();
