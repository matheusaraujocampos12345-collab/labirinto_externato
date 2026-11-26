// i22 — Boneco 02: "Só o Instagram não basta" (≈25 s), com voz de IA. Mesma base do i21 (estúdio cheio, monitores
// que mudam com a fala, etiquetas 3D, câmera por frase). Cenas: 1) a conta cai — o perfil vira "conta indisponível"
// e um cadeado despenca; 2) a busca "doceria perto de mim" só mostra concorrentes (o boneco procura com a lupa);
// 3) o cardápio se perde no feed — a fumaça passa e vira o cardápio do site; checklist da MACH; "Comenta INSTA".
// Tempos, legenda e boca: instagram/reels/voz/i22/. Gerar como o i21 e juntar a voz com o ffmpeg.
import * as THREE from 'three';
import { RoomEnvironment } from '/video-anuncio/vendor/RoomEnvironment.js';
import { clamp, lerp, prog, ease, hash } from '../motor/tempo.js';
import { COR, FONTE, assinatura, vinheta } from '../motor/marca.js';
import { criarBoneco } from '../boneco/boneco.js';
import { foto } from './catalogo.js';

const VOZ = '/instagram/reels/voz/i22/';
const PALAVRA = 'INSTA';
const TITULOS = ['SÓ INSTAGRAM É UM RISCO', '1. A CONTA PODE CAIR', '2. O GOOGLE NÃO TE ACHA', '3. O CARDÁPIO SE PERDE', 'SITE + INSTAGRAM, JUNTOS', 'COMENTA INSTA'];
let L = null; // linhas da narração
let BOCA = [];
let SEC = []; // início de cada parte
let EV = {}; // momentos-chave tirados da fala
let DUR = 22.6;

const suave = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const secao = (t) => {
  let i = 0;
  while (i + 1 < SEC.length && t >= SEC[i + 1]) i++;
  return i;
};
const linhaEm = (t) => {
  let i = 0;
  while (i + 1 < L.length && t >= L[i + 1].ini - 0.12) i++;
  return i;
};
function tPedaco(li, palavra) {
  const p = L[li].pedacos.find((c) => c.texto.includes(palavra));
  return p ? p.t : L[li].ini;
}
function preparaTempos(dados) {
  L = dados.linhas;
  DUR = dados.duracao;
  // partes: 0 intro (linha 0), 1 conta cai (1–2), 2 Google (3–4), 3 cardápio (5–6), 4 MACH (7), 5 comenta (8)
  SEC = [0, L[1].ini - 0.4, L[3].ini - 0.4, L[5].ini - 0.4, L[7].ini - 0.4, L[8].ini - 0.4];
  EV = {
    risco: tPedaco(0, 'risco'),
    bloqueio: tPedaco(2, 'bloqueio'),
    vitrine: tPedaco(2, 'vitrine'),
    pesquisa: tPedaco(4, 'pesquisa'),
    concorrente: tPedaco(4, 'concorrente'),
    limpa: L[6].ini + 0.1,
    resolve: tPedaco(7, 'faz'),
    site: tPedaco(8, PALAVRA),
  };
}
function bocaEm(t) {
  const f = t * 30, i = Math.floor(f), k = f - i;
  return lerp(BOCA[i] ?? 0, BOCA[i + 1] ?? 0, k);
}

