// i13 (mesa) — o filme de lançamento do site da Equus Genetics passando num monitor sobre uma mesa
// montada por computador (cenas/equus/mesa.js). 19,5 s. A tela do monitor usa os quadros da versão de
// tela cheia (renderize antes: motor/render.mjs cenas/i13-tela-cheia.js --manter).
//   0–3 s       plano aberto, o monitor mostra o logo da Equus · gancho da MACH no alto
//   2,5–6,5 s   a câmera se aproxima devagar (como se fosse de mão) e o filme começa (3 s)
//   16,5–19,5 s o filme termina no logo, a câmera recua ao plano do começo (loop)
//               "Site sob medida · equusbr.com" · @mach.sites
import { W, H, clamp, lerp, prog, ease, carregarImagem, criarCanvas } from '../motor/tempo.js';
import { COR, bloco, rotulo, assinatura } from '../motor/marca.js';
import { Mesa, TELA } from './equus/mesa.js';
import { FONTES_EQUUS, DUR_ANIMACAO } from './i13-tela-cheia.js';

const DUR = 19.5;
const ATRASO = 3; // o filme começa no monitor em 3 s; antes, o monitor mostra o logo (último quadro)
const QUADROS = '/instagram/reels/.quadros/i13-tela-cheia';

let mesa, cFundo, cMon, cTec, cBrilho;

function cameraNo(t) {
  // plano aberto → próximo (teclado grande e desfocado embaixo) → volta ao plano aberto no fim
  const k = ease.inOutSine(prog(t, 2.5, 6.5)) * (1 - ease.inOutSine(prog(t, 16.5, 19.5)));
  const z = lerp(1.28, 0.72, k);
  const y = lerp(0.5, 0.4, k);
  // "de mão": somas de senos lentos, amplitude de milímetros (fecham o ciclo em 19,5 s)
  const f = (n) => n / DUR;
  const s = (a, n, ph) => a * Math.sin(2 * Math.PI * f(n) * t + ph);
  const dx = s(0.0042, 2, 0.3) + s(0.0018, 5, 1.7);
  const dy = s(0.0032, 3, 2.1) + s(0.0012, 7, 0.4);
  const ax = s(0.003, 2, 1.1), ay = s(0.0025, 3, 2.6);
  return { pos: [0.01 + dx, y + dy, z], alvo: [ax, lerp(0.44, 0.3, k) + ay, TELA.z], fov: lerp(48, 56, k) };
}

export default {
  id: 'i13',
  nome: 'i13-equus-mesa',
  duracao: DUR,
  fps: 30,
  fontes: FONTES_EQUUS,

  async preparar() {
    mesa = new Mesa();
    cFundo = criarCanvas(W, H);
    cMon = criarCanvas(W, H);
    cTec = criarCanvas(W, H);
    cBrilho = criarCanvas(W / 4, H / 4);
  },

  async desenhar(ctx, t) {
    // antes de o filme começar, o monitor mostra o último quadro (o logo): o fim emenda no começo
    const ta = t < ATRASO ? DUR_ANIMACAO - 1 / 30 : clamp(t - ATRASO, 0, DUR_ANIMACAO - 1 / 30);
    const img = await carregarImagem(`${QUADROS}/q_${String(Math.round(ta * 30)).padStart(5, '0')}.png`);
    mesa.desenharTela(img);
    const c = cameraNo(t);
    mesa.olhar(c.pos, c.alvo, c.fov);

    // camadas: fundo (levemente desfocado), monitor (nítido), teclado (bem desfocado)
    const copiar = (dest, k) => {
      const g = dest.getContext('2d');
      g.clearRect(0, 0, W, H);
      g.drawImage(mesa.camada(k), 0, 0);
    };
    copiar(cFundo, 0);
    copiar(cMon, 1);
    copiar(cTec, 2);
    const desfoqueFundo = lerp(1.2, 3.4, ease.inOutSine(prog(t, 2.5, 6.5)) * (1 - ease.inOutSine(prog(t, 16.5, 19.5))));
    ctx.fillStyle = '#050403';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.filter = `blur(${desfoqueFundo.toFixed(1)}px)`;
    ctx.drawImage(cFundo, 0, 0);
    ctx.restore();
    ctx.drawImage(cMon, 0, 0);
    // brilho da tela (bloom suave)
    const gb = cBrilho.getContext('2d');
    gb.clearRect(0, 0, cBrilho.width, cBrilho.height);
    gb.filter = 'blur(10px)';
    gb.drawImage(cMon, 0, 0, cBrilho.width, cBrilho.height);
    gb.filter = 'none';
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.32;
    ctx.drawImage(cBrilho, 0, 0, W, H);
    ctx.restore();
    ctx.save();
    ctx.filter = 'blur(12px)';
    ctx.drawImage(cTec, 0, 0);
    ctx.restore();
    // vinheta quente
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.5, H * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(4,2,0,0.55)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    // sobreposição da MACH
    if (t < 3.6) {
      const a = 1 - ease.inCubic(prog(t, 3.1, 3.5));
      const g = ctx.createLinearGradient(0, 0, 0, 700);
      g.addColorStop(0, `rgba(10,12,15,${0.85 * a})`);
      g.addColorStop(0.55, `rgba(10,12,15,${0.7 * a})`);
      g.addColorStop(1, 'rgba(10,12,15,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 700);
      bloco(ctx, t, { texto: 'Isso não é um app.', x: 90, y: 300, tamanho: 76, entra: -1, entrada: 'corte', sai: 3.1 });
      bloco(ctx, t, { estilo: 'texto', texto: 'É o site de um laboratório\nde genética de cavalos.', x: 90, y: 400, tamanho: 44, cor: COR.aluminio, entra: 0.6, sai: 3.1, entrada: 'fade', durEntrada: 0.5 });
    }
    if (t >= 17.2) {
      const a = ease.outCubic(prog(t, 17.2, 17.8));
      const g = ctx.createLinearGradient(0, 0, 0, 520);
      g.addColorStop(0, `rgba(10,12,15,${0.85 * a})`);
      g.addColorStop(0.6, `rgba(10,12,15,${0.7 * a})`);
      g.addColorStop(1, 'rgba(10,12,15,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, 520);
      rotulo(ctx, t, { texto: 'Site sob medida · equusbr.com', x: 90, y: 292, entra: 17.4, cor: COR.aluminio });
      assinatura(ctx, t, { x: 90, y: 340, tamanho: 30, entra: 17.7, cor: COR.aluminio });
    }
  },

  async capa(ctx) {
    await this.desenhar(ctx, 10.7);
    const g = ctx.createLinearGradient(0, 0, 0, 760);
    g.addColorStop(0, 'rgba(10,12,15,0.92)');
    g.addColorStop(0.65, 'rgba(10,12,15,0.75)');
    g.addColorStop(1, 'rgba(10,12,15,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 760);
    bloco(ctx, 99, { texto: 'Isso não é um app.', alinhar: 'center', x: 540, y: 330, tamanho: 84, entrada: 'corte' });
    bloco(ctx, 99, { estilo: 'texto', texto: 'É o site de um laboratório\nde genética de cavalos.', alinhar: 'center', x: 540, y: 440, tamanho: 46, entrada: 'corte' });
  },
};
