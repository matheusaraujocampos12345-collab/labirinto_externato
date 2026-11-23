// Gera o carrossel "5 sinais de que o seu site tem cara de template" (7 slides 1080×1350)
// como uma panorâmica contínua e recorta cada slide em PNG. Uso: node carrossel-sinais/gerar.mjs
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
const MARCA = path.join(ROOT, '..', 'marca-mach', 'svg');
const SW = 1080, SH = 1350, N = 7;

const assinatura = fs.readFileSync(path.join(MARCA, 'assinatura-escuro.svg'), 'utf8')
  .replace(/<title>.*?<\/title>/, '')
  .replace('<svg ', '<svg class="assin" ');

const logoMini = `<svg class="logo-mini" viewBox="-10 -14 544 124" aria-hidden="true">
  <clipPath id="pe-m{i}"><rect x="-40" y="-40" width="620" height="143.5"/></clipPath>
  <g fill="none" stroke-width="9" stroke-linejoin="miter" stroke-miterlimit="4">
    <path d="M0 100 V0 L55 72 L110 0 V100 M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 M420 0 V100 M520 0 V100 M420 50 H520" stroke="#DFE3E7" stroke-linecap="square"/>
    <path d="M137.68 108 L196 0 L254.32 108" stroke="#FF6B1A" clip-path="url(#pe-m{i})"/>
  </g></svg>`;

const jato = (cls = '') => `<svg class="jato ${cls}" viewBox="-20 -24 148 236" aria-hidden="true">
  <clipPath id="pe-j${cls}"><rect x="-40" y="-40" width="200" height="144.5"/></clipPath>
  <path d="M-4.32 108 L54 0 L112.32 108" fill="none" stroke="#FF6B1A" stroke-width="9" clip-path="url(#pe-j${cls})"/>
  <path d="M54 114 L63 128 L54 142 L45 128 Z" fill="#FF6B1A"/>
  <path d="M54 147 L60.5 157 L54 167 L47.5 157 Z" fill="#FF6B1A" opacity=".62"/>
  <path d="M54 173 L58.5 180 L54 187 L49.5 180 Z" fill="#FF6B1A" opacity=".34"/>
</svg>`;

const tpl = (nome, cor, extra = '') => `<div class="tpl" style="--a:${cor};${extra}">
  <div class="tpl-bar"><span>${nome.toLowerCase()}.com.br</span></div>
  <div class="tpl-hero"><div class="tpl-nav"><b>◉ ${nome}</b><s></s></div>
    <p class="tpl-h">Eleve seu negócio<br><em>ao próximo nível</em></p>
    <p class="tpl-sub">Soluções inovadoras e<br>tecnologia de ponta</p>
    <span class="tpl-btn">Comece agora →</span>
    <div class="tpl-bolhas"><i></i><i></i><i></i><i></i></div></div>
  <div class="tpl-cards"><div><i></i>Rápido</div><div><i></i>Seguro</div><div><i></i>Escalável</div></div>
</div>`;

// velocidade mostrada em cada slide (a "pista" atravessa o carrossel)
const MACH = [0.4, 0.52, 0.64, 0.76, 0.88, 0.97, 1.2];
const estado = (m) => (m >= 1 ? 'Supersônico' : m >= 0.8 ? 'Transônico' : 'Subsônico');

const dias = (n) => '<span class="dias">' + [0, 1, 2, 3, 4].map((k) => `<i${k < n ? ' class="on"' : ''}></i>`).join('') + '</span>';
const sinal = (n, titulo, ilus, texto) => `<p class="eyebrow">Sinal ${String(n).padStart(2, '0')} ${dias(n)}</p>
   <h2>${titulo}</h2>
   ${ilus}
   <p class="texto">${texto}</p>`;

