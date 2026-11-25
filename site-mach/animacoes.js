/* MACH Estúdio — página de animações (animacoes.html)
   ─────────────────────────────────────────────
   Seis animações ao vivo. Cada uma só é montada quando o cartão chega perto da tela
   e pausa quando ele sai. Tudo responde ao mouse e ao dedo.
   Com "menos movimento" ligado no aparelho, nada se mexe sozinho: só responde ao toque. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parado = { liga() {}, desliga() {} };

  // um laço de quadros que só roda entre liga() e desliga()
  function laco(quadro) {
    let ligado = false, id = 0, ant = 0;
    const passo = (agora) => {
      if (!ligado) return;
      const dt = ant ? Math.min(0.05, (agora - ant) / 1000) : 1 / 60;
      ant = agora;
      quadro(agora / 1000, dt);
      id = requestAnimationFrame(passo);
    };
    return {
      liga() { if (ligado) return; ligado = true; ant = 0; id = requestAnimationFrame(passo); },
      desliga() { ligado = false; cancelAnimationFrame(id); },
    };
  }
  // aproxima um valor do alvo no mesmo ritmo em qualquer taxa de quadros
  const segue = (atual, alvo, dt, vel) => atual + (alvo - atual) * (1 - Math.exp(-dt * vel));

  const ANIM = {};

  /* ── 1 · cartão que inclina, com reflexo de luz ── */
  ANIM.cartao = (palco) => {
    const card = $('.cartao-3d', palco);
    let tx = 0, ty = 0, gx = 30, gy = 20, aX = 0, aY = 0, aGx = 30, aGy = 20, tocando = false;
    function desenha(k) {
      tx += (aX - tx) * k; ty += (aY - ty) * k; gx += (aGx - gx) * k; gy += (aGy - gy) * k;
      card.style.transform = 'rotateX(' + tx.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) + 'deg)';
      card.style.setProperty('--gx', gx.toFixed(1) + '%');
      card.style.setProperty('--gy', gy.toFixed(1) + '%');
    }
    function mira(e) {
      const r = card.getBoundingClientRect();
      const u = clamp((e.clientX - r.left) / r.width, -0.2, 1.2), v = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
      aY = (u - 0.5) * 30; aX = (0.5 - v) * 24; aGx = u * 100; aGy = v * 100;
      tocando = true;
      if (reduz) desenha(1);
    }
    function solta() {
      tocando = false;
      if (reduz) { aX = 0; aY = 0; aGx = 30; aGy = 20; desenha(1); }
    }
    palco.addEventListener('pointermove', mira);
    palco.addEventListener('pointerdown', mira);
    ['pointerleave', 'pointerup', 'pointercancel'].forEach((n) => palco.addEventListener(n, solta));
    desenha(1);
    if (reduz) return parado;
    return laco((t, dt) => {
      if (!tocando) { aX = Math.sin(t * 0.9) * 7; aY = Math.cos(t * 0.7) * 12; aGx = 50 + Math.cos(t * 0.7) * 34; aGy = 40 + Math.sin(t * 0.9) * 26; }
      desenha(1 - Math.exp(-dt * 6));
    });
  };

  /* ── 2 · página que se ajusta à tela ── */
  ANIM.ajuste = (palco) => {
    const quadro = $('.aj-quadro', palco), range = $('.aj-controle', palco);
    const elA = $('.aj-aparelho', palco), elM = $('.aj-medida', palco);
    const NOMES = { celular: 'Celular', tablet: 'Tablet', pc: 'Computador' };
    let mexeu = false, mostrou = false, id = 0;
    function aplica(v) {
      // v vai de 0 (celular) a 1 (computador); a medida mostrada simula a tela real
      const px = Math.round((360 + v * 1080) / 10) * 10;
      const modo = px < 600 ? 'celular' : px < 1024 ? 'tablet' : 'pc';
      quadro.style.setProperty('--v', v.toFixed(3));
      if (quadro.dataset.modo !== modo) quadro.dataset.modo = modo;
      elA.textContent = NOMES[modo];
      elM.textContent = 'Tela de ' + px + ' px';
      range.setAttribute('aria-valuetext', NOMES[modo] + ', tela de ' + px + ' pixels');
    }
    range.addEventListener('input', () => { mexeu = true; cancelAnimationFrame(id); aplica(range.value / 100); });
    aplica(range.value / 100);
    return {
      // na primeira vez que aparece, a página encolhe até o celular e volta, para mostrar a ideia
      liga() {
        if (mostrou || mexeu || reduz) return;
        const t0 = performance.now() + 500, dur = 2600;
        const passo = (agora) => {
          if (mexeu) return;
          const k = clamp((agora - t0) / dur);
          const v = 1 - Math.sin(k * Math.PI) * 0.96;
          range.value = Math.round(v * 100);
          aplica(v);
          if (k < 1) id = requestAnimationFrame(passo);
          else mostrou = true;
        };
        id = requestAnimationFrame(passo);
      },
      desliga() {
        cancelAnimationFrame(id);
        if (!mostrou && !mexeu) { range.value = 100; aplica(1); }
      },
    };
  };

  /* ── 3 · relógio em órbita (conceito ÓRBITA): a hora real, cercada por órbitas ── */
  ANIM.orbita = (palco) => {
    const cv = $('canvas', palco), c = cv.getContext('2d');
    const p = { w: 0, h: 0, mx: 0.5, my: 0.5, aX: 0.5, aY: 0.5, foco: 0, aF: 0 };
    let soltaT = 0;
    function mede() {
      const r = palco.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      p.w = r.width; p.h = r.height;
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      c.setTransform(d, 0, 0, d, 0, 0);
    }
    function desenha(t, k) {
      p.mx += (p.aX - p.mx) * k; p.my += (p.aY - p.my) * k; p.foco += (p.aF - p.foco) * k;
      const { w, h } = p;
      c.fillStyle = '#0e1116';
      c.fillRect(0, 0, w, h);
      const cx = w * 0.5 + (p.mx - 0.5) * 18, cy = h * 0.44 + (p.my - 0.5) * 14;
      const R = Math.min(w, h) * 0.27;
      for (let i = 0; i < 3; i++) {
        c.save();
        c.translate(cx, cy);
        c.rotate(t * (0.08 + i * 0.05) * (i % 2 ? -1 : 1) + i);
        c.scale(1, 0.32 + 0.1 * i + 0.14 * p.foco);
        c.strokeStyle = 'rgba(233,236,239,' + (0.1 + 0.05 * i) + ')';
        c.lineWidth = 1;
        c.beginPath(); c.arc(0, 0, R * (1.35 + i * 0.22), 0, Math.PI * 2); c.stroke();
        c.fillStyle = i === 1 ? '#ff6b1a' : '#e9ecef';
        c.beginPath(); c.arc(R * (1.35 + i * 0.22), 0, 2.6, 0, Math.PI * 2); c.fill();
        c.restore();
      }
      c.strokeStyle = 'rgba(233,236,239,0.55)';
      c.lineWidth = 1.2;
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, l = i % 5 === 0 ? 0.13 : 0.05;
        c.strokeStyle = i % 5 === 0 ? 'rgba(233,236,239,0.85)' : 'rgba(233,236,239,0.3)';
        c.beginPath();
        c.moveTo(cx + Math.sin(a) * R * (0.94 - l), cy - Math.cos(a) * R * (0.94 - l));
        c.lineTo(cx + Math.sin(a) * R * 0.94, cy - Math.cos(a) * R * 0.94);
        c.stroke();
      }
      const d = new Date();
      const s = d.getSeconds() + d.getMilliseconds() / 1000, mi = d.getMinutes() + s / 60, hr = (d.getHours() % 12) + mi / 60;
      const ponteiro = (ang, len, cor, lw) => {
        c.strokeStyle = cor; c.lineWidth = lw; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx - Math.sin(ang) * len * 0.12, cy + Math.cos(ang) * len * 0.12);
        c.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len);
        c.stroke();
      };
      ponteiro((hr / 12) * Math.PI * 2, R * 0.5, '#e9ecef', 3);
      ponteiro((mi / 60) * Math.PI * 2, R * 0.75, '#e9ecef', 2);
      ponteiro(((reduz ? Math.floor(s) : s) / 60) * Math.PI * 2, R * 0.86, '#ff6b1a', 1.2);
      c.fillStyle = '#ff6b1a';
      c.beginPath(); c.arc(cx, cy, 3.2, 0, Math.PI * 2); c.fill();
    }
    function mira(e) {
      const r = palco.getBoundingClientRect();
      p.aX = (e.clientX - r.left) / r.width; p.aY = (e.clientY - r.top) / r.height; p.aF = 1;
      if (reduz) desenha(0, 1);
    }
    function volta() { p.aF = 0; p.aX = 0.5; p.aY = 0.5; if (reduz) desenha(0, 1); }
    palco.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) mira(e); });
    palco.addEventListener('pointerdown', (e) => { clearTimeout(soltaT); mira(e); });
    palco.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') soltaT = setTimeout(volta, 1400); });
    palco.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') volta(); });
    mede();
    if ('ResizeObserver' in window) new ResizeObserver(() => { mede(); desenha(0, 1); }).observe(palco);
    if (reduz) {
      // parado: desenha uma vez por segundo, só para a hora continuar certa
      let id = 0;
      return { liga() { desenha(0, 1); clearInterval(id); id = setInterval(() => desenha(0, 1), 1000); }, desliga() { clearInterval(id); } };
    }
    return laco((t, dt) => desenha(t, 1 - Math.exp(-dt * 5)));
  };

  /* ── 4 · texto que acende palavra por palavra, conforme a rolagem ── */
  ANIM.texto = (palco) => {
    const frase = $('.acende', palco);
    const partes = [];
    Array.from(frase.childNodes).forEach((no) => {
      const destaque = no.nodeType === 1; // o <em> é a palavra que acende em laranja
      no.textContent.split(/(\s+)/).forEach((s) => {
        if (!s) return;
        if (/^\s+$/.test(s)) { partes.push(document.createTextNode(s)); return; }
        const sp = document.createElement('span');
        sp.className = 'w' + (destaque ? ' destaque' : '');
        sp.textContent = s;
        partes.push(sp);
      });
    });
    frase.textContent = '';
    partes.forEach((x) => frase.appendChild(x));
    const palavras = $$('.w', frase);
    if (reduz) { palavras.forEach((w) => w.classList.add('on')); return parado; }
    frase.classList.add('acende-js');
    let acesas = -1, pedido = false, ouvindo = false;
    function atualiza() {
      pedido = false;
      const vh = window.innerHeight, r = palco.getBoundingClientRect();
      // começa quando o cartão entra embaixo e termina quando ele chega ao terço de cima da tela
      let prog = (vh * 0.92 - r.top) / (vh * 0.62);
      if (window.scrollY + vh >= document.documentElement.scrollHeight - 2) prog = 1;
      const n = Math.round(clamp(prog) * palavras.length);
      if (n === acesas) return;
      acesas = n;
      palavras.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    const agenda = () => { if (!pedido) { pedido = true; requestAnimationFrame(atualiza); } };
    return {
      liga() { if (!ouvindo) { ouvindo = true; window.addEventListener('scroll', agenda, { passive: true }); } atualiza(); },
      desliga() { ouvindo = false; window.removeEventListener('scroll', agenda); },
    };
  };

  /* ── 5 · paisagem em 3 camadas que se separam com o mouse ou o dedo ── */
  ANIM.camadas = (palco) => {
    if (reduz) return parado;
    const camadas = [[$('.cam-fundo', palco), 0.22], [$('.cam-meio', palco), 0.55], [$('.cam-frente', palco), 1]];
    let aX = 0, aY = 0, x = 0, y = 0, tocando = false, amp = 20;
    function mede() { amp = palco.clientWidth * 0.06; }
    function mira(e) {
      const r = palco.getBoundingClientRect();
      aX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      aY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      tocando = true;
    }
    palco.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) mira(e); });
    palco.addEventListener('pointerdown', mira);
    ['pointerleave', 'pointerup', 'pointercancel'].forEach((n) => palco.addEventListener(n, () => { tocando = false; }));
    mede();
    if ('ResizeObserver' in window) new ResizeObserver(mede).observe(palco);
    return laco((t, dt) => {
      // parada, a paisagem respira devagar; com o mouse ou o dedo, segue o movimento
      const alvoX = tocando ? aX : Math.sin(t * 0.45) * 0.55;
      const alvoY = tocando ? aY : Math.sin(t * 0.32) * 0.25;
      x = segue(x, alvoX, dt, 4);
      y = segue(y, alvoY, dt, 4);
      for (const [el, k] of camadas) {
        el.style.transform = 'translate3d(' + (-x * k * amp).toFixed(1) + 'px,' + (-y * k * amp * 0.5).toFixed(1) + 'px,0)';
      }
    });
  };

  /* ── 6 · botão magnético: puxa o cursor e responde ao toque com uma onda ── */
  ANIM.ima = (palco) => {
    const btn = $('.ima-btn', palco), rotulo = $('.ima-rotulo', palco), aviso = $('.ima-aviso', palco);
    const TEXTO = rotulo.textContent;
    let bx = 0, by = 0, aX = 0, aY = 0, cx = 0, cy = 0, raio = 160, voltaT = 0;
    function mede() {
      const rp = palco.getBoundingClientRect(), rb = btn.getBoundingClientRect();
      cx = rb.left - rp.left + rb.width / 2 - bx;
      cy = rb.top - rp.top + rb.height / 2 - by;
      raio = Math.min(180, rp.width * 0.5);
    }
    function puxa(e) {
      if (reduz) return;
      const rp = palco.getBoundingClientRect();
      const dx = e.clientX - rp.left - cx, dy = e.clientY - rp.top - cy;
      const f = clamp(1.25 - Math.hypot(dx, dy) / raio);
      aX = dx * 0.4 * f;
      aY = dy * 0.4 * f;
    }
    const solta = () => { aX = 0; aY = 0; };
    palco.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) puxa(e); });
    palco.addEventListener('pointerdown', puxa);
    palco.addEventListener('pointerleave', solta);
    palco.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(solta, 250); });
    palco.addEventListener('pointercancel', solta);
    function onda(x, y) {
      for (let i = 0; i < 3; i++) {
        const o = document.createElement('span');
        o.className = 'ima-onda';
        o.style.left = x + 'px';
        o.style.top = y + 'px';
        o.style.animationDelay = i * 120 + 'ms';
        o.addEventListener('animationend', () => o.remove());
        palco.appendChild(o);
      }
    }
    btn.addEventListener('click', (e) => {
      const rp = palco.getBoundingClientRect();
      const teclado = e.detail === 0;
      if (!reduz) onda(teclado ? cx + bx : e.clientX - rp.left, teclado ? cy + by : e.clientY - rp.top);
      rotulo.textContent = 'Reservado!';
      aviso.textContent = 'É só uma demonstração.';
      clearTimeout(voltaT);
      voltaT = setTimeout(() => { rotulo.textContent = TEXTO; aviso.textContent = ''; }, 1800);
    });
    mede();
    if ('ResizeObserver' in window) new ResizeObserver(mede).observe(palco);
    if (reduz) return parado;
    return laco((t, dt) => {
      bx = segue(bx, aX, dt, 10);
      by = segue(by, aY, dt, 10);
      btn.style.transform = 'translate3d(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px,0)';
      rotulo.style.transform = 'translate3d(' + (bx * 0.35).toFixed(1) + 'px,' + (by * 0.35).toFixed(1) + 'px,0)';
    });
  };

  /* ── liga cada animação quando o cartão chega perto da tela e pausa quando ele sai ── */
  const palcos = $$('[data-anim]');
  if (!('IntersectionObserver' in window)) {
    palcos.forEach((pal) => { const a = ANIM[pal.dataset.anim](pal); a.liga(); });
    return;
  }
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((x) => {
      const pal = x.target;
      if (x.isIntersecting && !pal._anim) pal._anim = ANIM[pal.dataset.anim](pal);
      if (!pal._anim) return;
      if (x.isIntersecting) pal._anim.liga();
      else pal._anim.desliga();
    });
  }, { rootMargin: '120px 0px' });
  palcos.forEach((pal) => io.observe(pal));
})();
