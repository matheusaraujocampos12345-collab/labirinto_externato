import { W, H } from './util.js';
import { renderAct1 } from './act1.js';
import { renderGlitch, renderBreak, renderBreakText } from './act2.js';
import { initAct3, renderAct3 } from './act3.js';
import { renderAct4 } from './act4.js';
import { GLITCH_START, BLACK_START, ACT3_START, ACT4_START } from './timeline.js';

const canvas = document.getElementById('c');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

function resetCtx() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.filter = 'none';
  ctx.shadowColor = 'transparent';
}

window.renderFrame = (f) => {
  resetCtx();
  if (f < GLITCH_START) renderAct1(ctx, f);
  else if (f < BLACK_START) renderGlitch(ctx, f);
  else if (f < ACT3_START) renderBreak(ctx, f);
  else if (f < ACT4_START) {
    renderAct3(ctx, f);
    if (f < ACT3_START + 10) renderBreakText(ctx, f);
  } else renderAct4(ctx, f);
  resetCtx();
  return true;
};

window.ready = (async () => {
  // aquece as fontes do sistema usadas no canvas
  const fonts = [
    '200 100px "Inter Display"', '300 100px "Inter Display"', '400 40px "Inter"', '500 40px "Inter"',
    '600 40px "Inter"', '800 40px "Inter"', 'bold 40px "Liberation Sans"', '40px "Liberation Sans"',
    'italic 40px "Liberation Sans"', '300 70px "Saira"', '400 34px "JetBrains Mono"',
  ];
  await Promise.all(fonts.map((f) => document.fonts.load(f, 'Aa çãé…')));
  for (const f of fonts) {
    ctx.font = f;
    ctx.fillText('Aa çãé…', -500, -500);
  }
  initAct3();
  return true;
})();
