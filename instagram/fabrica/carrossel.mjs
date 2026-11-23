// Fábrica de carrosséis MACH: transforma um arquivo de texto (JSON) em slides 1080×1350 prontos.
// Uso: node instagram/fabrica/carrossel.mjs instagram/posts/como-funciona.json
// Saída: instagram/posts/<nome>/slide-XX.png + slide-XX.jpg + legenda.txt
//
// Tipos de slide aceitos no JSON:
//   { "tipo": "capa", "eyebrow": "...", "titulo": "...", "destaque": "parte do título em laranja", "rodape": "Arraste →", "jato": true }
//   { "tipo": "texto", "eyebrow": "...", "titulo": "...", "texto": ["parágrafo", "parágrafo"] }
//   { "tipo": "lista", "eyebrow": "...", "titulo": "...", "itens": [{ "titulo": "...", "texto": "..." }] }
//   { "tipo": "passos", "eyebrow": "...", "titulo": "...", "inicio": 1, "passos": [{ "titulo": "...", "texto": "..." }] }
//   { "tipo": "numeros", "eyebrow": "...", "titulo": "...", "numeros": [["0", "Templates"], ["100%", "Sob medida"]] }
//   { "tipo": "chamada", "titulo": "...", "texto": "...", "botao": "Chama no direct", "arroba": "@mach.sites" }
//
//   { "tipo": "imagem-anotada", "eyebrow": "...", "titulo": "frase curta",
//     "imagem": "instagram/recortes/site-celular-primeira-tela.png", "recorte": [0, 0.45, 1, 0.3],
//     "marcadores": [{ "x": 0.3, "y": 0.4, "texto": "O que este ponto mostra." }], "foco": 1, "rotuloImagem": "Celular" }
//       Um recorte de site com 1 a 3 marcadores numerados e a legenda de cada um embaixo.
//       "recorte" = [x, y, largura, altura] em frações da imagem (0 a 1); sem ele, a imagem inteira.
//       "x" e "y" de cada marcador = posição dentro do recorte, também de 0 a 1.
//       "foco" = número do marcador que fica laranja (padrão 1; 0 deixa todos claros).
//       A imagem sai em "raio-X" (preto e branco) para o laranja ficar só no marcador; "cores": true mantém as cores.
//       "altura" (px) limita o tamanho da imagem. "rotuloImagem" é a etiqueta em mono acima da imagem.
//       "lado": true põe a imagem à esquerda e as legendas à direita (bom para recorte alto, de celular).
//       "desfoque": 8 borra a imagem (px), para mostrar "o que o olho pega de relance". "grande": true aumenta o título.
//       "texto" opcional entra depois das legendas. "varredura": 0.4 desenha a linha de varredura nessa altura.
//       "sangria": true leva a imagem de ponta a ponta (sem marcadores), cortada para caber; "foco": [0.5, 0.4]
//       escolhe o ponto da imagem que fica no centro do corte.
//   { "tipo": "mito", "eyebrow": "Frase 01 / 05", "frase": "Animação deixa o site lento.", "selo": "DEPENDE",
//     "resposta": "Resposta curta.", "texto": "Uma linha de apoio (opcional)." }
//       A frase do mito entre aspas, o selo ("MITO", "DEPENDE" ou "VERDADE") e a resposta.
//   { "tipo": "frase", "titulo": "Frase grande.\nCom quebra de linha.", "destaque": "...", "assinatura": "@mach.sites" }
//       Para foto única (manifesto): só a frase grande, a assinatura em mono e o Λ laranja pequeno no canto.
//       Sem logo no topo e sem contador. Evite "destaque" aqui: o Λ já é o laranja da peça.
//   { "tipo": "foto", "imagem": "caminho/da/tela.jpg", "titulo": "Frase pequena embaixo.", "assinatura": "@mach.sites" }
//       Para foto única "quadro-herói": a imagem inteira, grande e com cantos arredondados, sobre um fundo feito
//       com ela mesma desfocada; a frase pequena e a assinatura embaixo. Sem logo, sem contador e sem régua.
//       "fundoDesfocado": false troca o fundo desfocado pelo céu escuro da MACH. "brilhoFundo": 0.58 (padrão) clareia ou escurece o fundo.
//   { "tipo": "paleta", "eyebrow": "...", "titulo": "...", "cores": [{ "hex": "#05020A", "nome": "Forno", "origem": "Dentro do forno" }], "texto": "..." }
//       Amostras de cor em grade de 4 colunas, com nome, código e de onde a cor saiu.
//
// Campos opcionais que valem para vários tipos:
//   "progresso": [3, 8]   → diamantes de progresso ao lado do eyebrow (como no carrossel "5 sinais")
//   "rotulo": "..."       → no tipo "texto": etiqueta em mono, com um traço, entre o título e o texto
//   "grande": true        → no tipo "texto": título maior (bom para o 2º slide, que funciona como segunda capa)
//   "imagem" e "recorte"  → no tipo "capa": mostra um recorte (em raio-X) abaixo do título, com cantoneiras de mira
//                           (aceita os mesmos campos de imagem do tipo "imagem-anotada", menos marcadores)
//   "texto"               → no tipo "passos": parágrafo depois da lista
//   "\n" no título        → quebra a linha nesse ponto
//   "aspas": true         → no tipo "capa": aspas gigantes, discretas, no fundo
//   "checklist": ["...", "..."] → no tipo "capa": lista de checagem (número, item, pontilhado e caixinha vazia)
//   "numero": "01"        → no tipo "texto": número gigante vazado no fundo, no canto de baixo
// No nível do arquivo:
//   "regua": false        → tira a régua de velocidade (ela já sai sozinha quando o post tem um slide só)
//
// Regra da marca: no máximo UM destaque laranja por slide (o Λ do logo e a régua não contam).
// Depois de gerar, a fábrica avisa no terminal se algum texto passou da margem.
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
const REPO = path.resolve(AQUI, '..', '..');
const SW = 1080, SH = 1350;

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('Uso: node instagram/fabrica/carrossel.mjs instagram/posts/<nome>.json');
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(path.resolve(arquivo), 'utf8'));
const slug = spec.slug || path.basename(arquivo, '.json');
const saida = path.resolve(path.dirname(arquivo), slug);
const N = spec.slides.length;
const REGUA = spec.regua ?? N > 1; // post de um slide só (foto) sai sem a régua de velocidade