const slides = [
  // 1 — capa
  `<p class="eyebrow">Checklist</p>
   <h1 class="h1-sinais">5 sinais de que o seu site tem <b>cara de template</b>.</h1>
   <div class="inspecao">
     ${tpl('Nexora', '#ff3d8b')}
     <i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>
     <i class="scan"></i>
   </div>
   <p class="arraste mono">Conte quantos o seu tem <span>→</span></p>`,
  // 2–6 — os sinais
  sinal(1, 'Degradê roxo-azul no topo.',
    `<div class="ilus degrade"><span class="hex h1">#7A2FF2</span><span class="hex h2">#2E78FF</span></div>`,
    'Virou o uniforme dos sites feitos com pressa.'),
  sinal(2, 'Uma frase que serve para qualquer empresa.',
    `<div class="ilus degrade frase"><p>Eleve seu negócio<br><em>ao próximo nível</em></p><span class="pill">Comece agora →</span></div>`,
    'Se cabe no site de todo mundo, não fala do seu.'),
  sinal(3, 'Três cards com ícones genéricos.',
    `<div class="ilus cards3">
       <div><i></i><b>Rápido</b><small>Resultados em tempo recorde.</small></div>
       <div><i></i><b>Seguro</b><small>Proteção total para seus dados.</small></div>
       <div><i></i><b>Escalável</b><small>Cresça sem limites.</small></div>
     </div>`,
    'Todo mundo promete o mesmo. Ninguém lembra de nenhum.'),
  sinal(4, 'Bolhas 3D brilhantes sem motivo.',
    `<div class="ilus degrade bolhas"><i class="b1"></i><i class="b2"></i><i class="b3"></i><i class="b4"></i><i class="b5"></i><s class="s1"></s><s class="s2"></s><s class="s3"></s></div>`,
    'Enfeite que não mostra nada do seu produto.'),
  sinal(5, 'Animação no automático.',
    `<div class="ilus fade">
       <span class="fb f4">Saiba mais</span><span class="fb f3">Saiba mais</span><span class="fb f2">Saiba mais</span><span class="fb f1">Saiba mais</span>
       <p class="mono rotulo">fade-in-up · 0,3 s · em todos os elementos</p>
     </div>`,
    'O mesmo “aparecer de baixo” em tudo. Ou nada se mexe.'),
  // 7 — chamada
  `<div class="anel" aria-hidden="true"></div>
   <div class="final">
     ${assinatura}
     <h2>Reconheceu algum no seu site?</h2>
     <p class="texto centro">A gente redesenha do zero, com movimento de verdade.</p>
     <p class="botao">Chama no direct</p>
     <p class="mono arroba">@mach.sites</p>
   </div>`,
];

