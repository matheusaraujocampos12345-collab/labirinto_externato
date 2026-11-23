// A mesa montada por computador (three.js) para o i13: parede de ripas de madeira, mesa de nogueira,
// monitor genérico em pé (retrato, sem marca) com luz de tela de verdade (RectAreaLight), barra de luz
// sobre o monitor, luz de fundo atrás dele e um teclado mecânico em primeiro plano.
// A profundidade de campo é feita por camadas: fundo levemente desfocado, monitor nítido, teclado desfocado.
import * as THREE from 'three';
import { RoomEnvironment } from '/video-anuncio/vendor/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from './vendor/RectAreaLightUniformsLib.js';

const W = 1080, H = 1920;
export const TELA = { w: 0.34, h: (0.34 * 16) / 9, x: 0, y: 0.47, z: -0.3 };
const FUNDO = 0, MONITOR = 1, TECLADO = 2;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** textura de madeira procedural (veios na direção do comprimento) */
function madeira({ w = 512, h = 2048, base = '#7a4e2c', escuro = '#4a2c16', claro = '#a8774c', veios = 120, semente = 3, vertical = true }) {
  const c = document.createElement('canvas');
  c.width = vertical ? w : h;
  c.height = vertical ? h : w;
  const g = c.getContext('2d');
  const r = rng(semente);
  g.fillStyle = base;
  g.fillRect(0, 0, c.width, c.height);
  if (!vertical) {
    g.translate(c.width, 0);
    g.rotate(Math.PI / 2);
  }
  for (let i = 0; i < veios; i++) {
    const x = r() * w, larg = 0.6 + r() * 3.5, a = 0.05 + r() * 0.22;
    g.strokeStyle = r() < 0.6 ? escuro : claro;
    g.globalAlpha = a;
    g.lineWidth = larg;
    g.beginPath();
    let xx = x;
    g.moveTo(xx, 0);
    for (let y = 0; y <= h; y += 32) {
      xx += (r() - 0.5) * 3 + Math.sin(y / (180 + r() * 200) + i) * 0.8;
      g.lineTo(xx, y);
    }
    g.stroke();
  }
  // nós e manchas suaves
  g.globalAlpha = 1;
  for (let i = 0; i < 6; i++) {
    const x = r() * w, y = r() * h, rr = 10 + r() * 30;
    const gr = g.createRadialGradient(x, y, 0, x, y, rr * 3);
    gr.addColorStop(0, 'rgba(40,20,8,0.25)');
    gr.addColorStop(1, 'rgba(40,20,8,0)');
    g.fillStyle = gr;
    g.fillRect(x - rr * 3, y - rr * 3, rr * 6, rr * 6);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export class Mesa {
  constructor() {
    RectAreaLightUniformsLib.init();
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true }));
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;

    const cena = (this.cena = new THREE.Scene());
    const pmrem = new THREE.PMREMGenerator(r);
    cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    cena.environmentIntensity = 0.06;
    this.camera = new THREE.PerspectiveCamera(48, W / H, 0.02, 20);

    const naCamada = (obj, k) => {
      obj.traverse((o) => o.layers.set(k));
      cena.add(obj);
      return obj;
    };

    // ── parede de ripas ──
    const ripaTex = madeira({ base: '#a27a52', escuro: '#6c4a2c', claro: '#c8a27a', semente: 11 });
    ripaTex.repeat.set(1, 1);
    const ripaMat = new THREE.MeshStandardMaterial({ map: ripaTex, roughness: 0.82, metalness: 0 });
    const N = 64, PASSO = 0.047;
    const ripas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 2.2, 0.024), ripaMat, N);
    const m = new THREE.Matrix4(), cor = new THREE.Color(), rr = rng(5);
    for (let i = 0; i < N; i++) {
      m.makeTranslation((i - N / 2) * PASSO, 0.9, -0.56);
      ripas.setMatrixAt(i, m);
      ripas.setColorAt(i, cor.setHSL(0.08, 0.12, 0.72 + rr() * 0.12));
    }
    naCamada(ripas, FUNDO);
    const painel = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.4), new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 1 }));
    painel.position.set(0, 0.9, -0.575);
    naCamada(painel, FUNDO);

    // ── mesa de nogueira ──
    const tampoTex = madeira({ w: 512, h: 2048, base: '#3d2516', escuro: '#22130a', claro: '#5c3a22', veios: 160, semente: 21, vertical: false });
    tampoTex.repeat.set(1.2, 1);
    const tampo = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.04, 1.2),
      new THREE.MeshPhysicalMaterial({ map: tampoTex, roughness: 0.38, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.16 }),
    );
    tampo.position.set(0, -0.02, 0.0);
    naCamada(tampo, FUNDO);

    // ── monitor em pé (retrato), genérico ──
    const mon = new THREE.Group();
    const caixaMat = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.55, metalness: 0.3 });
    const B = 0.007;
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(TELA.w + B * 2, TELA.h + B * 2 + 0.006, 0.016), caixaMat);
    corpo.position.set(0, -0.003, -0.008);
    mon.add(corpo);
    const costas = new THREE.Mesh(new THREE.BoxGeometry(TELA.w * 0.8, TELA.h * 0.7, 0.03), caixaMat);
    costas.position.set(0, -0.04, -0.03);
    mon.add(costas);
    this.telaCanvas = document.createElement('canvas');
    this.telaCanvas.width = W;
    this.telaCanvas.height = H;
    this.telaCtx = this.telaCanvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.telaCanvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 16;
    this.tex.minFilter = THREE.LinearMipmapLinearFilter;
    this.tex.generateMipmaps = true;
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(TELA.w, TELA.h), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    tela.position.z = 0.0002;
    mon.add(tela);
    // vidro fosco por cima: reflexo bem leve
    const vidro = new THREE.Mesh(
      new THREE.PlaneGeometry(TELA.w + B * 2, TELA.h + B * 2),
      new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.18, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 2.2 }),
    );
    vidro.position.z = 0.0006;
    mon.add(vidro);
    // pé: haste e base
    const haste = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.3, 0.018), caixaMat);
    haste.position.set(0, -TELA.h / 2 + 0.06, -0.05);
    mon.add(haste);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.15), caixaMat);
    base.position.set(0, -TELA.y + 0.005 - 0.0, -0.06);
    mon.add(base);
    mon.position.set(TELA.x, TELA.y, TELA.z);
    naCamada(mon, MONITOR);
    // barra de luz sobre o monitor
    const barra = new THREE.Group();
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.4, 24), new THREE.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.4, metalness: 0.6 }));
    tubo.rotation.z = Math.PI / 2;
    barra.add(tubo);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.003, 0.008), new THREE.MeshBasicMaterial({ color: 0xfff1d6 }));
    led.position.set(0, -0.011, 0.004);
    barra.add(led);
    const garra = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.04), caixaMat);
    garra.position.set(0, -0.012, -0.018);
    barra.add(garra);
    barra.position.set(0, TELA.y + TELA.h / 2 + B + 0.016, TELA.z + 0.012);
    naCamada(barra, MONITOR);

    // ── teclado mecânico ──
    const tec = new THREE.Group();
    const baseTec = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.022, 0.118), new THREE.MeshStandardMaterial({ color: 0x232325, roughness: 0.5, metalness: 0.4 }));
    tec.add(baseTec);
    const COLS = 16, LINHAS = 5, K = 0.0186;
    const teclas = new THREE.InstancedMesh(new THREE.BoxGeometry(K * 0.9, 0.011, K * 0.9), new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 }), COLS * LINHAS);
    let n = 0;
    for (let l = 0; l < LINHAS; l++) {
      for (let c = 0; c < COLS; c++) {
        m.makeTranslation((c - (COLS - 1) / 2) * K * 1.04, 0.017 + l * 0.0016, (l - (LINHAS - 1) / 2) * K * 1.04);
        teclas.setMatrixAt(n, m);
        const modificador = c === 0 || c === COLS - 1 || l === LINHAS - 1;
        teclas.setColorAt(n, cor.set(modificador ? 0xcfc4b2 : 0x2c2c30));
        n++;
      }
    }
    tec.add(teclas);
    tec.position.set(0.0, 0.011, 0.12);
    tec.rotation.set(-0.06, -0.04, 0);
    tec.scale.setScalar(1.08);
    naCamada(tec, TECLADO);

    // caneca de cerâmica ao lado do teclado
    const perfil = [[0, 0], [0.034, 0], [0.036, 0.004], [0.037, 0.085], [0.034, 0.088], [0.031, 0.01], [0, 0.012]].map(([x, y]) => new THREE.Vector2(x, y));
    const caneca = new THREE.Group();
    const ceramica = new THREE.MeshPhysicalMaterial({ color: 0xd9d2c5, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    caneca.add(new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), ceramica));
    const cafe = new THREE.Mesh(new THREE.CircleGeometry(0.031, 32), new THREE.MeshStandardMaterial({ color: 0x1a0d05, roughness: 0.2 }));
    cafe.rotation.x = -Math.PI / 2;
    cafe.position.y = 0.074;
    caneca.add(cafe);
    const alca = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 12, 24, Math.PI), ceramica);
    alca.rotation.z = -Math.PI / 2;
    alca.position.set(0.037, 0.045, 0);
    caneca.add(alca);
    caneca.position.set(-0.155, 0, -0.04);
    caneca.rotation.y = 2.4;
    naCamada(caneca, FUNDO);

    // ── luzes ──
    const todas = (l) => {
      l.layers.enableAll();
      cena.add(l);
      return l;
    };
    // a tela ilumina a mesa e o teclado (luz de área com o tamanho da tela)
    this.luzTela = todas(new THREE.RectAreaLight(0xffc870, 6, TELA.w, TELA.h));
    this.luzTela.position.set(TELA.x, TELA.y, TELA.z + 0.003);
    this.luzTela.lookAt(TELA.x, TELA.y, 1);
    // luz de fundo atrás do monitor, na parede
    this.luzFundo = todas(new THREE.RectAreaLight(0xffb060, 3.5, TELA.w * 0.9, TELA.h * 0.9));
    this.luzFundo.position.set(TELA.x, TELA.y, TELA.z - 0.05);
    this.luzFundo.lookAt(TELA.x, TELA.y, -2);
    // barra de luz: cone quente para baixo
    const spot = todas(new THREE.SpotLight(0xffe2b8, 3.2, 1.6, 0.75, 1, 2));
    spot.position.set(0, TELA.y + TELA.h / 2 + 0.02, TELA.z + 0.03);
    spot.target.position.set(0, 0, 0.25);
    todas(spot.target);
    // luz baixa e quente vinda da esquerda (abajur fora do quadro), raspando as ripas
    const abajur = todas(new THREE.PointLight(0xffb070, 1.1, 3.0, 2));
    abajur.position.set(-0.7, 0.6, -0.28);
    todas(new THREE.AmbientLight(0x1c140c, 1.0));
  }

  /** atualiza a tela do monitor; devolve a cor média para a luz da tela */
  desenharTela(img) {
    const g = this.telaCtx;
    g.drawImage(img, 0, 0, W, H);
    this.tex.needsUpdate = true;
    if (!this._amostra) {
      this._amostra = document.createElement('canvas');
      this._amostra.width = this._amostra.height = 8;
    }
    const a = this._amostra.getContext('2d', { willReadFrequently: true });
    a.drawImage(this.telaCanvas, 0, 0, 8, 8);
    const d = a.getImageData(0, 0, 8, 8).data;
    let R = 0, G = 0, Bl = 0;
    for (let i = 0; i < d.length; i += 4) {
      R += d[i];
      G += d[i + 1];
      Bl += d[i + 2];
    }
    const n = d.length / 4;
    const lum = (0.2126 * R + 0.7152 * G + 0.0722 * Bl) / n / 255;
    this.luzTela.color.setRGB(R / n / 255 + 0.05, G / n / 255 + 0.04, Bl / n / 255 + 0.02);
    this.luzTela.intensity = 4 + lum * 40;
    this.luzFundo.intensity = 2.5 + lum * 10;
  }

  olhar(pos, alvo, fov = 48) {
    const c = this.camera;
    c.fov = fov;
    c.position.set(...pos);
    c.lookAt(...alvo);
    c.updateProjectionMatrix();
  }

  /** renderiza uma camada (0 fundo, 1 monitor, 2 teclado) */
  camada(k) {
    this.camera.layers.set(k);
    this.renderer.render(this.cena, this.camera);
    return this.canvas;
  }
}