// Imagens entram no HTML como data URI. O caminho vale a partir da pasta do JSON ou da raiz do repositório.
function tamanhoImagem(buf) {
  if (buf.readUInt32BE(0) === 0x89504e47) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), tipo: 'image/png' };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i < buf.length - 9; ) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), tipo: 'image/jpeg' };
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  throw new Error('A imagem precisa ser PNG ou JPG.');
}
const imagens = new Map();
function carregarImagem(rel) {
  if (imagens.has(rel)) return imagens.get(rel);
  const arq = [path.resolve(path.dirname(path.resolve(arquivo)), rel), path.resolve(REPO, rel)].find((a) => fs.existsSync(a));
  if (!arq) throw new Error(`Imagem não encontrada: ${rel}`);
  const buf = fs.readFileSync(arq);
  const { w, h, tipo } = tamanhoImagem(buf);
  const img = { uri: `data:${tipo};base64,${buf.toString('base64')}`, w, h };
  imagens.set(rel, img);
  return img;
}

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const assinatura = fs.readFileSync(path.join(REPO, 'marca-mach', 'svg', 'assinatura-escuro.svg'), 'utf8')
  .replace(/<title>.*?<\/title>/, '').replace('<svg ', '<svg class="assin" ');
const logoMini = (i) => `<svg class="logo-mini" viewBox="-10 -14 544 124">
  <clipPath id="pe-m${i}"><rect x="-40" y="-40" width="620" height="143.5"/></clipPath>
  <g fill="none" stroke-width="9" stroke-linejoin="miter" stroke-miterlimit="4">
    <path d="M0 100 V0 L55 72 L110 0 V100 M390 0 H312 Q282 0 282 30 V70 Q282 100 312 100 H390 M420 0 V100 M520 0 V100 M420 50 H520" stroke="#DFE3E7" stroke-linecap="square"/>
    <path d="M137.68 108 L196 0 L254.32 108" stroke="#FF6B1A" clip-path="url(#pe-m${i})"/>
  </g></svg>`;
const jato = `<svg class="jato" viewBox="-20 -24 148 236">
  <clipPath id="pe-j"><rect x="-40" y="-40" width="200" height="144.5"/></clipPath>
  <path d="M-4.32 108 L54 0 L112.32 108" fill="none" stroke="#FF6B1A" stroke-width="9" clip-path="url(#pe-j)"/>
  <path d="M54 114 L63 128 L54 142 L45 128 Z" fill="#FF6B1A"/>
  <path d="M54 147 L60.5 157 L54 167 L47.5 157 Z" fill="#FF6B1A" opacity=".62"/>
  <path d="M54 173 L58.5 180 L54 187 L49.5 180 Z" fill="#FF6B1A" opacity=".34"/></svg>`;

const comDestaque = (titulo, destaque) =>
  (destaque && titulo.includes(destaque) ? esc(titulo).replace(esc(destaque), `<b>${esc(destaque)}</b>`) : esc(titulo)).replace(/\n/g, '<br>');
const paragrafos = (t) => (Array.isArray(t) ? t : t ? [t] : []).map((p) => `<p class="texto">${esc(p)}</p>`).join('');
const progresso = (p) => (Array.isArray(p) ? `<span class="dias">${Array.from({ length: p[1] }, (_, k) => `<i${k < p[0] ? ' class="on"' : ''}></i>`).join('')}</span>` : '');
const eyebrow = (s, laranja, prog) => (s ? `<p class="eyebrow${laranja ? ' laranja' : ''}">${esc(s)}${progresso(prog)}</p>` : '');
const cab = (s) => eyebrow(s.eyebrow, s.laranja, s.progresso);

