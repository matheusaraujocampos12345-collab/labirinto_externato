// Configuração comum das gravações do equusbr.com (site da Equus Genetics, feito pelo dono da MACH).
// Só navegação e rolagem: nenhum formulário, nenhuma conta, nenhum clique.
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const suave = (p) => -(Math.cos(Math.PI * clamp(p)) - 1) / 2;

export function gravacao(nome, y0, y1, duracao = 2.7) {
  return {
    url: 'https://equusbr.com/',
    largura: 432,
    altura: 768,
    escala: 2.5,
    fps: 30,
    duracao,
    saida: `instagram/reels/.quadros/equus-${nome}`,
    // rastreadores de terceiros ficam de fora (não contamos visita no Analytics do cliente)
    bloquearRegex: /googletagmanager|google-analytics|doubleclick|facebook\.net|hotjar|clarity\.ms/,
    // o botão flutuante de WhatsApp (plugin) some só na gravação
    css: '.joinchat, .joinchat__button { display: none !important; }',
    esperaReal: 3500,
    aquecer: 1500,
    semente: 7,
    rolagem: (t) => y0 + (y1 - y0) * suave(t / duracao),
  };
}
