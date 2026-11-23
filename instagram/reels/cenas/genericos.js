// Seis caras de site genérico para barbearia — todas esquecíveis. Cada uma desenha a tela de celular
// 1080×1920 com rolagem (s, em px) e tempo (t). Fontes padrão de sistema, cores de tema pronto,
// lorem ipsum. Sem degradê roxo-azul e sem "eleve seu negócio".
import { W, H, clamp, lerp, ease } from '../motor/tempo.js';

const SANS = '"Liberation Sans", Arial, sans-serif';
const SERIF = '"Liberation Serif", Georgia, serif';
const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur',
  'adipiscing elit. Sed do eiusmod tempor',
  'incididunt ut labore et dolore magna',
  'aliqua. Ut enim ad minim veniam, quis',
  'nostrud exercitation ullamco laboris.',
];

function txt(ctx, s, x, y, font, cor, align = 'left', esp = 0) {
  ctx.font = font;
  ctx.fillStyle = cor;
  ctx.textAlign = align;
  ctx.letterSpacing = `${esp}px`;
  ctx.fillText(s, x, y);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
}
function lorem(ctx, x, y, n, cor = '#777', tam = 30, align = 'left', passo = 44) {
  for (let i = 0; i < n; i++) txt(ctx, LOREM[i % LOREM.length], x, y + i * passo, `${tam}px ${SANS}`, cor, align);
}
function navegador(ctx, dominio) {
  ctx.fillStyle = '#f2f2f6';
  ctx.fillRect(0, 0, W, 120);
  txt(ctx, '10:08', 56, 46, `bold 30px ${SANS}`, '#111');
  ctx.beginPath();
  ctx.roundRect(36, 60, W - 72, 50, 25);
  ctx.fillStyle = '#e3e3ea';
  ctx.fill();
  txt(ctx, dominio, W / 2, 95, `28px ${SANS}`, '#333', 'center');
}
function hamburguer(ctx, x, y, cor) {
  ctx.fillStyle = cor;
  for (let k = 0; k < 3; k++) ctx.fillRect(x, y + k * 16, 56, 7);
}
function placeholderImagem(ctx, x, y, w, h, fundo = '#d9d9d9', cor = '#b5b5b5') {
  ctx.fillStyle = fundo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = cor;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.2, y + h * 0.75);
  ctx.lineTo(x + w * 0.42, y + h * 0.42);
  ctx.lineTo(x + w * 0.58, y + h * 0.62);
  ctx.lineTo(x + w * 0.68, y + h * 0.5);
  ctx.lineTo(x + w * 0.82, y + h * 0.75);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.7, y + h * 0.3, Math.min(w, h) * 0.08, 0, Math.PI * 2);
  ctx.fill();
}
function tesoura(ctx, x, y, s, cor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 0.13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-0.45, 0.55, 0.28, 0, Math.PI * 2);
  ctx.moveTo(0.73, 0.55);
  ctx.arc(0.45, 0.55, 0.28, 0, Math.PI * 2);
  ctx.moveTo(-0.3, 0.32);
  ctx.lineTo(0.55, -0.85);
  ctx.moveTo(0.3, 0.32);
  ctx.lineTo(-0.55, -0.85);
  ctx.stroke();
  ctx.restore();
}
function estrelas(ctx, x, y, r, n, cor) {
  ctx.fillStyle = cor;
  for (let k = 0; k < n; k++) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + k * r * 2.6 + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.fill();
  }
}
function pagina(ctx, s, fundo, dominio, desenho) {
  ctx.save();
  ctx.fillStyle = fundo;
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.rect(0, 120, W, H - 120);
  ctx.clip();
  ctx.translate(0, 120 - s);
  desenho();
  ctx.restore();
  navegador(ctx, dominio);
}

