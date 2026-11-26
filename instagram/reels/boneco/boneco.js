// O boneco 3D da MACH (o mascote que narra os vídeos). Estilo "brinquedo de vinil": formas arredondadas,
// cabelo liso em mechas lisas e penteadas (pedido do dono em 26/11), nada de blocos. Roupa e cabelo a partir das fotos de referência do dono
// (as fotos não ficam no repositório).
//   Moletom cinza de tecido técnico, com zíper preto, costuras pretas na diagonal e punhos pretos;
//   no peito, um Λ laranja da MACH no lugar do logo da marca da roupa.
//   Calça jeans larga cinza-claro, lavada. Óculos pretos esportivos, que envolvem o rosto.
//   Cabelo castanho-escuro, liso, com franja caindo na testa. Cavanhaque e bigode ralo. Celular de capa azul.
// Unidade: 1 = 10 cm. Pés em y = 0, olhando para +z.
import * as THREE from 'three';

const COR = {
  pele: 0xe8c0a2,
  peleSombra: 0xd9a98a,
  cabelo: 0x21160f,
  barba: 0x3a2a20,
  moletom: 0x80868d,
  preto: 0x16181b,
  jeans: 0xa9adb0,
  tenis: 0xe6e8ea,
  sola: 0xb5b9bd,
  laranja: 0xff6b1a,
  azulCelular: 0x2448e0,
  prata: 0xc9ced3,
};

/** gerador de números determinístico (o mesmo boneco sempre) */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function texturaJeans() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#aeb2b5';
  g.fillRect(0, 0, 256, 256);
  const r = rng(7);
  for (let i = 0; i < 90; i++) {
    const x = r() * 256, y = r() * 256, rad = 6 + r() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const claro = r() > 0.4;
    gr.addColorStop(0, claro ? 'rgba(235,238,240,0.16)' : 'rgba(110,115,120,0.1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = 'rgba(255,255,255,0.06)';
  for (let x = 0; x < 256; x += 3) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 6, 256);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}

const mat = (cor, op = {}) => new THREE.MeshStandardMaterial({ color: cor, roughness: op.rough ?? 0.75, metalness: op.metal ?? 0, flatShading: op.flat ?? false, map: op.map ?? null });

function malha(geo, material, pos = [0, 0, 0], esc = [1, 1, 1], rot = [0, 0, 0]) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(...pos);
  m.scale.set(...esc);
  m.rotation.set(...rot);
  m.castShadow = true;
  return m;
}
const esfera = (r = 1, w = 32, h = 20) => new THREE.SphereGeometry(r, w, h);
const capsula = (r, l) => new THREE.CapsuleGeometry(r, l, 8, 20);

// tronco: cápsula achatada; a função dá o z da frente para desenhar zíper e costuras em cima
const TRONCO = { cy: 2.33, r: 0.62, L: 0.56, sy: 0.86, sz: 0.74 };
function zFrente(x, y, folga = 0.012) {
  const { cy, r, L, sy, sz } = TRONCO;
  const yl = Math.abs((y - cy) / sy);
  const rr = yl <= L / 2 ? r : Math.sqrt(Math.max(0, r * r - (yl - L / 2) ** 2));
  return sz * Math.sqrt(Math.max(0, rr * rr - x * x)) + folga;
}
function costura(pontos, material, raio = 0.016) {
  const curva = new THREE.CatmullRomCurve3(pontos.map(([x, y]) => new THREE.Vector3(x, y, zFrente(x, y))));
  return new THREE.Mesh(new THREE.TubeGeometry(curva, 64, raio, 8, false), material);
}

function criarBraco(lado, M) {
  // lado = +1 (direita de quem olha o boneco de frente = esquerda dele) ou -1
  const ombro = new THREE.Group();
  ombro.position.set(0.66 * lado, 2.86, 0);
  const braco = malha(capsula(0.175, 0.55), M.moletom, [0, -0.45, 0]);
  ombro.add(braco);
  const cotovelo = new THREE.Group();
  cotovelo.position.set(0, -0.9, 0);
  ombro.add(cotovelo);
  cotovelo.add(malha(capsula(0.165, 0.48), M.moletom, [0, -0.4, 0]));
  cotovelo.add(malha(new THREE.CylinderGeometry(0.17, 0.165, 0.1, 24), M.preto, [0, -0.8, 0]));
  const pulso = new THREE.Group();
  pulso.position.set(0, -0.86, 0);
  cotovelo.add(pulso);
  const mao = new THREE.Group();
  pulso.add(mao);
  mao.add(malha(esfera(0.14), M.pele, [0, -0.1, 0.01], [0.85, 1.12, 0.62]));
  mao.add(malha(capsula(0.045, 0.08), M.pele, [-0.1 * lado, -0.06, 0.06], [1, 1, 1], [0.2, 0, 0.5 * lado]));
  // relógio no pulso esquerdo dele (lado +1), anel na mão direita
  if (lado > 0) {
    pulso.add(malha(new THREE.TorusGeometry(0.125, 0.035, 10, 24), M.prata, [0, 0.03, 0], [1, 1, 1], [Math.PI / 2, 0, 0]));
    pulso.add(malha(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 24), M.preto, [0, 0.03, 0.13], [1, 1, 1], [Math.PI / 2, 0, 0]));
  } else {
    mao.add(malha(new THREE.TorusGeometry(0.035, 0.009, 8, 20), M.prata, [0.02, -0.17, 0.05], [1, 1, 1], [Math.PI / 2, 0, 0]));
  }
  return { ombro, cotovelo, pulso, mao };
}

