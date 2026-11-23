// Linha do tempo única (quadros a 30 fps). Usada pelo renderizador
// e exportada em JSON para o script de áudio (sincronia exata).
export const FPS = 30;
export const TOTAL_FRAMES = 900; // 30 s

// ── ATO 1 ────────────────────────────────────────────────────
export const QUERY = 'criar site para minha empresa';
export const CLICK_T = 0.62;
export const TYPE_START = 0.74;
export const TYPE_END = 1.96;
export const ENTER_T = 2.14;

export const KEY_TIMES = (() => {
  const n = QUERY.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const base = TYPE_START + (TYPE_END - TYPE_START) * (i / (n - 1));
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const jitter = (j - Math.floor(j) - 0.5) * 0.03;
    out.push(i === 0 || i === n - 1 ? base : base + jitter);
  }
  return out;
})();

export const SITES_START = 76; // primeiro site (2,53 s)
export const GLITCH_START = 387; // 12,9 s
export const BLACK_START = 410; // 13,67 s — corte seco
export const REVEAL_START = 440; // 14,67 s — após 1 s de silêncio
export const ACT3_START = 480; // 16 s
export const ACT4_START = 750; // 25 s

// 1,5 s → 0,2 s por site
const DURS = [45, 36, 29, 23, 18, 15, 12, 10, 8, 7, 6];
const TRANS = ['slideUp', 'whipL', 'slideUp', 'whipR', 'zoom', 'slideUp', 'whipL', 'whipR'];

export const CUTS = (() => {
  const cuts = [];
  let f = SITES_START;
  let i = 0;
  while (f < GLITCH_START) {
    const d = Math.min(i < DURS.length ? DURS[i] : 6, GLITCH_START - f);
    cuts.push({ i, start: f, dur: d, trans: i === 0 ? 'slideUp' : TRANS[i % TRANS.length] });
    f += d;
    i++;
  }
  const n = cuts.length;
  for (const c of cuts) {
    c.count = c.i <= 11 ? c.i + 1 : Math.round(12 + ((c.i - 11) * 35) / (n - 1 - 11));
    c.trLen = Math.max(3, Math.min(7, Math.round(c.dur * 0.22)));
  }
  return cuts;
})();

// Legendas do Ato 1 (segundos)
export const CAPTION1 = { in: 0.22, out: 4.7 };
export const CAPTION2 = { in: 8.85, in2: 9.85, out: 12.9 };

// ── ATOS 3 e 4 (segundos) ───────────────────────────────────
export const A3 = {
  lightIn: 16.0,
  word1: 16.12, // "Animação de verdade."
  textOut: 18.25,
  phoneIn: 18.3,
  macro: 20.15,
  rack: 21.6, // foco sai do celular
  word2: 21.75, // "Feita sob medida."
  numbers: 22.5,
  end: 24.75,
};
export const A4 = {
  lines: 25.0, // linhas finas começam a convergir
  lock: 26.3, // logo MACH trava + estrondo sônico
  diamonds: 26.42, // diamantes de choque acendem (a cada 0,12 s)
  wordmark: 26.55, // descritor ESTÚDIO
  tagline: 26.95,
  handles: 27.55,
};

export function timelineJSON() {
  return {
    fps: FPS,
    totalFrames: TOTAL_FRAMES,
    clickT: CLICK_T,
    keyTimes: KEY_TIMES,
    enterT: ENTER_T,
    sitesStart: SITES_START / FPS,
    glitchStart: GLITCH_START / FPS,
    blackStart: BLACK_START / FPS,
    revealStart: REVEAL_START / FPS,
    act3Start: ACT3_START / FPS,
    act4Start: ACT4_START / FPS,
    cuts: CUTS.map((c) => ({ t: c.start / FPS, dur: c.dur / FPS, trans: c.trans, count: c.count })),
    a3: A3,
    a4: A4,
  };
}