// 1 — foto de banco e título centralizado
function fotoDeBanco(ctx, s) {
  pagina(ctx, s, '#ffffff', 'barbeariaclassica.com.br', () => {
    // "foto" de banco: cadeira e cliente desfocados, luz quente
    const g = ctx.createLinearGradient(0, 0, W, 1000);
    g.addColorStop(0, '#7a6656');
    g.addColorStop(1, '#2c241f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, 1040);
    ctx.save();
    ctx.filter = 'blur(10px)';
    ctx.fillStyle = 'rgba(255,220,170,0.35)';
    for (const [x, y, r] of [[160, 160, 60], [880, 120, 80], [980, 420, 50], [90, 520, 40]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#1b1512';
    ctx.beginPath();
    ctx.roundRect(330, 560, 420, 380, 60);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(540, 470, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(540, 690, 230, 150, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(0, 0, W, 1040);
    txt(ctx, 'BEM-VINDO À', W / 2, 330, `bold 30px ${SANS}`, 'rgba(255,255,255,0.85)', 'center', 6);
    txt(ctx, 'Barbearia', W / 2, 450, `bold 104px ${SERIF}`, '#fff', 'center');
    txt(ctx, 'Clássica', W / 2, 560, `bold 104px ${SERIF}`, '#fff', 'center');
    txt(ctx, 'Tradição e qualidade desde 2010', W / 2, 640, `36px ${SANS}`, 'rgba(255,255,255,0.9)', 'center');
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.strokeRect(390, 700, 300, 90);
    txt(ctx, 'SAIBA MAIS', W / 2, 758, `bold 30px ${SANS}`, '#fff', 'center', 3);
    txt(ctx, 'Sobre Nós', W / 2, 1160, `bold 58px ${SERIF}`, '#222', 'center');
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(W / 2 - 40, 1190, 80, 4);
    lorem(ctx, W / 2, 1270, 5, '#777', 32, 'center', 48);
    placeholderImagem(ctx, 60, 1560, 960, 520, '#cfc6bd', '#b3a79b');
  });
}

// 2 — construtor de site com três ícones
function tresIcones(ctx, s) {
  pagina(ctx, s, '#ffffff', 'barbershopelite.com.br', () => {
    txt(ctx, 'BarberShop', 60, 100, `bold 46px ${SANS}`, '#1E88E5');
    txt(ctx, 'Elite', 318, 100, `46px ${SANS}`, '#333');
    hamburguer(ctx, 960, 62, '#333');
    ctx.fillStyle = '#F4F6F8';
    ctx.fillRect(0, 170, W, 640);
    txt(ctx, 'Seu estilo', 60, 330, `bold 86px ${SANS}`, '#1d2430');
    txt(ctx, 'começa aqui', 60, 430, `bold 86px ${SANS}`, '#1d2430');
    lorem(ctx, 60, 510, 2, '#666', 32, 'left', 46);
    ctx.fillStyle = '#1E88E5';
    ctx.beginPath();
    ctx.roundRect(60, 630, 330, 100, 8);
    ctx.fill();
    txt(ctx, 'AGENDAR', 225, 695, `bold 34px ${SANS}`, '#fff', 'center', 2);
    const itens = [['Qualidade', 0], ['Pontualidade', 1], ['Preço justo', 2]];
    itens.forEach(([n, k], i) => {
      const y = 900 + i * 380;
      ctx.fillStyle = '#E3F0FC';
      ctx.beginPath();
      ctx.arc(W / 2, y + 90, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1E88E5';
      ctx.fillStyle = '#1E88E5';
      ctx.lineWidth = 8;
      if (k === 0) tesoura(ctx, W / 2, y + 90, 46, '#1E88E5');
      else if (k === 1) {
        ctx.beginPath();
        ctx.arc(W / 2, y + 90, 40, 0, Math.PI * 2);
        ctx.moveTo(W / 2, y + 90);
        ctx.lineTo(W / 2, y + 64);
        ctx.moveTo(W / 2, y + 90);
        ctx.lineTo(W / 2 + 20, y + 100);
        ctx.stroke();
      } else estrelas(ctx, W / 2, y + 92, 40, 1, '#1E88E5');
      txt(ctx, n, W / 2, y + 230, `bold 48px ${SANS}`, '#1d2430', 'center');
      lorem(ctx, W / 2, y + 290, 2, '#888', 30, 'center', 42);
    });
  });
}

// 3 — slider de banner
function slider(ctx, s, t) {
  pagina(ctx, s, '#ffffff', 'studiobarbaecia.com.br', () => {
    ctx.fillStyle = '#00897B';
    ctx.fillRect(0, 0, W, 170);
    txt(ctx, 'Studio Barba & Cia', 60, 104, `bold 44px ${SANS}`, '#fff');
    hamburguer(ctx, 960, 62, '#fff');
    // o carrossel passa para o próximo banner
    const passo = ease.inOutCubic(clamp((t % 1.6) / 0.6 - 1.2));
    const slides = [
      ['PROMOÇÃO DE INVERNO', 'CORTE + BARBA R$ 49,90', '#C62828', '#3b0d0d'],
      ['NOVIDADE NA CASA', 'HIDRATAÇÃO DE BARBA', '#37474F', '#11181c'],
    ];
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 170, W, 900);
    ctx.clip();
    slides.forEach(([a, b, c1, c2], i) => {
      const x = (i - passo) * W;
      const g = ctx.createLinearGradient(x, 170, x + W, 1070);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.fillRect(x, 170, W, 900);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(x + 600, 170);
      ctx.lineTo(x + W, 170);
      ctx.lineTo(x + W, 1070);
      ctx.lineTo(x + 300, 1070);
      ctx.fill();
      txt(ctx, a, x + W / 2, 520, `bold 72px ${SANS}`, '#fff', 'center');
      txt(ctx, b, x + W / 2, 610, `bold 46px ${SANS}`, '#FFD54F', 'center');
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(x + 380, 680, 320, 96, 48);
      ctx.fill();
      txt(ctx, 'CONFIRA', x + W / 2, 742, `bold 34px ${SANS}`, c1, 'center', 2);
    });
    ctx.restore();
    for (const [x, d] of [[70, -1], [1010, 1]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.arc(x, 620, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x - 8 * d, 596);
      ctx.lineTo(x + 12 * d, 620);
      ctx.lineTo(x - 8 * d, 644);
      ctx.stroke();
    }
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k === Math.round(passo) ? '#fff' : 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.arc(W / 2 - 75 + k * 50, 1020, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    txt(ctx, 'Bem-vindo ao nosso site!', W / 2, 1200, `bold 56px ${SANS}`, '#222', 'center');
    lorem(ctx, W / 2, 1280, 4, '#777', 32, 'center', 48);
    ctx.fillStyle = '#00897B';
    ctx.fillRect(60, 1540, 960, 110);
    txt(ctx, 'FALE CONOSCO', W / 2, 1610, `bold 36px ${SANS}`, '#fff', 'center', 3);
  });
}

// 4 — grade de cards
function grade(ctx, s) {
  pagina(ctx, s, '#f5f5f5', 'barbeariaprime.com.br', () => {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, 170);
    txt(ctx, 'PRIME BARBER', 60, 106, `bold 48px ${SANS}`, '#F9A825', 'left', 4);
    hamburguer(ctx, 960, 62, '#F9A825');
    txt(ctx, 'Nossos Serviços', W / 2, 330, `bold 66px ${SANS}`, '#222', 'center');
    ctx.fillStyle = '#F9A825';
    ctx.fillRect(W / 2 - 60, 362, 120, 6);
    const nomes = [['Corte Masculino', '45,00'], ['Barba Completa', '35,00'], ['Corte + Barba', '70,00'], ['Pigmentação', '50,00'], ['Sobrancelha', '15,00'], ['Hidratação', '40,00']];
    nomes.forEach(([n, p], i) => {
      const x = 50 + (i % 2) * 500, y = 430 + Math.floor(i / 2) * 560;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, 480, 520);
      ctx.restore();
      placeholderImagem(ctx, x, y, 480, 270);
      txt(ctx, n, x + 30, y + 340, `bold 38px ${SANS}`, '#222');
      txt(ctx, `R$ ${p}`, x + 30, y + 395, `32px ${SANS}`, '#888');
      ctx.fillStyle = '#F9A825';
      ctx.fillRect(x + 30, y + 425, 200, 66);
      txt(ctx, 'Ver mais', x + 130, y + 469, `bold 28px ${SANS}`, '#111', 'center');
    });
  });
}

// 5 — tema de blog com barra lateral
function barraLateral(ctx, s) {
  pagina(ctx, s, '#ffffff', 'barbeariadoze.com.br', () => {
    txt(ctx, 'Barbearia do Zé', 50, 110, `bold 60px ${SERIF}`, '#222');
    txt(ctx, 'Só mais um site de barbearia', 50, 160, `italic 30px ${SERIF}`, '#888');
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 200, W, 80);
    ['Início', 'Sobre', 'Serviços', 'Blog', 'Contato'].forEach((m, i) => txt(ctx, m, 50 + i * 170, 252, `26px ${SANS}`, '#eee'));
    // coluna do post
    placeholderImagem(ctx, 40, 320, 650, 380);
    txt(ctx, 'Olá, mundo!', 40, 790, `bold 58px ${SERIF}`, '#1A5FB4');
    txt(ctx, 'Publicado em 12 de março de 2019 por admin', 40, 840, `24px ${SANS}`, '#999');
    for (let i = 0; i < 8; i++) txt(ctx, LOREM[i % 5].slice(0, 34), 40, 905 + i * 42, `27px ${SERIF}`, '#555');
    txt(ctx, 'Leia mais »', 40, 1270, `bold 27px ${SANS}`, '#1A5FB4');
    txt(ctx, '1 comentário', 40, 1320, `24px ${SANS}`, '#999');
    // barra lateral
    const x = 730;
    const widget = (titulo, y, linhas) => {
      txt(ctx, titulo, x, y, `bold 30px ${SANS}`, '#222');
      ctx.fillStyle = '#ddd';
      ctx.fillRect(x, y + 16, 310, 2);
      linhas.forEach((l, i) => txt(ctx, l, x, y + 64 + i * 40, `25px ${SANS}`, '#1A5FB4'));
    };
    txt(ctx, 'Pesquisar', x, 350, `bold 30px ${SANS}`, '#222');
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 372, 210, 56);
    ctx.fillStyle = '#555';
    ctx.fillRect(x + 214, 372, 96, 56);
    txt(ctx, 'Ir', x + 262, 410, `bold 24px ${SANS}`, '#fff', 'center');
    widget('Posts recentes', 510, ['Olá, mundo!', 'Promoção de', 'inverno', 'Nova cadeira']);
    widget('Arquivos', 760, ['março 2019', 'fevereiro 2019']);
    widget('Categorias', 930, ['Sem categoria']);
    widget('Meta', 1060, ['Acessar', 'Feed de posts', 'Feed de comentários']);
    ctx.fillStyle = '#eee';
    ctx.fillRect(0, 1420, W, 300);
    txt(ctx, '© 2019 Barbearia do Zé · Tema padrão', W / 2, 1520, `24px ${SANS}`, '#999', 'center');
  });
}

// 6 — landing de curso
function landingCurso(ctx, s, t) {
  pagina(ctx, s, '#0d0d0d', 'metodobarbeirodesucesso.com', () => {
    ctx.fillStyle = '#D32F2F';
    ctx.fillRect(0, 0, W, 90);
    txt(ctx, '⚠ ATENÇÃO: ÚLTIMAS VAGAS COM DESCONTO', W / 2, 60, `bold 30px ${SANS}`, '#fff', 'center');
    txt(ctx, 'DESCUBRA O MÉTODO', W / 2, 220, `bold 70px ${SANS}`, '#fff', 'center');
    txt(ctx, 'QUE JÁ FORMOU', W / 2, 300, `bold 70px ${SANS}`, '#fff', 'center');
    txt(ctx, '+3.000 BARBEIROS', W / 2, 380, `bold 70px ${SANS}`, '#FFEB3B', 'center');
    txt(ctx, 'Aprenda do zero e fature alto ainda este mês', W / 2, 450, `32px ${SANS}`, '#bbb', 'center');
    ctx.fillStyle = '#222';
    ctx.fillRect(60, 500, 960, 540);
    ctx.fillStyle = '#E53935';
    ctx.beginPath();
    ctx.arc(W / 2, 770, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 24, 730);
    ctx.lineTo(W / 2 + 40, 770);
    ctx.lineTo(W / 2 - 24, 810);
    ctx.fill();
    // contagem regressiva
    const seg = 37 - Math.floor(t);
    const caixas = [['02', 'DIAS'], ['14', 'HORAS'], ['37', 'MIN'], [String((seg + 60) % 60).padStart(2, '0'), 'SEG']];
    caixas.forEach(([n, l], i) => {
      const x = 90 + i * 235;
      ctx.fillStyle = '#1f1f1f';
      ctx.fillRect(x, 1090, 200, 170);
      txt(ctx, n, x + 100, 1200, `bold 90px ${SANS}`, '#fff', 'center');
      txt(ctx, l, x + 100, 1245, `bold 22px ${SANS}`, '#aaa', 'center', 2);
    });
    ctx.save();
    ctx.shadowColor = 'rgba(76,175,80,0.7)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#43A047';
    ctx.beginPath();
    ctx.roundRect(60, 1310, 960, 140, 14);
    ctx.fill();
    ctx.restore();
    txt(ctx, 'QUERO MINHA VAGA AGORA', W / 2, 1400, `bold 50px ${SANS}`, '#fff', 'center');
    txt(ctx, 'De R$ 997 por apenas 12x de R$ 49,70', W / 2, 1510, `30px ${SANS}`, '#ddd', 'center');
    ctx.fillStyle = '#ddd';
    ctx.fillRect(W / 2 - 300, 1500, 150, 3);
    estrelas(ctx, W / 2 - 100, 1600, 26, 5, '#FFC107');
    txt(ctx, '“Mudou a minha vida!” — João, SP', W / 2, 1680, `italic 32px ${SANS}`, '#ccc', 'center');
  });
}

export const MODELOS = [
  { nome: 'Foto de banco', desenhar: fotoDeBanco },
  { nome: 'Construtor com 3 ícones', desenhar: tresIcones },
  { nome: 'Slider de banner', desenhar: slider },
  { nome: 'Grade de cards', desenhar: grade },
  { nome: 'Tema com barra lateral', desenhar: barraLateral },
  { nome: 'Landing de curso', desenhar: landingCurso },
];
