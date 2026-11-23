// Celular 3D genérico para o filme de lançamento da Equus (i13). Baseado em video-anuncio/src/phone3d.js.
// Sem desenho de aparelho de marca: cantos pouco arredondados, borda reta, câmera frontal num furo
// pequeno na moldura de cima, sem "ilha", sem módulo de câmeras traseiro à mostra.
import * as THREE from 'three';
import { RoomEnvironment } from '/video-anuncio/vendor/RoomEnvironment.js';

const W = 1080, H = 1920;
// tela 9:16 (a captura do site é 432 × 768)
export const TELA_W = 0.8, TELA_H = (0.8 * 16) / 9;
const BORDA = 0.024, BORDA_TOPO = 0.05, BORDA_BASE = 0.034;
const CORPO_W = TELA_W + BORDA * 2, CORPO_H = TELA_H + BORDA_TOPO + BORDA_BASE;
const RAIO = 0.075, PROF = 0.07, BISEL = 0.012;
export const FRENTE_Z = PROF / 2 + BISEL;
const TELA_Y = (BORDA_BASE - BORDA_TOPO) / 2;

function retangulo(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}
function planoArredondado(w, h, r) {
  const geo = new THREE.ShapeGeometry(retangulo(w, h, r), 32);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
  return geo;
}

export class Celular {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, preserveDrawingBuffer: true }));
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;

    this.cena = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.cena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.cena.environmentIntensity = 0.75;
    this.camera = new THREE.PerspectiveCamera(28, W / H, 0.05, 50);

    // textura da tela (a captura do site)
    this.telaCanvas = document.createElement('canvas');
    this.telaCanvas.width = W;
    this.telaCanvas.height = H;
    this.telaCtx = this.telaCanvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.telaCanvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;

    const g = (this.grupo = new THREE.Group());
    const corpoGeo = new THREE.ExtrudeGeometry(retangulo(CORPO_W, CORPO_H, RAIO), {
      depth: PROF, bevelEnabled: true, bevelThickness: BISEL, bevelSize: BISEL * 0.8, bevelSegments: 6, curveSegments: 24,
    });
    corpoGeo.translate(0, 0, -PROF / 2);
    const vidro = new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 });
    // grafite escovado, quente (combina com o preto e o dourado da Equus)
    this.moldura = new THREE.MeshPhysicalMaterial({ color: 0x3a3631, metalness: 1, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.2 });
    g.add(new THREE.Mesh(corpoGeo, [vidro, this.moldura]));

    const tela = new THREE.Mesh(planoArredondado(TELA_W, TELA_H, 0.04), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    tela.position.set(0, TELA_Y, FRENTE_Z + 0.0006);
    g.add(tela);
    // câmera frontal: um furo pequeno na moldura de cima
    const furo = new THREE.Mesh(new THREE.CircleGeometry(0.009, 24), new THREE.MeshBasicMaterial({ color: 0x0b0b0c }));
    furo.position.set(0, CORPO_H / 2 - BORDA_TOPO / 2, FRENTE_Z + 0.0007);
    g.add(furo);
    // vidro por cima: só reflexo (aditivo)
    const capa = new THREE.Mesh(
      planoArredondado(CORPO_W, CORPO_H, RAIO),
      new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.03, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.14 }),
    );
    capa.position.z = FRENTE_Z + 0.0012;
    g.add(capa);
    // botões no lado direito
    for (const [len, y] of [[0.16, 0.34], [0.09, 0.12]]) {
      const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, len, 6, 12), this.moldura);
      b.position.set(CORPO_W / 2 + BISEL * 0.8 + 0.002, y, 0);
      b.scale.set(1, 1, 1.5);
      g.add(b);
    }
    this.cena.add(g);

    const luz1 = new THREE.DirectionalLight(0xfff2dc, 2.0);
    luz1.position.set(-2.5, 3, 4);
    this.cena.add(luz1);
    const luz2 = new THREE.DirectionalLight(0xffc56a, 3.2); // contraluz dourada
    luz2.position.set(3, 1.5, -3);
    this.cena.add(luz2);
    const luz3 = new THREE.DirectionalLight(0xffe2b0, 1.4);
    luz3.position.set(-3, -0.5, -2);
    this.cena.add(luz3);
  }

  pose({ rotX = 0, rotY = 0, rotZ = 0, x = 0, y = 0, z = 0 }) {
    this.grupo.rotation.set(rotX, rotY, rotZ, 'YXZ');
    this.grupo.position.set(x, y, z);
    this.grupo.updateMatrixWorld(true);
  }

  olhar(pos, alvo, fov = 28) {
    const c = this.camera;
    c.fov = fov;
    c.position.set(...pos);
    c.lookAt(...alvo);
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
  }

  /** ponto da tela (u, v de 0 a 1, v de cima para baixo) projetado em px do quadro */
  pontoDaTela(u, v) {
    const p = new THREE.Vector3((u - 0.5) * TELA_W, TELA_Y + (0.5 - v) * TELA_H, FRENTE_Z);
    this.grupo.localToWorld(p);
    p.project(this.camera);
    return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H];
  }

  desenharTela(fn) {
    fn(this.telaCtx, W, H);
    this.tex.needsUpdate = true;
  }

  render() {
    this.renderer.render(this.cena, this.camera);
    return this.canvas;
  }
}
