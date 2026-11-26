// i21 — "3 erros que espantam cliente", com o boneco 3D da MACH (30 s).
// Estrutura do Reels de referência desmontado em 26/11 (instagram/pauta/desmonte-reels-3-comandos-claude.md):
// faixa-índice no topo, legenda palavra por palavra, personagem 3D falando, uma cena literal por item,
// transição de fumaça e o pedido de comentário encenado. Tudo próprio: estúdio escuro da marca, Λ de neon,
// celular gigante com a tela animada. Sem áudio: as falas estão na legenda (o dono pode narrar por cima).
import * as THREE from 'three';
import { RoomEnvironment } from '/video-anuncio/vendor/RoomEnvironment.js';
import { clamp, lerp, prog, ease, hash } from '../motor/tempo.js';
import { COR, FONTE, assinatura, vinheta } from '../motor/marca.js';
import { criarBoneco } from '../boneco/boneco.js';
import { foto } from './catalogo.js';

const DUR = 30;
const SECOES = [
  [0, 'TRÊS ERROS QUE ESPANTAM CLIENTE'],
  [3.4, '1. DEMORA PARA ABRIR'],
  [9.6, '2. WHATSAPP ESCONDIDO'],
  [15.8, '3. FOTO RUIM NO TOPO'],
  [22.0, 'A MACH RESOLVE OS TRÊS'],
  [25.6, 'COMENTA SITE'],
];
// legenda: [início, texto, palavra em destaque]
const FALAS = [
  [0.15, 'Três erros', 'erros'], [0.95, 'que fazem'], [1.6, 'o cliente'], [2.25, 'fechar o'], [2.8, 'seu site.'],
  [3.6, 'Primeiro:'], [4.3, 'demora', 'demora'], [4.9, 'para abrir.'], [5.8, 'Passou de'], [6.5, '3 segundos,', 'segundos,'], [7.4, 'ele volta'], [8.1, 'pro feed.'],
  [9.9, 'Segundo:'], [10.6, 'o WhatsApp', 'WhatsApp'], [11.4, 'escondido.'], [12.3, 'Se ele'], [12.9, 'precisa'], [13.5, 'procurar,'], [14.4, 'ele desiste.', 'desiste.'],
  [16.1, 'Terceiro:'], [16.8, 'a foto', 'foto'], [17.4, 'do topo.'], [18.2, 'É ela'], [18.8, 'que decide', 'decide'], [19.6, 'se ele fica'], [20.5, 'ou sai.'],
  [22.3, 'A MACH', 'MACH'], [23.0, 'resolve'], [23.6, 'os três'], [24.3, 'de uma vez.'],
  [25.9, 'Comenta'], [26.6, 'SITE', 'SITE'], [27.2, 'que eu'], [27.7, 'olho'], [28.2, 'o seu.'],
];
const FIM_FALA = { 3.4: 3.3, 9.6: 9.0, 15.8: 15.3, 22.0: 21.3, 25.6: 25.2, 30: 29.0 };
const TRANSICOES = [9.6, 15.8, 22.0, 25.6];

const suave = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
const secao = (t) => {
  let i = 0;
  while (i + 1 < SECOES.length && t >= SECOES[i + 1][0]) i++;
  return i;
};