// Recorte de imagem com cantoneiras de mira e marcadores numerados. O tamanho final é calculado no navegador
// (função encaixar), para a imagem ocupar o espaço que sobra no slide sem empurrar o texto para fora.
const figura = (s, { marcadores = [] } = {}) => {
  const img = carregarImagem(s.imagem);
  const [x, y, w, h] = s.recorte || [0, 0, 1, 1];
  const r = (w * img.w) / (h * img.h);
  const foco = s.foco ?? 1;
  const filtro = s.desfoque ? ` style="--desfoque:${+s.desfoque}px"` : '';
  if (s.sangria) {
    const [fx, fy] = s.foco || [0.5, 0.5];
    return `<div class="fig-area sangria" data-r="0" data-maxh="${s.altura || 9999}">
      <figure class="fig"><div class="fig-img${s.cores ? '' : ' raiox'}"><img src="${img.uri}" style="object-position:${fx * 100}% ${fy * 100}%"></div>
        ${s.rotuloImagem ? `<span class="mono fig-tag">${esc(s.rotuloImagem)}</span>` : ''}</figure></div>`;
  }
  return `<div class="fig-area" data-r="${r.toFixed(5)}" data-maxh="${s.altura || 9999}">
      <figure class="fig">
        <div class="fig-img${s.cores ? '' : ' raiox'}${s.desfoque ? ' desfoque' : ''}"${filtro}><img src="${img.uri}" style="width:${100 / w}%;height:${100 / h}%;left:${(-x / w) * 100}%;top:${(-y / h) * 100}%"></div>
        <i class="canto c1"></i><i class="canto c2"></i><i class="canto c3"></i><i class="canto c4"></i>
        ${s.rotuloImagem ? `<span class="mono fig-tag">${esc(s.rotuloImagem)}</span>` : ''}
        ${s.varredura ? `<i class="varredura" style="top:${s.varredura * 100}%"></i>` : ''}
        ${marcadores.map((m, k) => `<span class="pino${k + 1 === foco ? ' foco' : ''}" style="left:${m.x * 100}%;top:${m.y * 100}%">${k + 1}</span>`).join('')}
      </figure>
    </div>`;
};

const SELOS = ['MITO', 'DEPENDE', 'VERDADE'];