// ── poses ───────────────────────────────────────────────────────
const NEUTRA = { e: { ombro: [0, 0, 0.14], cotovelo: [-0.12, 0, 0] }, d: { ombro: [0, 0, -0.14], cotovelo: [-0.12, 0, 0] }, cabeca: [0, 0, 0] };
const P = {
  neutra: NEUTRA,
  explica: { e: { ombro: [-0.2, 0, 0.3], cotovelo: [-0.9, 0, 0] }, d: { ombro: [-0.35, 0, -0.35], cotovelo: [-1.2, 0, 0] }, cabeca: [0, 0.1, 0] },
  aponta: { e: { ombro: [-0.35, 0, 1.15], cotovelo: [-0.35, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0, 0.38, 0] },
  relogio: { e: { ombro: [-0.95, 0, -0.42], cotovelo: [-1.55, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0.38, 0.28, 0] },
  ombros: { e: { ombro: [-0.15, 0, 0.6], cotovelo: [-1.45, 0, 0] }, d: { ombro: [-0.15, 0, -0.6], cotovelo: [-1.45, 0, 0] }, cabeca: [0.08, 0, 0.16] },
  lupa: { e: { ombro: [-0.55, 0, 1.0], cotovelo: [-0.55, 0, 0] }, d: { ombro: [-0.1, 0, -0.2], cotovelo: [-0.5, 0, 0] }, cabeca: [0.05, 0.45, 0] },
  limpa: { e: { ombro: [-0.85, 0, 1.25], cotovelo: [-0.75, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0, 0.35, 0] },
  joinha: { e: { ombro: [0, 0, 0.18], cotovelo: [-0.2, 0, 0] }, d: { ombro: [-0.25, 0, -0.4], cotovelo: [-2.15, 0, 0] }, cabeca: [-0.05, -0.1, 0] },
  bracos: { e: { ombro: [-0.3, 0, 1.0], cotovelo: [-0.5, 0, 0] }, d: { ombro: [-0.3, 0, -1.0], cotovelo: [-0.5, 0, 0] }, cabeca: [-0.12, 0, 0] },
};
function trilha() {
  return [
    [0, 'explica'], [EV.risco - 0.2, 'aponta'], [SEC[1], 'explica'], [EV.bloqueio - 0.15, 'ombros'], [EV.vitrine + 0.5, 'aponta'],
    [SEC[2], 'explica'], [L[3].ini + 0.4, 'lupa'], [EV.concorrente - 0.15, 'neutra'],
    [SEC[3], 'aponta'], [EV.limpa, 'limpa'], [EV.limpa + 1.0, 'aponta'],
    [SEC[4], 'bracos'], [EV.resolve + 0.3, 'joinha'],
    [SEC[5], 'aponta'], [L[8].fim - 0.4, 'explica'],
  ];
}
function lerpPose(a, b, k) {
  const out = { e: {}, d: {} };
  for (const lado of ['e', 'd']) for (const parte of ['ombro', 'cotovelo']) {
    const pa = a[lado]?.[parte] ?? NEUTRA[lado][parte], pb = b[lado]?.[parte] ?? NEUTRA[lado][parte];
    out[lado][parte] = pa.map((v, i) => lerp(v, pb[i], k));
  }
  out.cabeca = (a.cabeca ?? [0, 0, 0]).map((v, i) => lerp(v, (b.cabeca ?? [0, 0, 0])[i], k));
  return out;
}
function poseEm(t) {
  const T = trilha();
  let i = 0;
  while (i + 1 < T.length && t >= T[i + 1][0]) i++;
  const ant = i > 0 ? P[T[i - 1][1]] : P[T[i][1]];
  return lerpPose(ant, P[T[i][1]], ease.inOutCubic(prog(t, T[i][0], T[i][0] + 0.35)));
}

// ── desenhos em canvas (tela do celular gigante, monitores, letreiro, etiquetas) ──
const TW = 460, TH = 920;
function barraStatus(g, escura) {
  g.fillStyle = escura ? '#1B1E22' : COR.aluminio;
  g.font = FONTE.texto(20, 500);
  g.fillText('10:30', 30, 40);
  g.fillRect(370, 26, 52, 18);
}
function siteDoceria(g, op = {}) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  g.save();
  if (op.ruim) g.filter = 'blur(7px) saturate(0.35) brightness(0.55)';
  foto(g, 0, 0, TW, 520, 7, { raio: 0 });
  g.restore();
  const sombra = g.createLinearGradient(0, 260, 0, 520);
  sombra.addColorStop(0, 'rgba(14,17,21,0)');
  sombra.addColorStop(1, 'rgba(14,17,21,0.95)');
  g.fillStyle = sombra;
  g.fillRect(0, 0, TW, 520);
  g.fillStyle = COR.aluminio;
  g.font = FONTE.expandida(18, 500);
  g.letterSpacing = '4px';
  g.fillText('DOCERIA LAÇO', 30, 92);
  g.letterSpacing = '0px';
  g.font = FONTE.titulo(52, 300);
  g.fillText('Bolos para o', 30, 400);
  g.fillText('fim de semana.', 30, 458);
  g.fillStyle = 'rgba(223,227,231,0.16)';
  for (let i = 0; i < 9; i++) g.fillRect(30, 560 + i * 34, [380, 340, 390, 300, 360, 380, 250, 340, 200][i], 12);
  g.fillStyle = '#5A626C';
  g.font = FONTE.texto(15, 400);
  g.fillText('Fale conosco: (11) 98765-4321', 30, 890);
  if (op.achou) {
    g.strokeStyle = `rgba(255,107,26,${op.achou})`;
    g.lineWidth = 4;
    g.beginPath();
    g.roundRect(18, 866, 250, 36, 18);
    g.stroke();
  }
  if (op.pilula) {
    g.fillStyle = COR.aluminio;
    g.beginPath();
    g.roundRect(30, 810, 400, 74, 37);
    g.fill();
    g.fillStyle = '#0A0C0F';
    g.font = FONTE.texto(26, 500);
    g.textAlign = 'center';
    g.fillText('Pedir pelo WhatsApp', 230, 856);
    g.textAlign = 'left';
  }
  if (op.selo) {
    g.fillStyle = COR.laranja;
    g.beginPath();
    g.roundRect(290, 120, 140, 54, 27);
    g.fill();
    g.fillStyle = '#0A0C0F';
    g.font = FONTE.mono(24, 500);
    g.fillText('0,9 s', 318, 156);
  }
  barraStatus(g);
}
function feed(g) {
  g.fillStyle = '#0B0D10';
  g.fillRect(0, 0, TW, TH);
  for (let i = 0; i < 3; i++) {
    const y = 80 + i * 290;
    g.fillStyle = 'rgba(223,227,231,0.16)';
    g.beginPath();
    g.arc(46, y + 20, 20, 0, Math.PI * 2);
    g.fill();
    g.fillRect(80, y + 12, 150, 14);
    g.fillStyle = 'rgba(223,227,231,0.07)';
    g.fillRect(0, y + 56, TW, 210);
  }
  barraStatus(g);
}
function carregando(g, t, t0, t1) {
  g.fillStyle = '#F1F2F3';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g, true);
  g.fillStyle = '#DADDE0';
  g.fillRect(30, 100, 400, 260);
  for (let i = 0; i < 7; i++) g.fillRect(30, 400 + i * 40, [360, 300, 380, 260, 340, 380, 200][i], 16);
  const s = clamp((t - t0) / (t1 - t0)) * 3.4;
  g.strokeStyle = '#5A626C';
  g.lineWidth = 10;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(230, 230, 50, t * 6, t * 6 + 4.2);
  g.stroke();
  g.fillStyle = s >= 3 ? COR.laranja : '#2C323A';
  g.font = FONTE.mono(64, 500);
  g.textAlign = 'center';
  g.fillText(`${s.toFixed(1).replace('.', ',')} s`, 230, 760);
  g.textAlign = 'left';
  g.fillStyle = '#DADDE0';
  g.fillRect(30, 800, 400, 10);
  g.fillStyle = '#5A626C';
  g.fillRect(30, 800, 400 * Math.min(0.92, s / 3.4) * 0.6, 10);
}
function comentarios(g, t) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g);
  g.fillStyle = COR.aluminio;
  g.font = FONTE.texto(26, 500);
  g.textAlign = 'center';
  g.fillText('Comentários', 230, 100);
  g.textAlign = 'left';
  g.fillStyle = 'rgba(223,227,231,0.1)';
  g.fillRect(0, 124, TW, 2);
  [['ana.doces', 'quero ver o meu!'], ['barbearia.ze', PALAVRA]].forEach(([quem, c], i) => {
    const y = 190 + i * 110;
    g.fillStyle = 'rgba(223,227,231,0.18)';
    g.beginPath();
    g.arc(56, y, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COR.nevoa;
    g.font = FONTE.texto(20, 500);
    g.fillText(quem, 100, y - 8);
    g.fillStyle = c === PALAVRA ? COR.laranja : COR.aluminio;
    g.font = FONTE.texto(24, c === PALAVRA ? 600 : 400);
    g.fillText(c, 100, y + 24);
  });
  const digitado = PALAVRA.slice(0, Math.floor(clamp((t - EV.site) / 0.5) * PALAVRA.length + 0.001));
  const publicado = t >= EV.site + 0.75;
  if (publicado) {
    const y = 410;
    g.globalAlpha = ease.outCubic(prog(t, EV.site + 0.75, EV.site + 1.0));
    g.fillStyle = COR.laranja;
    g.beginPath();
    g.arc(56, y, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COR.nevoa;
    g.font = FONTE.texto(20, 500);
    g.fillText('você', 100, y - 8);
    g.fillStyle = COR.laranja;
    g.font = FONTE.texto(24, 600);
    g.fillText(PALAVRA, 100, y + 24);
    g.globalAlpha = 1;
  }
  g.fillStyle = '#1B2026';
  g.beginPath();
  g.roundRect(20, 820, 420, 70, 35);
  g.fill();
  g.font = FONTE.texto(26, publicado ? 400 : 600);
  g.fillStyle = publicado || !digitado ? '#5A626C' : COR.aluminio;
  g.fillText(publicado || !digitado ? 'Adicione um comentário…' : digitado + (Math.floor(t * 4) % 2 ? '|' : ''), 46, 864);
}
function telaInicio(g, t) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g);
  g.fillStyle = COR.aluminio;
  g.font = FONTE.titulo(300, 200);
  g.textAlign = 'center';
  g.fillText('3', 230, 560);
  g.font = FONTE.mono(30, 400);
  g.letterSpacing = '8px';
  g.fillText('ERROS', 236, 640);
  g.letterSpacing = '0px';
  g.textAlign = 'left';
  g.fillStyle = COR.laranja;
  g.fillRect(170, 670, 120 * ease.outCubic(prog(t, 0.3, 1.2)), 6);
}
function deslizaPara(g, t, t0, de, para) {
  const k = ease.inOutCubic(prog(t, t0, t0 + 0.4));
  g.save();
  g.translate(k * TW * 0.4, 0);
  de();
  g.restore();
  if (k > 0) {
    g.save();
    g.translate(-(1 - k) * TW, 0);
    para();
    g.restore();
  }
}
function perfil(g) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g);
  g.strokeStyle = COR.laranja;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(82, 150, 52, 0, Math.PI * 2);
  g.stroke();
  g.save();
  g.beginPath();
  g.arc(82, 150, 46, 0, Math.PI * 2);
  g.clip();
  foto(g, 30, 98, 104, 104, 7, { raio: 0 });
  g.restore();
  g.fillStyle = COR.aluminio;
  g.font = FONTE.texto(26, 600);
  g.fillText('doceria.laco', 156, 138);
  g.fillStyle = COR.nevoa;
  g.font = FONTE.texto(18, 400);
  g.fillText('312 posts · 2,1 mil seguidores', 156, 170);
  g.fillStyle = COR.aluminio;
  g.beginPath();
  g.roundRect(30, 226, 400, 50, 12);
  g.fill();
  g.fillStyle = '#0A0C0F';
  g.font = FONTE.texto(20, 600);
  g.textAlign = 'center';
  g.fillText('Seguir', 230, 258);
  g.textAlign = 'left';
  for (let i = 0; i < 12; i++) foto(g, (i % 3) * 153 + 1, 300 + Math.floor(i / 3) * 153, 151, 151, 20 + i, { raio: 0 });
}
function indisponivel(g) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g);
  g.strokeStyle = COR.aluminio;
  g.lineWidth = 12;
  g.beginPath();
  g.arc(230, 330, 56, Math.PI, 0);
  g.stroke();
  g.fillStyle = COR.aluminio;
  g.beginPath();
  g.roundRect(150, 330, 160, 130, 16);
  g.fill();
  g.fillStyle = '#0E1115';
  g.beginPath();
  g.arc(230, 385, 16, 0, Math.PI * 2);
  g.fill();
  g.fillRect(224, 390, 12, 34);
  g.fillStyle = COR.aluminio;
  g.font = FONTE.texto(32, 600);
  g.textAlign = 'center';
  g.fillText('Conta indisponível', 230, 540);
  g.fillStyle = COR.nevoa;
  g.font = FONTE.texto(21, 400);
  g.fillText('Esta página não está', 230, 584);
  g.fillText('disponível no momento.', 230, 612);
  g.textAlign = 'left';
}
function estrela(g, x, y, r) {
  g.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r;
    k ? g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)) : g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  g.closePath();
  g.fill();
}
function busca(g, t) {
  g.fillStyle = '#F1F2F3';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g, true);
  g.fillStyle = '#FFFFFF';
  g.beginPath();
  g.roundRect(24, 80, 412, 64, 32);
  g.fill();
  g.strokeStyle = '#5A626C';
  g.lineWidth = 4;
  g.beginPath();
  g.arc(64, 108, 12, 0, Math.PI * 2);
  g.moveTo(73, 117);
  g.lineTo(82, 126);
  g.stroke();
  const frase = 'doceria perto de mim';
  const n = Math.floor(clamp((t - EV.pesquisa) / 0.9) * frase.length + 0.001);
  g.fillStyle = '#1B1E22';
  g.font = FONTE.texto(22, 500);
  g.fillText(frase.slice(0, n) + (n < frase.length && Math.floor(t * 4) % 2 ? '|' : ''), 96, 120);
  if (n < frase.length) return;
  const res = [['Doce Ponto', '4,8 · 600 m'], ['Casa do Bolo', '4,6 · 900 m'], ['Doces da Vila', '4,7 · 1,2 km']];
  res.forEach(([nome, info], i) => {
    const y = 184 + i * 150, a = ease.outCubic(prog(t, EV.pesquisa + 1.0 + i * 0.15, EV.pesquisa + 1.25 + i * 0.15));
    if (a <= 0) return;
    g.globalAlpha = a;
    g.fillStyle = '#FFFFFF';
    g.beginPath();
    g.roundRect(24, y, 412, 130, 16);
    g.fill();
    if (i === 0 && t > EV.concorrente) {
      g.strokeStyle = COR.laranja;
      g.lineWidth = 5;
      g.stroke();
    }
    foto(g, 40, y + 16, 98, 98, 50 + i, { raio: 10 });
    g.fillStyle = '#1B1E22';
    g.font = FONTE.texto(24, 600);
    g.fillText(nome, 156, y + 52);
    g.fillStyle = '#E8A33A';
    estrela(g, 166, y + 82, 10);
    g.fillStyle = '#5A626C';
    g.font = FONTE.texto(19, 400);
    g.fillText(info, 184, y + 89);
    g.globalAlpha = 1;
  });
  if (t > EV.concorrente + 0.3) {
    g.fillStyle = '#8A929B';
    g.font = FONTE.texto(18, 400);
    g.fillText('Doceria Laço: nenhum resultado', 30, 690);
  }
}
function feedCardapio(g, t) {
  g.fillStyle = '#0B0D10';
  g.fillRect(0, 0, TW, TH);
  const rola = (t - SEC[3]) * 520;
  for (let i = -1; i < 6; i++) {
    const n = Math.floor(rola / 300) + i;
    const y = n * 300 - rola + 60;
    g.fillStyle = 'rgba(223,227,231,0.16)';
    g.beginPath();
    g.arc(40, y + 18, 16, 0, Math.PI * 2);
    g.fill();
    g.fillRect(66, y + 10, 140, 12);
    if (n % 4 === 2) {
      g.fillStyle = '#1B2026';
      g.fillRect(0, y + 44, TW, 230);
      g.fillStyle = COR.aluminio;
      g.font = FONTE.titulo(40, 300);
      g.fillText('Cardápio', 30, y + 110);
      g.fillStyle = 'rgba(223,227,231,0.3)';
      for (let k = 0; k < 4; k++) g.fillRect(30, y + 140 + k * 28, 300, 10);
    } else foto(g, 0, y + 44, TW, 230, 60 + ((n % 7) + 7) % 7, { raio: 0 });
  }
  barraStatus(g);
}
function siteCardapio(g) {
  g.fillStyle = '#0E1115';
  g.fillRect(0, 0, TW, TH);
  barraStatus(g);
  g.fillStyle = COR.aluminio;
  g.font = FONTE.expandida(18, 500);
  g.letterSpacing = '4px';
  g.fillText('DOCERIA LAÇO', 30, 92);
  g.letterSpacing = '0px';
  g.font = FONTE.titulo(56, 300);
  g.fillText('Cardápio', 30, 170);
  [['Bolo de brigadeiro', 'R$ 120'], ['Torta de limão', 'R$ 95'], ['Bolo de nozes', 'R$ 140'], ['Caixa de docinhos', 'R$ 60']].forEach(([n, p], i) => {
    const y = 210 + i * 132;
    foto(g, 30, y, 104, 104, 20 + i, { raio: 12 });
    g.fillStyle = COR.aluminio;
    g.font = FONTE.texto(24, 600);
    g.fillText(n, 152, y + 38);
    g.fillStyle = COR.nevoa;
    g.font = FONTE.mono(22, 500);
    g.fillText(p, 152, y + 74);
    g.strokeStyle = COR.aluminio;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(340, y + 44, 92, 42, 21);
    g.stroke();
    g.font = FONTE.texto(18, 600);
    g.fillStyle = COR.aluminio;
    g.fillText('Pedir', 364, y + 72);
  });
  g.fillStyle = COR.aluminio;
  g.beginPath();
  g.roundRect(30, 810, 400, 74, 37);
  g.fill();
  g.fillStyle = '#0A0C0F';
  g.font = FONTE.texto(26, 500);
  g.textAlign = 'center';
  g.fillText('Pedir pelo WhatsApp', 230, 856);
  g.textAlign = 'left';
}
function desenharTela(g, t) {
  const i = secao(t);
  if (i === 0) perfil(g);
  else if (i === 1) deslizaPara(g, t, EV.bloqueio, () => perfil(g), () => indisponivel(g));
  else if (i === 2) busca(g, t);
  else if (i === 3) (t < EV.limpa + 0.45 ? feedCardapio(g, t) : siteCardapio(g));
  else if (i === 4) siteDoceria(g, { pilula: true, selo: false });
  else comentarios(g, t);
}

