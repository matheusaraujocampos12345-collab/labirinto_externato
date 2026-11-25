/* ═══ PRIMEIRA TELA (componente isolado) ═══
   Tudo num canvas 2D, sem WebGL e sem biblioteca:
   - anéis finos (ondas de choque) que avançam e pulsam sozinhos, como um túnel;
   - riscos de ar passando, como velocidade;
   - no centro, o Λ da marca como uma nave: flutua e gira de leve; o brilho no traço e o pulso
     dos diamantes são animações de CSS;
   - na rolagem, o túnel acelera, o Λ vem na direção da câmera, os diamantes se alongam como um
     pós-combustor e, no fim da rolagem presa (1 tela), o Λ solta uma onda de choque laranja que
     revela o grafite do site;
   - no computador, anéis e Λ reagem de leve ao mouse; no celular, ao toque e à rolagem.
   Com "menos movimento", tudo fica parado e nada prende a rolagem.
   Para trocar a primeira tela: substitua este arquivo, primeira-tela.css e o bloco do index.html. */
(function () {
  'use strict';
  var sec = document.getElementById('inicio');
  if (!sec) return;
  var palco = sec.querySelector('.pt-palco');
  var cv = sec.querySelector('.pt-aneis');
  var cena = sec.querySelector('.pt-cena');
  var cel = sec.querySelector('.pt-simbolo');
  var texto = sec.querySelector('.pt-texto');
  var chamas = sec.querySelector('.pt-chamas');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  if (!ctx || !cel) return; // fica a versão em CSS, parada
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sec.classList.add('pt-js');

  /* o volume do Λ: cópias do traço atrás da frente, cada vez mais fundas e mais escuras */
  var frente = cel.querySelector('.pt-frente');
  var CAMADAS = 10, PASSO = 2.2;
  for (var c = CAMADAS; c >= 1; c--) {
    var cam = frente.cloneNode(true);
    cam.classList.remove('pt-frente');
    cam.classList.add('pt-camada');
    cam.removeAttribute('role');
    cam.removeAttribute('aria-label');
    cam.setAttribute('aria-hidden', 'true');
    var def = cam.querySelector('defs'); if (def) def.remove();
    var ref = cam.querySelector('.pt-reflexo'); if (ref) ref.remove();
    var ch = cam.querySelector('.pt-chamas'); if (ch) ch.remove();
    var k = c / CAMADAS;
    var r = Math.round(196 - 96 * k), g = Math.round(78 - 40 * k), b = Math.round(14 - 8 * k);
    cam.style.setProperty('--cor', 'rgb(' + r + ',' + g + ',' + b + ')');
    cam.style.transform = 'translateZ(' + (-c * PASSO).toFixed(1) + 'px)';
    cel.insertBefore(cam, frente);
  }
  frente.style.transform = 'translateZ(0.5px)';
  if (!calmo) sec.classList.add('pt-anima');

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var suave = function (a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  var FUNDO_SITE = '#16181b'; // a base grafite do resto do site

  /* ── medidas ── */
  var W = 0, H = 0, dpr = 1, cx = 0, cy = 0, celH = 0, raioFim = 0, halo = null, leve = false;
  var paraX = 0, paraY = 0, pertoMax = 1.34, dX = 0, dY = 0;
  function medir() {
    cena.style.transform = 'none';
    cel.style.transform = 'none';
    if (chamas) chamas.style.transform = '';
    // linhas finas e suaves não pedem mais que 1,5x; em aparelho lento, 1x (veja "leve" abaixo)
    dpr = Math.min(window.devicePixelRatio || 1, leve ? 1 : 1.5);
    W = palco.clientWidth;
    H = palco.clientHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    var rp = palco.getBoundingClientRect();
    var rc = cena.getBoundingClientRect();
    cx = rc.left - rp.left + rc.width / 2;
    cy = rc.top - rp.top + rc.height * 0.36; // o centro do Λ fica no terço de cima do símbolo
    celH = rc.height * 0.62;
    // no fim, o celular vai para o centro da área abaixo do menu, sem passar da altura da tela
    var topo = parseFloat(getComputedStyle(palco).paddingTop) || 0;
    paraX = W / 2 - cx;
    paraY = topo + (H - topo) * 0.42 - cy;
    pertoMax = clamp((H - topo - 40) / Math.max(1, rc.height * 1.2), 1, 1.6); // 1.2: espaço para os diamantes alongados
    raioFim = Math.hypot(W / 2 + Math.abs(paraX), H) * 1.05;
    halo = ctx.createRadialGradient(0, 0, 0, 0, 0, celH * 1.1);
    halo.addColorStop(0, 'rgba(255,107,26,0.08)');
    halo.addColorStop(1, 'rgba(255,107,26,0)');
  }

  /* ── o túnel ── */
  var N = 14, VAO = 0.55, PERTO = 0.3, LONGE = PERTO + N * VAO;
  var riscos = [];
  for (var k = 0; k < 46; k++) riscos.push({ a: Math.random() * 6.2832, z: PERTO + Math.random() * (LONGE - PERTO), b: 0.6 + Math.random() * 0.9 });
  var percurso = 0;

  function desenha(t, dt, vel, p, px, py) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var onda = suave(0.5, 0.92, p);
    var R = onda * raioFim;
    if (onda >= 1) { ctx.fillStyle = FUNDO_SITE; ctx.fillRect(0, 0, W, H); return; }
    ctx.clearRect(0, 0, W, H);
    var ccx = cx + dX, ccy = cy + dY; // centro do celular agora
    var rh = celH * 1.1; // o halo só ocupa um quadrado em volta do Λ
    ctx.translate(ccx, ccy);
    ctx.fillStyle = halo;
    ctx.fillRect(-rh, -rh, rh * 2, rh * 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // ponto de fuga e deslocamento por profundidade (paralaxe)
    var fx = ccx + px * W * 0.05, fy = ccy + py * H * 0.04;
    var base = celH * 0.78;
    var volta = N * VAO;
    ctx.globalCompositeOperation = 'lighter';

    // riscos de ar (um traço só, em dois lotes por profundidade)
    var esticar = 0.05 + vel * 0.09;
    for (var lote = 0; lote < 2; lote++) {
      ctx.beginPath();
      for (var i = lote; i < (leve ? 24 : riscos.length); i += 2) {
        var s = riscos[i];
        if (dt) { s.z -= vel * dt * 1.15; if (s.z < PERTO) { s.z += LONGE - PERTO; s.a = Math.random() * 6.2832; } }
        var raio = base * 1.9 * s.b;
        var r1 = raio / s.z, r2 = raio / (s.z + esticar);
        var desl = -px * 60 / (s.z + 0.4), deslY = -py * 50 / (s.z + 0.4);
        var ca = Math.cos(s.a), sa = Math.sin(s.a);
        ctx.moveTo(fx + desl + ca * r2, fy + deslY + sa * r2);
        ctx.lineTo(fx + desl + ca * r1, fy + deslY + sa * r1);
      }
      ctx.lineWidth = lote ? 1 : 1.4;
      ctx.strokeStyle = 'rgba(223,227,231,' + (lote ? 0.1 : 0.16) + ')';
      ctx.stroke();
    }

    // os anéis
    for (var j = 0; j < N; j++) {
      var d = ((j * VAO + percurso) % volta + volta) % volta;
      var z = LONGE - d;
      var r = base / z;
      // some quando nasce (longe) e quando passa pela câmera; e não desenha anéis menores que o Λ
      var a = suave(LONGE, LONGE - 2.4, z) * suave(PERTO, PERTO + 0.55, z) * suave(celH * 0.5, celH * 0.95, r);
      if (a < 0.01) continue;
      var pulso = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 2.1 - z * 1.3));
      var ox = fx - px * 70 / (z + 0.4), oy = fy - py * 56 / (z + 0.4);
      var laranja = j % 4 === 0;
      var cor = laranja ? '255,107,26' : '223,227,231';
      var lw = Math.max(1, 1.4 / Math.sqrt(z));
      if (laranja && !leve) { // só os anéis laranja ganham brilho em volta
        ctx.lineWidth = lw * 6;
        ctx.strokeStyle = 'rgba(' + cor + ',' + (0.07 * a * pulso).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(ox, oy, r, 0, 6.2832); ctx.stroke();
      }
      ctx.lineWidth = lw;
      ctx.strokeStyle = 'rgba(' + cor + ',' + ((laranja ? 0.9 : 0.45) * a * pulso).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ox, oy, r, 0, 6.2832); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';

    // a onda de choque: por dentro dela já é o grafite do site
    if (R > 0.5) {
      ctx.fillStyle = FUNDO_SITE;
      ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, 6.2832); ctx.fill();
      var forca = 1 - onda * 0.55;
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 18; ctx.strokeStyle = 'rgba(255,107,26,' + (0.08 * forca).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,107,26,' + (0.22 * forca).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,140,70,' + (0.95 * forca).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ccx, ccy, R, 0, 6.2832); ctx.stroke();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(223,227,231,' + (0.35 * forca).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(ccx, ccy, R * 0.9, 0, 6.2832); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ── o Λ e o texto ── */
  var textoVisivel = true, ultimoTexto = -1, ultimaQueima = 1;
  function aplica(p, t, px, py) {
    var m = calmo ? 0 : 1;
    var frente = suave(0, 0.6, p);
    var giro = -14 + 14 * frente + m * (Math.sin(t * 0.5) * 9 + px * 18);
    var incl = 6 + 6 * suave(0.15, 0.55, p) + m * (Math.sin(t * 0.7) * 3 - py * 12); // inclina para a frente ao acelerar
    var rola = m * Math.sin(t * 0.4) * 2;
    var perto = 1 + (pertoMax - 1) * suave(0.08, 0.85, p);
    var flutua = m * Math.sin(t * 0.9) * 7 * (1 - frente * 0.6);
    var centro = suave(0.1, 0.6, p);
    dX = paraX * centro;
    dY = paraY * centro;
    cena.style.transform = 'translate3d(' + (dX + m * px * -12).toFixed(1) + 'px,' + (dY + flutua).toFixed(1) + 'px,0)';
    cel.style.transform = 'rotateY(' + giro.toFixed(2) + 'deg) rotateX(' + incl.toFixed(2) + 'deg) rotateZ(' + rola.toFixed(2) + 'deg) scale(' + perto.toFixed(3) + ')';
    // pós-combustor: os diamantes se alongam enquanto o Λ acelera
    var queima = 1 + 0.9 * suave(0.12, 0.55, p) * (1 - 0.5 * suave(0.75, 1, p));
    if (chamas && Math.abs(queima - ultimaQueima) > 0.004) { ultimaQueima = queima; chamas.style.transform = 'scale(1,' + queima.toFixed(3) + ')'; }
    var tx = 1 - suave(0.12, 0.34, p);
    if (Math.abs(tx - ultimoTexto) > 0.002 || (tx !== ultimoTexto && (tx === 0 || tx === 1))) { ultimoTexto = tx; sec.style.setProperty('--texto', tx.toFixed(3)); }
    if ((tx > 0.02) !== textoVisivel) { textoVisivel = tx > 0.02; texto.classList.toggle('some', !textoVisivel); }
  }

  /* ── entrada: rolagem, mouse e toque ── */
  var quer = 0, atual = 0, visivel = true, rodando = false, ultimoY = window.scrollY, ultimoT = 0;
  var vel = 0.3, empurra = 0, alvoX = 0, alvoY = 0, px = 0, py = 0, ritmoRolagem = 0;
  function le() {
    var vao = sec.offsetHeight - window.innerHeight;
    quer = vao > 0 ? clamp(-sec.getBoundingClientRect().top / vao, 0, 1) : 0;
  }
  if (!calmo) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      alvoX = e.clientX / window.innerWidth - 0.5;
      alvoY = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
    palco.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      var r = palco.getBoundingClientRect();
      alvoX = ((e.clientX - r.left) / r.width - 0.5) * 0.7;
      alvoY = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
      empurra = Math.min(empurra + 1.6, 2.4); // um toque dá um impulso no túnel
      acorda();
    }, { passive: true });
    palco.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { alvoX = 0; alvoY = 0; } }, { passive: true });
    palco.addEventListener('pointercancel', function () { alvoX = 0; alvoY = 0; }, { passive: true });
  }

  // modo leve automático: se os primeiros 90 quadros passarem de 19 ms em média, o túnel
  // baixa a resolução e o número de riscos (o desenho continua o mesmo)
  var amostras = 0, somaAmostras = 0;
  function confereRitmo(dtMs) {
    if (leve || amostras >= 90) return;
    if (amostras >= 10) somaAmostras += dtMs; // os primeiros quadros sempre são lentos
    amostras++;
    if (amostras === 90 && somaAmostras / 80 > 19) { leve = true; medir(); }
  }
  function quadro(agora) {
    if (!visivel) { rodando = false; return; }
    var dt = ultimoT ? Math.min(0.05, (agora - ultimoT) / 1000) : 0.016;
    if (ultimoT && !document.hidden) confereRitmo(agora - ultimoT);
    ultimoT = agora;
    var t = agora / 1000;
    // rolagem: velocidade em px/s vira aceleração do túnel
    var y = window.scrollY;
    var vy = Math.abs(y - ultimoY) / Math.max(dt, 0.001);
    ultimoY = y;
    ritmoRolagem += (clamp(vy / 1400, 0, 1) - ritmoRolagem) * (1 - Math.exp(-dt * 6));
    empurra *= Math.exp(-dt * 2.2);
    var velAlvo = 0.3 + atual * 0.7 + ritmoRolagem * 3 + empurra;
    vel += (velAlvo - vel) * (1 - Math.exp(-dt * 4));
    percurso += vel * dt;
    atual += (quer - atual) * (1 - Math.exp(-dt * 9));
    if (Math.abs(quer - atual) < 0.0005) atual = quer;
    var k = 1 - Math.exp(-dt * 3);
    px += (alvoX - px) * k;
    py += (alvoY - py) * k;
    aplica(atual, t, px, py);
    desenha(t, dt, vel, atual, px, py);
    requestAnimationFrame(quadro);
  }
  function acorda() { if (!rodando && visivel && !calmo) { rodando = true; ultimoT = 0; ultimoY = window.scrollY; requestAnimationFrame(quadro); } }
  function parado() { le(); atual = quer; aplica(atual, 0, 0, 0); percurso = 0.35; desenha(0, 0, 0, atual, 0, 0); }

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
