/* MACH Estúdio — site oficial (sem back-end)
   ─────────────────────────────────────────────
   CONFIGURAÇÃO: número de WhatsApp com DDI + DDD, só dígitos (ex.: '5511999998888').
   Vazio = o WhatsApp abre e a pessoa escolhe o contato. */
const CONFIG = {
  whatsapp: '5511939045618',
  instagram: 'mach.sites',
  // Caso real da Equus Genetics nas provas. Mude para false para esconder o bloco inteiro
  // (por exemplo, enquanto o cliente não autoriza mostrar o site).
  mostrarEquus: true,
};

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const suave = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toque = window.matchMedia('(hover: none)').matches;
  const hash = (n) => {
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
  const VEL_SOM = 1062; // km/h a 15 km de altitude (ar a −56 °C)
  const DPR = Math.min(window.devicePixelRatio || 1, 1.75);

  /* ── rolagem suave (Lenis, projeto open source) ── */
  let lenis = null;
  if (!reduz && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    const raf = (t) => {
      lenis.raf(t);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      if (lenis) {
        e.preventDefault();
        lenis.scrollTo(alvo, { offset: id === '#topo' ? 0 : -70 });
      }
    });
  });

  /* ── medidas da página ── */
  const nav = $('#nav');
  const main = $('#conteudo');
  const problema = $('#problema');
  const barreira = $('#barreira');
  const provas = $('#provas');
  let M = {};
  function medir() {
    const y = window.scrollY;
    const top = (el) => el.getBoundingClientRect().top + y;
    M = {
      vh: window.innerHeight,
      probTop: top(problema),
      probH: problema.offsetHeight,
      barreira: top(barreira) - window.innerHeight * 0.55,
      // o medidor sai de cena quando as provas começam: o papel dele termina no estrondo
      provas: top(provas) - window.innerHeight * 0.65,
      fim: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
    };
  }

  /* ── medidor de Mach (a rolagem é o acelerador) ── */
  const elMach = $('#mach'), elVel = $('#vel'), elEstado = $('#estado'), medidor = $('#medidor');
  const boomEl = $('#boom');
  let boomFeito = false, ultimoY = window.scrollY;
  const fmt = new Intl.NumberFormat('pt-BR');

  function machDe(y) {
    if (y < M.barreira) return 0.6 + 0.4 * clamp(y / Math.max(1, M.barreira));
    return 1 + 1.2 * clamp((y - M.barreira) / Math.max(1, M.fim - M.barreira));
  }

  // O estrondo sônico: um só, no momento em que o site rompe a barreira do template.
  function estrondo() {
    boomEl.classList.remove('on');
    void boomEl.offsetWidth;
    boomEl.classList.add('on');
    if (!reduz) {
      main.classList.remove('tremor');
      void main.offsetWidth;
      main.classList.add('tremor');
      try { navigator.vibrate && navigator.vibrate([18, 40, 26]); } catch (e) { /* sem vibração */ }
    }
  }

  function atualizaMedidor(y) {
    const m = machDe(y);
    elMach.textContent = m.toFixed(2);
    elVel.textContent = fmt.format(Math.round(m * VEL_SOM));
    const sup = m >= 1;
    elEstado.textContent = sup ? 'Supersônico' : m >= 0.8 ? 'Transônico' : 'Subsônico';
    medidor.classList.toggle('super', sup);
    medidor.classList.toggle('esconde', y > M.provas);
    if (!boomFeito && y >= M.barreira) {
      boomFeito = true;
      if (ultimoY < M.barreira) estrondo();
    }
  }

  /* ── o problema: pilha de sites iguais ── */
  const VARIANTES = [
    ['Nexora', '#ff3d8b'], ['Vortiq', '#00d9ff'], ['Lumora', '#ffc21a'], ['Zentrix', '#2ff3a0'],
    ['Flowbi', '#ff7a2f'], ['Synkra', '#b6ff2e'], ['Brivora', '#ff52e5'], ['Optiva', '#5ce1ff'],
    ['Elevra', '#ffe14d'], ['Novyx', '#00f5c8'], ['Qualix', '#ff5d5d'], ['Vertika', '#d4b0ff'],
    ['Kloudi', '#7cff6b'], ['Axora', '#ff9ec7'],
  ];
  const deck = $('#deck');
  const cartas = VARIANTES.map(([nome, cor], i) => {
    const el = document.createElement('div');
    el.className = 'tpl';
    el.style.setProperty('--a', cor);
    el.innerHTML =
      `<div class="tpl-bar"><span>${nome.toLowerCase()}.com.br</span></div>` +
      `<div class="tpl-hero"><div class="tpl-nav"><b>◉ ${nome}</b><s></s></div>` +
      `<p class="tpl-h">Inovação que<br><em>transforma</em></p>` +
      `<p class="tpl-sub">Soluções inteligentes e<br>tecnologia de ponta</p>` +
      `<span class="tpl-btn">Saiba mais →</span>` +
      `<div class="tpl-bolhas"><i></i><i></i><i></i><i></i></div></div>` +
      `<div class="tpl-cards"><div><i></i>Rápido</div><div><i></i>Seguro</div><div><i></i>Escalável</div></div>`;
    deck.appendChild(el);
    return {
      el,
      rot: (hash(i * 3 + 1) - 0.5) * (i === 0 ? 0 : 14),
      dx: (hash(i * 5 + 2) - 0.5) * (i === 0 ? 0 : 70),
      dy: (hash(i * 7 + 3) - 0.5) * (i === 0 ? 0 : 50),
      entra: i === 0 ? -1 : 0.74 * (1 - Math.pow(1 - i / (VARIANTES.length - 1), 1.8)),
    };
  });
  const palco = $('#palco'), apagao = $('#apagao'), contador = $('#contador');
  let ultimoContador = -1;

  function atualizaProblema(y) {
    const p = clamp((y - M.probTop) / Math.max(1, M.probH - M.vh));
    cartas.forEach((c) => {
      const k = reduz ? 1 : easeOut(clamp((p - c.entra) / 0.055));
      const ty = (1 - k) * 130;
      c.el.style.transform = `translate(${c.dx * k}px, calc(${ty}vh + ${c.dy * k}px)) rotate(${c.rot * k}deg)`;
    });
    const n = p < 0.02 ? 1 : Math.min(47, Math.round(1 + 46 * Math.pow(clamp(p / 0.8), 1.6)));
    if (n !== ultimoContador) {
      contador.textContent = n;
      ultimoContador = n;
    }
    palco.classList.toggle('glitch', !reduz && p > 0.8 && p < 0.9);
    const preto = clamp((p - 0.86) / 0.05);
    apagao.style.opacity = preto;
    apagao.classList.toggle('on', preto > 0.85);
  }

  /* ── cliente real: Equus Genetics (liga e desliga em CONFIG.mostrarEquus) ──
     Enquanto o bloco passa pela tela, o site no computador rola da primeira tela até os
     quatro passos, e o celular flutua um pouco. Com movimento reduzido, tudo fica parado. */
  const caso = $('#caso-equus');
  if (caso) {
    if (CONFIG.mostrarEquus) caso.hidden = false;
    else caso.remove();
  }
  const casoTelas = CONFIG.mostrarEquus && caso ? $('.caso-telas', caso) : null;
  function atualizaCaso() {
    if (!casoTelas || reduz) return;
    const r = casoTelas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > M.vh) return;
    const q = clamp((M.vh - r.top) / (M.vh + r.height));
    casoTelas.style.setProperty('--q', q.toFixed(3));
    casoTelas.style.setProperty('--pan', suave(0.5, 0.88, q).toFixed(3));
  }

  /* ── laço principal de rolagem ── */
  function aoRolar() {
    const y = window.scrollY;
    nav.classList.toggle('solida', y > 30);
    atualizaMedidor(y);
    atualizaProblema(y);
    atualizaCaso();
    ultimoY = y;
  }
  let agendado = false;
  const agenda = () => {
    if (agendado) return;
    agendado = true;
    requestAnimationFrame(() => {
      agendado = false;
      aoRolar();
    });
  };
  window.addEventListener('scroll', agenda, { passive: true });

  /* ── a barreira: números contando ── */
  let barreiraLigada = false;
  function ligaBarreira() {
    if (barreiraLigada) return;
    barreiraLigada = true;
    if (reduz) return;
    $$('[data-conta]', barreira).forEach((dd) => {
      const alvo = Number(dd.dataset.conta);
      const de = Number(dd.dataset.de || 0);
      const suf = dd.dataset.suf || '';
      const t0 = performance.now();
      const passo = (agora) => {
        const k = easeOutExpo(clamp((agora - t0) / 1600));
        dd.textContent = Math.round(lerp(de, alvo, k)) + suf;
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    });
  }

  /* ── o filme (só carrega quando aparece) ── */
  const video = $('#video'), bPlay = $('#v-play'), bSom = $('#v-som');
  let pausadoPeloUsuario = false;
  function controlaVideo(visivel) {
    if (visivel && !pausadoPeloUsuario && !reduz) video.play().catch(() => {});
    if (!visivel) video.pause();
  }
  // a capa do filme só é baixada quando a pessoa está chegando nele (a primeira tela fica mais leve)
  if (video.dataset.poster) {
    const ioCapa = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      video.poster = video.dataset.poster;
      ioCapa.disconnect();
    }, { rootMargin: '150% 0px' });
    ioCapa.observe(video);
  }
  video.addEventListener('play', () => (bPlay.textContent = 'Pausar'));
  video.addEventListener('pause', () => (bPlay.textContent = 'Reproduzir'));
  bPlay.addEventListener('click', () => {
    if (video.paused) {
      pausadoPeloUsuario = false;
      video.play().catch(() => {});
    } else {
      pausadoPeloUsuario = true;
      video.pause();
    }
  });
  bSom.addEventListener('click', () => {
    video.muted = !video.muted;
    bSom.textContent = video.muted ? 'Ativar som' : 'Tirar som';
    if (!video.muted && video.paused) video.play().catch(() => {});
  });

  /* ── observador geral (só anima o que está na tela) ── */
  const io = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      const el = en.target;
      if (el.classList.contains('proj')) el._visivel = en.isIntersecting;
      else if (el === barreira && en.isIntersecting && en.intersectionRatio > 0.2) ligaBarreira();
      else if (el === video) controlaVideo(en.isIntersecting);
      else if (el === tilt) { tiltVisivel = en.isIntersecting; if (tiltVisivel) acordaCartao(); }
      else if (el === demo && en.isIntersecting) demonstraLargura();
    }
  }, { threshold: [0, 0.2, 0.5] });

  /* ══ PROVA 01 · o cartão que inclina, com reflexo de luz ══ */
  const tilt = $('#tilt'), card = $('#card');
  let tx = 0, ty = 0, gx = 30, gy = 20, alvoX = 0, alvoY = 0, alvoGx = 30, alvoGy = 20;
  let tocando = false, tiltVisivel = false, tiltLaco = false;
  function mira(e) {
    const r = card.getBoundingClientRect();
    const u = clamp((e.clientX - r.left) / r.width, -0.2, 1.2), v = clamp((e.clientY - r.top) / r.height, -0.2, 1.2);
    alvoY = (u - 0.5) * 30;
    alvoX = (0.5 - v) * 24;
    alvoGx = u * 100;
    alvoGy = v * 100;
    tocando = true;
    acordaCartao();
  }
  tilt.addEventListener('pointermove', mira);
  tilt.addEventListener('pointerdown', mira);
  ['pointerleave', 'pointerup', 'pointercancel'].forEach((n) => tilt.addEventListener(n, () => { tocando = false; acordaCartao(); }));
  function quadroCartao(agora) {
    if (!tiltVisivel) { tiltLaco = false; return; }
    const t = agora / 1000;
    if (!tocando) {
      if (reduz) { alvoX = 0; alvoY = 0; alvoGx = 30; alvoGy = 20; }
      else { alvoX = Math.sin(t * 0.9) * 7; alvoY = Math.cos(t * 0.7) * 12; alvoGx = 50 + Math.cos(t * 0.7) * 34; alvoGy = 40 + Math.sin(t * 0.9) * 26; }
    }
    const k = reduz ? 1 : 0.1;
    tx += (alvoX - tx) * k; ty += (alvoY - ty) * k; gx += (alvoGx - gx) * k; gy += (alvoGy - gy) * k;
    card.style.transform = `rotateX(${tx.toFixed(2)}deg) rotateY(${ty.toFixed(2)}deg)`;
    card.style.setProperty('--gx', gx.toFixed(1) + '%');
    card.style.setProperty('--gy', gy.toFixed(1) + '%');
    // com movimento reduzido o cartão só se mexe enquanto a pessoa toca
    if (reduz && !tocando) { tiltLaco = false; return; }
    requestAnimationFrame(quadroCartao);
  }
  function acordaCartao() {
    if (tiltLaco || !tiltVisivel) return;
    tiltLaco = true;
    requestAnimationFrame(quadroCartao);
  }

  /* ══ PROVA 02 · a página que se ajusta à medida ══ */
  const demo = $('.demo'), quadro = $('#quadro'), largura = $('#largura');
  const elAparelho = $('#fit-aparelho'), elMedida = $('#fit-medida');
  const APARELHOS = { celular: 'Celular', tablet: 'Tablet', pc: 'Computador' };
  let mexeu = false, demonstrou = false;
  function aplicaLargura(v) {
    // v vai de 0 (celular) a 1 (computador); a medida mostrada simula a tela real
    const px = Math.round((360 + v * 1080) / 10) * 10;
    const modo = px < 600 ? 'celular' : px < 1024 ? 'tablet' : 'pc';
    quadro.style.setProperty('--v', v.toFixed(3));
    if (quadro.dataset.modo !== modo) quadro.dataset.modo = modo;
    elAparelho.textContent = APARELHOS[modo];
    elMedida.textContent = `Tela de ${px} px`;
    largura.setAttribute('aria-valuetext', `${APARELHOS[modo]}, tela de ${px} pixels`);
  }
  largura.addEventListener('input', () => { mexeu = true; aplicaLargura(largura.value / 100); });
  // na primeira vez que aparece, a página encolhe até o celular e volta, para mostrar a ideia
  function demonstraLargura() {
    if (demonstrou || mexeu || reduz) return;
    demonstrou = true;
    const t0 = performance.now(), dur = 2600;
    const passo = (agora) => {
      if (mexeu) return;
      const k = clamp((agora - t0) / dur);
      const v = 1 - Math.sin(k * Math.PI) * 0.96;
      largura.value = Math.round(v * 100);
      aplicaLargura(v);
      if (k < 1) requestAnimationFrame(passo);
    };
    setTimeout(() => requestAnimationFrame(passo), 500);
  }
  aplicaLargura(1);

  /* ══ PROVA 03 · hangar: três conceitos desenhados em tempo real ══ */
  const projetos = $$('.proj').map((el) => {
    const cv = $('canvas', el);
    const p = { el, cv, c: cv.getContext('2d'), w: 0, h: 0, mx: 0.5, my: 0.5, alvoX: 0.5, alvoY: 0.5, foco: 0, alvoFoco: 0, tipo: el.dataset.proj };
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      p.alvoX = (e.clientX - r.left) / r.width;
      p.alvoY = (e.clientY - r.top) / r.height;
      p.alvoFoco = 1;
    });
    el.addEventListener('pointerleave', () => {
      p.alvoFoco = 0;
      p.alvoX = 0.5;
      p.alvoY = 0.5;
    });
    el.addEventListener('click', () => {
      if (!toque) return;
      p.alvoFoco = p.alvoFoco ? 0 : 1;
      el.classList.toggle('ativo', !!p.alvoFoco);
    });
    io.observe(el);
    return p;
  });
  function redimensionaProjetos() {
    for (const p of projetos) {
      const r = p.el.getBoundingClientRect();
      p.w = r.width;
      p.h = r.height;
      p.cv.width = Math.round(r.width * DPR);
      p.cv.height = Math.round(r.height * DPR);
    }
  }

  function halo(p, t) {
    const { c, w, h } = p;
    const bg = c.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.8);
    bg.addColorStop(0, '#2a1a0e');
    bg.addColorStop(1, '#0c0a09');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const cx = w * 0.5 + (p.mx - 0.5) * w * 0.08;
    const cy = h * 0.4 + (p.my - 0.5) * h * 0.05;
    const R = Math.min(w, h) * 0.26;
    const brilho = 0.75 + 0.25 * p.foco + 0.05 * Math.sin(t * 2.2);
    const tilt = (p.mx - 0.5) * 0.9;
    const glow = c.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 2.4);
    glow.addColorStop(0, `rgba(255,170,90,${0.3 * brilho})`);
    glow.addColorStop(1, 'rgba(255,140,60,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#3a3633';
    c.lineWidth = Math.max(2, R * 0.03);
    c.beginPath();
    c.moveTo(cx, cy + R * 1.02);
    c.lineTo(w * 0.5, cy + R * 1.6);
    c.stroke();
    c.fillStyle = '#2b2725';
    c.beginPath();
    c.ellipse(w * 0.5, cy + R * 1.62, R * 0.5, R * 0.07, 0, 0, Math.PI * 2);
    c.fill();
    c.save();
    c.translate(cx, cy);
    c.scale(Math.cos(tilt * 0.6), 1);
    c.shadowColor = `rgba(255,170,90,${0.9 * brilho})`;
    c.shadowBlur = R * 0.4;
    const rg = c.createLinearGradient(-R, -R, R, R);
    rg.addColorStop(0, '#fff6e8');
    rg.addColorStop(0.45, '#ffd7a1');
    rg.addColorStop(1, '#ff9d45');
    c.strokeStyle = rg;
    c.lineWidth = R * 0.1;
    c.beginPath();
    c.arc(0, 0, R, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    const fg = c.createRadialGradient(w * 0.5, cy + R * 1.65, 0, w * 0.5, cy + R * 1.65, R * 1.3);
    fg.addColorStop(0, `rgba(255,170,90,${0.22 * brilho})`);
    fg.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = fg;
    c.fillRect(0, cy + R, w, R * 1.4);
  }

  function orbita(p, t) {
    const { c, w, h } = p;
    c.fillStyle = '#0e1116';
    c.fillRect(0, 0, w, h);
    const cx = w * 0.5 + (p.mx - 0.5) * 16, cy = h * 0.43 + (p.my - 0.5) * 12;
    const R = Math.min(w, h) * 0.3;
    for (let k = 0; k < 3; k++) {
      c.save();
      c.translate(cx, cy);
      c.rotate(t * (0.08 + k * 0.05) * (k % 2 ? -1 : 1) + k);
      c.scale(1, 0.32 + 0.1 * k + 0.1 * p.foco);
      c.strokeStyle = `rgba(223,227,231,${0.1 + 0.05 * k})`;
      c.lineWidth = 1;
      c.beginPath();
      c.arc(0, 0, R * (1.35 + k * 0.22), 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = k === 1 ? '#ff6b1a' : '#dfe3e7';
      c.beginPath();
      c.arc(R * (1.35 + k * 0.22), 0, 2.5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    c.strokeStyle = 'rgba(223,227,231,0.55)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const l = i % 5 === 0 ? 0.13 : 0.05;
      c.strokeStyle = i % 5 === 0 ? 'rgba(223,227,231,0.85)' : 'rgba(223,227,231,0.3)';
      c.beginPath();
      c.moveTo(cx + Math.sin(a) * R * (0.94 - l), cy - Math.cos(a) * R * (0.94 - l));
      c.lineTo(cx + Math.sin(a) * R * 0.94, cy - Math.cos(a) * R * 0.94);
      c.stroke();
    }
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000;
    const mi = d.getMinutes() + s / 60;
    const hr = (d.getHours() % 12) + mi / 60;
    const ponteiroDe = (ang, len, cor, lw) => {
      c.strokeStyle = cor;
      c.lineWidth = lw;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(cx - Math.sin(ang) * len * 0.12, cy + Math.cos(ang) * len * 0.12);
      c.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len);
      c.stroke();
    };
    ponteiroDe((hr / 12) * Math.PI * 2, R * 0.5, '#dfe3e7', 3);
    ponteiroDe((mi / 60) * Math.PI * 2, R * 0.75, '#dfe3e7', 2);
    ponteiroDe((s / 60) * Math.PI * 2, R * 0.86, '#ff6b1a', 1.2);
    c.fillStyle = '#ff6b1a';
    c.beginPath();
    c.arc(cx, cy, 3.2, 0, Math.PI * 2);
    c.fill();
  }

  function mare(p, t) {
    const { c, w, h } = p;
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#071a1f');
    bg.addColorStop(1, '#0a0f14');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const linhas = 14;
    for (let i = 0; i < linhas; i++) {
      const y0 = h * (0.18 + (i / linhas) * 0.62);
      const amp = h * 0.035 * (1 + 0.6 * Math.sin(i * 0.7 + t * 0.6));
      c.strokeStyle = `rgba(${90 + i * 8},${210 - i * 4},${200 + i * 2},${0.18 + 0.4 * (i / linhas)})`;
      c.lineWidth = 1 + (i / linhas) * 1.2;
      c.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const dx = (x / w - p.mx);
        const bump = p.foco * h * 0.06 * Math.exp(-(dx * dx) / 0.02) * Math.exp(-Math.pow(y0 / h - p.my, 2) / 0.05);
        const y = y0 + Math.sin(x * 0.012 + t * 1.2 + i * 0.5) * amp + Math.sin(x * 0.031 - t * 0.8 + i) * amp * 0.35 - bump;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    }
    const sol = c.createRadialGradient(w * 0.78, h * 0.16, 0, w * 0.78, h * 0.16, h * 0.25);
    sol.addColorStop(0, 'rgba(255,190,120,0.35)');
    sol.addColorStop(1, 'rgba(255,190,120,0)');
    c.fillStyle = sol;
    c.fillRect(0, 0, w, h);
  }

  const DESENHOS = { halo, orbita, mare };
  function lacoProjetos(agora) {
    const t = agora / 1000;
    for (const p of projetos) {
      if (!p.el._visivel || document.hidden) continue;
      p.mx = lerp(p.mx, p.alvoX, 0.08);
      p.my = lerp(p.my, p.alvoY, 0.08);
      p.foco = lerp(p.foco, p.alvoFoco, 0.06);
      p.c.setTransform(DPR, 0, 0, DPR, 0, 0);
      DESENHOS[p.tipo](p, t);
    }
    requestAnimationFrame(lacoProjetos);
  }
  // com movimento reduzido, os conceitos ficam parados (desenhados uma vez)
  function desenhaProjetosParados() {
    for (const p of projetos) {
      p.c.setTransform(DPR, 0, 0, DPR, 0, 0);
      DESENHOS[p.tipo](p, 0);
    }
  }

  /* ══ COMO FUNCIONA · os quatro passos em rolagem lateral ══
     O símbolo 3D (mach3d.js) lê a mesma rolagem lateral para ir do traço ao sólido. */
  const trilho = $('#trilho'), passos = $$('.passo', trilho), marcas = $$('#marcas i');
  const bVolta = $('#volta'), bVai = $('#vai');
  let passoAtual = -1;
  function progressoTrilho() {
    return clamp(trilho.scrollLeft / Math.max(1, trilho.scrollWidth - trilho.clientWidth));
  }
  function atualizaTrilho() {
    const q = progressoTrilho();
    marcas.forEach((m, i) => m.style.setProperty('--k', clamp(q * 3 - i + 1).toFixed(3)));
    const at = Math.round(q * 3);
    if (at === passoAtual) return;
    passoAtual = at;
    passos.forEach((p, i) => p.classList.toggle('on', i === at));
    bVolta.disabled = at === 0;
    bVai.disabled = at === passos.length - 1;
  }
  // No celular cada passo encaixa no começo da tela. No computador cabem vários cartões,
  // então as setas andam um quarto do caminho por vez (o passo aceso e o símbolo 3D acompanham).
  const encaixe = window.matchMedia('(max-width: 759px)');
  function vaiPara(i) {
    const n = clamp(i, 0, passos.length - 1);
    const alcance = Math.max(0, trilho.scrollWidth - trilho.clientWidth);
    const left = encaixe.matches ? passos[n].offsetLeft - passos[0].offsetLeft : (n / (passos.length - 1)) * alcance;
    trilho.scrollTo({ left: Math.min(left, alcance), behavior: reduz ? 'auto' : 'smooth' });
  }
  bVolta.addEventListener('click', () => vaiPara(passoAtual - 1));
  bVai.addEventListener('click', () => vaiPara(passoAtual + 1));
  passos.forEach((el, i) => el.addEventListener('click', () => vaiPara(i)));
  trilho.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { vaiPara(passoAtual + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { vaiPara(passoAtual - 1); e.preventDefault(); }
  });
  trilho.addEventListener('scroll', atualizaTrilho, { passive: true });

  /* ── títulos: cada palavra entra em foco quando aparece ── */
  const titulos = $$('.reveal');
  titulos.forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w, i) => `<span class="w" style="--i:${i}">${w}</span>`).join(' ');
  });
  if (reduz) titulos.forEach((el) => el.classList.add('in'));
  else {
    const ioT = new IntersectionObserver((en) => {
      en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); ioT.unobserve(x.target); } });
    }, { threshold: 0.4 });
    titulos.forEach((el) => ioT.observe(el));
  }

  /* ── blocos entram macios (só os que começam fora da tela) ── */
  if (!reduz) {
    const ioB = new IntersectionObserver((en) => {
      en.forEach((x) => { if (x.isIntersecting) { x.target.classList.remove('fora'); ioB.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$('[data-revela]').forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.92) {
        el.classList.add('fora');
        ioB.observe(el);
      }
    });
  }

  /* ══ PEDIDO · cartão de embarque + WhatsApp / direct ══ */
  const form = $('#form');
  const campo = (n) => form.elements[n];
  const marcado = (n) => {
    const el = form.querySelector(`input[name="${n}"]:checked`);
    return el ? el.value : '';
  };
  const CODIGOS = { 'Site institucional': 'INS', 'Landing page': 'LDP', 'Portfólio': 'PRT', 'Animação e 3D': 'A3D', 'Ainda não sei': '???' };
  const voo = 'MCH-' + String(1000 + Math.floor(Math.random() * 9000));
  $('#c-voo').textContent = voo;
  const bZap = $('#b-zap'), bDirect = $('#b-direct'), cartao = $('#cartao'), barras = $('#c-barras');
  const erroNome = $('#erro-nome');

  function dados() {
    return {
      nome: campo('nome').value.trim(),
      empresa: campo('empresa').value.trim(),
      tipo: marcado('tipo'),
      prazo: marcado('prazo'),
      ref: campo('ref').value.trim(),
      msg: campo('msg').value.trim(),
    };
  }
  function mensagem(d) {
    const linhas = ['Olá, MACH! Quero fazer um pedido de site.', ''];
    linhas.push(`Nome: ${d.nome || '—'}`);
    if (d.empresa) linhas.push(`Empresa: ${d.empresa}`);
    linhas.push(`Tipo: ${d.tipo || 'Ainda não sei'}`);
    linhas.push(`Prazo: ${d.prazo || 'A combinar'}`);
    if (d.ref) linhas.push(`Referências: ${d.ref}`);
    if (d.msg) linhas.push('', `Sobre o projeto: ${d.msg}`);
    linhas.push('', `Cartão de embarque ${voo}`);
    return linhas.join('\n');
  }
  function desenhaBarras(semente) {
    let s = 0;
    for (const ch of semente) s = (s * 31 + ch.charCodeAt(0)) | 0;
    let html = '';
    for (let i = 0; i < 44; i++) html += `<i style="width:${1 + Math.floor(hash(s + i * 97) * 3.4)}px"></i>`;
    barras.innerHTML = html;
  }
  function atualizaPedido() {
    const d = dados();
    $('#c-nome').textContent = d.nome || '—';
    $('#c-empresa').textContent = d.empresa || '—';
    $('#c-prazo').textContent = d.prazo || 'A combinar';
    $('#c-cod').textContent = CODIGOS[d.tipo] || '???';
    $('#c-tipo').textContent = d.tipo || 'Seu site';
    desenhaBarras(d.nome + voo + d.tipo);
    const texto = encodeURIComponent(mensagem(d));
    const numero = String(CONFIG.whatsapp || '').replace(/\D/g, '');
    bZap.href = numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
    bDirect.href = `https://ig.me/m/${CONFIG.instagram}`;
    if (d.nome) erroNome.hidden = true;
  }
  form.addEventListener('input', atualizaPedido);
  form.addEventListener('change', atualizaPedido);
  form.addEventListener('submit', (e) => e.preventDefault());

  const toast = $('#toast');
  let toastT = 0;
  function aviso(txt) {
    toast.textContent = txt;
    toast.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove('on'), 3800);
  }
  function exigeNome(e) {
    if (campo('nome').value.trim()) return true;
    e.preventDefault();
    erroNome.hidden = false;
    campo('nome').focus();
    return false;
  }
  function carimba() {
    cartao.classList.remove('carimbado');
    void cartao.offsetWidth;
    cartao.classList.add('carimbado');
  }
  bZap.addEventListener('click', (e) => {
    if (!exigeNome(e)) return;
    atualizaPedido();
    carimba();
    aviso('Abrindo o WhatsApp com a sua mensagem.');
  });
  bDirect.addEventListener('click', (e) => {
    if (!exigeNome(e)) return;
    const texto = mensagem(dados());
    const copiado = () => aviso(`Mensagem copiada. Cole no direct da @${CONFIG.instagram}.`);
    const reserva = () => {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      if (ok) copiado();
      else aviso(`Abra o direct da @${CONFIG.instagram} e conte sobre o seu projeto.`);
    };
    try {
      navigator.clipboard.writeText(texto).then(copiado, reserva);
    } catch (err) {
      reserva();
    }
    carimba();
  });

  /* ══ RODAPÉ · um jatinho escreve MACH no céu ══ */
  (function jatinho() {
    const ceu = $('#ceu'), svg = $('svg', ceu), NS = 'http://www.w3.org/2000/svg';
    // O voo, trecho a trecho: 0 = voando sem fumaça, 1 = fumaça clara, 2 = fumaça laranja (o Λ)
    const ROTA = [
      ['M-110 255 Q-20 305 60 240', 0],
      ['M60 240 L60 60 L145 172 L230 60 L230 240', 1],
      ['M230 240 Q260 284 290 240', 0],
      ['M290 240 L375 60 L460 240', 2],
      ['M460 240 C520 330 770 150 690 60', 0],
      ['M690 60 L566 60 Q520 60 520 106 L520 194 Q520 240 566 240 L690 240', 1],
      ['M690 240 C745 300 700 15 750 60', 0],
      ['M750 60 L750 240', 1],
      ['M750 240 Q698 200 750 150', 0],
      ['M750 150 L920 150', 1],
      ['M920 150 Q978 108 920 60', 0],
      ['M920 60 L920 240', 1],
      ['M920 240 Q965 312 1130 185', 0],
    ];
    const trechos = [];
    let total = 0;
    const caminho = (d, cls) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      if (cls) p.setAttribute('class', cls);
      svg.appendChild(p);
      return p;
    };
    ROTA.forEach(([d, tipo]) => {
      const fumaca = tipo ? caminho(d, 'fumaca' + (tipo === 2 ? ' quente' : '')) : null;
      const linha = caminho(d, tipo ? 'tr' + (tipo === 2 ? ' quente' : '') : '');
      const len = linha.getTotalLength();
      if (tipo) [fumaca, linha].forEach((p) => { p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
      trechos.push({ linha, fumaca, len, em: total, fuma: !!tipo });
      total += len;
    });
    const jato = caminho('M17 0 L4 -2.4 L-3 -12 L-7.5 -12 L-3.6 -2.4 L-10 -2.2 L-13 -6.5 L-16 -6.5 L-14.4 0 L-16 6.5 L-13 6.5 L-10 2.2 L-3.6 2.4 L-7.5 12 L-3 12 L4 2.4 Z', 'jato');
    let t0 = 0, voando = false, pronto = false, rumo = 0;
    function desenha(dist) {
      for (const g of trechos) {
        if (!g.fuma) continue;
        const off = g.len - clamp(dist - g.em, 0, g.len);
        g.linha.style.strokeDashoffset = off;
        g.fumaca.style.strokeDashoffset = off;
      }
    }
    function voa(agora) {
      if (!voando) return;
      const u = clamp((agora - t0) / 6200), dist = u * total;
      let i = 0;
      while (i < trechos.length - 1 && dist > trechos[i].em + trechos[i].len) i++;
      const g = trechos[i], d = clamp(dist - g.em, 0, g.len);
      const a = g.linha.getPointAtLength(Math.max(0, d - 2)), b = g.linha.getPointAtLength(Math.min(g.len, d + 2));
      const quer = Math.atan2(b.y - a.y, b.x - a.x);
      rumo += Math.atan2(Math.sin(quer - rumo), Math.cos(quer - rumo)) * 0.3;
      const p = g.linha.getPointAtLength(d);
      jato.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(rumo * 57.2958).toFixed(1)}) scale(1.5)`);
      jato.style.opacity = 1;
      desenha(dist);
      if (u < 1) requestAnimationFrame(voa);
      else { voando = false; pronto = true; jato.style.opacity = 0; }
    }
    function decola() {
      if (voando) return;
      desenha(0);
      rumo = 0.5;
      voando = true;
      pronto = false;
      t0 = performance.now();
      requestAnimationFrame(voa);
    }
    if (reduz) { desenha(total); return; }
    new IntersectionObserver((en) => {
      if (en[0].isIntersecting) { if (!pronto) decola(); }
      else if (!voando) { pronto = false; desenha(0); }
    }, { threshold: 0.55 }).observe(ceu);
    ceu.addEventListener('click', () => { if (!voando) decola(); });
  })();

  /* ── início ── */
  function iniciar() {
    medir();
    redimensionaProjetos();
    io.observe(barreira);
    io.observe(video);
    io.observe(tilt);
    io.observe(demo);
    if (window.scrollY >= M.barreira) boomFeito = true;
    atualizaPedido();
    atualizaTrilho();
    aoRolar();
    if (reduz) desenhaProjetosParados();
    else requestAnimationFrame(lacoProjetos);
  }
  iniciar();
  // a altura da página muda quando as fontes chegam ou quando a abertura 3D vira imagem estática
  if ('ResizeObserver' in window) new ResizeObserver(() => { medir(); agenda(); }).observe(main);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { medir(); aoRolar(); });
  window.addEventListener('load', () => { medir(); redimensionaProjetos(); if (reduz) desenhaProjetosParados(); aoRolar(); });
  window.addEventListener('resize', () => {
    medir();
    redimensionaProjetos();
    if (reduz) desenhaProjetosParados();
    atualizaTrilho();
    agenda();
  });
})();