// monitores da parede: cada um com um assunto; nas partes 1 a 5 todos seguem o tema da fala
const MW = 256, MH = 160;
function monitor(g, n, t) {
  const s = secao(t);
  g.fillStyle = '#0D1014';
  g.fillRect(0, 0, MW, MH);
  g.fillStyle = 'rgba(223,227,231,0.1)';
  g.fillRect(0, 0, MW, 16);
  for (let k = 0; k < 3; k++) {
    g.fillStyle = 'rgba(223,227,231,0.3)';
    g.beginPath();
    g.arc(10 + k * 10, 8, 3, 0, Math.PI * 2);
    g.fill();
  }
  const r = (k) => hash(n * 17 + k);
  if (s === 1) {
    if (t < EV.bloqueio) {
      for (let k = 0; k < 6; k++) foto(g, 8 + (k % 3) * 82, 22 + Math.floor(k / 3) * 68, 78, 64, 20 + k + n, { raio: 4 });
    } else {
      g.strokeStyle = COR.aluminio;
      g.lineWidth = 7;
      g.beginPath();
      g.arc(MW / 2, 70, 20, Math.PI, 0);
      g.stroke();
      g.fillStyle = COR.aluminio;
      g.fillRect(MW / 2 - 30, 70, 60, 48);
      g.fillStyle = 'rgba(223,227,231,0.25)';
      g.fillRect(58, 132, 140, 8);
    }
    return;
  }
  if (s === 2) {
    g.fillStyle = 'rgba(223,227,231,0.85)';
    g.beginPath();
    g.roundRect(14, 26, MW - 28, 28, 14);
    g.fill();
    for (let k = 0; k < 3; k++) {
      g.fillStyle = k === 0 && t > EV.concorrente ? COR.laranja : 'rgba(223,227,231,0.3)';
      g.fillRect(14, 70 + k * 28, 80 + hash(n * 5 + k) * 120, 14);
    }
    return;
  }
  if (s === 3) {
    if (t < EV.limpa + 0.45) {
      g.save();
      g.beginPath();
      g.rect(0, 16, MW, MH - 16);
      g.clip();
      const sy = ((t - SEC[3]) * 300 + n * 40) % 140;
      for (let k = -1; k < 3; k++) foto(g, 10, 22 + k * 70 - sy + 70, MW - 20, 62, 60 + k + n, { raio: 4 });
      g.restore();
    } else {
      for (let k = 0; k < 4; k++) {
        g.fillStyle = 'rgba(223,227,231,0.35)';
        g.fillRect(16, 30 + k * 30, 120, 12);
        g.fillStyle = COR.laranja;
        g.fillRect(190, 30 + k * 30, 46, 12);
      }
    }
    return;
  }
  if (s === 4) {
    // Λ e um sinal de certo
    g.strokeStyle = COR.laranja;
    g.lineWidth = 10;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(MW / 2 - 40, 130);
    g.lineTo(MW / 2, 40);
    g.lineTo(MW / 2 + 40, 130);
    g.stroke();
    return;
  }
  if (s === 5) {
    for (let k = 0; k < 3; k++) {
      const y = ((k * 50 - t * 40 + n * 13) % 150 + 150) % 150 + 18;
      g.fillStyle = 'rgba(223,227,231,0.2)';
      g.beginPath();
      g.arc(24, y + 10, 9, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = k === 1 ? COR.laranja : 'rgba(223,227,231,0.6)';
      g.font = FONTE.texto(16, 600);
      g.fillText(k === 1 ? PALAVRA : 'quero!', 42, y + 16);
    }
    return;
  }
  // início: cada monitor com um assunto
  const tipo = n % 5;
  if (tipo === 0) {
    // site rolando
    g.save();
    g.beginPath();
    g.rect(0, 16, MW, MH - 16);
    g.clip();
    const sy = (t * 30 + n * 50) % 200;
    foto(g, 10, 24 - sy, MW - 20, 90, 40 + n, { raio: 4 });
    g.fillStyle = 'rgba(223,227,231,0.18)';
    for (let k = 0; k < 8; k++) g.fillRect(10, 124 + k * 18 - sy, 60 + r(k) * 160, 7);
    g.restore();
  } else if (tipo === 1) {
    // gráfico subindo
    for (let k = 0; k < 7; k++) {
      const h = 20 + (Math.sin(t * 1.5 + k * 0.9 + n) * 0.5 + 0.5) * 90;
      g.fillStyle = k === 6 ? COR.laranja : 'rgba(223,227,231,0.35)';
      g.fillRect(22 + k * 32, MH - 10 - h, 20, h);
    }
  } else if (tipo === 2) {
    // código sendo digitado
    g.font = FONTE.mono(12, 400);
    const linhas = ['<section class="hero">', '  <h1>Bolos</h1>', '  animar(".foto")', '</section>', 'scroll.on(...)', 'gsap.to(card, …)'];
    const ate = Math.floor((t * 2 + n) % 7);
    linhas.slice(0, ate).forEach((l, k) => {
      g.fillStyle = k % 3 === 2 ? COR.laranja : 'rgba(223,227,231,0.7)';
      g.fillText(l, 12, 36 + k * 20);
    });
  } else if (tipo === 3) {
    // número que conta
    g.fillStyle = COR.aluminio;
    g.font = FONTE.mono(46, 500);
    g.textAlign = 'center';
    g.fillText(`${(0.4 + ((t * 0.35 + r(2)) % 1) * 0.8).toFixed(2)}`, MW / 2, 98);
    g.font = FONTE.mono(13, 400);
    g.fillStyle = COR.nevoa;
    g.fillText('MACH', MW / 2, 128);
    g.textAlign = 'left';
  } else {
    // ondas
    g.strokeStyle = 'rgba(223,227,231,0.7)';
    g.lineWidth = 2;
    g.beginPath();
    for (let x = 0; x <= MW; x += 4) {
      const y = 90 + Math.sin(x * 0.05 + t * 3 + n) * 30 * Math.sin(t + x * 0.01);
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
}
function letreiro(g, t) {
  g.fillStyle = '#07080A';
  g.fillRect(0, 0, 1024, 64);
  const frase = 'SITE QUE NÃO CAI  ◆  APARECE NO GOOGLE  ◆  PEDIDO NUM LUGAR SÓ  ◆  MACH ESTÚDIO  ◆  ';
  g.font = FONTE.mono(30, 500);
  const w = g.measureText(frase).width;
  const off = (t * 120) % w;
  for (let x = -off; x < 1024; x += w) {
    let cx = x;
    for (const parte of frase.split('◆')) {
      g.fillStyle = COR.aluminio;
      g.fillText(parte, cx, 43);
      cx += g.measureText(parte).width;
      g.fillStyle = COR.laranja;
      g.fillText('◆', cx, 43);
      cx += g.measureText('◆').width;
    }
  }
}
/** etiqueta flutuante (sprite): pílula com ícone opcional (certo, x, relógio, balão) */
function etiqueta(texto, op = {}) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = FONTE.texto(56, 600);
  const icone = op.icone ? 70 : 0;
  c.width = Math.ceil(g.measureText(texto).width + 80 + icone);
  c.height = 120;
  g.font = FONTE.texto(56, 600);
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath();
  g.roundRect(8, 14, c.width - 12, 102, 51);
  g.fill();
  g.fillStyle = op.fundo ?? COR.aluminio;
  g.beginPath();
  g.roundRect(2, 4, c.width - 12, 102, 51);
  g.fill();
  const cor = op.texto ?? '#0A0C0F';
  g.strokeStyle = cor;
  g.fillStyle = cor;
  g.lineWidth = 8;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (op.icone === 'certo') {
    g.beginPath();
    g.moveTo(40, 56);
    g.lineTo(56, 72);
    g.lineTo(84, 40);
    g.stroke();
  } else if (op.icone === 'x') {
    g.beginPath();
    g.moveTo(42, 38);
    g.lineTo(78, 74);
    g.moveTo(78, 38);
    g.lineTo(42, 74);
    g.stroke();
  } else if (op.icone === 'relogio') {
    g.lineWidth = 6;
    g.beginPath();
    g.arc(60, 56, 22, 0, Math.PI * 2);
    g.moveTo(60, 56);
    g.lineTo(60, 42);
    g.moveTo(60, 56);
    g.lineTo(70, 62);
    g.stroke();
  } else if (op.icone === 'balao') {
    g.lineWidth = 6;
    g.beginPath();
    g.arc(60, 54, 20, Math.PI * 0.7, Math.PI * 2.45);
    g.lineTo(44, 76);
    g.closePath();
    g.stroke();
  }
  g.textBaseline = 'middle';
  g.fillText(texto, 40 + icone, 58);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const altura = op.altura ?? 0.42;
  s.scale.set((altura * c.width) / c.height, altura, 1);
  s.userData.base = s.scale.clone();
  s.visible = false;
  return s;
}

// ── a cena 3D ──────────────────────────────────────────────────
let R = null;
function montar() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(1080, 1920, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x0a0c0f);
  cena.fog = new THREE.Fog(0x0a0c0f, 24, 44);
  const pmrem = new THREE.PMREMGenerator(renderer);
  cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  cena.environmentIntensity = 0.3;
  cena.add(new THREE.HemisphereLight(0xdfe3e7, 0x0a0c0f, 0.55));
  const chave = new THREE.DirectionalLight(0xfff1e6, 1.7);
  chave.position.set(-5, 9, 8);
  cena.add(chave);
  const preenche = new THREE.DirectionalLight(0xbfd0e0, 0.6);
  preenche.position.set(6, 3, 6);
  cena.add(preenche);
  const recorte = new THREE.DirectionalLight(0xff6b1a, 1.2);
  recorte.position.set(7, 4, -4);
  cena.add(recorte);
  const recorte2 = new THREE.DirectionalLight(0xdfe3e7, 0.9);
  recorte2.position.set(-6, 5, -5);
  cena.add(recorte2);

  // chão com grade e anel que pulsa com a voz
  cena.add(new THREE.Mesh(new THREE.CircleGeometry(16, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x101317, roughness: 0.45, metalness: 0.25 })));
  const grade = new THREE.GridHelper(32, 48, 0x232831, 0x181c22);
  grade.position.y = 0.004;
  cena.add(grade);
  const anelMat = new THREE.MeshBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.3, depthWrite: false });
  const anel = new THREE.Mesh(new THREE.RingGeometry(0.95, 1.03, 64).rotateX(-Math.PI / 2), anelMat);
  anel.position.set(-1.1, 0.01, 0);
  cena.add(anel);
  // parede
  const parede = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.95 }));
  parede.position.set(0, 8, -5);
  cena.add(parede);
  // monitores na parede
  const monitores = [];
  const molduraMat = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.5, metalness: 0.4 });
  const posMon = [[-3.3, 5.0], [-1.6, 5.0], [0.1, 5.0], [1.8, 5.0], [3.5, 5.0], [-2.45, 6.25], [-0.75, 6.25], [0.95, 6.25], [2.65, 6.25]];
  posMon.forEach(([x, y], n) => {
    const cv = document.createElement('canvas');
    cv.width = MW;
    cv.height = MH;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    tela.position.set(x, y, -4.86);
    const moldura = new THREE.Mesh(new THREE.BoxGeometry(1.62, 1.06, 0.08), molduraMat);
    moldura.position.set(x, y, -4.92);
    cena.add(moldura, tela);
    monitores.push({ cv, tex, n });
  });
  // letreiro de LED
  const ledCv = document.createElement('canvas');
  ledCv.width = 1024;
  ledCv.height = 64;
  const ledTex = new THREE.CanvasTexture(ledCv);
  ledTex.colorSpace = THREE.SRGBColorSpace;
  const led = new THREE.Mesh(new THREE.PlaneGeometry(9, 0.56), new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }));
  led.position.set(0.1, 7.35, -4.85);
  cena.add(led);
  // Λ de neon
  const neonMat = new THREE.MeshStandardMaterial({ color: 0x2a140a, emissive: 0xff6b1a, emissiveIntensity: 0.06 });
  const neon = new THREE.Group();
  for (const s of [-1, 1]) {
    const perna = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 2.1, 6, 12), neonMat);
    perna.position.set(0.55 * s, 0, 0);
    perna.rotation.z = 0.48 * s; // Λ
    neon.add(perna);
  }
  neon.position.set(-4.6, 6.0, -4.8);
  neon.scale.setScalar(0.75);
  cena.add(neon);
  const brilhoNeon = new THREE.PointLight(0xff6b1a, 0, 10, 1.6);
  brilhoNeon.position.set(-4.0, 5.5, -3.4);
  cena.add(brilhoNeon);
  // fachos de luz que varrem devagar
  const facho = new THREE.MeshBasicMaterial({ color: 0xfff1e6, transparent: true, opacity: 0.05, depthWrite: false, side: THREE.DoubleSide });
  const fachos = [-1.4, 2.4].map((x) => {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.9, 9, 32, 1, true), facho);
    cone.position.y = -4.5;
    g.add(cone);
    g.position.set(x, 9.7, 0.2);
    cena.add(g);
    return g;
  });
  // poeira nos fachos
  const N = 420, pos = new Float32Array(N * 3);
  const base = [];
  for (let i = 0; i < N; i++) base.push([(hash(i * 3) - 0.5) * 9, hash(i * 3 + 1) * 8.5, (hash(i * 3 + 2) - 0.5) * 6 - 0.5]);
  const geoPo = new THREE.BufferGeometry();
  geoPo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const poeira = new THREE.Points(geoPo, new THREE.PointsMaterial({ color: 0xfff1e6, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  cena.add(poeira);
  // sombra suave sob o boneco
  {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,0.75)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    sombra.position.set(-1.1, 0.008, 0);
    cena.add(sombra);
  }

  // o boneco
  const B = criarBoneco();
  B.boneco.position.set(-1.1, 0, 0);
  B.boneco.rotation.y = 0.18;
  cena.add(B.boneco);
  // lupa
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.25, metalness: 0.9 });
  const lupa = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 12, 40), metal);
  aro.position.set(0, -0.78, 0);
  lupa.add(aro);
  const vidro = new THREE.Mesh(new THREE.CircleGeometry(0.32, 40), new THREE.MeshPhysicalMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.22, roughness: 0.05, side: THREE.DoubleSide }));
  vidro.position.copy(aro.position);
  lupa.add(vidro);
  const cabo = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x16181b, roughness: 0.5 }));
  cabo.position.set(0, -0.22, 0);
  lupa.add(cabo);
  lupa.rotation.y = Math.PI / 2;
  lupa.visible = false;
  B.partes.bracoE.mao.add(lupa);

  // celular gigante
  const tela = document.createElement('canvas');
  tela.width = TW;
  tela.height = TH;
  const texTela = new THREE.CanvasTexture(tela);
  texTela.colorSpace = THREE.SRGBColorSpace;
  const quadroCel = new THREE.Group();
  const forma = (w, h, r) => {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  };
  const corpoCel = new THREE.Mesh(new THREE.ExtrudeGeometry(forma(2.1, 4.2, 0.32), { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 4, curveSegments: 16 }), new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.35, metalness: 0.4 }));
  corpoCel.position.z = -0.07;
  quadroCel.add(corpoCel);
  const geoTela = new THREE.ShapeGeometry(forma(1.94, 4.04, 0.26), 16);
  const p = geoTela.attributes.position, uv = geoTela.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / 1.94 + 0.5, p.getY(i) / 4.04 + 0.5);
  const telaMesh = new THREE.Mesh(geoTela, new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }));
  telaMesh.position.z = 0.12;
  quadroCel.add(telaMesh);
  quadroCel.position.set(1.55, 2.45, -0.4);
  quadroCel.rotation.y = -0.22;
  cena.add(quadroCel);

  // cadeado (parte 1)
  const cadeado = new THREE.Group();
  cadeado.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.72, 0.34), new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.3, metalness: 0.85 })));
  const arco = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 12, 32, Math.PI), metal);
  arco.position.y = 0.36;
  cadeado.add(arco);
  const furo = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.36, 16), new THREE.MeshStandardMaterial({ color: 0xff6b1a, emissive: 0x5a2208 }));
  furo.rotation.x = Math.PI / 2;
  cadeado.add(furo);
  cadeado.visible = false;
  cena.add(cadeado);

  // fumaça
  const fumacaMat = new THREE.MeshStandardMaterial({ color: 0xd9dde1, roughness: 1, emissive: 0x1c1f23 });
  const bolha = new THREE.SphereGeometry(1, 24, 16);
  const camera = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.1, 90);
  cena.add(camera);
  const fumacaCam = new THREE.Group();
  for (let i = 0; i < 22; i++) {
    const m = new THREE.Mesh(bolha, fumacaMat);
    m.userData = { x: (hash(i * 3) - 0.5) * 2.6, y: (hash(i * 3 + 1) - 0.5) * 4.2, r: 0.7 + hash(i * 3 + 2) * 0.6, atraso: hash(i * 7) * 0.12 };
    fumacaCam.add(m);
  }
  fumacaCam.position.z = -3.4;
  camera.add(fumacaCam);
  const fumacaFoto = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const m = new THREE.Mesh(bolha, fumacaMat);
    m.userData = { x: (hash(i * 5) - 0.5) * 1.8, y: (hash(i * 5 + 1) - 0.5) * 3.2, r: 0.24 + hash(i * 5 + 2) * 0.24, atraso: hash(i * 11) * 0.15 };
    fumacaFoto.add(m);
  }
  fumacaFoto.position.set(0, 0, 0.35);
  quadroCel.add(fumacaFoto);

  // etiquetas flutuantes de cada parte: [sprite, posição, entra, sai]
  const E = [];
  const add = (s, x, y, z, entra, sai) => {
    s.position.set(x, y, z);
    s.userData.pos = s.position.clone();
    s.userData.entra = entra;
    s.userData.sai = sai;
    cena.add(s);
    E.push(s);
  };
  const p0 = L[0].pedacos;
  add(etiqueta('só Instagram?', { icone: 'balao', altura: 0.4 }), 0.4, 4.55, 0.9, p0[1].t, SEC[1]);
  add(etiqueta('risco', { icone: 'x', fundo: COR.laranja, altura: 0.44 }), 0.45, 3.9, 1.0, EV.risco, SEC[1]);
  add(etiqueta('conta bloqueada', { icone: 'x', altura: 0.4 }), 0.1, 4.6, 1.0, EV.bloqueio + 0.3, SEC[2]);
  add(etiqueta('vitrine sumiu', { fundo: COR.laranja, altura: 0.4 }), 0.15, 4.05, 1.0, EV.vitrine, SEC[2]);
  add(etiqueta('doceria perto de mim', { icone: 'balao', altura: 0.34 }), 0.6, 3.9, 1.0, EV.pesquisa, SEC[3]);
  add(etiqueta('só o concorrente', { icone: 'x', fundo: COR.laranja, altura: 0.38 }), -0.1, 4.75, 1.0, EV.concorrente, SEC[3]);
  add(etiqueta('cadê o preço?', { icone: 'balao', altura: 0.4 }), 0.45, 4.55, 1.0, L[5].ini + 0.4, EV.limpa + 0.45);
  add(etiqueta('tudo num lugar só', { icone: 'certo', fundo: COR.laranja, altura: 0.4 }), -0.05, 4.6, 1.0, EV.limpa + 0.5, SEC[4]);
  const c4 = [EV.resolve, EV.resolve + 0.45, EV.resolve + 0.9];
  add(etiqueta('não cai', { icone: 'certo', altura: 0.38 }), 0.3, 5.05, 1.0, c4[0], SEC[5]);
  add(etiqueta('aparece no Google', { icone: 'certo', altura: 0.38 }), 0.3, 4.5, 1.0, c4[1], SEC[5]);
  add(etiqueta('pedido fácil', { icone: 'certo', fundo: COR.laranja, altura: 0.4 }), 0.3, 3.95, 1.0, c4[2], SEC[5]);
  for (let i = 0; i < 4; i++) add(etiqueta(i % 2 ? PALAVRA : 'quero!', { icone: 'balao', fundo: i % 2 ? COR.laranja : COR.aluminio, altura: 0.34 }), 2.8 - i * 0.35, 0.8, 0.8 + i * 0.1, EV.site + 0.9 + i * 0.35, DUR + 1);
  E.slice(-4).forEach((s) => (s.userData.sobe = true));

  R = { renderer, cena, camera, B, lupa, quadroCel, tela, texTela, cadeado, fumacaCam, fumacaFoto, neonMat, brilhoNeon, monitores, ledCv, ledTex, poeira, base, fachos, anel, anelMat, E };
}

