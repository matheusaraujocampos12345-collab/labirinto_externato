// Núcleo do motor: carrega o módulo do Reels (?reel=/caminho/do/modulo.js),
// prepara as fontes e expõe as funções que o render.mjs chama quadro a quadro.
import { W, H } from './tempo.js';
import { grade } from './marca.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const comGrade = params.has('grade');

function limpar() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.letterSpacing = '0px';
  ctx.setLineDash([]);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
}

const FONTES_PADRAO = [
  '200 80px "Saira"', '300 80px "Saira"', '300 80px "Saira Expandida"', '500 80px "Saira Expandida"',
  '300 40px "Hanken Grotesk"', '400 40px "Hanken Grotesk"', '500 40px "Hanken Grotesk"',
  '300 30px "JetBrains Mono"', '400 30px "JetBrains Mono"', '500 30px "JetBrains Mono"',
];

window.motorPronto = (async () => {
  const mod = await import(params.get('reel'));
  const reel = mod.default ?? mod;
  window.__reel = reel;
  // fontes extras do Reels: [{ familia, arquivo (URL), peso, estilo }]
  for (const f of reel.fontes || []) {
    const ff = new FontFace(f.familia, `url(${f.arquivo})`, { weight: String(f.peso ?? 400), style: f.estilo ?? 'normal' });
    document.fonts.add(await ff.load());
  }
  const lista = [...FONTES_PADRAO, ...(reel.fontes || []).map((f) => `${f.estilo === 'italic' ? 'italic ' : ''}${f.peso ?? 400} 40px "${f.familia}"`)];
  await Promise.all(lista.map((f) => document.fonts.load(f, 'Aa çãéÉ→·')));
  for (const f of lista) {
    ctx.font = f;
    ctx.fillText('Aa çãéÉ→·', -500, -500);
  }
  if (reel.preparar) await reel.preparar(ctx);
  return { id: reel.id, nome: reel.nome, duracao: reel.duracao, fps: reel.fps ?? 30, temCapa: !!reel.capa };
})();

// borrão de movimento: reel.subquadros = n desenha n subquadros espalhados em reel.obturador
// (fração do intervalo do quadro; 0,5 = obturador de 180°) e faz a média.
// desenhar(ctx, t, f, k) recebe k = índice do subquadro (0..n-1).
let temp = null;
async function desenharComBorrao(reel, f) {
  const fps = reel.fps ?? 30, obt = reel.obturador ?? 0.5;
  // subquadros pode ser um número ou uma função do tempo (borrão só onde há movimento rápido)
  const n = typeof reel.subquadros === 'function' ? reel.subquadros(f / fps, f) : reel.subquadros ?? 1;
  if (n <= 1) return reel.desenhar(ctx, f / fps, f, 0);
  if (!temp) {
    temp = document.createElement('canvas');
    temp.width = W;
    temp.height = H;
  }
  const tc = temp.getContext('2d');
  for (let k = 0; k < n; k++) {
    tc.setTransform(1, 0, 0, 1, 0, 0);
    tc.globalAlpha = 1;
    tc.globalCompositeOperation = 'source-over';
    tc.filter = 'none';
    tc.fillStyle = '#000';
    tc.fillRect(0, 0, W, H);
    await reel.desenhar(tc, f / fps + (k * obt) / (fps * n), f, k);
    tc.setTransform(1, 0, 0, 1, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.globalAlpha = 1 / (k + 1); // média com pesos iguais
    ctx.drawImage(temp, 0, 0);
  }
  ctx.globalAlpha = 1;
}

/** Desenha o quadro f e devolve o PNG (data URL) e os avisos de zona segura. */
window.motorQuadro = async (f) => {
  const reel = window.__reel;
  window.__avisosZona = [];
  limpar();
  await desenharComBorrao(reel, f);
  limpar2();
  if (comGrade) grade(ctx);
  return { png: canvas.toDataURL('image/png'), avisos: window.__avisosZona };
};

/** Desenha a capa (reel.capa ou o quadro de reel.tempoCapa) e devolve JPEG qualidade 92. */
window.motorCapa = async () => {
  const reel = window.__reel;
  window.__avisosZona = [];
  limpar();
  if (reel.capa) await reel.capa(ctx);
  else await reel.desenhar(ctx, reel.tempoCapa ?? 0, Math.round((reel.tempoCapa ?? 0) * (reel.fps ?? 30)));
  limpar2();
  if (comGrade) grade(ctx);
  return { jpg: canvas.toDataURL('image/jpeg', 0.92), avisos: window.__avisosZona };
};

function limpar2() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowColor = 'transparent';
}
