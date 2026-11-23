// Utilitários de tempo e movimento do motor dos Reels.
// Tudo é função pura do tempo t (segundos): o mesmo t sempre gera o mesmo quadro.

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const BATIDA = 0.5; // 120 bpm: cortes em múltiplos de 0,5 s

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** progresso de t dentro de [a, b] → 0..1 (limitado) */
export const prog = (t, a, b) => clamp((t - a) / (b - a));
/** tempo da batida n (n × 0,5 s) */
export const batida = (n) => n * BATIDA;

// Curvas suaves. Nada de "back" ou "elastic": a marca não quica.
export const ease = {
  linear: (t) => t,
  inCubic: (t) => t * t * t,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutExpo: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outSine: (t) => Math.sin((t * Math.PI) / 2),
  inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
};

/** Interpola uma lista de chaves [[t, valor], ...] com a curva dada (padrão inOutCubic). */
export function chaves(t, lista, curva = ease.inOutCubic) {
  if (t <= lista[0][0]) return lista[0][1];
  for (let i = 1; i < lista.length; i++) {
    const [t1, v1] = lista[i];
    const [t0, v0] = lista[i - 1];
    if (t <= t1) return lerp(v0, v1, curva(prog(t, t0, t1)));
  }
  return lista[lista.length - 1][1];
}

/** hash determinístico → [0, 1) */
export function hash(n) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function criarCanvas(w = W, h = H) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

const cacheImagens = new Map();
/** Carrega uma imagem (com cache). Use dentro de desenhar(), que pode ser async. */
export function carregarImagem(url) {
  if (!cacheImagens.has(url)) {
    cacheImagens.set(
      url,
      new Promise((ok, erro) => {
        const im = new Image();
        im.onload = () => ok(im);
        im.onerror = () => erro(new Error('imagem não carregou: ' + url));
        im.src = url;
      }),
    );
    if (cacheImagens.size > 64) cacheImagens.delete(cacheImagens.keys().next().value);
  }
  return cacheImagens.get(url);
}
