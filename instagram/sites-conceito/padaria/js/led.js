/* Padaria Quatro Horas — números de painel de senha (LED de 7 segmentos), desenhados à mão.
   Os segmentos apagados aparecem bem fracos, como num painel de verdade. */
(function () {
  'use strict';
  const T = 6.4;                       // grossura do segmento
  const hz = (x0, x1, y) => `${x0},${y} ${x0 + T / 2},${y - T / 2} ${x1 - T / 2},${y - T / 2} ${x1},${y} ${x1 - T / 2},${y + T / 2} ${x0 + T / 2},${y + T / 2}`;
  const vt = (x, y0, y1) => `${x},${y0} ${x + T / 2},${y0 + T / 2} ${x + T / 2},${y1 - T / 2} ${x},${y1} ${x - T / 2},${y1 - T / 2} ${x - T / 2},${y0 + T / 2}`;
  const SEG = {
    a: hz(5.5, 34.5, 4), g: hz(5.5, 34.5, 35), d: hz(5.5, 34.5, 66),
    f: vt(3.8, 5.8, 33.2), b: vt(36.2, 5.8, 33.2), e: vt(3.8, 36.8, 64.2), c: vt(36.2, 36.8, 64.2),
  };
  const MAPA = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '' };
  const LARG = 48, DOIS = 18;

  function digito(ch, x) {
    const acesos = MAPA[ch] || '';
    return `<g transform="translate(${x} 0) skewX(-7)">` + Object.entries(SEG).map(([k, p]) =>
      `<polygon points="${p}" class="${acesos.includes(k) ? 'seg-on' : 'seg-off'}"/>`).join('') + '</g>';
  }
  /* texto: '16:00', '12:04' ... ; dois-pontos piscam pela classe .pisca no svg */
  function svg(texto, rotulo) {
    let x = 4, corpo = '';
    for (const ch of texto) {
      if (ch === ':') { corpo += `<g class="dois" transform="translate(${x + 2} 0) skewX(-7)"><rect x="4" y="18" width="6" height="6" rx="1"/><rect x="0" y="46" width="6" height="6" rx="1"/></g>`; x += DOIS; }
      else { corpo += digito(ch, x); x += LARG; }
    }
    return `<svg viewBox="0 0 ${x} 70" role="img" aria-label="${rotulo || texto}">${corpo}</svg>`;
  }
  // atualiza só o que mudou (para o relógio que corre)
  function aplicar(el, texto, rotulo) {
    if (el._led === texto) return;
    el._led = texto;
    el.innerHTML = svg(texto, rotulo);
  }
  window.LED = { svg, aplicar };
})();