function criarCabelo(M, cabeca) {
  // cabelo liso: uma peça só, lisa, com os fios penteados marcados de leve e a franja caindo
  // para o lado até perto dos óculos, com as pontas recortadas
  const g = new THREE.Group();
  const [hx, hy, hz] = cabeca;
  const C = new THREE.Vector3(hx, hy + 0.05, hz - 0.02);
  const R = 0.645;
  const geo = new THREE.SphereGeometry(R, 120, 60, 0, Math.PI * 2, 0, Math.PI * 0.66);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const horiz = Math.hypot(v.x, v.z) || 1;
    const phi = Math.atan2(v.x, v.z); // 0 = frente
    const frente = Math.max(0, v.z / horiz);
    // limite de baixo: nuca abaixo das orelhas; frente = franja até perto dos óculos,
    // mais baixa do lado para onde ela cai (x < 0) e com pontas recortadas
    const pontas = 0.045 * Math.abs(Math.sin(phi * 11));
    let minY = THREE.MathUtils.lerp(Math.cos(Math.PI * 0.64), Math.cos(Math.PI * 0.43), Math.pow(frente, 1.4));
    minY += frente * (0.07 * v.x / horiz + pontas);
    if (v.y < minY) {
      const k = Math.sqrt(Math.max(0, 1 - minY * minY)) / horiz;
      v.set(v.x * k, minY, v.z * k);
    }
    // volume no alto e atrás; fios penteados (sulcos leves que descem do topo)
    const sulco = 0.012 * Math.sin(phi * 34 + v.y * 3) * (1 - Math.max(0, v.y) * 0.6);
    const volume = 1.0 + 0.07 * Math.max(0, v.y) + 0.03 * Math.max(0, -v.z) + sulco;
    pos.setXYZ(i, v.x * R * volume, v.y * R * volume, v.z * R * volume);
  }
  geo.computeVertexNormals();
  g.add(malha(geo, M.cabelo, [C.x, C.y, C.z], [1.06, 1.04, 1.07]));
  return g;
}

function criarOculos(M, cabeca) {
  const g = new THREE.Group();
  const [hx, hy, hz] = cabeca;
  const y = hy + 0.04;
  for (const s of [-1, 1]) {
    const lente = malha(esfera(1, 32, 16), M.lente, [hx + 0.215 * s, y, hz + 0.545], [0.25, 0.14, 0.08], [0, 0.5 * s, -0.12 * s]);
    g.add(lente);
    const aro = malha(new THREE.TorusGeometry(1, 0.13, 8, 40), M.aro, [hx + 0.215 * s, y, hz + 0.55], [0.25, 0.14, 0.08], [0, 0.5 * s, -0.12 * s]);
    g.add(aro);
    // haste até a orelha
    const haste = malha(new THREE.BoxGeometry(0.03, 0.045, 0.46), M.aro, [hx + 0.55 * s, y + 0.03, hz + 0.12], [1, 1, 1], [0, 0.22 * s, 0]);
    g.add(haste);
  }
  g.add(malha(new THREE.BoxGeometry(0.12, 0.05, 0.05), M.aro, [hx, y + 0.04, hz + 0.61]));
  return g;
}

