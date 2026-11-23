// Stories da semana 1 (1080×1920, JPG). Uso: node instagram/stories/semana-1/gerar.mjs
// Os prints dos exemplos vêm de instagram/recortes/ (gerados por node instagram/fabrica/capturar.mjs).
// Zona segura: nada importante nos 250 px do topo nem nos 340 px de baixo. O script avisa se algo passar.
// As áreas com cantoneiras vazias são o lugar dos stickers (caixinha, enquete, contagem e link): ver LEIA-ME.md.
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

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(AQUI, '..', '..', '..');
const W = 1080, H = 1920, TOPO = 250, BASE = H - 340;

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const br = (s) => esc(s).replace(/\n/g, '<br>');
const img = (rel) => {
  const buf = fs.readFileSync(path.join(REPO, rel));
  return `data:image/${rel.endsWith('.png') ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`;
};

// tamanho de um PNG (para recortar sem distorcer)
const tamanho = (rel) => { const b = fs.readFileSync(path.join(REPO, rel)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

const logoMini = `<svg class="logo-mini" viewBox="-10 -14 544 124">
  <clipPath id="pe-m"><rect x="-40" y="-40" width="620" height="143.5"/></clipPath>
  <g fill="none" stroke-width="9" stroke-linejoin="miter" stroke-miterlimit="4">
    <path d="M0 100 V0 L55 72 L110 0 V100 M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 M420 0 V100 M520 0 V100 M420 50 H520" stroke="#DFE3E7" stroke-linecap="square"/>
    <path d="M137.68 108 L196 0 L254.32 108" stroke="#FF6B1A" clip-path="url(#pe-m)"/>
  </g></svg>`;

const cantos = '<i class="ct c1"></i><i class="ct c2"></i><i class="ct c3"></i><i class="ct c4"></i>';

// Quadro HUD para o print do dia (vazio no modelo, com imagem nos exemplos)
// "recorte" = [x, y, largura, altura] em frações da imagem: mostra só esse pedaço, inteiro, centrado (fundo na cor "fundo").
const telaImagem = (imagem, foco, recorte, fundo) => {
  if (!recorte) return `<img src="${img(imagem)}" style="object-position:${foco}">`;
  const { w, h } = tamanho(imagem);
  const [x, y, rw, rh] = recorte;
  return `<div class="rec" style="aspect-ratio:${(rw * w) / (rh * h)}"><img src="${img(imagem)}" style="width:${100 / rw}%;height:${100 / rh}%;left:${(-x / rw) * 100}%;top:${(-y / rh) * 100}%"></div>`;
};
const quadro = ({ imagem, foco = '50% 50%', recorte, fundo, rotuloA, rotuloB, rodapeA, rodapeB, classe = '' }) => `
  <div class="quadro ${classe}">
    <span class="mono tag ta">${esc(rotuloA)}</span><span class="mono tag tb">${esc(rotuloB)}</span>
    <div class="tela${recorte ? ' com-recorte' : ''}"${fundo ? ` style="background:${fundo}"` : ''}>${imagem ? telaImagem(imagem, foco, recorte) : '<i class="mira"></i>'}</div>
    ${cantos}
    <span class="mono tag tc">${esc(rodapeA)}</span><span class="mono tag td">${esc(rodapeB)}</span>
  </div>`;

// Zona vazia para o sticker do Instagram, com a chamada (o único laranja da tela) logo acima
const zona = (chamada, altura, largura = 760) => `
  <p class="mono chamada">${esc(chamada)}</p>
  <div class="zona" style="height:${altura}px;width:${largura}px">${cantos}</div>`;

const cabecalho = (rotulo) => `<header class="cab">${logoMini}<span class="mono">${esc(rotulo)}</span></header>`;

const STORIES = [
  {
    arquivo: 's01-bancada-modelo.jpg',
    rotulo: 'Bancada · bastidor',
    html: `      <h1>Hoje na bancada.</h1>
      ${quadro({ rotuloA: 'Quadro do dia', rotuloB: 'Em produção · M 0.82', rodapeA: 'MACH Estúdio', rodapeB: '@mach.sites' })}`,
  },
  {
    arquivo: 's01-bancada-exemplo-filme.jpg',
    rotulo: 'Bancada · bastidor',
    html: `      <h1>Hoje na bancada.</h1>
      ${quadro({ imagem: 'instagram/recortes/filme-quadro-585.png', recorte: [0, 0.1875, 1, 0.6094], fundo: '#0a0a0a', rotuloA: 'Filme 30 s · quadro 585', rotuloB: 'Em produção · M 0.82', rodapeA: 'MACH Estúdio', rodapeB: '@mach.sites' })}
      <p class="legenda">Acertando o brilho da luz no giro.</p>`,
  },
  {
    arquivo: 's01-bancada-exemplo-site.jpg',
    rotulo: 'Bancada · bastidor',
    html: `      <h1>Hoje na bancada.</h1>
      ${quadro({ imagem: 'instagram/recortes/site-cartao-embarque.png', foco: '50% 50%', rotuloA: 'Site · formulário · celular', rotuloB: 'Em produção · M 0.82', rodapeA: 'MACH Estúdio', rodapeB: '@mach.sites', classe: 'cartao' })}
      <p class="legenda">O pedido vira cartão de embarque.</p>`,
  },
  {
    arquivo: 's01-post-do-dia-modelo.jpg',
    rotulo: 'No feed hoje',
    html: `      <h1>Post novo<br>no feed.</h1>
      ${quadro({ rotuloA: 'Post do dia', rotuloB: '4:5', rodapeA: '', rodapeB: '', classe: 'post' })}
      ${zona('Toque no link ↓', 140, 560)}`,
  },
  {
    arquivo: 's01-post-do-dia-exemplo.jpg',
    rotulo: 'No feed hoje',
    html: `      <h1>Post novo<br>no feed.</h1>
      ${quadro({ imagem: 'instagram/posts/raio-x-primeira-tela/slide-01.jpg', rotuloA: 'Post do dia', rotuloB: '4:5', rodapeA: '', rodapeB: '', classe: 'post' })}
      ${zona('Toque no link ↓', 140, 560)}`,
  },
  {
    arquivo: 's02-sexta-do-site.jpg',
    rotulo: 'Sexta do site',
    html: `      <h1 class="grande">Manda o link<br>do seu site.</h1>
      <p class="sub">Escolho um para analisar no sábado.</p>
      ${zona('Manda aqui ↓', 470)}
      <ul class="regras mono"><li>Só o seu próprio site.</li><li>Mandou, autorizou mostrar.</li></ul>`,
  },
  ...[1, 2].map((n) => ({
    arquivo: `s03-domingo-enquete-${n}.jpg`,
    rotulo: 'Domingo · você escolhe',
    html: `      <p class="mono olho">Votação ${n} de 2</p>
      <h1>Qual negócio ganha um site-conceito esta semana?</h1>
      ${zona('Vote ↓', 400)}
      <p class="sub pe">O mais votado sai na segunda.</p>`,
  })),
  {
    arquivo: 's04-contagem.jpg',
    rotulo: 'Contagem regressiva',
    html: `      <h1 class="grande">Nosso site<br>está quase no ar.</h1>
      <p class="sub">Até lá, uma prévia por dia.</p>
      ${zona('Ative o lembrete ↓', 400)}
      <div class="regua"><i class="trilho"></i>${Array.from({ length: 15 }, (_, k) => `<i class="tique${k % 5 === 0 ? ' alto' : ''}" style="left:${(k / 14) * 100}%"></i>`).join('')}
        <i class="ponteiro" style="left:${((0.97 - 0.4) / 0.8) * 100}%"></i>
        <span class="mono r0">M 0.40</span><span class="mono r1">M 0.97 · Transônico</span><span class="mono r2">M 1.20</span></div>`,
  },
];

const css = `
:root { --estrato:#0a0c0f; --titanio:#12161b; --linha:#252b32; --aluminio:#dfe3e7; --aluminio2:#b9c0c7; --nevoa:#8a929b; --laranja:#ff6b1a; }
* { box-sizing: border-box; }
html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
body { background: var(--estrato); color: var(--aluminio); font-family: "Hanken Grotesk", Arial, sans-serif; }
#fundo { position: absolute; inset: 0; background: radial-gradient(70% 40% at 15% 8%, #151b25 0%, rgba(20,26,36,0) 60%), linear-gradient(180deg, #0b0e13, var(--estrato) 60%); }
#ceu { position: absolute; inset: 0; }
main { position: absolute; left: 96px; right: 96px; top: ${TOPO + 26}px; bottom: ${H - BASE}px; display: flex; flex-direction: column; align-items: flex-start; }
.mono { font-family: "JetBrains Mono", monospace; letter-spacing: .12em; text-transform: uppercase; font-size: 22px; color: var(--nevoa); }
.cab { width: 100%; flex: none; display: flex; justify-content: space-between; align-items: center; }
.corpo { flex: 1; width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: flex-start; padding-bottom: 20px; }
.logo-mini { width: 150px; height: auto; }
h1 { font-family: "Saira", sans-serif; font-weight: 300; font-size: 96px; line-height: 1.0; letter-spacing: -.025em; margin: 0; }
h1.grande { font-size: 112px; line-height: .98; }
.olho { margin: 0 0 26px; letter-spacing: .18em; }
.sub { font-size: 40px; line-height: 1.3; color: var(--aluminio2); margin: 30px 0 0; }
.sub.pe { margin-top: 44px; font-size: 36px; }
.legenda { font-size: 36px; line-height: 1.3; color: var(--aluminio2); margin: 96px 0 0; }
/* quadro HUD */
.quadro { position: relative; width: 100%; height: 820px; margin-top: 96px; flex: none; }
.quadro.post { width: 480px; height: 600px; align-self: center; margin-top: 90px; }
.quadro.cartao .tela img { object-fit: contain; background: #12161b; padding: 40px; }
.tela { position: absolute; inset: 0; overflow: hidden; background: rgba(18,22,27,.55);
  background-image: linear-gradient(rgba(223,227,231,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(223,227,231,.035) 1px, transparent 1px); background-size: 74px 74px; background-position: center; box-shadow: 0 0 0 1px var(--linha); }
.tela img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tela.com-recorte { display: flex; align-items: center; justify-content: center; }
.rec { position: relative; height: 100%; max-width: 100%; overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent); }
.rec img { position: absolute; max-width: none; object-fit: fill; }
.mira { position: absolute; left: 50%; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; }
.mira::before, .mira::after { content: ""; position: absolute; background: rgba(223,227,231,.22); }
.mira::before { left: 31px; top: 0; width: 2px; height: 64px; }
.mira::after { top: 31px; left: 0; height: 2px; width: 64px; }
.ct { position: absolute; width: 48px; height: 48px; border: 0 solid rgba(223,227,231,.8); }
.ct.c1 { left: -16px; top: -16px; border-width: 3px 0 0 3px; }
.ct.c2 { right: -16px; top: -16px; border-width: 3px 3px 0 0; }
.ct.c3 { left: -16px; bottom: -16px; border-width: 0 0 3px 3px; }
.ct.c4 { right: -16px; bottom: -16px; border-width: 0 3px 3px 0; }
.tag { position: absolute; font-size: 19px; letter-spacing: .14em; white-space: nowrap; }
.ta { left: 0; top: -54px; } .tb { right: 0; top: -54px; }
.tc { left: 0; bottom: -54px; } .td { right: 0; bottom: -54px; }
/* zona do sticker */
.chamada { margin: 80px 0 0; align-self: center; color: var(--laranja); font-size: 24px; letter-spacing: .2em; }
.zona { position: relative; align-self: center; margin-top: 34px; flex: none; }
.regras { list-style: none; margin: 56px 0 0; padding: 0; align-self: center; text-align: center; display: grid; gap: 14px; font-size: 22px; }
/* régua da contagem */
.regua { position: relative; width: 100%; height: 90px; margin-top: 70px; }
.regua .trilho { position: absolute; left: 0; right: 0; top: 30px; height: 1px; background: var(--nevoa); opacity: .6; }
.regua .tique { position: absolute; top: 18px; width: 1px; height: 12px; background: var(--nevoa); }
.regua .tique.alto { top: 8px; height: 22px; }
.regua .ponteiro { position: absolute; top: 0; width: 2px; height: 42px; margin-left: -1px; background: var(--aluminio); box-shadow: 0 0 12px rgba(223,227,231,.5); }
.regua .mono { position: absolute; top: 56px; font-size: 18px; }
.regua .r0 { left: 0; } .regua .r2 { right: 0; } .regua .r1 { left: ${((0.97 - 0.4) / 0.8) * 100}%; transform: translateX(-60%); color: var(--aluminio); }
`;

const pagina = (rotulo, corpo, semente) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wdth,wght@75..125,200..700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style></head><body><div id="fundo"></div><canvas id="ceu" width="${W}" height="${H}"></canvas>
<main>${cabecalho(rotulo)}<div class="corpo">${corpo}</div></main>
<script>
const c = document.getElementById('ceu'), x = c.getContext('2d');
let s = ${semente}; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
const R = c.width * 2.2, cx = c.width / 2, cy = c.height + R - 230;
x.strokeStyle = 'rgba(140,180,255,.22)'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, R, Math.PI * 1.2, Math.PI * 1.8); x.stroke();
for (let i = 0; i < 230; i++) {
  const px = r() * c.width, py = r() * c.height, d = r(), len = 30 + 170 * d * d;
  x.strokeStyle = 'rgba(214,226,240,' + (0.03 + 0.12 * d * d) + ')';
  x.lineWidth = 1 + 1.4 * d; x.beginPath(); x.moveTo(px, py - len); x.lineTo(px, py); x.stroke();
}
</script></body></html>`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
let k = 0;
for (const st of STORIES) {
  await page.setContent(pagina(st.rotulo, st.html, 11 + 7 * k++), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  // zona segura: tudo o que tem conteúdo precisa ficar entre 250 px e 1580 px
  const fora = await page.evaluate(({ TOPO, BASE, W }) => {
    const out = [];
    document.querySelectorAll('main *').forEach((el) => {
      if (el.closest('svg') && el.tagName !== 'svg') return;
      if (el.classList.contains('ct')) return; // cantoneiras podem encostar na margem
      if (el.closest('.tela') && !el.classList.contains('tela')) return; // a moldura corta o que sobra da imagem
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.top < TOPO || r.bottom > BASE || r.left < 40 || r.right > W - 40) out.push(`${el.tagName.toLowerCase()}.${el.className} (${Math.round(r.top)}–${Math.round(r.bottom)})`);
    });
    return out;
  }, { TOPO, BASE, W });
  fora.forEach((f) => console.warn(`Atenção: ${st.arquivo}: ${f} fora da zona segura`));
  const out = path.join(AQUI, st.arquivo);
  await page.screenshot({ path: out, type: 'jpeg', quality: 92 });
  console.log(path.relative(REPO, out));
}
await browser.close();