function bolhas(grupo, k) {
  grupo.visible = k > 0.001;
  if (!grupo.visible) return;
  for (const m of grupo.children) {
    const { x, y, r, atraso } = m.userData;
    const kk = clamp((k - atraso) / (1 - atraso));
    const s = r * ease.outCubic(kk);
    m.visible = s > 0.01;
    m.position.set(x * (0.7 + 0.3 * kk), y * (0.7 + 0.3 * kk), 0);
    m.scale.setScalar(Math.max(0.001, s));
  }
}

// planos de câmera: [alvo x, alvo y, distância, giro, altura extra]
const PLANO = {
  geral: [0.3, 2.55, 18, 0, 0.9],
  medio: [-0.55, 3.0, 12, -0.08, 0.6],
  rosto: [-1.0, 3.75, 5.8, 0.1, 0.2],
  tela: [1.45, 2.7, 9.5, -0.12, 0.3],
  baixo: [-0.2, 3.2, 12.5, 0.05, -1.6],
  lado: [0.2, 2.8, 14, 0.42, 0.7],
};
function planoEm(t) {
  // um plano por frase, com troca no meio de algumas
  const li = linhaEm(t);
  const tabela = [
    [['rosto', 0], ['geral', EV.risco - 0.1]],
    [['medio', 0]],
    [['geral', 0]],
    [['lado', 0]],
    [['tela', 0], ['medio', EV.concorrente - 0.1]],
    [['baixo', 0]],
    [['tela', 0], ['medio', EV.limpa + 1.2]],
    [['geral', 0]],
    [['medio', 0], ['tela', EV.site - 0.25]],
  ][li];
  let nome = tabela[0][0], t0 = li === 0 ? 0 : L[li].ini - 0.12;
  for (const [n, tt] of tabela) if (tt && t >= tt) {
    nome = n;
    t0 = tt;
  }
  if (li > 0 && tabela.length === 1) t0 = L[li].ini - 0.12;
  return { nome, t0 };
}
function camera3d(t) {
  const { nome, t0 } = planoEm(t);
  const [ax, ay, d, g, h] = PLANO[nome];
  const k = t - t0;
  // aproximação lenta durante o plano + "soco" de câmera na palavra em destaque
  const fala = L[linhaEm(t)];
  const tD = fala.destaque ? (fala.pedacos.find((c) => c.texto.includes(fala.destaque))?.t ?? -9) : -9;
  const soco = Math.exp(-Math.pow((t - tD - 0.12) / 0.18, 2)) * 0.07;
  const dd = d * (1 - 0.018 * k - soco);
  const az = g + 0.012 * k + 0.02 * Math.sin(t * 0.8);
  R.camera.position.set(ax + Math.sin(az) * dd, ay + h + 0.08 * Math.sin(t * 0.6), Math.cos(az) * dd);
  R.camera.lookAt(ax, ay, 0);
}