// ── poses do boneco (chaves no tempo) ───────────────────────────
const NEUTRA = { e: { ombro: [0, 0, 0.14], cotovelo: [-0.12, 0, 0] }, d: { ombro: [0, 0, -0.14], cotovelo: [-0.12, 0, 0] }, cabeca: [0, 0, 0] };
const P = {
  neutra: NEUTRA,
  explica: { e: { ombro: [-0.2, 0, 0.3], cotovelo: [-0.9, 0, 0] }, d: { ombro: [-0.35, 0, -0.35], cotovelo: [-1.2, 0, 0] }, cabeca: [0, 0.1, 0] },
  aponta: { e: { ombro: [-0.35, 0, 1.15], cotovelo: [-0.35, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0, 0.38, 0] },
  relogio: { e: { ombro: [-0.95, 0, -0.42], cotovelo: [-1.55, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0.38, 0.28, 0] },
  lupa: { e: { ombro: [-0.55, 0, 1.0], cotovelo: [-0.55, 0, 0] }, d: { ombro: [-0.1, 0, -0.2], cotovelo: [-0.5, 0, 0] }, cabeca: [0.05, 0.45, 0] },
  limpa: { e: { ombro: [-0.85, 0, 1.25], cotovelo: [-0.75, 0, 0] }, d: { ombro: [0, 0, -0.12], cotovelo: [-0.2, 0, 0] }, cabeca: [0, 0.35, 0] },
  joinha: { e: { ombro: [0, 0, 0.18], cotovelo: [-0.2, 0, 0] }, d: { ombro: [-0.25, 0, -0.4], cotovelo: [-2.15, 0, 0] }, cabeca: [-0.05, -0.1, 0] },
  bracos: { e: { ombro: [-0.25, 0, 0.75], cotovelo: [-0.6, 0, 0] }, d: { ombro: [-0.25, 0, -0.75], cotovelo: [-0.6, 0, 0] }, cabeca: [-0.06, 0, 0] },
};
const TRILHA = [
  [0, 'explica'], [2.6, 'bracos'], [3.5, 'explica'], [5.6, 'relogio'], [7.2, 'aponta'], [9.0, 'neutra'],
  [9.9, 'explica'], [10.8, 'lupa'], [14.2, 'aponta'], [15.4, 'neutra'],
  [16.1, 'explica'], [17.2, 'aponta'], [18.7, 'limpa'], [19.7, 'aponta'], [21.0, 'neutra'],
  [22.2, 'bracos'], [23.4, 'joinha'], [25.4, 'neutra'], [25.9, 'aponta'], [28.6, 'explica'],
];
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
  let i = 0;
  while (i + 1 < TRILHA.length && t >= TRILHA[i + 1][0]) i++;
  const [t0, n0] = TRILHA[i];
  const ant = i > 0 ? P[TRILHA[i - 1][1]] : P[n0];
  const k = ease.inOutCubic(prog(t, t0, t0 + 0.45));
  return lerpPose(ant, P[n0], k);
}

// ── tela do celular gigante (textura desenhada a cada quadro) ───
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
  // contato escondido no rodapé
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
  // anel girando e tempo
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
  const linhas = [['ana.doces', 'quero ver o meu!'], ['barbearia.ze', 'SITE']];
  linhas.forEach(([quem, c], i) => {
    const y = 190 + i * 110;
    g.fillStyle = 'rgba(223,227,231,0.18)';
    g.beginPath();
    g.arc(56, y, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COR.nevoa;
    g.font = FONTE.texto(20, 500);
    g.fillText(quem, 100, y - 8);
    g.fillStyle = c === 'SITE' ? COR.laranja : COR.aluminio;
    g.font = FONTE.texto(24, c === 'SITE' ? 600 : 400);
    g.fillText(c, 100, y + 24);
  });
  // o comentário do espectador sendo digitado e publicado
  const digitado = 'SITE'.slice(0, Math.floor(clamp((t - 26.6) / 0.5) * 4 + 0.001));
  const publicado = t >= 27.4;
  if (publicado) {
    const y = 410, a = ease.outCubic(prog(t, 27.4, 27.7));
    g.globalAlpha = a;
    g.fillStyle = COR.laranja;
    g.beginPath();
    g.arc(56, y, 26, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = COR.nevoa;
    g.font = FONTE.texto(20, 500);
    g.fillText('você', 100, y - 8);
    g.fillStyle = COR.laranja;
    g.font = FONTE.texto(24, 600);
    g.fillText('SITE', 100, y + 24);
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
function desenharTela(g, t) {
  g.save();
  const i = secao(t);
  if (i === 0) telaInicio(g, t);
  else if (i === 1) {
    if (t < 7.4) carregando(g, t, 4.3, 7.4);
    else {
      const k = ease.inOutCubic(prog(t, 7.4, 7.8));
      g.save();
      g.translate(k * TW * 0.4, 0);
      carregando(g, t, 4.3, 7.4);
      g.restore();
      g.save();
      g.translate(-(1 - k) * TW, 0);
      feed(g);
      g.restore();
    }
  } else if (i === 2) {
    if (t < 14.4) siteDoceria(g, { achou: ease.outCubic(prog(t, 13.5, 13.8)) });
    else {
      const k = ease.inOutCubic(prog(t, 14.4, 14.8));
      g.save();
      g.translate(k * TW * 0.4, 0);
      siteDoceria(g, { achou: 1 });
      g.restore();
      g.save();
      g.translate(-(1 - k) * TW, 0);
      feed(g);
      g.restore();
    }
  } else if (i === 3) siteDoceria(g, { ruim: t < 19.35 });
  else if (i === 4) siteDoceria(g, { pilula: true, selo: t > 23.2 });
  else comentarios(g, t);
  g.restore();
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
  renderer.toneMappingExposure = 1.05;
  const cena = new THREE.Scene();
  cena.background = new THREE.Color(0x0a0c0f);
  cena.fog = new THREE.Fog(0x0a0c0f, 22, 40);
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

  // estúdio: chão, parede, janelas acesas, Λ de neon e fachos de luz
  const chao = new THREE.Mesh(new THREE.CircleGeometry(14, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x101317, roughness: 0.5, metalness: 0.2 }));
  cena.add(chao);
  const parede = new THREE.Mesh(new THREE.PlaneGeometry(30, 16), new THREE.MeshStandardMaterial({ color: 0x14181d, roughness: 0.95 }));
  parede.position.set(0, 7, -5);
  cena.add(parede);
  const janela = new THREE.MeshStandardMaterial({ color: 0x1a1d22, emissive: 0xffcf9a, emissiveIntensity: 0.32 });
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.45), janela);
    m.position.set(-5.5 + (i % 5) * 2.7 + hash(i) * 0.6, 7.2 + Math.floor(i / 5) * 1.6 + hash(i + 9) * 0.3, -4.95);
    cena.add(m);
  }
  const neonMat = new THREE.MeshStandardMaterial({ color: 0x2a140a, emissive: 0xff6b1a, emissiveIntensity: 0.06 });
  const neon = new THREE.Group();
  for (const s of [-1, 1]) {
    const perna = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 2.1, 6, 12), neonMat);
    perna.position.set(0.55 * s, 0, 0);
    perna.rotation.z = 0.48 * s; // as duas pernas se encontram no alto: Λ
    neon.add(perna);
  }
  neon.position.set(-2.2, 5.7, -4.85);
  neon.scale.setScalar(0.8);
  cena.add(neon);
  const brilhoNeon = new THREE.PointLight(0xff6b1a, 0, 9, 1.6);
  brilhoNeon.position.set(-2.2, 5.5, -3.6);
  cena.add(brilhoNeon);
  const facho = new THREE.MeshBasicMaterial({ color: 0xfff1e6, transparent: true, opacity: 0.045, depthWrite: false, side: THREE.DoubleSide });
  for (const x of [-1.2, 2.2]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.9, 9, 32, 1, true), facho);
    cone.position.set(x, 5.2, 0.2);
    cena.add(cone);
  }
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
    sombra.position.set(-1.1, 0.006, 0);
    cena.add(sombra);
  }

  // o boneco
  const B = criarBoneco();
  B.boneco.position.set(-1.1, 0, 0);
  B.boneco.rotation.y = 0.18;
  cena.add(B.boneco);
  // a lupa, na mão esquerda dele
  const lupa = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xc9ced3, roughness: 0.25, metalness: 0.9 });
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

  // o celular gigante
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
  const pos = geoTela.attributes.position, uv = geoTela.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 1.94 + 0.5, pos.getY(i) / 4.04 + 0.5);
  const telaMesh = new THREE.Mesh(geoTela, new THREE.MeshBasicMaterial({ map: texTela, toneMapped: false }));
  telaMesh.position.z = 0.12;
  quadroCel.add(telaMesh);
  quadroCel.position.set(1.55, 2.45, -0.4);
  quadroCel.rotation.y = -0.22;
  cena.add(quadroCel);

  // a ampulheta (item 1)
  const ampulheta = new THREE.Group();
  for (const y of [0.62, -0.62]) {
    const tampa = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 32), metal);
    tampa.position.y = y;
    ampulheta.add(tampa);
  }
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.24, 8), metal);
    p.position.set(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4);
    ampulheta.add(p);
  }
  const vidroMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe3e7, transparent: true, opacity: 0.18, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const vidroCima = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.56, 32, 1, true), vidroMat);
  vidroCima.position.y = 0.3;
  vidroCima.rotation.x = Math.PI;
  const vidroBaixo = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.56, 32, 1, true), vidroMat);
  vidroBaixo.position.y = -0.3;
  ampulheta.add(vidroCima, vidroBaixo);
  const areiaMat = new THREE.MeshStandardMaterial({ color: 0xff6b1a, roughness: 0.8, emissive: 0x401a06 });
  const areiaCima = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.5, 32), areiaMat);
  areiaCima.rotation.x = Math.PI;
  const areiaBaixo = new THREE.Mesh(new THREE.ConeGeometry(0.33, 0.5, 32), areiaMat);
  const fio = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), areiaMat);
  ampulheta.add(areiaCima, areiaBaixo, fio);
  ampulheta.position.set(0.25, 4.25, 0.9);
  ampulheta.visible = false;
  cena.add(ampulheta);

  // fumaça: bolhas brancas (transições na frente da câmera e a limpeza da foto)
  const fumacaMat = new THREE.MeshStandardMaterial({ color: 0xd9dde1, roughness: 1, emissive: 0x1c1f23 });
  const bolha = new THREE.SphereGeometry(1, 24, 16);
  const camera = new THREE.PerspectiveCamera(30, 1080 / 1920, 0.1, 80);
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
    m.userData = { x: (hash(i * 5) - 0.5) * 2.0, y: (hash(i * 5 + 1) - 0.5) * 3.4, r: 0.35 + hash(i * 5 + 2) * 0.35, atraso: hash(i * 11) * 0.15 };
    fumacaFoto.add(m);
  }
  fumacaFoto.position.set(0, 0, 0.35);
  quadroCel.add(fumacaFoto);

  R = { renderer, cena, camera, B, lupa, quadroCel, tela, texTela, ampulheta, areiaCima, areiaBaixo, fio, fumacaCam, fumacaFoto, neonMat, brilhoNeon };
}

