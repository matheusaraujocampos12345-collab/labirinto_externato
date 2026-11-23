// Gravação do site da MACH para o i01 ("Isso não é vídeo"). Roda no Node (motor/capturar.mjs).
// A linha do tempo da rolagem já é a do Reels: os saltos de rolagem caem nos cortes (6 s, 9 s e 12 s).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const outCubic = (p) => 1 - Math.pow(1 - p, 3);

const BARREIRA = 3264; // rolagem em que o site passa de M 1,0 (estrondo)
const Y_FIM_BARREIRA = 3800;
// início do trecho 2 calculado para o estrondo cair em 6,5 s (na batida)
const Y_INICIO_BARREIRA = (BARREIRA - Y_FIM_BARREIRA * outCubic(0.2)) / (1 - outCubic(0.2));
const Y_CARTAO = 10800;

export function rolagem(t) {
  if (t < 2) return 0;
  if (t < 6) {
    // a régua: a rolagem acelera e desacelera suave antes do corte de 6 s (o medidor sobe)
    const p = (t - 2) / 4, k = 1.8;
    return 2250 * (Math.pow(p, k) / (Math.pow(p, k) + Math.pow(1 - p, k)));
  }
  if (t < 9) return Y_INICIO_BARREIRA + (Y_FIM_BARREIRA - Y_INICIO_BARREIRA) * outCubic(clamp((t - 6) / 2.5));
  if (t < 12) return Y_CARTAO + 50 * ((t - 9) / 3);
  return 0;
}

const NOME = 'Marina Costa';
const EMPRESA = 'Ateliê Costa';

export default {
  pasta: 'site-mach',
  pagina: 'index.html',
  largura: 432,
  altura: 768,
  escala: 2.5,
  fps: 30,
  duracao: 15,
  saida: 'instagram/reels/.quadros/i01-site',
  // a Lenis vem de CDN; sem ela o site usa a rolagem nativa (e a gravação fica exata)
  bloquear: ['**/lenis*'],
  semente: 42,
  aquecer: 2000,
  elementos: ['#medidor', '.contador', '#cartao'],
  rolagem,
  async acao({ page, t }) {
    if (t < 9.3 || t >= 12) return;
    const n = clamp(Math.floor((t - 9.4) / 0.08) + 1, 0, NOME.length);
    const m = clamp(Math.floor((t - 10.5) / 0.05) + 1, 0, EMPRESA.length);
    await page.evaluate(
      ({ nome, empresa, tipo, carimbo }) => {
        const f = document.getElementById('form');
        const por = (campo, v) => {
          const el = f.elements[campo];
          if (el.value !== v) {
            el.value = v;
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }
        };
        por('nome', nome);
        por('empresa', empresa);
        const ldp = document.getElementById('t-ldp');
        if (tipo && !ldp.checked) {
          ldp.checked = true;
          ldp.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const c = document.getElementById('cartao');
        if (carimbo && !c.classList.contains('carimbado')) c.classList.add('carimbado');
      },
      { nome: NOME.slice(0, n), empresa: EMPRESA.slice(0, m), tipo: t >= 11.2, carimbo: t >= 11.4 },
    );
  },
};