function atualizar3d(t) {
  const { B } = R;
  const boca = bocaEm(t);
  const pose = poseEm(t);
  // cabeça acompanha a voz; balanço do corpo
  pose.cabeca = [pose.cabeca[0] + 0.06 * boca * Math.sin(t * 9), pose.cabeca[1] + 0.03 * Math.sin(t * 1.1), pose.cabeca[2] + 0.025 * Math.sin(t * 1.3)];
  if (t > EV.concorrente - 0.1 && t < EV.concorrente + 0.9) pose.cabeca[1] += 0.28 * Math.sin((t - EV.concorrente) * 14) * (1 - prog(t, EV.concorrente, EV.concorrente + 0.9));
  if (t > EV.limpa && t < EV.limpa + 1.0) pose.e.ombro[2] += 0.25 * Math.sin((t - EV.limpa) * 12);
  if (t > L[3].ini + 0.4 && t < EV.concorrente) {
    pose.e.ombro[2] += 0.12 * Math.sin((t - L[3].ini) * 2.2);
    pose.e.ombro[0] += 0.1 * Math.sin((t - L[3].ini) * 1.6);
  }
  B.animar({ ...pose, boca: Math.min(1, boca * 1.2), respira: t * 2.2 });
  // pulinho quando a MACH entra
  const pulo = Math.sin(Math.PI * prog(t, SEC[4] + 0.05, SEC[4] + 0.5));
  B.boneco.position.y = 0.35 * Math.max(0, pulo);
  B.boneco.rotation.y = 0.18 + 0.06 * Math.sin(t * 0.9);
  R.lupa.visible = t > L[3].ini + 0.5 && t < EV.concorrente + 0.2;
  // cadeado: despenca na frente do celular no "bloqueio"
  const cad = t > EV.bloqueio - 0.05 && t < SEC[2] + 0.1;
  R.cadeado.visible = cad;
  if (cad) {
    const q = prog(t, EV.bloqueio - 0.05, EV.bloqueio + 0.3);
    R.cadeado.position.set(1.45, lerp(6.8, 2.75, ease.inCubic(q)), 0.7);
    const bate = Math.sin(Math.PI * prog(t, EV.bloqueio + 0.3, EV.bloqueio + 0.5));
    const some = 1 - ease.inCubic(prog(t, SEC[2] - 0.3, SEC[2]));
    R.cadeado.scale.set((1 + 0.14 * bate) * some, (1 - 0.14 * bate) * some, some);
    R.cadeado.rotation.set(0, -0.25 + 0.05 * Math.sin(t * 2), 0.06 * Math.sin(t * 1.7));
  }
  // telas
  desenharTela(R.tela.getContext('2d'), t);
  R.texTela.needsUpdate = true;
  for (const m of R.monitores) {
    monitor(m.cv.getContext('2d'), m.n, t);
    m.tex.needsUpdate = true;
  }
  letreiro(R.ledCv.getContext('2d'), t);
  R.ledTex.needsUpdate = true;
  // poeira subindo devagar
  const arr = R.poeira.geometry.attributes.position.array;
  R.base.forEach(([x, y, z], i) => {
    arr[i * 3] = x + 0.15 * Math.sin(t * 0.4 + i);
    arr[i * 3 + 1] = (y + t * 0.18) % 8.5;
    arr[i * 3 + 2] = z;
  });
  R.poeira.geometry.attributes.position.needsUpdate = true;
  // fachos varrendo
  R.fachos.forEach((f, i) => {
    f.rotation.z = 0.16 * Math.sin(t * 0.5 + i * 2);
  });
  // anel do chão pulsa com a voz
  R.anelMat.opacity = 0.12 + 0.55 * boca;
  R.anel.scale.setScalar(1 + 0.18 * boca);
  // etiquetas: entram com um "pop", flutuam e saem
  for (const s of R.E) {
    const { entra, sai, pos, base, sobe } = s.userData;
    const a = ease.outCubic(prog(t, entra, entra + 0.22)) * (1 - ease.inCubic(prog(t, sai - 0.2, sai)));
    s.visible = a > 0.01;
    if (!s.visible) continue;
    const pop = 1 + 0.25 * Math.sin(Math.PI * prog(t, entra, entra + 0.3));
    s.scale.set(base.x * a * pop, base.y * a * pop, 1);
    s.position.set(pos.x, pos.y + 0.06 * Math.sin(t * 2 + pos.x * 3) + (sobe ? (t - entra) * 1.1 : 0), pos.z);
    s.material.opacity = sobe ? 1 - prog(t, entra + 1.6, entra + 2.4) : 1;
    s.material.rotation = 0.04 * Math.sin(t * 1.5 + pos.y);
  }
  // fumaça
  let kc = 0;
  for (const tr of SEC.slice(1)) kc = Math.max(kc, 1 - Math.abs(t - tr) / 0.3);
  bolhas(R.fumacaCam, kc > 0 ? ease.inOutSine(clamp(kc)) : 0);
  bolhas(R.fumacaFoto, t > EV.limpa - 0.05 && t < EV.limpa + 0.9 ? Math.sin(Math.PI * prog(t, EV.limpa - 0.05, EV.limpa + 0.9)) : 0);
  // neon
  const acende = ease.outCubic(prog(t, SEC[4] + 0.1, SEC[4] + 0.5));
  const pisca = t > SEC[4] + 0.1 && t < SEC[4] + 0.45 ? (Math.floor(t * 30) % 3 ? 1 : 0.3) : 1;
  R.neonMat.emissiveIntensity = 0.06 + 2.8 * acende * pisca;
  R.brilhoNeon.intensity = 20 * acende * pisca;
  R.quadroCel.position.y = 2.45 + 0.05 * Math.sin(t * 1.1);
  camera3d(t);
}