const css = `
:root { --estrato:#0a0c0f; --titanio:#12161b; --linha:#252b32; --aluminio:#dfe3e7; --aluminio2:#b9c0c7; --nevoa:#8a929b; --laranja:#ff6b1a; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--estrato); color: var(--aluminio); font-family: "Hanken Grotesk", Arial, sans-serif; -webkit-font-smoothing: antialiased; }
#pano { position: relative; width: ${SW * N}px; height: ${SH}px; overflow: hidden;
  background: radial-gradient(60% 50% at 10% 0%, #141a24 0%, rgba(20,26,36,0) 60%), radial-gradient(50% 45% at 72% 10%, #121822 0%, rgba(18,24,34,0) 60%), linear-gradient(180deg, #0b0e13, var(--estrato) 70%); }
#ceu { position: absolute; inset: 0; }
.slide { position: absolute; top: 0; width: ${SW}px; height: ${SH}px; padding: 150px 96px 0; display: flex; flex-direction: column; isolation: isolate; }
.slide.corta { overflow: hidden; }
.topo { position: absolute; left: 96px; right: 96px; top: 64px; display: flex; justify-content: space-between; align-items: center; }
.logo-mini { width: 128px; height: auto; }
.mono { font-family: "JetBrains Mono", monospace; letter-spacing: .08em; text-transform: uppercase; font-size: 20px; color: var(--nevoa); }
.pag { font-size: 20px; }
.eyebrow { font-family: "JetBrains Mono", monospace; font-size: 22px; letter-spacing: .16em; text-transform: uppercase; color: var(--nevoa); margin: 30px 0 26px; }
.eyebrow.laranja { color: var(--laranja); }
h1, h2 { font-family: "Saira", sans-serif; font-weight: 300; letter-spacing: -.02em; margin: 0; }
h2 { font-size: 84px; line-height: 1.02; }
.texto { font-size: 38px; line-height: 1.4; color: var(--aluminio2); margin: 22px 0 0; max-width: 860px; }
.texto strong { color: var(--aluminio); font-weight: 600; }
/* capa */
.capa { height: 100%; display: flex; flex-direction: column; }
.capa-jato { height: 470px; display: flex; justify-content: center; margin-top: 10px; }
.jato { height: 100%; width: auto; overflow: visible; }
.capa h1 { font-size: 104px; line-height: .98; margin-top: 40px; }
.capa h1 b { font-weight: 500; font-stretch: 125%; letter-spacing: .06em; }
.arraste { margin-top: 44px; color: var(--aluminio2); font-size: 22px; }
.arraste span { color: var(--laranja); margin-left: 8px; }
/* nome */
.formula { font-family: "Saira", sans-serif; font-stretch: 125%; font-weight: 250; font-size: 210px; line-height: 1; letter-spacing: .04em; display: flex; flex-direction: column; gap: 10px; margin: 20px 0 50px; }
.formula .mais { font-size: 150px; color: var(--nevoa); }
.formula b { color: var(--laranja); font-weight: 300; }
.formula i { font-style: italic; font-weight: 200; color: var(--aluminio2); }
.formula + .legenda { margin: -20px 0 40px; }
/* mach 1 */
.numero { font-family: "Saira", sans-serif; font-weight: 250; font-size: 230px; line-height: .9; letter-spacing: -.03em; margin: 0; }
.numero small { font-size: 62px; color: var(--nevoa); margin-left: 18px; letter-spacing: 0; }
.legenda { margin: 22px 0 0; }
.cone { width: 560px; height: auto; margin: 40px 0 10px; }
/* problema */
.caixas { font-family: "Hanken Grotesk", sans-serif; font-weight: 600; font-size: 74px; letter-spacing: -.01em; line-height: 1.15; }
.caixas span { display: inline-block; background: #fff; color: #0d0d10; padding: .04em .3em .08em; }
.caixas .inv { background: #0d0d10; color: #fff; box-shadow: 0 0 0 2px rgba(255,255,255,.3); }
.pilha { position: relative; height: 560px; margin: 46px 0 6px; }
.contador { position: absolute; right: 30px; bottom: 30px; display: flex; align-items: center; gap: 12px; padding: 14px 22px; background: rgba(14,14,18,.92); color: #fff; font-size: 24px; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
.contador i { width: 12px; height: 12px; border-radius: 50%; background: #ff3b3b; }
.tpl { container-type: inline-size; position: absolute; left: 50%; top: 0; width: 300px; margin-left: -150px; aspect-ratio: 9/16; overflow: hidden; border-radius: 16px; background: #f4f3ff; font-family: Arial, "Liberation Sans", sans-serif; box-shadow: 0 30px 70px rgba(0,0,0,.6); height: auto; max-height: 534px; }
.tpl-bar { height: 7.5%; background: #f0f0f4; display: flex; align-items: center; padding: 0 5cqw; }
.tpl-bar span { flex: 1; height: 58%; background: #e2e2ea; border-radius: 99px; display: flex; align-items: center; justify-content: center; font-size: 3.4cqw; color: #444; }
.tpl-hero { position: relative; height: 63%; padding: 4cqw 6cqw 0; color: #fff; text-align: center; background: radial-gradient(60% 40% at 90% 12%, rgba(255,110,220,.55), transparent 70%), radial-gradient(60% 45% at 5% 75%, rgba(0,225,255,.4), transparent 70%), linear-gradient(135deg, #7a2ff2, #5b47f5 50%, #2e78ff); clip-path: ellipse(120% 100% at 50% 0%); }
.tpl-nav { display: flex; justify-content: space-between; align-items: center; font-weight: 700; font-size: 4.6cqw; }
.tpl-nav s { width: 7cqw; height: 4cqw; border-block: .9cqw solid #fff; }
.tpl-h { margin: 8cqw 0 0; font-weight: 700; font-size: 8.2cqw; line-height: 1.08; }
.tpl-h em { font-style: normal; color: var(--a); }
.tpl-sub { margin: 3cqw 0 0; font-size: 3.6cqw; opacity: .85; line-height: 1.35; }
.tpl-btn { display: inline-block; margin-top: 4.5cqw; padding: 3cqw 8cqw; border-radius: 99px; background: var(--a); color: #fff; font-weight: 700; font-size: 4.2cqw; box-shadow: 0 2cqw 6cqw var(--a); }
.tpl-bolhas { position: absolute; left: 0; right: 0; bottom: 2cqw; height: 38cqw; }
.tpl-bolhas i { position: absolute; border-radius: 50%; background: radial-gradient(circle at 32% 28%, #fff7fe 0%, #f59bff 28%, #9a45ff 70%, #3b138f 100%); box-shadow: inset -2cqw -3cqw 6cqw rgba(110,255,245,.45); }
.tpl-bolhas i:nth-child(1) { width: 30cqw; height: 30cqw; left: 36cqw; top: 2cqw; }
.tpl-bolhas i:nth-child(2) { width: 19cqw; height: 19cqw; left: 16cqw; top: 12cqw; background: radial-gradient(circle at 32% 28%, #effcff 0%, #8fe1ff 28%, #4f6bff 70%, #1d2190 100%); }
.tpl-bolhas i:nth-child(3) { width: 17cqw; height: 17cqw; left: 66cqw; top: 15cqw; }
.tpl-bolhas i:nth-child(4) { width: 8cqw; height: 8cqw; left: 72cqw; top: 2cqw; }
.tpl-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3cqw; padding: 0 5cqw; margin-top: -10cqw; position: relative; }
.tpl-cards div { background: #fff; border-radius: 3cqw; padding: 4cqw 2cqw; text-align: center; font-size: 3.4cqw; font-weight: 700; color: #1b1740; }
.tpl-cards i { display: block; width: 9cqw; height: 9cqw; margin: 0 auto 2.4cqw; border-radius: 50%; background: linear-gradient(135deg, var(--a), #6a3cf3); }
/* o que fazemos */
.anel { position: absolute; z-index: -1; left: -560px; top: 160px; width: 1120px; height: 1120px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(255,107,26,.55), 0 0 0 90px rgba(255,255,255,.02), 0 0 0 91px rgba(223,227,231,.12); pointer-events: none; }
.ficha { list-style: none; margin: 46px 0 10px; padding: 0; border-bottom: 1px solid var(--linha); }
.ficha li { display: flex; align-items: baseline; gap: 34px; padding: 28px 0; border-top: 1px solid var(--linha); font-family: "Saira", sans-serif; font-weight: 400; font-size: 54px; line-height: 1.1; }
.ficha .mono { color: var(--laranja); font-size: 22px; min-width: 120px; }
/* nosso jeito */
.regras { list-style: none; margin: 40px 0 0; padding: 0; display: grid; gap: 34px; }
.regras li { display: grid; gap: 8px; padding-left: 44px; position: relative; }
.regras li::before { content: ""; position: absolute; left: 4px; top: 18px; width: 16px; height: 16px; background: var(--laranja); transform: rotate(45deg); }
.regras b { font-family: "Saira", sans-serif; font-weight: 400; font-size: 52px; line-height: 1.1; }
.regras span { font-size: 34px; color: var(--aluminio2); line-height: 1.35; }
.numeros { display: grid; grid-template-columns: repeat(3, 1fr); margin: 56px 0 0; border-top: 1px solid var(--linha); }
.numeros div { padding: 24px 16px 0 0; }
.numeros div + div { padding-left: 24px; border-left: 1px solid var(--linha); }
.numeros dd { margin: 0; font-family: "Saira", sans-serif; font-weight: 250; font-size: 96px; line-height: 1; }
.numeros dt { font-family: "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: .08em; font-size: 20px; color: var(--nevoa); margin-top: 10px; }
/* final */
.final { height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 70px; }
.assin { width: 720px; height: auto; }
.final h2 { font-size: 74px; line-height: 1.06; margin-top: 70px; max-width: 860px; }
.botao { margin: 64px 0 0; padding: 30px 56px; font-weight: 600; font-size: 38px; color: var(--estrato); background: var(--laranja); clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
.arroba { margin-top: 34px; font-size: 28px; color: var(--aluminio2); text-transform: none; }

/* carrossel sinais */
.h1-sinais { font-size: 96px; line-height: 1.0; margin: 0; }
.h1-sinais b { font-weight: 400; color: var(--laranja); }
.inspecao { position: relative; height: 500px; margin: 48px 0 0; }
.inspecao .tpl { width: 270px; margin-left: -135px; transform: rotate(-3deg); }
.inspecao .c { position: absolute; width: 46px; height: 46px; border: 0 solid var(--laranja); }
.inspecao .c1 { left: 268px; top: -14px; border-width: 3px 0 0 3px; }
.inspecao .c2 { right: 268px; top: -14px; border-width: 3px 3px 0 0; }
.inspecao .c3 { left: 268px; bottom: -6px; border-width: 0 0 3px 3px; }
.inspecao .c4 { right: 268px; bottom: -6px; border-width: 0 3px 3px 0; }
.inspecao .scan { position: absolute; left: 250px; right: 250px; top: 44%; height: 3px; background: var(--laranja); box-shadow: 0 0 24px 6px rgba(255,107,26,.45); }
.dias { display: inline-flex; gap: 12px; margin-left: 22px; vertical-align: 2px; }
.dias i { display: inline-block; width: 13px; height: 13px; transform: rotate(45deg); box-shadow: inset 0 0 0 1.5px var(--nevoa); }
.dias i.on { background: var(--laranja); box-shadow: none; }
.slide h2 { margin-top: 4px; }
.ilus { position: relative; height: 460px; margin: 46px 0 6px; border-radius: 28px; overflow: hidden; font-family: Arial, "Liberation Sans", sans-serif; }
.degrade { background: radial-gradient(60% 50% at 88% 10%, rgba(255,110,220,.55), transparent 70%), radial-gradient(60% 55% at 5% 85%, rgba(0,225,255,.4), transparent 70%), linear-gradient(135deg, #7a2ff2, #5b47f5 50%, #2e78ff); }
.hex { position: absolute; bottom: 28px; font-family: "JetBrains Mono", monospace; font-size: 24px; color: rgba(255,255,255,.9); letter-spacing: .06em; }
.hex.h1 { left: 34px; } .hex.h2 { right: 34px; }
.frase { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; }
.frase p { margin: 0; font-weight: 700; font-size: 66px; line-height: 1.08; }
.frase em { font-style: normal; color: #ff3d8b; }
.frase .pill { margin-top: 36px; padding: 20px 48px; border-radius: 99px; background: #ff3d8b; font-weight: 700; font-size: 30px; box-shadow: 0 12px 40px rgba(255,61,139,.7); }
.cards3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; padding: 44px 34px; background: #f4f3ff; }
.cards3 div { background: #fff; border-radius: 24px; padding: 34px 16px; text-align: center; box-shadow: 0 14px 34px rgba(60,40,150,.18); display: flex; flex-direction: column; align-items: center; gap: 14px; }
.cards3 i { width: 96px; height: 96px; border-radius: 50%; background: linear-gradient(135deg, #ff3d8b, #6a3cf3); }
.cards3 b { font-size: 36px; color: #1b1740; }
.cards3 small { font-size: 22px; color: #6c6896; line-height: 1.3; }
.bolhas i { position: absolute; border-radius: 50%; background: radial-gradient(circle at 32% 28%, #fff7fe 0%, #f59bff 28%, #9a45ff 70%, #3b138f 100%); box-shadow: inset -14px -20px 40px rgba(110,255,245,.45), 0 30px 50px rgba(40,10,120,.45); }
.bolhas .b1 { width: 280px; height: 280px; left: 340px; top: 70px; }
.bolhas .b2 { width: 170px; height: 170px; left: 150px; top: 200px; background: radial-gradient(circle at 32% 28%, #effcff 0%, #8fe1ff 28%, #4f6bff 70%, #1d2190 100%); }
.bolhas .b3 { width: 150px; height: 150px; left: 650px; top: 230px; }
.bolhas .b4 { width: 80px; height: 80px; left: 680px; top: 70px; background: radial-gradient(circle at 32% 28%, #effcff 0%, #8fe1ff 28%, #4f6bff 70%, #1d2190 100%); }
.bolhas .b5 { width: 56px; height: 56px; left: 250px; top: 90px; }
.bolhas s { position: absolute; width: 44px; height: 44px; background: #fff; clip-path: polygon(50% 0, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0 50%, 40% 40%); filter: drop-shadow(0 0 10px #fff); }
.bolhas .s1 { left: 110px; top: 70px; } .bolhas .s2 { left: 790px; top: 170px; width: 30px; height: 30px; } .bolhas .s3 { left: 560px; top: 380px; width: 26px; height: 26px; }
.fade { background: var(--titanio); box-shadow: inset 0 0 0 1px var(--linha); }
.fade .fb { position: absolute; left: 50%; transform: translateX(-50%); padding: 24px 64px; border-radius: 99px; background: #5b47f5; color: #fff; font-weight: 700; font-size: 32px; white-space: nowrap; }
.fade .f1 { top: 270px; } .fade .f2 { top: 200px; opacity: .42; } .fade .f3 { top: 130px; opacity: .2; } .fade .f4 { top: 60px; opacity: .08; }
.fade .rotulo { position: absolute; left: 0; right: 0; bottom: 26px; text-align: center; font-size: 20px; }
.final .texto.centro { text-align: center; margin: 24px auto 0; }
.final h2 { margin-top: 64px; }
/* pista contínua (atravessa todos os slides) */
.pista { position: absolute; left: 0; right: 0; top: 1240px; height: 1px; background: var(--linha); }
.pista-quente { position: absolute; top: 1240px; height: 2px; margin-top: -0.5px; background: var(--laranja); }
.marca { position: absolute; top: 1210px; width: 1px; height: 30px; background: var(--nevoa); }
.leitura { position: absolute; top: 1262px; font-size: 20px; }
.leitura b { color: var(--aluminio); font-weight: 500; margin-right: 14px; }
.leitura.super, .leitura.super b { color: var(--laranja); }
.barreira-txt { position: absolute; top: 1172px; font-size: 18px; color: var(--laranja); transform: translateX(-100%); padding-right: 14px; }
`;

