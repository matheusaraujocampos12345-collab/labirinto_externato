/* Casca & Miolo — os itens do balcão (ilustrações em SVG, cores da paleta do pão). */
(function () {
  'use strict';
  const C = {
    pestana: '#441608', cesc: '#663116', casca: '#834C24', ponto: '#A25C1A',
    dourado: '#B18455', abert: '#CFAB86', miolo: '#F2E9D8', farinha: '#F5F2EC', creme: '#EFD39A',
  };
  const sombra = (rx = 44) => `<ellipse cx="60" cy="79" rx="${rx}" ry="4.5" fill="#000" opacity=".35"/>`;
  const grad = (id, a, b, c, cx = '42%', cy = '28%') =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="80%"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></radialGradient>`;
  const brilho = (d, op = .35) => `<path d="${d}" stroke="${C.farinha}" stroke-width="2" fill="none" opacity="${op}" stroke-linecap="round"/>`;
  const farinha = (pts, op = .7) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.farinha}" opacity="${op}"/>`).join('');

  const ARTE = {
    frances: `<defs>${grad('fr-a', C.abert, C.ponto, C.casca)}<linearGradient id="fr-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.miolo}"/><stop offset="1" stop-color="${C.abert}"/></linearGradient></defs>
      ${sombra(46)}
      <path d="M12 60C12 38 38 29 62 30 88 31 110 41 108 59 106 72 82 78 58 78 34 78 12 73 12 60Z" fill="url(#fr-a)"/>
      <path d="M26 50C44 38 76 35 98 44 78 47 50 51 26 50Z" fill="url(#fr-b)"/>
      <path d="M26 50C50 51 78 47 98 44" stroke="${C.cesc}" stroke-width="1.6" fill="none" opacity=".8"/>
      ${brilho('M22 54C28 42 42 36 56 35')}`,

    natural: `<defs>${grad('na-a', C.dourado, C.casca, C.pestana)}<linearGradient id="na-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.abert}"/><stop offset="1" stop-color="${C.dourado}"/></linearGradient></defs>
      ${sombra(48)}
      <path d="M10 66C10 36 32 18 60 18S110 36 110 66C110 75 96 79 60 79S10 75 10 66Z" fill="url(#na-a)"/>
      <g fill="none" stroke="${C.farinha}" stroke-linecap="round" opacity=".55" stroke-width="1.3">
        <path d="M24 60C24 44 40 32 60 32S96 44 96 60" stroke-dasharray="14 5 22 6"/>
        <path d="M32 64C32 50 44 42 60 42S88 50 88 64" stroke-dasharray="9 6 16 4"/>
        <path d="M17 64C17 40 36 25 60 25S103 40 103 64" stroke-dasharray="20 7 10 9" opacity=".7"/></g>
      <path d="M28 40C44 30 72 26 94 31 76 38 50 42 28 40Z" fill="url(#na-b)"/>
      <path d="M28 40C46 36 72 31 94 31" stroke="${C.pestana}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      ${brilho('M18 56C20 40 32 28 46 24', .25)}`,

    baguete: `<defs><linearGradient id="ba-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.dourado}"/><stop offset=".55" stop-color="${C.ponto}"/><stop offset="1" stop-color="${C.casca}"/></linearGradient></defs>
      ${sombra(52)}
      <g transform="rotate(-12 60 56)">
        <path d="M4 56C4 47 12 43 24 43H98C110 43 117 48 117 56S110 69 98 69H24C12 69 4 65 4 56Z" fill="url(#ba-a)"/>
        ${[18, 38, 58, 78].map((x) => `<path d="M${x} 52C${x + 8} 46 ${x + 16} 45 ${x + 22} 47 ${x + 15} 51 ${x + 8} 53 ${x} 52Z" fill="${C.abert}"/><path d="M${x} 52C${x + 8} 53 ${x + 15} 51 ${x + 22} 47" stroke="${C.cesc}" stroke-width="1.2" fill="none"/>`).join('')}
        ${brilho('M12 50C16 46 22 45 30 45', .3)}
      </g>`,

    croissant: `<defs>${grad('cr-a', C.abert, C.ponto, C.cesc, '45%', '25%')}${grad('cr-b', C.dourado, C.ponto, C.casca, '40%', '25%')}</defs>
      ${sombra(46)}
      <path d="M10 70C8 62 14 56 22 56L30 62C24 66 18 70 10 70Z" fill="url(#cr-b)"/>
      <path d="M110 70C112 62 106 56 98 56L90 62C96 66 102 70 110 70Z" fill="url(#cr-b)"/>
      <path d="M20 58C22 46 32 42 40 44L44 70C34 72 22 68 20 58Z" fill="url(#cr-a)"/>
      <path d="M100 58C98 46 88 42 80 44L76 70C86 72 98 68 100 58Z" fill="url(#cr-a)"/>
      <path d="M38 46C40 32 50 26 60 26S80 32 82 46L78 72C70 76 50 76 42 72Z" fill="url(#cr-a)"/>
      <g stroke="${C.cesc}" stroke-width="1.3" fill="none" opacity=".7" stroke-linecap="round">
        <path d="M40 46C44 56 44 64 42 72"/><path d="M80 46C76 56 76 64 78 72"/><path d="M24 57C28 62 30 66 30 69"/><path d="M96 57C92 62 90 66 90 69"/></g>
      ${brilho('M46 40C50 33 56 30 62 30', .5)}${brilho('M26 52C28 49 31 47 34 47', .35)}`,

    sonho: `<defs>${grad('so-a', C.abert, C.dourado, C.casca)}</defs>
      ${sombra(42)}
      <path d="M18 62C18 38 38 26 60 26S102 38 102 62C102 72 86 76 60 76S18 72 18 62Z" fill="url(#so-a)"/>
      <path d="M19 60C30 66 90 66 101 60 101 64 98 67 95 68 80 72 40 72 25 68 22 67 19 64 19 60Z" fill="${C.miolo}" opacity=".85"/>
      <path d="M86 58C96 58 104 62 104 68 104 72 98 72 94 70 90 68 84 64 86 58Z" fill="${C.creme}"/>
      <path d="M90 60C96 61 100 64 101 67" stroke="#fff" stroke-width="1.2" opacity=".5" fill="none" stroke-linecap="round"/>
      ${farinha([[40, 34, 1.4], [48, 31, 1.1], [56, 29, 1.6], [64, 30, 1.2], [72, 32, 1.5], [80, 36, 1.1], [44, 40, 1.2], [52, 37, 1.6], [60, 36, 1.2], [68, 38, 1.5], [76, 41, 1.1], [36, 44, 1.1], [62, 43, 1.1], [84, 44, 1.2], [50, 45, 1], [70, 46, 1]], .9)}`,

    fuba: `<defs><linearGradient id="fu-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.abert}"/><stop offset=".6" stop-color="${C.dourado}"/><stop offset="1" stop-color="${C.ponto}"/></linearGradient>
      <linearGradient id="fu-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3DFA6"/><stop offset="1" stop-color="${C.creme}"/></linearGradient></defs>
      ${sombra(46)}
      <path d="M16 44C16 34 36 28 60 28S104 34 104 44L100 70C100 76 82 80 60 80S20 76 20 70Z" fill="url(#fu-a)"/>
      <g stroke="${C.casca}" stroke-width="1.2" opacity=".45">${[30, 42, 54, 66, 78, 90].map((x) => `<path d="M${x} ${x < 60 ? 36 : 36} L${x + (x - 60) * 0.06} 76"/>`).join('')}</g>
      <ellipse cx="60" cy="38" rx="14" ry="4.5" fill="${C.cesc}"/>
      <path d="M78 33L100 40 97 68 76 74Z" fill="url(#fu-b)"/>
      <path d="M78 33L100 40" stroke="${C.ponto}" stroke-width="2" stroke-linecap="round"/>
      ${farinha([[86, 50, .8], [92, 56, .7], [84, 62, .8], [90, 64, .6], [94, 48, .6]], .5)}
      ${brilho('M24 42C30 36 42 33 54 32', .4)}`,

    queijo: `<defs>${grad('qu-a', C.miolo, C.abert, C.dourado, '40%', '30%')}</defs>
      ${sombra(46)}
      ${[[34, 60, 19], [86, 60, 19], [60, 52, 21]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#qu-a)"/>
        <path d="M${x - r * .5} ${y - r * .45}c${r * .2} ${-r * .2} ${r * .5} ${-r * .25} ${r * .7} ${-r * .1}M${x - r * .1} ${y - r * .65}c${r * .15} ${r * .1} ${r * .3} ${r * .1} ${r * .45} 0" stroke="${C.dourado}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        <path d="M${x - r * .75} ${y + r * .1}c${r * .3} ${r * .75} ${r * 1.2} ${r * .75} ${r * 1.5} 0" stroke="${C.ponto}" stroke-width="${r * .22}" fill="none" opacity=".35" stroke-linecap="round"/>`).join('')}
      ${brilho('M50 40C53 36 57 34 61 34', .55)}`,

    broa: `<defs>${grad('br-a', '#D9B27A', C.dourado, C.casca)}</defs>
      ${sombra(44)}
      <path d="M16 66C16 40 36 26 60 26S104 40 104 66C104 74 88 78 60 78S16 74 16 66Z" fill="url(#br-a)"/>
      <g stroke="${C.cesc}" stroke-width="1.4" fill="none" opacity=".6" stroke-linecap="round">
        <path d="M34 42L46 50 44 62M46 50L60 46 74 52M60 46L62 34M74 52L86 46M74 52L76 64M44 62L60 66 76 64M30 56L44 62"/></g>
      ${farinha([[38, 38, 1.3], [52, 34, 1], [68, 36, 1.4], [82, 42, 1], [56, 56, 1.2], [70, 60, 1], [40, 54, 1], [88, 56, 1.1], [62, 40, 1]], .75)}
      ${brilho('M24 54C28 42 38 34 50 31', .3)}`,

    cafe: `<defs><linearGradient id="ca-a" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${C.abert}"/><stop offset=".45" stop-color="${C.farinha}"/><stop offset="1" stop-color="${C.abert}"/></linearGradient></defs>
      ${sombra(40)}
      <ellipse cx="60" cy="74" rx="38" ry="6" fill="${C.miolo}"/><ellipse cx="60" cy="73" rx="30" ry="4" fill="${C.abert}" opacity=".6"/>
      <path d="M84 46C96 44 98 60 84 62" stroke="${C.abert}" stroke-width="5" fill="none"/>
      <path d="M34 40H86L82 66C81 71 72 74 60 74S39 71 38 66Z" fill="url(#ca-a)"/>
      <ellipse cx="60" cy="40" rx="26" ry="5" fill="${C.miolo}"/><ellipse cx="60" cy="40.5" rx="22.5" ry="3.8" fill="${C.pestana}"/>
      <ellipse cx="55" cy="40" rx="7" ry="1.2" fill="${C.casca}" opacity=".7"/>
      <g class="fumaca" stroke="${C.farinha}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55">
        <path d="M52 32C48 26 56 22 52 14" pathLength="1"/><path d="M64 33C60 25 70 21 65 10" pathLength="1"/></g>`,
  };

  const ITENS = [
    { id: 'frances', nome: 'Pão francês', preco: 'R$ 0,90', un: 'un.' },
    { id: 'natural', nome: 'Fermentação natural', preco: 'R$ 24', un: '' },
    { id: 'baguete', nome: 'Baguete', preco: 'R$ 12', un: '' },
    { id: 'croissant', nome: 'Croissant', preco: 'R$ 11', un: '' },
    { id: 'sonho', nome: 'Sonho de creme', preco: 'R$ 9', un: '', acabou: 'volta às 16h20' },
    { id: 'fuba', nome: 'Bolo de fubá', preco: 'R$ 8', un: 'fatia' },
    { id: 'queijo', nome: 'Pão de queijo', preco: 'R$ 3,50', un: 'un.' },
    { id: 'broa', nome: 'Broa de milho', preco: 'R$ 6', un: '' },
    { id: 'cafe', nome: 'Café coado', preco: 'R$ 7', un: '' },
  ];

  window.Vitrine = {
    ITENS,
    montar(estante) {
      const prateleiras = Array.from(estante.querySelectorAll('.prateleira'));
      ITENS.forEach((it, i) => {
        const f = document.createElement('figure');
        f.className = 'item' + (it.acabou ? ' acabou' : '');
        f.dataset.i = i;
        f.innerHTML = `<div class="item-arte"><svg viewBox="0 0 120 84" aria-hidden="true">${ARTE[it.id]}</svg></div>
          <figcaption><span class="item-nome">${it.nome}</span>
          <span class="item-preco">${it.acabou ? `<s>${it.preco}</s> <em>acabou</em></span><span class="item-volta">${it.acabou}` : `${it.preco}${it.un ? ` <small>${it.un}</small>` : ''}`}</span></figcaption>`;
        prateleiras[Math.floor(i / 3)].querySelector('.itens').appendChild(f);
      });
    },
  };
})();
