// Smartphone genérico em 3D (three.js) com reflexos de estúdio reais.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { W, H, makeCanvas } from './util.js';
import { SW, SH } from './premiumSite.js';

const BODY_W = 0.76, BODY_H = 1.6, BODY_R = 0.105, DEPTH = 0.064, BEVEL = 0.014;
export const FRONT_Z = DEPTH / 2 + BEVEL;
export const FLOOR_Y = -1.02;

function roundedRect(w, h, r) {
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

function planeFromShape(w, h, r) {
  const geo = new THREE.ShapeGeometry(roundedRect(w, h, r), 40);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
  return geo;
}

export class Phone3D {
  constructor() {
    this.canvas = makeCanvas(W, H);
    const r = (this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    }));
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.setClearColor(0x000000, 0);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(r);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    this.scene.environmentIntensity = 0.9;

    this.camera = new THREE.PerspectiveCamera(28, W / H, 0.02, 60);

    // tela (textura dinâmica)
    this.screenCanvas = makeCanvas(SW, SH);
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.screenCanvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;

    const group = (this.group = new THREE.Group());
    // corpo: moldura metálica + tampas de vidro
    const bodyGeo = new THREE.ExtrudeGeometry(roundedRect(BODY_W, BODY_H, BODY_R), {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 10,
      curveSegments: 40,
    });
    bodyGeo.translate(0, 0, -DEPTH / 2);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 });
    this.frameMat = new THREE.MeshPhysicalMaterial({ color: 0x8c8f96, metalness: 1, roughness: 0.2, clearcoat: 0.4, clearcoatRoughness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, [glassMat, this.frameMat]);
    group.add(body);

    // tela
    const scrW = BODY_W - 0.01, scrH = BODY_H - 0.01;
    const screen = new THREE.Mesh(planeFromShape(scrW, scrH, BODY_R - 0.006), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    screen.position.z = FRONT_Z + 0.0006;
    group.add(screen);
    // camada de vidro: só reflexo especular (aditivo)
    const glass = new THREE.Mesh(
      planeFromShape(BODY_W + BEVEL * 1.6, BODY_H + BEVEL * 1.6, BODY_R + BEVEL * 0.8),
      new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.02,
        metalness: 0,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        envMapIntensity: 0.38,
        specularIntensity: 1,
      }),
    );
    glass.position.z = FRONT_Z + 0.0012;
    group.add(glass);

    // botões laterais
    const btnGeo = (len) => {
      const g = new THREE.CapsuleGeometry(0.008, len, 6, 12);
      return g;
    };
    const addBtn = (len, y, side) => {
      const b = new THREE.Mesh(btnGeo(len), this.frameMat);
      b.position.set(side * (BODY_W / 2 + BEVEL + 0.002), y, 0);
      b.scale.set(1, 1, 1.6);
      group.add(b);
    };
    addBtn(0.13, 0.38, 1);
    addBtn(0.13, 0.2, 1);
    addBtn(0.08, 0.02, 1);

    // módulo de câmera traseiro (visível de lado)
    const camBump = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedRect(0.26, 0.26, 0.06), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4 }),
      new THREE.MeshPhysicalMaterial({ color: 0x1a1a1c, metalness: 0.3, roughness: 0.3 }),
    );
    camBump.position.set(-0.2, 0.56, -FRONT_Z - 0.012);
    group.add(camBump);

    this.scene.add(group);

    // luzes de estúdio
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(-2.5, 3, 4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfe6ff, 3.0);
    rim.position.set(3, 1.5, -3);
    this.scene.add(rim);
    const rim2 = new THREE.DirectionalLight(0xffe2c4, 1.6);
    rim2.position.set(-3, -0.5, -2);
    this.scene.add(rim2);

    // cópia espelhada para o reflexo no piso
    this.reflCanvas = makeCanvas(W, H);
    this.mirror = new THREE.Matrix4().set(1, 0, 0, 0, 0, -1, 0, 2 * FLOOR_Y, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  setPose({ rotX = 0, rotY = 0, rotZ = 0, x = 0, y = 0, z = 0 }) {
    const g = this.group;
    g.rotation.set(rotX, rotY, rotZ, 'YXZ');
    g.position.set(x, y, z);
    g.updateMatrixWorld(true);
  }

  setCamera(pos, target, fov = 28) {
    const c = this.camera;
    c.fov = fov;
    c.position.set(pos[0], pos[1], pos[2]);
    c.lookAt(target[0], target[1], target[2]);
    c.updateProjectionMatrix();
    c.updateMatrixWorld(true);
  }

  localToWorld(x, y, z) {
    return this.group.localToWorld(new THREE.Vector3(x, y, z));
  }

  project(v) {
    const p = v.clone().project(this.camera);
    return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H];
  }

  projectXYZ(x, y, z) {
    return this.project(new THREE.Vector3(x, y, z));
  }

  updateScreen(drawFn) {
    drawFn(this.screenCtx);
    this.tex.needsUpdate = true;
  }

  /** Renderiza o reflexo (cena espelhada) e depois o celular. */
  render(withReflection = true) {
    if (withReflection) {
      const g = this.group;
      const saved = g.matrix.clone();
      g.matrixAutoUpdate = false;
      g.matrix.multiplyMatrices(this.mirror, saved);
      g.matrixWorldNeedsUpdate = true;
      g.updateMatrixWorld(true);
      this.renderer.render(this.scene, this.camera);
      const rc = this.reflCanvas.getContext('2d');
      rc.clearRect(0, 0, W, H);
      rc.drawImage(this.canvas, 0, 0);
      g.matrix.copy(saved);
      g.matrixAutoUpdate = true;
      g.updateMatrixWorld(true);
    }
    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }
}