export function criarBoneco(op = {}) {
  const M = {
    pele: mat(COR.pele, { rough: 0.6 }),
    cabelo: new THREE.MeshPhysicalMaterial({ color: COR.cabelo, roughness: 0.55, sheen: 0.25, sheenColor: 0x5a4436, sheenRoughness: 0.5, side: THREE.DoubleSide }),
    barba: mat(COR.barba, { rough: 1 }),
    moletom: mat(COR.moletom, { rough: 0.92 }),
    preto: mat(COR.preto, { rough: 0.6 }),
    jeans: mat(0xffffff, { rough: 0.95, map: texturaJeans() }),
    tenis: mat(COR.tenis, { rough: 0.55 }),
    sola: mat(COR.sola, { rough: 0.7 }),
    laranja: mat(COR.laranja, { rough: 0.5 }),
    prata: mat(COR.prata, { rough: 0.25, metal: 0.9 }),
    lente: new THREE.MeshPhysicalMaterial({ color: 0x0a0b0d, roughness: 0.06, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 }),
    aro: new THREE.MeshPhysicalMaterial({ color: 0x111215, roughness: 0.25, metalness: 0.1, clearcoat: 0.8 }),
    celular: mat(COR.azulCelular, { rough: 0.45 }),
  };
  const boneco = new THREE.Group();
  const corpo = new THREE.Group();
  boneco.add(corpo);

  // ── pernas, quadril e tênis ──
  for (const s of [-1, 1]) {
    corpo.add(malha(new THREE.CylinderGeometry(0.28, 0.31, 1.42, 28, 1, false), M.jeans, [0.27 * s, 0.93, 0]));
    corpo.add(malha(capsula(0.16, 0.34), M.tenis, [0.27 * s, 0.16, 0.08], [1.05, 1, 0.95], [Math.PI / 2, 0, 0]));
    corpo.add(malha(new THREE.BoxGeometry(0.36, 0.06, 0.72), M.sola, [0.27 * s, 0.03, 0.08]));
  }
  corpo.add(malha(new THREE.CylinderGeometry(0.58, 0.56, 0.36, 32), M.jeans, [0, 1.62, 0], [1, 1, 0.78]));

  // ── tronco (moletom) ──
  const { cy, r, L, sy, sz } = TRONCO;
  corpo.add(malha(capsula(r, L), M.moletom, [0, cy, 0], [1, sy, sz]));
  // gola alta com zíper, capuz caído atrás
  corpo.add(malha(new THREE.CylinderGeometry(0.25, 0.3, 0.24, 28), M.moletom, [0, 3.06, -0.02], [1, 1, 0.92]));
  corpo.add(malha(new THREE.TorusGeometry(0.3, 0.13, 12, 32), M.moletom, [0, 3.0, -0.08], [1, 1, 0.8], [Math.PI / 2 - 0.25, 0, 0]));
  corpo.add(malha(esfera(1), M.moletom, [0, 3.0, -0.36], [0.5, 0.3, 0.26]));
  // zíper (um pouco fora do centro) e costuras pretas do tecido técnico
  const zx = 0.03;
  corpo.add(costura([[zx, 1.62], [zx, 2.0], [zx, 2.4], [zx, 2.8], [zx, 2.98]], M.preto, 0.02));
  corpo.add(malha(new THREE.BoxGeometry(0.04, 0.24, 0.02), M.preto, [zx, 3.06, 0.29]));
  corpo.add(costura([[-0.6, 2.55], [-0.3, 2.42], [0.05, 2.3], [0.35, 2.2], [0.6, 2.12]], M.preto));
  for (const s of [-1, 1]) corpo.add(costura([[0.2 * s, 2.95], [0.38 * s, 2.8], [0.6 * s, 2.6]], M.preto, 0.013));
  corpo.add(costura([[0.36, 2.36], [0.37, 2.5], [0.37, 2.66]], M.preto, 0.014));
  // Λ laranja da MACH no peito (lado esquerdo de quem olha)
  const lx = -0.32, ly = 2.66, lz = zFrente(lx, ly, 0.02);
  const perna = new THREE.BoxGeometry(0.022, 0.13, 0.012);
  corpo.add(malha(perna, M.laranja, [lx - 0.03, ly, lz], [1, 1, 1], [0, 0, -0.42]));
  corpo.add(malha(perna, M.laranja, [lx + 0.03, ly, lz], [1, 1, 1], [0, 0, 0.42]));

  // ── braços ──
  const bracoE = criarBraco(1, M), bracoD = criarBraco(-1, M);
  corpo.add(bracoE.ombro, bracoD.ombro);
  corpo.add(malha(esfera(0.2), M.moletom, [0.62, 2.86, 0], [1, 0.8, 0.85]));
  corpo.add(malha(esfera(0.2), M.moletom, [-0.62, 2.86, 0], [1, 0.8, 0.85]));

  // celular azul (preso na mão direita dele)
  const celular = new THREE.Group();
  celular.add(malha(new THREE.BoxGeometry(0.34, 0.68, 0.06), M.celular));
  celular.add(malha(new THREE.BoxGeometry(0.15, 0.15, 0.03), mat(0xdde0e3, { rough: 0.3 }), [-0.07, 0.22, -0.04]));
  for (const [dx, dy] of [[-0.105, 0.255], [-0.04, 0.185]]) celular.add(malha(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16), mat(0x0a0b0d, { rough: 0.2 }), [dx, dy, -0.06], [1, 1, 1], [Math.PI / 2, 0, 0]));
  celular.position.set(0, -0.18, 0.1);
  celular.visible = false;
  bracoD.mao.add(celular);

  // ── pescoço e cabeça ──
  const cabeca = [0, 3.78, 0.02];
  const [hx, hy, hz] = cabeca;
  corpo.add(malha(new THREE.CylinderGeometry(0.16, 0.18, 0.4, 20), M.pele, [0, 3.18, 0]));
  const cab = new THREE.Group();
  corpo.add(cab);
  cab.add(malha(esfera(0.58, 40, 28), M.pele, [hx, hy, hz], [1, 1.07, 0.97]));
  cab.add(malha(esfera(0.42, 32, 20), M.pele, [hx, hy - 0.26, hz + 0.06], [1, 0.85, 0.95])); // maxilar
  for (const s of [-1, 1]) cab.add(malha(esfera(1), M.pele, [hx + 0.57 * s, hy - 0.03, hz - 0.02], [0.08, 0.14, 0.1]));
  cab.add(malha(capsula(0.055, 0.1), mat(COR.peleSombra, { rough: 0.6 }), [hx, hy - 0.13, hz + 0.56], [1, 1, 1], [0.35, 0, 0]));
  cab.add(malha(capsula(0.02, 0.11), mat(0xc58f7d, { rough: 0.5 }), [hx, hy - 0.33, hz + 0.505], [0.85, 1, 0.6], [0, 0, Math.PI / 2]));
  cab.add(malha(capsula(0.009, 0.13), mat(0x8a6a58, { rough: 1 }), [hx, hy - 0.275, hz + 0.53], [1, 1, 0.6], [0, 0, Math.PI / 2]));
  cab.add(malha(esfera(1), M.barba, [hx, hy - 0.49, hz + 0.37], [0.13, 0.07, 0.07]));
  cab.add(malha(capsula(0.014, 0.05), M.barba, [hx, hy - 0.41, hz + 0.475], [1, 1, 0.7]));
  for (const s of [-1, 1]) cab.add(malha(capsula(0.022, 0.1), M.cabelo, [hx + 0.2 * s, hy + 0.21, hz + 0.53], [1, 1, 0.7], [0, 0, Math.PI / 2 + 0.12 * s]));
  cab.add(criarOculos(M, cabeca));
  cab.add(criarCabelo(M, cabeca));

  // ── poses ──
  const pivoCabeca = new THREE.Vector3(0, 3.15, 0);
  function pose(nome) {
    for (const b of [bracoE, bracoD]) {
      b.ombro.rotation.set(0, 0, 0);
      b.cotovelo.rotation.set(0, 0, 0);
      b.pulso.rotation.set(0, 0, 0);
    }
    celular.visible = false;
    cab.rotation.set(0, 0, 0);
    if (nome === 'selfie') {
      bracoE.ombro.rotation.set(0.05, 0, 0.14);
      bracoE.cotovelo.rotation.set(-0.15, 0, 0);
      bracoD.ombro.rotation.set(-1.057, 0, 0.32);
      bracoD.cotovelo.rotation.set(-1.93, 0, 0.37);
      bracoD.pulso.rotation.set(0, 0, 0);
      celular.visible = true;
      cab.rotation.set(0.04, -0.12, 0.05);
    } else if (nome === 'tchau') {
      bracoE.ombro.rotation.set(0, 0, 0.14);
      bracoD.ombro.rotation.set(0, 0, -2.4);
      bracoD.cotovelo.rotation.set(0, 0, -0.5);
    } else {
      bracoE.ombro.rotation.set(0, 0, 0.14);
      bracoD.ombro.rotation.set(0, 0, -0.14);
      bracoE.cotovelo.rotation.set(-0.12, 0, 0);
      bracoD.cotovelo.rotation.set(-0.12, 0, 0);
    }
    // a cabeça gira em torno do pescoço
    cab.position.set(0, 0, 0);
    const q = new THREE.Quaternion().setFromEuler(cab.rotation);
    const v = new THREE.Vector3().copy(pivoCabeca).applyQuaternion(q);
    cab.position.copy(pivoCabeca).sub(v);
    if (celular.visible) {
      // a traseira do celular (capa azul e câmera) fica virada para quem olha
      boneco.updateMatrixWorld(true);
      const qp = new THREE.Quaternion();
      celular.parent.getWorldQuaternion(qp);
      const alvo = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, Math.PI + 0.2, 0));
      celular.quaternion.copy(qp.invert().multiply(alvo));
    }
  }
  pose(op.pose ?? 'neutra');
  return { boneco, pose, partes: { bracoE, bracoD, cab, celular } };
}