const RENDER = {
  capa: (s) => `<div class="capa${s.imagem ? ' com-imagem' : ''}${s.aspas ? ' com-aspas' : ''}">
      ${s.aspas ? '<span class="capa-aspas">“</span>' : ''}
      ${s.jato ? `<div class="capa-jato">${jato}</div>` : ''}
      ${cab(s)}
      <h1>${comDestaque(s.titulo, s.destaque)}</h1>
      ${s.imagem ? figura(s) : ''}
      ${Array.isArray(s.checklist) ? `<ul class="capa-check">${s.checklist.map((t, k) => `<li><span class="nn">${String(k + 1).padStart(2, '0')}</span>${esc(t)}<i></i><s></s></li>`).join('')}</ul>` : ''}
      ${s.rodape ? `<p class="arraste mono">${esc(s.rodape)}</p>` : ''}
    </div>`,
  texto: (s) => `${s.numero ? `<span class="num-fundo">${esc(s.numero)}</span>` : ''}${cab(s)}<h2${s.grande ? ' class="grande"' : ''}>${comDestaque(s.titulo, s.destaque)}</h2>
      ${s.rotulo ? `<p class="rotulo mono">${esc(s.rotulo)}</p>` : ''}${paragrafos(s.texto)}`,
  'imagem-anotada': (s) => {
    const ms = s.marcadores || [];
    if (ms.length > 3) throw new Error('imagem-anotada aceita no máximo 3 marcadores.');
    const notas = ms.length ? `<ol class="notas">${ms.map((m, k) => `<li><span class="n mono">${k + 1}</span><span>${esc(m.texto)}</span></li>`).join('')}</ol>` : '';
    const corpo = figura(s, { marcadores: ms }) + notas;
    return `${cab(s)}<h2 class="anotada${s.grande ? ' grande' : ''}">${comDestaque(s.titulo, s.destaque)}</h2>
      ${s.lado ? `<div class="lado-a-lado">${corpo}</div>` : corpo}${paragrafos(s.texto)}`;
  },
  mito: (s) => {
    const selo = String(s.selo || '').toUpperCase();
    if (!SELOS.includes(selo)) throw new Error(`mito: o selo precisa ser ${SELOS.join(', ')} (veio "${s.selo}").`);
    return `<span class="aspa-fundo">”</span>${cab(s)}
      <blockquote class="mito-frase"><span class="aspa">“</span>${esc(s.frase)}<span class="aspa">”</span></blockquote>
      <div class="veredito"><span class="selo">${selo}</span><i></i></div>
      <p class="resposta">${esc(s.resposta).replace(/\n/g, '<br>')}</p>${paragrafos(s.texto)}`;
  },
  frase: (s) => `<div class="frase">${cab(s)}
      <h1>${comDestaque(s.titulo, s.destaque).replace(/\n/g, '<br>')}</h1>${paragrafos(s.texto)}</div>
      <div class="frase-pe"><span class="mono">${esc(s.assinatura ?? '@mach.sites')}</span>${jato}</div>`,
  foto: (s) => {
    const img = carregarImagem(s.imagem);
    return `${s.fundoDesfocado === false ? '' : `<div class="foto-fundo" style="background-image:url('${img.uri}')${s.brilhoFundo ? `;--brilho:${+s.brilhoFundo}` : ''}"></div>`}
      <figure class="foto-tela" style="aspect-ratio:${img.w} / ${img.h}"><img src="${img.uri}"></figure>
      <div class="foto-pe"><p class="foto-frase">${esc(s.titulo)}</p><span class="mono">${esc(s.assinatura ?? '@mach.sites')}</span></div>`;
  },
  paleta: (s) => `${cab(s)}<h2 class="anotada">${comDestaque(s.titulo, s.destaque)}</h2>
      <ul class="amostras">${s.cores.map((c) => `<li><i style="background:${esc(c.hex)}"></i><b>${esc(c.nome)}</b><span class="mono">${esc(c.hex)}</span>${c.origem ? `<small>${esc(c.origem)}</small>` : ''}</li>`).join('')}</ul>
      ${paragrafos(s.texto)}`,
  lista: (s) => `${cab(s)}<h2>${comDestaque(s.titulo, s.destaque)}</h2>
      <ul class="regras">${s.itens.map((it) => `<li><b>${esc(it.titulo)}</b>${it.texto ? `<span>${esc(it.texto)}</span>` : ''}</li>`).join('')}</ul>
      ${paragrafos(s.texto)}`,
  passos: (s) => `${cab(s)}<h2>${comDestaque(s.titulo, s.destaque)}</h2>
      <ol class="passos">${s.passos.map((p, k) => `<li><span class="n mono">${String((s.inicio || 1) + k).padStart(2, '0')}</span><b>${esc(p.titulo)}</b>${p.texto ? `<span class="t">${esc(p.texto)}</span>` : ''}</li>`).join('')}</ol>${paragrafos(s.texto)}`,
  numeros: (s) => `${cab(s)}<h2>${comDestaque(s.titulo, s.destaque)}</h2>
      <dl class="numeros">${s.numeros.map(([v, r]) => `<div><dd>${esc(v)}</dd><dt>${esc(r)}</dt></div>`).join('')}</dl>${paragrafos(s.texto)}`,
  chamada: (s) => `<div class="anel"></div><div class="final">${assinatura}
      <h2>${esc(s.titulo).replace(/\n/g, '<br>')}</h2>${s.texto ? `<p class="texto centro">${esc(s.texto)}</p>` : ''}
      <p class="botao">${esc(s.botao || 'Chama no direct')}</p><p class="mono arroba">${esc(s.arroba || '@mach.sites')}</p></div>`,
};

// a "pista" de velocidade: sobe a cada slide e rompe Mach 1 antes do último
const mach = spec.slides.map((_, i) => (i === N - 1 ? 1.2 : 0.4 + (0.97 - 0.4) * (i / Math.max(1, N - 2))));
const estado = (m) => (m >= 1 ? 'Supersônico' : m >= 0.8 ? 'Transônico' : 'Subsônico');