// ── sobreposição 2D ─────────────────────────────────────────────
function faixa(ctx, t) {
  const i = secao(t), t0 = SEC[i], s = TITULOS[i];
  const pop = 1 + 0.12 * (1 - ease.outCubic(prog(t, t0, t0 + 0.2)));
  ctx.save();
  let px = 36;
  ctx.font = FONTE.expandida(px, 500);
  ctx.letterSpacing = '2px';
  while (ctx.measureText(s).width + 72 > 840 && px > 24) ctx.font = FONTE.expandida(--px, 500);
  const w = ctx.measureText(s).width + 72;
  ctx.translate(540, 318);
  ctx.rotate(-0.018);
  ctx.scale(pop, pop);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-w / 2 + 6, -26, w, 72);
  ctx.fillStyle = COR.aluminio;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -36);
  for (let x = -w / 2; x <= w / 2; x += 24) ctx.lineTo(x, -36 + (hash(Math.round(x)) - 0.5) * 3);
  ctx.lineTo(w / 2, 36);
  for (let x = w / 2; x >= -w / 2; x -= 24) ctx.lineTo(x, 36 + (hash(Math.round(x) + 99) - 0.5) * 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0A0C0F';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, 0, 3);
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * (w / 2 - 4), -30);
    ctx.rotate(sx * 0.65);
    ctx.fillStyle = 'rgba(214,200,170,0.62)';
    ctx.fillRect(-40, -13, 80, 26);
    ctx.restore();
  }
  ctx.restore();
  // progresso dos 3 erros
  if (i >= 1 && i <= 3) {
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = k + 1 === i ? COR.laranja : k + 1 < i ? COR.aluminio : 'rgba(223,227,231,0.25)';
      ctx.beginPath();
      ctx.roundRect(540 - 66 + k * 46, 376, 38, 8, 4);
      ctx.fill();
    }
  }
}
function numeroGrande(ctx, t) {
  for (const k of [1, 2, 3]) {
    const t0 = SEC[k];
    const a = prog(t, t0 - 0.1, t0 + 0.05) * (1 - prog(t, t0 + 0.45, t0 + 0.75));
    if (a <= 0) continue;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(540, 1010);
    const e = 1.35 - 0.35 * ease.outCubic(prog(t, t0 - 0.1, t0 + 0.25));
    ctx.scale(e, e);
    ctx.font = FONTE.titulo(560, 300);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillText(String(k), 10, 14);
    ctx.fillStyle = COR.laranja;
    ctx.fillText(String(k), 0, 0);
    ctx.restore();
  }
}
function falaAtual(t) {
  for (let li = L.length - 1; li >= 0; li--) {
    const ln = L[li];
    if (t < ln.pedacos[0].t) continue;
    if (t > ln.fim + 0.35) return null;
    let k = 0;
    while (k + 1 < ln.pedacos.length && t >= ln.pedacos[k + 1].t) k++;
    return { li, k };
  }
  return null;
}
function legenda(ctx, t) {
  const f = falaAtual(t);
  if (!f) return;
  const ln = L[f.li], pd = ln.pedacos[f.k];
  const palavras = pd.texto.split(' ');
  ctx.save();
  ctx.font = FONTE.texto(60, 600);
  const larg = palavras.map((p) => ctx.measureText(p).width + 40);
  const total = larg.reduce((a, b) => a + b, 0) + 16 * (palavras.length - 1);
  let x = 540 - total / 2;
  palavras.forEach((p, i) => {
    const k = ease.outCubic(prog(t, pd.t + i * 0.08, pd.t + i * 0.08 + 0.14));
    if (k > 0) {
      ctx.save();
      ctx.translate(x + larg[i] / 2, 1240);
      ctx.rotate(((f.k + i) % 2 ? 1 : -1) * 0.035);
      ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      const quente = ln.destaque && p === ln.destaque;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(-larg[i] / 2 + 5, -40 + 7, larg[i], 84);
      ctx.fillStyle = quente ? COR.laranja : COR.aluminio;
      ctx.beginPath();
      ctx.roundRect(-larg[i] / 2, -40, larg[i], 84, 10);
      ctx.fill();
      ctx.fillStyle = '#0A0C0F';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p, 0, 4);
      ctx.restore();
    }
    x += larg[i] + 16;
  });
  ctx.restore();
}
function balaoDM(ctx, t) {
  const t0 = EV.site + 0.9;
  const k = ease.outCubic(prog(t, t0, t0 + 0.25));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(690, 560);
  ctx.rotate(-0.06);
  ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(-150 + 6, -46 + 8, 300, 92);
  ctx.fillStyle = COR.aluminio;
  ctx.beginPath();
  ctx.roundRect(-150, -46, 300, 92, 46);
  ctx.moveTo(-60, 40);
  ctx.lineTo(-96, 82);
  ctx.lineTo(-20, 44);
  ctx.fill();
  ctx.fillStyle = '#0A0C0F';
  ctx.font = FONTE.expandida(34, 500);
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NA SUA DM!', 0, 3);
  ctx.restore();
  for (let i = 0; i < 18; i++) {
    const kk = prog(t, t0 + hash(i) * 0.2, t0 + 1.0 + hash(i) * 0.2);
    if (kk <= 0 || kk >= 1) continue;
    const ang = hash(i * 3) * Math.PI * 2, d = 60 + 220 * ease.outCubic(kk);
    ctx.save();
    ctx.globalAlpha = 1 - kk;
    ctx.fillStyle = i % 3 ? COR.aluminio : COR.laranja;
    ctx.translate(690 + Math.cos(ang) * d, 560 + Math.sin(ang) * d * 0.7 + kk * 80);
    ctx.rotate(kk * 8 + i);
    ctx.fillRect(-7, -4, 14, 8);
    ctx.restore();
  }
}

const reel = {
  id: 'i22',
  nome: 'i22-boneco-so-instagram-nao-basta',
  duracao: DUR,
  fps: 30,
  async preparar() {
    preparaTempos(await (await fetch(VOZ + 'linhas.json')).json());
    BOCA = await (await fetch(VOZ + 'boca.json')).json();
    reel.duracao = DUR;
    montar();
  },
  desenhar(ctx, t) {
    atualizar3d(t);
    R.renderer.render(R.cena, R.camera);
    ctx.drawImage(R.renderer.domElement, 0, 0, 1080, 1920);
    faixa(ctx, t);
    numeroGrande(ctx, t);
    legenda(ctx, t);
    balaoDM(ctx, t);
    assinatura(ctx, t, { entra: DUR - 1.4 });
    vinheta(ctx, 0.28);
  },
  capa(ctx) {
    reel.desenhar(ctx, EV.bloqueio + 0.9);
  },
};
export default reel;