function bolhas(grupo, k, cresce = 1) {
  grupo.visible = k > 0.001;
  if (!grupo.visible) return;
  for (const m of grupo.children) {
    const { x, y, r, atraso } = m.userData;
    const kk = clamp((k - atraso) / (1 - atraso));
    const s = r * ease.outCubic(kk) * cresce;
    m.visible = s > 0.01;
    m.position.set(x * (0.7 + 0.3 * kk), y * (0.7 + 0.3 * kk), 0);
    m.scale.setScalar(Math.max(0.001, s));
  }
}

function camera3d(t) {
  const i = secao(t);
  // [alvo x, alvo y, distância, giro]
  const planos = [
    [0.25, 2.3, 18.0, 0.0],
    [0.15, 2.35, 17.0, -0.06],
    [0.3, 2.4, 16.8, 0.05],
    [0.35, 2.4, 16.5, 0.08],
    [0.1, 2.9, 19.5, -0.04],
    [0.4, 2.35, 17.0, 0.04],
  ];
  const ini = SECOES[i][0], fimSec = i + 1 < SECOES.length ? SECOES[i + 1][0] : DUR;
  const k = (t - ini) / (fimSec - ini);
  const [ax, ay, d, g] = planos[i];
  const dd = d * (1 - 0.05 * k); // aproximação lenta dentro de cada parte
  const az = g + 0.03 * Math.sin(t * 0.7);
  R.camera.position.set(ax + Math.sin(az) * dd, ay + 0.9 + 0.1 * Math.sin(t * 0.5), Math.cos(az) * dd);
  R.camera.lookAt(ax, ay, 0);
}

