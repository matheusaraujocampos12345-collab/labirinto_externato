/* Padaria Quatro Horas — o letreiro de neon, desenhado à mão (nada de fonte digitada).
   Cada letra é um tubo: traço contínuo, pontas redondas. Entre uma letra e outra o tubo
   continua, pintado de preto, como nos letreiros de verdade. O "A" tem o arco da boca do forno.
   O símbolo é um relógio parado nas 4h, com o ponteiro das horas em forma de pá de forno. */
(function () {
  'use strict';
  // letras em caixa de 40 de altura; [largura, traço, entrada(x,y), saída(x,y)]
  const L = {
    Q: [40, 'M20 0.5A19.5 19.5 0 1 1 19.9 0.5M27 29L37.5 40.5', [0.5, 20], [37.5, 40.5]],
    U: [30, 'M0 0V24A15 15 0 0 0 30 24V0', [0, 0], [30, 0]],
    A: [30, 'M0 40V15A15 15 0 0 1 30 15V40M0 26.5H30', [0, 40], [30, 40]],
    T: [30, 'M0 0H30M15 0V40', [0, 0], [15, 40]],
    R: [30, 'M0 40V0H15.5A10 10 0 0 1 15.5 20H0M13 20L30 40', [0, 40], [30, 40]],
    O: [40, 'M20 0.5A19.5 19.5 0 1 1 19.9 0.5', [0.5, 20], [39.5, 20]],
    H: [30, 'M0 0V40M30 0V40M0 20H30', [0, 40], [30, 0]],
    S: [28, 'M27 8C24 0.5 4 -0.5 2.5 9.5S26 17 26.5 28.5 4 41.5 1 32.5', [27, 8], [1, 32.5]],
  };
  const ESP = 10;
  function linha(txt, x0, y0, esc) {
    let x = x0, tubos = '', pretos = '', ant = null, fim = 0;
    for (const ch of txt) {
      if (ch === ' ') { x += 18; ant = null; continue; }
      const [w, d, ent, sai] = L[ch];
      tubos += `<path d="${d}" transform="translate(${x} ${y0})"/>`;
      const a = [x + ent[0], y0 + ent[1]];
      if (ant) pretos += `<path d="M${ant[0]} ${ant[1]}C${ant[0] + 6} ${y0 + 44} ${a[0] - 6} ${y0 + 44} ${a[0]} ${a[1]}"/>`;
      ant = [x + sai[0], y0 + sai[1]];
      x += w + ESP; fim = x - ESP;
    }
    return { tubos, pretos, largura: fim - x0 };
  }
  // relógio nas 4h: ponteiro das horas é uma pá (cabo + lâmina arredondada)
  function relogio(cx, cy, r) {
    const a = (120 - 90) * Math.PI / 180;               // 4h = 120 graus a partir das 12
    const px = cx + Math.cos(a) * r * 0.48, py = cy + Math.sin(a) * r * 0.48;
    const bx = cx + Math.cos(a) * r * 0.66, by = cy + Math.sin(a) * r * 0.66;
    const n = [-Math.sin(a), Math.cos(a)], k = r * 0.13;
    const lam = `M${(px + n[0] * k).toFixed(2)} ${(py + n[1] * k).toFixed(2)}Q${(bx + n[0] * k * 1.25).toFixed(2)} ${(by + n[1] * k * 1.25).toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`
      + `Q${(bx - n[0] * k * 1.25).toFixed(2)} ${(by - n[1] * k * 1.25).toFixed(2)} ${(px - n[0] * k).toFixed(2)} ${(py - n[1] * k).toFixed(2)}Z`;
    return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`
      + `<path d="M${cx} ${cy}V${cy - r * 0.72}"/>`
      + `<path d="M${cx} ${cy}L${px.toFixed(2)} ${py.toFixed(2)}${lam.replace(/^M/, 'M')}"/>`
      + `<path d="M${cx} ${cy - r + 4}v3M${cx + r - 4} ${cy}h-3M${cx} ${cy + r - 4}v-3M${cx - r + 4} ${cy}h3" stroke-width="1.6"/>`;
  }

  // letras ao longo de um arco (como letreiro em cima da porta e como a boca do forno)
  function arco(txt, cx, cy, R) {
    let total = 0;
    for (const ch of txt) total += L[ch][0] + ESP;
    total -= ESP;
    let x = 0, tubos = '', pretos = '', ant = null;
    const ponto = (xc, lx, ly, w) => {
      const th = (xc - total / 2) / R;
      const dx = lx - w / 2, dy = ly - 40;
      const Px = cx + R * Math.sin(th), Py = cy - R * Math.cos(th);
      return [Px + dx * Math.cos(th) - dy * Math.sin(th), Py + dx * Math.sin(th) + dy * Math.cos(th)];
    };
    for (const ch of txt) {
      const [w, d, ent, sai] = L[ch];
      const xc = x + w / 2, th = (xc - total / 2) / R;
      const Px = cx + R * Math.sin(th), Py = cy - R * Math.cos(th);
      tubos += `<path d="${d}" transform="translate(${Px.toFixed(2)} ${Py.toFixed(2)}) rotate(${(th * 180 / Math.PI).toFixed(2)}) translate(${-w / 2} -40)"/>`;
      const a = ponto(xc, ent[0], ent[1], w);
      if (ant) pretos += `<path d="M${ant[0].toFixed(1)} ${ant[1].toFixed(1)}Q${((ant[0] + a[0]) / 2).toFixed(1)} ${(Math.max(ant[1], a[1]) + 10).toFixed(1)} ${a[0].toFixed(1)} ${a[1].toFixed(1)}"/>`;
      ant = ponto(xc, sai[0], sai[1], w);
      x += w + ESP;
    }
    return { tubos, pretos };
  }

  let uid = 0;
  /* opções: forma 'linha' (uma linha, para a barra) ou 'bloco' (duas linhas, letreiro grande);
     neon true = tubo aceso com brilho; cor = cor do traço quando não é neon (carimbo do saco) */
  function svg({ forma = 'linha', neon = true, cor = '#FAF1DF', titulo = 'Padaria Quatro Horas' } = {}) {
    const id = 'nb' + (++uid);
    let corpo, vb, pre = '';
    if (forma === 'letreiro') {
      // QUATRO em arco, o relógio dentro do arco, HORAS reto embaixo
      const W = 300, a = arco('QUATRO', W / 2, 251, 205), b = linha('HORAS', (W - 198) / 2, 140, 1);
      corpo = { tubos: a.tubos + b.tubos + relogio(W / 2, 102, 24), pretos: a.pretos + b.pretos };
      vb = `0 0 ${W} 214`;
      pre = `<text x="${W / 2}" y="206" text-anchor="middle" font-family="Tilt Neon, sans-serif" font-size="12.5" letter-spacing="6" fill="${neon ? '#F6C98A' : cor}">PADARIA</text>`;
    } else if (forma === 'bloco') {
      const a = linha('QUATRO', 70, 26, 1), b = linha('HORAS', 70, 80, 1);
      corpo = { tubos: a.tubos + b.tubos + relogio(30, 53, 24), pretos: a.pretos + b.pretos };
      vb = `0 0 ${70 + Math.max(a.largura, b.largura) + 6} 128`;
    } else {
      const a = linha('QUATRO HORAS', 62, 8, 1);
      corpo = { tubos: a.tubos + relogio(26, 28, 21), pretos: a.pretos };
      vb = `0 0 ${62 + a.largura + 6} 56`;
    }
    const tubo = `fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    if (forma === 'bloco') pre = `<text x="72" y="16" font-family="Tilt Neon, sans-serif" font-size="13" letter-spacing="4.5" fill="${neon ? '#F6C98A' : cor}">PADARIA</text>`;
    if (!neon) {
      return `<svg viewBox="${vb}" role="img" aria-label="${titulo}"><title>${titulo}</title>${pre}<g ${tubo} stroke="${cor}" stroke-width="3.4">${corpo.tubos}</g></svg>`;
    }
    return `<svg viewBox="${vb}" role="img" aria-label="${titulo}" class="neon"><title>${titulo}</title>
      <defs><filter id="${id}" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
      <g ${tubo} stroke="#2A1D19" stroke-width="3" opacity=".9">${corpo.pretos}</g>
      <g class="neon-brilho" ${tubo} stroke="#E5AC68" stroke-width="7" filter="url(#${id})" opacity=".85">${corpo.tubos}</g>
      <g class="neon-tubo" ${tubo} stroke="#F6C98A" stroke-width="3.6">${corpo.tubos}</g>
      <g class="neon-nucleo" ${tubo} stroke="#FFF6E6" stroke-width="1.3">${corpo.tubos}</g>
      ${pre}</svg>`;
  }
  window.Marca = { svg };
})();
