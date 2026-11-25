/* ═══ PRIMEIRA TELA (componente isolado) ═══
   - Anéis finos (ondas de choque) desenhados num canvas 2D: vêm do fundo e passam pela tela
     como um túnel, devagar quando a página está parada e mais rápido com a rolagem.
   - O celular gira de leve até ficar de frente.
   - No fim da rolagem presa (1 tela), uma onda laranja abre o fundo claro do resto do site.
   Sem WebGL e sem biblioteca. Com "menos movimento", tudo fica parado e nada prende a rolagem.
   Para trocar a primeira tela: substitua este arquivo, primeira-tela.css e o bloco do index.html. */
(function () {
  'use strict';
  var sec = document.getElementById('inicio');
  if (!sec) return;
  var palco = sec.querySelector('.pt-palco');
  var cv = sec.querySelector('.pt-aneis');
  var cena = sec.querySelector('.pt-cena');
  var cel = sec.querySelector('.pt-celular');
  var texto = sec.querySelector('.pt-texto');
  var legenda = sec.querySelector('.pt-legenda');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!ctx || !cel) return; // fica a versão em CSS, parada
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sec.classList.add('pt-js');
  if (!calmo) sec.classList.add('pt-anima');

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var suave = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

  /* ── medidas ── */
  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, celH = 0, raioFim = 0, distLegenda = 0;
  function medir() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = palco.clientWidth;
    H = palco.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    var rp = palco.getBoundingClientRect();
    var rc = cena.getBoundingClientRect();
    cx = rc.left - rp.left + rc.width / 2;
    cy = rc.top - rp.top + rc.height / 2;
    celH = rc.height;
    raioFim = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.03;
    var rl = legenda.getBoundingClientRect();
    distLegenda = rl.bottom - rp.top - cy + 4;
    sec.style.setProperty('--cx', cx.toFixed(1) + 'px');
    sec.style.setProperty('--cy', cy.toFixed(1) + 'px');
  }

  /* ── os anéis ── */
  var N = 12, VAO = 0.6, PERTO = 0.34, LONGE = PERTO + N * VAO;
  function aneis(t, p, luz) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (luz >= 1) return; // já está tudo claro
    var base = celH * 0.72; // raio do anel quando ele está na altura do celular
    var anda = (calmo ? 0.35 : t * 0.1) + p * 3.2;
    var volta = N * VAO;
    // um halo bem discreto atrás do celular
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, celH * 0.9);
    g.addColorStop(0, 'rgba(255,107,26,0.07)');
    g.addColorStop(1, 'rgba(255,107,26,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < N; i++) {
      var d = ((i * VAO + anda) % volta + volta) % volta;
      var z = LONGE - d;
      var a = suave(LONGE, LONGE - 2.4, z) * suave(PERTO, PERTO + 0.6, z);
      if (a < 0.01) continue;
      var r = base / z;
      var laranja = i % 4 === 0;
      var cor = laranja ? '255,107,26' : '223,227,231';
      var lw = Math.max(1, 1.3 / Math.sqrt(z));
      ctx.lineWidth = lw * 8;
      ctx.strokeStyle = 'rgba(' + cor + ',' + (0.07 * a).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 6.2832);
      ctx.stroke();
      ctx.lineWidth = lw;
      ctx.strokeStyle = 'rgba(' + cor + ',' + ((laranja ? 0.85 : 0.42) * a).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 6.2832);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── o celular, o texto e a passagem para o claro ── */
  var textoVisivel = true, legendaNoClaro = false;
  function aplica(p, t) {
    var mov = calmo ? 0 : 1;
    var giro = -14 + 14 * suave(0, 0.7, p) + mov * Math.sin(t * 0.55) * 2.2;
    var incl = 5 - 5 * suave(0, 0.7, p) + mov * Math.sin(t * 0.4) * 1;
    var esc = 1 + 0.05 * suave(0.2, 0.9, p);
    cel.style.setProperty('--giro', giro.toFixed(2) + 'deg');
    cel.style.setProperty('--incl', incl.toFixed(2) + 'deg');
    cel.style.setProperty('--esc', esc.toFixed(3));
    cel.style.setProperty('--brilho', (-30 + 60 * suave(0, 1, p) + mov * Math.sin(t * 0.3) * 6).toFixed(1) + '%');
    var tx = 1 - suave(0.2, 0.42, p);
    texto.style.setProperty('--texto', tx.toFixed(3));
    if ((tx > 0.02) !== textoVisivel) { textoVisivel = tx > 0.02; texto.classList.toggle('some', !textoVisivel); }
    var luz = suave(0.48, 0.94, p);
    var R = luz * raioFim;
    sec.style.setProperty('--r', R.toFixed(1) + 'px');
    sec.style.setProperty('--onda', (luz > 0 && luz < 1 ? 1 - luz * 0.85 : 0).toFixed(3));
    var noClaro = R > distLegenda;
    if (noClaro !== legendaNoClaro) { legendaNoClaro = noClaro; legenda.classList.toggle('no-claro', noClaro); }
    return luz;
  }

  /* ── laço: só roda com a seção na tela ── */
  var quer = 0, atual = 0, visivel = true, rodando = false;
  function le() {
    var vao = sec.offsetHeight - window.innerHeight;
    quer = vao > 0 ? clamp(-sec.getBoundingClientRect().top / vao, 0, 1) : 0;
  }
  function quadro(agora) {
    if (!visivel) { rodando = false; return; }
    atual += (quer - atual) * 0.14;
    if (Math.abs(quer - atual) < 0.0005) atual = quer;
    var t = agora / 1000;
    var luz = aplica(atual, t);
    aneis(t, atual, luz);
    requestAnimationFrame(quadro);
  }
  function acorda() { if (!rodando && visivel && !calmo) { rodando = true; requestAnimationFrame(quadro); } }
  function parado() { le(); atual = quer; var luz = aplica(atual, 0); aneis(0, atual, luz); }

  medir();
  if (calmo) parado();
  else { le(); atual = quer; acorda(); }
  window.addEventListener('scroll', function () { le(); acorda(); }, { passive: true });
  var espera;
  window.addEventListener('resize', function () {
    clearTimeout(espera);
    espera = setTimeout(function () { medir(); if (calmo) parado(); else { le(); acorda(); } }, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { medir(); if (calmo) parado(); });
  window.addEventListener('load', function () { medir(); if (calmo) parado(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; acorda(); }).observe(sec);
  }
})();