function falaAtual(t) {
  for (let i = FALAS.length - 1; i >= 0; i--) {
    if (t >= FALAS[i][0]) {
      const prox = FALAS[i + 1]?.[0] ?? DUR;
      const lim = Object.entries(FIM_FALA).find(([s]) => Number(s) > FALAS[i][0])?.[1] ?? DUR;
      if (t < Math.min(prox, lim + 0.6)) return { i, t0: FALAS[i][0], fim: Math.min(prox, lim) };
      return null;
    }
  }
  return null;
}

function atualizar3d(t) {
  const { B } = R;
  const pose = poseEm(t);
  const fala = falaAtual(t);
  // a boca abre e fecha enquanto ele fala; a cabeça acompanha a fala de leve
  let boca = 0;
  if (fala && t < fala.fim - 0.05) boca = 0.3 + 0.7 * Math.abs(Math.sin((t - fala.t0) * 15));
  const balanco = fala ? 0.04 * Math.sin((t - fala.t0) * 7) : 0;
  pose.cabeca = [pose.cabeca[0] + balanco, pose.cabeca[1], pose.cabeca[2] + 0.02 * Math.sin(t * 1.3)];
  // gesto de limpar: o braço varre a foto
  if (t > 18.7 && t < 19.7) pose.e.ombro[2] += 0.25 * Math.sin((t - 18.7) * 12);
  // a lupa passeia pela tela
  if (t > 10.8 && t < 14.3) {
    pose.e.ombro[2] += 0.12 * Math.sin((t - 10.8) * 2.2);
    pose.e.ombro[0] += 0.1 * Math.sin((t - 10.8) * 1.6);
  }
  B.animar({ ...pose, boca, respira: t * 2.2 });
  R.lupa.visible = t > 10.95 && t < 15.3;
  // ampulheta: aparece, gira, a areia desce
  const amp = t > 4.2 && t < 9.7;
  R.ampulheta.visible = amp;
  if (amp) {
    const nasce = ease.outCubic(prog(t, 4.2, 4.55));
    R.ampulheta.scale.setScalar(0.85 * nasce * (1 - ease.inCubic(prog(t, 9.3, 9.6))));
    R.ampulheta.rotation.y = t * 0.8;
    R.ampulheta.rotation.z = 0.12 * Math.sin(t * 1.4);
    const k = clamp((t - 4.4) / 3.0);
    R.areiaCima.scale.set(1 - k * 0.85, 1 - k * 0.85, 1 - k * 0.85);
    R.areiaCima.position.y = 0.22 - k * 0.1;
    R.areiaBaixo.scale.set(0.15 + k * 0.85, 0.15 + k * 0.85, 0.15 + k * 0.85);
    R.areiaBaixo.position.y = -0.56 + (0.15 + k * 0.85) * 0.25;
    R.fio.visible = k < 1;
  }
  // tela do celular gigante
  const g = R.tela.getContext('2d');
  desenharTela(g, t);
  R.texTela.needsUpdate = true;
  // fumaça na troca de parte (cobre a câmera) e na limpeza da foto
  let kc = 0;
  for (const tr of TRANSICOES) kc = Math.max(kc, 1 - Math.abs(t - tr) / 0.32);
  bolhas(R.fumacaCam, clamp(kc) > 0 ? ease.inOutSine(clamp(kc)) : 0);
  const kf = t > 18.95 && t < 19.9 ? Math.sin(Math.PI * prog(t, 18.95, 19.9)) : 0;
  bolhas(R.fumacaFoto, kf);
  // o Λ de neon acende quando a MACH entra
  const acende = ease.outCubic(prog(t, 22.25, 22.7));
  const pisca = t > 22.25 && t < 22.6 ? (Math.floor(t * 30) % 3 ? 1 : 0.3) : 1;
  R.neonMat.emissiveIntensity = 0.06 + 2.8 * acende * pisca;
  R.brilhoNeon.intensity = 18 * acende * pisca;
  // o celular gigante dá um "pulo" nas trocas de tela
  R.quadroCel.position.y = 2.45 + 0.05 * Math.sin(t * 1.1);
  camera3d(t);
}