const css = `
:root { --estrato:#0a0c0f; --titanio:#12161b; --linha:#252b32; --aluminio:#dfe3e7; --aluminio2:#b9c0c7; --nevoa:#8a929b; --laranja:#ff6b1a; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--estrato); color: var(--aluminio); font-family: "Hanken Grotesk", Arial, sans-serif; }
#pano { position: relative; width: ${SW * N}px; height: ${SH}px; overflow: hidden;
  background: radial-gradient(60% 50% at 10% 0%, #141a24 0%, rgba(20,26,36,0) 60%), linear-gradient(180deg, #0b0e13, var(--estrato) 70%); }
#ceu { position: absolute; inset: 0; }
.slide { position: absolute; top: 0; width: ${SW}px; height: ${SH}px; padding: 150px 96px 0; display: flex; flex-direction: column; isolation: isolate; overflow: hidden; }
.topo { position: absolute; left: 96px; right: 96px; top: 64px; display: flex; justify-content: space-between; align-items: center; }
.logo-mini { width: 128px; height: auto; }
.mono { font-family: "JetBrains Mono", monospace; letter-spacing: .08em; text-transform: uppercase; font-size: 20px; color: var(--nevoa); }
.eyebrow { font-family: "JetBrains Mono", monospace; font-size: 22px; letter-spacing: .16em; text-transform: uppercase; color: var(--nevoa); margin: 30px 0 26px; }
.eyebrow.laranja { color: var(--laranja); }
h1, h2 { font-family: "Saira", sans-serif; font-weight: 300; letter-spacing: -.02em; margin: 0; }
h1 { font-size: 100px; line-height: 1.0; }
h2 { font-size: 80px; line-height: 1.03; }
h1 b, h2 b { font-weight: 400; color: var(--laranja); }
.texto { font-size: 38px; line-height: 1.4; color: var(--aluminio2); margin: 26px 0 0; max-width: 880px; }
.capa { height: 100%; display: flex; flex-direction: column; }
.capa-jato { height: 420px; display: flex; justify-content: center; margin: 0 0 30px; }
.jato { height: 100%; width: auto; overflow: visible; }
.arraste { margin-top: 44px; color: var(--aluminio2); font-size: 22px; }
.regras { list-style: none; margin: 44px 0 0; padding: 0; display: grid; gap: 34px; }
.regras li { display: grid; gap: 8px; padding-left: 44px; position: relative; }
.regras li::before { content: ""; position: absolute; left: 4px; top: 18px; width: 16px; height: 16px; background: var(--laranja); transform: rotate(45deg); }
.regras b { font-family: "Saira", sans-serif; font-weight: 400; font-size: 52px; line-height: 1.1; }
.regras span { font-size: 34px; color: var(--aluminio2); line-height: 1.35; }
.passos { list-style: none; margin: 46px 0 0; padding: 0 0 0 54px; display: grid; gap: 40px; position: relative; }
.passos::before { content: ""; position: absolute; left: 14px; top: 14px; bottom: 14px; width: 2px; background: linear-gradient(var(--laranja), var(--linha)); }
.passos li { position: relative; display: grid; gap: 6px; }
.passos li::before { content: ""; position: absolute; left: -48px; top: 18px; width: 18px; height: 18px; background: var(--laranja); transform: rotate(45deg); box-shadow: 0 0 16px rgba(255,107,26,.6); }
.passos .n { color: var(--laranja); font-size: 22px; }
.passos b { font-family: "Saira", sans-serif; font-weight: 400; font-size: 54px; line-height: 1.1; }
.passos .t { font-size: 34px; color: var(--aluminio2); line-height: 1.35; }
.numeros { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); margin: 56px 0 0; border-top: 1px solid var(--linha); }
.numeros div { padding: 24px 16px 0 0; }
.numeros div + div { padding-left: 24px; border-left: 1px solid var(--linha); }
.numeros dd { margin: 0; font-family: "Saira", sans-serif; font-weight: 250; font-size: 104px; line-height: 1; }
.numeros dt { font-family: "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: .08em; font-size: 20px; color: var(--nevoa); margin-top: 10px; }
.anel { position: absolute; z-index: -1; left: -560px; top: 160px; width: 1120px; height: 1120px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(255,107,26,.55), 0 0 0 91px rgba(223,227,231,.1); }
.final { height: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 70px; }
.assin { width: 720px; height: auto; }
.final h2 { font-size: 74px; line-height: 1.06; margin-top: 64px; max-width: 860px; }
.texto.centro { text-align: center; margin: 24px auto 0; }
.botao { margin: 56px 0 0; padding: 30px 56px; font-weight: 600; font-size: 38px; color: var(--estrato); background: var(--laranja); clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px)); }
.arroba { margin-top: 30px; font-size: 28px; color: var(--aluminio2); text-transform: none; }
.pista { position: absolute; left: 0; right: 0; top: 1240px; height: 1px; background: var(--linha); }
.pista-quente { position: absolute; top: 1240px; height: 2px; margin-top: -.5px; background: var(--laranja); }
.marca { position: absolute; width: 1px; background: var(--nevoa); }
.leitura { position: absolute; left: 96px; top: 1262px; font-size: 20px; }
.leitura b { color: var(--aluminio); font-weight: 500; margin-right: 14px; }
.leitura.super, .leitura.super b { color: var(--laranja); }
/* progresso em diamantes (eyebrow) */
.dias { display: inline-flex; gap: 12px; margin-left: 22px; vertical-align: 2px; }
.dias i { display: inline-block; width: 13px; height: 13px; transform: rotate(45deg); box-shadow: inset 0 0 0 1.5px var(--nevoa); }
.dias i.on { background: var(--laranja); box-shadow: none; }
/* texto: rótulo e título grande */
h2.grande { font-size: 108px; line-height: .98; letter-spacing: -.025em; }
.rotulo { margin: 60px 0 0; padding-top: 30px; border-top: 1px solid var(--linha); font-size: 20px; letter-spacing: .16em; max-width: 880px; }
.rotulo + .texto { margin-top: 14px; }
/* capa com imagem e capa com aspas */
.capa.com-imagem { height: 1045px; }
.capa.com-imagem h1 { font-size: 92px; line-height: 1.0; }
.capa.com-imagem .fig-area { margin-top: 56px; }
.capa.com-imagem .arraste { margin-top: 22px; }
.capa.com-aspas { height: 1045px; }
.capa.com-aspas h1 { margin-top: auto; font-size: 124px; line-height: .98; letter-spacing: -.03em; }
.capa-aspas { position: absolute; z-index: -1; left: 60px; top: -40px; font-family: "Saira", sans-serif; font-weight: 200; font-size: 1700px; line-height: 1;
  color: transparent; -webkit-text-stroke: 2px rgba(223,227,231,.16); }
.capa-check { list-style: none; margin: 64px 0 0; padding: 30px 0 0; border-top: 1px solid var(--linha); display: grid; gap: 20px; }
.capa-check li { display: flex; align-items: center; gap: 18px; font-family: "JetBrains Mono", monospace; font-size: 23px; letter-spacing: .1em; text-transform: uppercase; color: var(--aluminio2); }
.capa-check .nn { color: var(--nevoa); }
.capa-check i { flex: 1; height: 2px; margin-top: 10px; background: radial-gradient(circle, #46505a 1px, transparent 1.4px) 0 0 / 10px 2px repeat-x; }
.capa-check s { flex: none; width: 30px; height: 30px; box-shadow: inset 0 0 0 2px var(--nevoa); }
.num-fundo { position: absolute; z-index: -1; right: 56px; bottom: 150px; font-family: "Saira", sans-serif; font-weight: 200; font-size: 500px; line-height: .74; letter-spacing: -.04em;
  color: transparent; -webkit-text-stroke: 2px rgba(223,227,231,.13); }
/* imagem anotada */
.slide.t-imagem-anotada { padding-bottom: 150px; }
h2.anotada { font-size: 72px; line-height: 1.04; }
h2.anotada.grande { font-size: 100px; line-height: 1.0; letter-spacing: -.025em; }
.t-imagem-anotada .texto { margin-top: 34px; }
.fig-area { flex: 1 1 0; min-height: 0; display: flex; align-items: center; justify-content: center; margin: 34px 0 0; }
.fig { position: relative; margin: 0; width: 600px; height: 400px; }
.fig-img { position: absolute; inset: 0; overflow: hidden; background: #050607; box-shadow: 0 0 0 1px var(--linha), 0 30px 70px rgba(0,0,0,.55); }
.fig-img img { position: absolute; max-width: none; display: block; }
.fig-img.raiox img { filter: grayscale(1) contrast(1.06) brightness(1.04); }
.fig-img.desfoque img { filter: blur(var(--desfoque)); transform: scale(1.04); }
.fig-img.raiox.desfoque img { filter: grayscale(1) contrast(1.06) brightness(1.04) blur(var(--desfoque)); }
.fig-img.raiox::after { content: ""; position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(190,210,235,.035) 0 1px, transparent 1px 5px), linear-gradient(180deg, rgba(140,180,255,.07), rgba(140,180,255,0)); }
.canto { position: absolute; width: 40px; height: 40px; border: 0 solid rgba(223,227,231,.75); }
.canto.c1 { left: -18px; top: -18px; border-width: 2px 0 0 2px; }
.canto.c2 { right: -18px; top: -18px; border-width: 2px 2px 0 0; }
.canto.c3 { left: -18px; bottom: -18px; border-width: 0 0 2px 2px; }
.canto.c4 { right: -18px; bottom: -18px; border-width: 0 2px 2px 0; }
.fig-tag { position: absolute; right: 0; top: -52px; font-size: 18px; letter-spacing: .14em; }
.varredura { position: absolute; left: -30px; right: -30px; top: 38%; height: 2px; background: rgba(223,227,231,.85); box-shadow: 0 0 22px 5px rgba(160,200,255,.22); }
.pino { position: absolute; width: 62px; height: 62px; margin: -31px 0 0 -31px; border-radius: 50%; display: grid; place-items: center;
  font-family: "JetBrains Mono", monospace; font-weight: 500; font-size: 26px; color: var(--aluminio); background: rgba(10,12,15,.88);
  box-shadow: 0 0 0 2px var(--aluminio), 0 0 0 11px rgba(223,227,231,.13); }
.pino.foco { color: var(--estrato); background: var(--laranja); box-shadow: 0 0 0 2px var(--laranja), 0 0 0 13px rgba(255,107,26,.2), 0 0 34px rgba(255,107,26,.55); }
.notas { list-style: none; margin: 40px 0 0; padding: 0; display: grid; gap: 16px; }
.notas li { display: flex; align-items: center; gap: 22px; font-size: 34px; line-height: 1.25; color: var(--aluminio2); }
.lado-a-lado { flex: 1 1 0; min-height: 0; display: flex; align-items: center; gap: 40px; margin-top: 34px; }
.lado-a-lado .fig-area { flex: 0 0 50%; height: 100%; margin: 0; }
.lado-a-lado .notas { flex: 1; margin: 0; gap: 44px; }
.lado-a-lado .notas li { flex-direction: column; align-items: flex-start; gap: 14px; font-size: 40px; }
.notas .n { flex: none; width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; color: var(--aluminio); box-shadow: inset 0 0 0 1.5px var(--nevoa); }
.fig-area.sangria { margin-left: -96px; margin-right: -96px; }
.fig-area.sangria .fig-img { box-shadow: none; }
.fig-area.sangria .fig-img img { position: static; width: 100%; height: 100%; object-fit: cover; }
.fig-area.sangria .fig-tag { right: 96px; }
/* paleta */
.amostras { list-style: none; margin: 46px 0 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 36px 24px; }
.amostras i { display: block; height: 190px; box-shadow: inset 0 0 0 1px rgba(223,227,231,.16); }
.amostras b { display: block; margin-top: 16px; font-family: "Saira", sans-serif; font-weight: 400; font-size: 32px; line-height: 1.1; }
.amostras .mono { display: block; margin-top: 6px; font-size: 18px; }
.amostras small { display: block; margin-top: 8px; font-size: 22px; line-height: 1.25; color: var(--aluminio2); }
.t-paleta .texto { font-size: 32px; margin-top: 18px; }
.t-paleta .amostras + .texto { margin-top: 44px; }
/* mito */
.slide.t-mito { padding-bottom: 160px; }
.mito-frase { margin: 6px 0 0; font-family: "Saira", sans-serif; font-weight: 300; font-size: 96px; line-height: 1.02; letter-spacing: -.025em; }
.aspa-fundo { position: absolute; z-index: -1; right: 60px; top: 300px; font-family: "Saira", sans-serif; font-weight: 200; font-size: 1400px; line-height: 1;
  color: transparent; -webkit-text-stroke: 2px rgba(223,227,231,.12); }
.mito-frase .aspa { color: var(--nevoa); }
.veredito { display: flex; align-items: center; gap: 30px; margin: auto 0 44px; padding-top: 60px; }
.veredito i { flex: 1; height: 1px; background: var(--linha); }
.selo { margin: 0; padding: 16px 22px 16px 32px; font-family: "Saira", sans-serif; font-stretch: 125%; font-weight: 500; font-size: 42px; line-height: 1; letter-spacing: .24em;
  color: var(--laranja); box-shadow: inset 0 0 0 3px var(--laranja); clip-path: polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px)); }
.resposta { margin: 0; font-family: "Saira", sans-serif; font-weight: 400; font-size: 66px; line-height: 1.08; letter-spacing: -.01em; max-width: 880px; }
.t-mito .texto { font-size: 36px; margin-top: 18px; }
.t-mito .resposta + .texto { margin-top: 26px; }
/* foto (quadro-herói) */
.slide.t-foto { padding: 56px 96px 0; align-items: center; }
.foto-fundo { position: absolute; z-index: -1; inset: -80px; background-size: cover; background-position: center; filter: blur(48px) brightness(var(--brilho, .58)) saturate(1.15); }
.foto-tela { margin: 0; height: 1110px; border-radius: 34px; overflow: hidden; box-shadow: 0 0 0 1px rgba(255,255,255,.1), 0 40px 90px rgba(0,0,0,.65); }
.foto-tela img { width: 100%; height: 100%; display: block; }
.foto-pe { position: absolute; left: 96px; right: 96px; bottom: 50px; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.foto-frase { margin: 0; font-size: 34px; line-height: 1.2; color: var(--aluminio); }
.foto-pe .mono { font-size: 18px; letter-spacing: .12em; text-transform: none; color: var(--aluminio2); white-space: nowrap; }
/* frase (foto única) */
.slide.t-frase { padding: 0 96px 120px; justify-content: center; }
.frase h1 { font-size: 150px; line-height: .98; letter-spacing: -.03em; }
.frase .texto { margin-top: 40px; }
.frase-pe { position: absolute; left: 96px; right: 96px; bottom: 96px; display: flex; justify-content: space-between; align-items: flex-end; }
.frase-pe .mono { font-size: 22px; letter-spacing: .14em; text-transform: none; color: var(--aluminio2); }
.frase-pe .jato { height: 132px; }
`;