let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wdth,wght@75..125,200..700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style></head><body><div id="pano"><canvas id="ceu" width="${SW * N}" height="${SH}"></canvas>
<div class="pista"></div>`;

// marcas da pista
for (let x = 40; x < SW * N; x += 60) html += `<div class="marca" style="left:${x}px;height:${x % 300 === 40 ? 22 : 10}px;top:${x % 300 === 40 ? 1218 : 1230}px"></div>`;
// trecho supersônico (a partir da barreira, entre os slides 4 e 5)
const xBarreira = SW * 6;
html += `<div class="pista-quente" style="left:${xBarreira}px;right:0"></div>`;
html += `<div class="marca" style="left:${xBarreira}px;top:1150px;height:90px;background:var(--laranja)"></div>`;
html += `<p class="mono barreira-txt" style="left:${xBarreira}px">M 1.0</p>`;

slides.forEach((conteudo, i) => {
  const m = MACH[i];
  html += `<section class="slide${i === 6 ? ' corta' : ''}" style="left:${i * SW}px">
    <div class="topo">${logoMini.replaceAll('{i}', i)}<span class="mono pag">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</span></div>
    ${conteudo}
    <p class="mono leitura ${m >= 1 ? 'super' : ''}" style="left:96px"><b>M ${m.toFixed(2)}</b>${estado(m)}</p>
  </section>`;
});

html += `</div><script>
const c = document.getElementById('ceu'), x = c.getContext('2d');
let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
const W = c.width, H = c.height;
// horizonte curvo contínuo
const R = W * 1.6, cx = W / 2, cy = H + R - 190;
const g = x.createRadialGradient(cx, cy, R * .995, cx, cy, R * 1.01);
g.addColorStop(0, 'rgba(70,120,200,.18)'); g.addColorStop(1, 'rgba(70,120,200,0)');
x.fillStyle = g; x.fillRect(0, H - 400, W, 400);
x.strokeStyle = 'rgba(140,180,255,.22)'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, R, Math.PI * 1.25, Math.PI * 1.75); x.stroke();
// riscos de ar (mais longos conforme a velocidade de cada slide)
const MACH = ${JSON.stringify(MACH)};
for (let i = 0; i < 900; i++) {
  const px = r() * W, py = r() * H, d = r();
  const m = MACH[Math.min(${N - 1}, Math.floor(px / ${SW}))];
  const len = (20 + 160 * d * d) * m;
  x.strokeStyle = 'rgba(214,226,240,' + (0.03 + 0.14 * d * d) + ')';
  x.lineWidth = 1 + 1.4 * d; x.beginPath(); x.moveTo(px, py - len); x.lineTo(px, py); x.stroke();
}
</script></body></html>`;

fs.writeFileSync(path.join(ROOT, 'carrossel.html'), html);

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: SW * N, height: SH }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(ROOT, 'carrossel.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
fs.mkdirSync(path.join(ROOT, 'slides'), { recursive: true });
for (let i = 0; i < N; i++) {
  const out = path.join(ROOT, 'slides', `mach-sinais-${String(i + 1).padStart(2, '0')}.png`);
  await page.screenshot({ path: out, clip: { x: i * SW, y: 0, width: SW, height: SH } });
  console.log(path.relative(ROOT, out));
}
await page.screenshot({ path: path.join(ROOT, 'panoramica.png'), clip: { x: 0, y: 0, width: SW * N, height: SH } });
await browser.close();