// ── sobreposição 2D: faixa no topo e legenda ────────────────────
function faixa(ctx, t) {
  const i = secao(t), [t0, s] = SECOES[i];
  const pop = 1 + 0.12 * (1 - ease.outCubic(prog(t, t0, t0 + 0.2)));
  ctx.save();
  let px = 36;
  ctx.font = FONTE.expandida(px, 500);
  ctx.letterSpacing = '2px';
  while (ctx.measureText(s).width + 72 > 840 && px > 24) {
    px -= 1;
    ctx.font = FONTE.expandida(px, 500);
  }
  const w = ctx.measureText(s).width + 72;
  ctx.translate(540, 318);
  ctx.rotate(-0.018);
  ctx.scale(pop, pop);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-w / 2 + 6, -34 + 8, w, 72);
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
}

function legenda(ctx, t) {
  const f = falaAtual(t);
  if (!f) return;
  const [t0, txt, destaque] = FALAS[f.i];
  const palavras = txt.split(' ');
  ctx.save();
  ctx.font = FONTE.texto(58, 600);
  const larg = palavras.map((p) => ctx.measureText(p).width + 40);
  const total = larg.reduce((a, b) => a + b, 0) + 16 * (palavras.length - 1);
  let x = 540 - total / 2;
  const y = 1236;
  palavras.forEach((p, i) => {
    const k = ease.outCubic(prog(t, t0 + i * 0.12, t0 + i * 0.12 + 0.16));
    if (k <= 0) {
      x += larg[i] + 16;
      return;
    }
    ctx.save();
    ctx.translate(x + larg[i] / 2, y);
    ctx.rotate(((f.i + i) % 2 ? 1 : -1) * 0.035);
    ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
    const quente = destaque && p === destaque;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(-larg[i] / 2 + 5, -40 + 7, larg[i], 82);
    ctx.fillStyle = quente ? COR.laranja : COR.aluminio;
    ctx.beginPath();
    ctx.roundRect(-larg[i] / 2, -40, larg[i], 82, 10);
    ctx.fill();
    ctx.fillStyle = '#0A0C0F';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p, 0, 4);
    ctx.restore();
    x += larg[i] + 16;
  });
  ctx.restore();
}

function balaoDM(ctx, t) {
  const k = ease.outCubic(prog(t, 27.6, 27.85));
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
  // confete laranja e alumínio
  for (let i = 0; i < 18; i++) {
    const kk = prog(t, 27.6 + hash(i) * 0.2, 28.6 + hash(i) * 0.2);
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
  id: 'i21',
  nome: 'i21-boneco-3-erros-que-espantam-cliente',
  duracao: DUR,
  fps: 30,
  async preparar() {
    montar();
  },
  desenhar(ctx, t) {
    if (!R) montar();
    atualizar3d(t);
    R.renderer.render(R.cena, R.camera);
    ctx.drawImage(R.renderer.domElement, 0, 0, 1080, 1920);
    faixa(ctx, t);
    legenda(ctx, t);
    balaoDM(ctx, t);
    assinatura(ctx, t, { entra: 28.8 });
    vinheta(ctx, 0.28);
  },
  capa(ctx) {
    reel.desenhar(ctx, 12.4);
  },
};
export default reel;