let html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Saira:wdth,wght@75..125,200..700&family=Hanken+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${css}</style></head><body><div id="pano"><canvas id="ceu" width="${SW * N}" height="${SH}"></canvas>`;
if (REGUA) {
  html += '<div class="pista"></div>';
  for (let x = 40; x < SW * N; x += 60) {
    const alta = x % 300 === 40;
    html += `<div class="marca" style="left:${x}px;top:${alta ? 1218 : 1230}px;height:${alta ? 22 : 10}px"></div>`;
  }
  html += `<div class="pista-quente" style="left:${SW * (N - 1)}px;right:0"></div>`;
}
spec.slides.forEach((s, i) => {
  const r = RENDER[s.tipo];
  if (!r) throw new Error(`Slide ${i + 1}: tipo desconhecido "${s.tipo}"`);
  const m = mach[i];
  const topo = s.tipo !== 'frase' && s.tipo !== 'foto'; // fotos únicas não levam logo nem contador
  html += `<section class="slide t-${s.tipo}" style="left:${i * SW}px">
    ${topo ? `<div class="topo">${logoMini(i)}<span class="mono">${String(i + 1).padStart(2, '0')} / ${String(N).padStart(2, '0')}</span></div>` : ''}
    ${r(s)}
    ${REGUA ? `<p class="mono leitura ${m >= 1 ? 'super' : ''}"><b>M ${m.toFixed(2)}</b>${estado(m)}</p>` : ''}</section>`;
});
html += `</div><script>
const c = document.getElementById('ceu'), x = c.getContext('2d');
let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
const R = c.width * 1.6, cx = c.width / 2, cy = c.height + R - 190;
x.strokeStyle = 'rgba(140,180,255,.2)'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, R, Math.PI * 1.25, Math.PI * 1.75); x.stroke();
for (let i = 0; i < ${N * 130}; i++) {
  const px = r() * c.width, py = r() * c.height, d = r(), len = 30 + 150 * d * d;
  x.strokeStyle = 'rgba(214,226,240,' + (0.03 + 0.13 * d * d) + ')';
  x.lineWidth = 1 + 1.4 * d; x.beginPath(); x.moveTo(px, py - len); x.lineTo(px, py); x.stroke();
}
// encaixa cada recorte no espaço que sobrou no slide, sem distorcer
window.encaixar = () => document.querySelectorAll('.fig-area').forEach((a) => {
  const r = +a.dataset.r, maxH = +a.dataset.maxh;
  if (a.classList.contains('sangria')) { // de ponta a ponta: ocupa toda a largura e a altura que sobrou
    const f = a.querySelector('.fig');
    f.style.width = a.clientWidth + 'px'; f.style.height = Math.round(Math.min(a.clientHeight - 56, maxH)) + 'px';
    return;
  }
  const livreW = a.clientWidth - 40, livreH = Math.min(a.clientHeight - 56, maxH);
  let w = livreW, h = w / r;
  if (h > livreH) { h = livreH; w = h * r; }
  else if (!a.parentElement.classList.contains('lado-a-lado')) { a.style.flex = 'none'; a.style.height = Math.round(h + 56) + 'px'; }
  const f = a.querySelector('.fig');
  f.style.width = Math.round(w) + 'px'; f.style.height = Math.round(h) + 'px';
});
</script></body></html>`;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: SW * N, height: SH } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => window.encaixar());
await page.waitForTimeout(300);
// confere se algum texto ou imagem passou da margem (encosta na régua ou sai pela lateral)
const avisos = await page.evaluate(({ SW, SH }) => {
  const out = [];
  document.querySelectorAll('.slide').forEach((sl, i) => {
    const base = sl.getBoundingClientRect();
    sl.querySelectorAll('h1, h2, p, li, blockquote, figure, .selo').forEach((el) => {
      if (el.closest('.topo') || el.classList.contains('leitura')) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const baixo = r.bottom - base.top, dir = r.right - base.left, esq = r.left - base.left;
      const limite = document.querySelector('.pista') ? 1205 : SH - 60;
      if (el.closest('.sangria')) return; // imagem de ponta a ponta encosta nas bordas de propósito
      const vaza = el.tagName !== 'FIGURE' && el.scrollWidth > el.clientWidth + 2;
      if (baixo > limite || dir > SW - 40 || esq < 40 || vaza) {
        out.push(`slide ${i + 1}: "${(el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 50)}" passou da margem`);
      }
    });
  });
  return out;
}, { SW, SH });
avisos.forEach((a) => console.warn('Atenção:', a));
fs.rmSync(saida, { recursive: true, force: true });
fs.mkdirSync(saida, { recursive: true });
for (let i = 0; i < N; i++) {
  const out = path.join(saida, `slide-${String(i + 1).padStart(2, '0')}.png`);
  const clip = { x: i * SW, y: 0, width: SW, height: SH };
  await page.screenshot({ path: out, clip });
  // A Meta só aceita JPEG na publicação automática: o calendário aponta para o .jpg.
  await page.screenshot({ path: out.replace(/\.png$/, '.jpg'), type: 'jpeg', quality: 92, clip });
  console.log(path.relative(REPO, out), '(+ .jpg)');
}
if (spec.legenda) fs.writeFileSync(path.join(saida, 'legenda.txt'), spec.legenda + '\n');
await browser.close();
