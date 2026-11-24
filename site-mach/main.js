/* MACH Estúdio — site-vitrine (sem back-end)
   ─────────────────────────────────────────────
   CONFIGURAÇÃO: coloque o número de WhatsApp com DDI + DDD, só dígitos.
   Ex.: '5511999998888'. Vazio = o WhatsApp abre e a pessoa escolhe o contato. */
const CONFIG = {
  whatsapp: '5511939045618',
  instagram: 'mach.sites',
};

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
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
  const etapas = $('#etapas');
  let M = {};
  function medir() {
    const y = window.scrollY;
    const top = (el) => el.getBoundingClientRect().top + y;
    M = {
      vh: window.innerHeight,
      probTop: top(problema),
      probH: problema.offsetHeight,
      barreira: top(barreira) - window.innerHeight * 0.55,
      fim: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
    };
  }

  /* ── medidor de Mach (a rolagem é o acelerador) ── */
  const elMach = $('#mach'), elVel = $('#vel'), elEstado = $('#estado'), medidor = $('#medidor');
  const boomEl = $('#boom');
  let machAtual = 0.6, boomFeito = false, ultimoY = window.scrollY;
  const fmt = new Intl.NumberFormat('pt-BR');

  function machDe(y) {
    if (y < M.barreira) return 0.6 + 0.4 * clamp(y / Math.max(1, M.barreira));
    return 1 + 1.2 * clamp((y - M.barreira) / Math.max(1, M.fim - M.barreira));
  }

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
    machAtual = m;
    elMach.textContent = m.toFixed(2);
    elVel.textContent = fmt.format(Math.round(m * VEL_SOM));
    const sup = m >= 1;
    elEstado.textContent = sup ? 'Supersônico' : m >= 0.8 ? 'Transônico' : 'Subsônico';
    medidor.classList.toggle('super', sup);
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
      `<p class="tpl-h">Eleve seu negócio<br><em>ao próximo nível</em></p>` +
      `<p class="tpl-sub">Soluções inovadoras e<br>tecnologia de ponta</p>` +
      `<span class="tpl-btn">Comece agora →</span>` +
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

  /* ── como funciona: rota preenchida pela rolagem ── */
  const passos = $$('#etapas li');
  function atualizaRota() {
    const r = etapas.getBoundingClientRect();
    const centro = M.vh * 0.6;
    etapas.style.setProperty('--p', clamp((centro - r.top) / Math.max(1, r.height)).toFixed(3));
    passos.forEach((li) => li.classList.toggle('on', li.getBoundingClientRect().top < centro));
  }

  /* ── laço principal de rolagem ── */
  function aoRolar() {
    const y = window.scrollY;
    nav.classList.toggle('solida', y > 30);
    atualizaMedidor(y);
    atualizaProblema(y);
    atualizaRota();
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
  window.addEventListener('resize', () => {
    medir();
    redimensionaCeu();
    agenda();
  });

  /* ── céu da abertura: escoamento de ar + ondas de pressão ── */
  const ceu = $('#ceu');
  const ctx = ceu.getContext('2d');
  const jato = $('#jato');
  let CW = 0, CH = 0, DPR = 1, parts = [], ceuVisivel = true, ponteiro = { x: 0.5, y: 0.5, alvoX: 0.5, alvoY: 0.5 };
  function redimensionaCeu() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.75);
    CW = ceu.clientWidth;
    CH = ceu.clientHeight;
    ceu.width = Math.round(CW * DPR);
    ceu.height = Math.round(CH * DPR);
    const n = Math.round(clamp((CW * CH) / 4200, 90, 320));
    parts = Array.from({ length: n }, () => ({ x: Math.random() * CW, y: Math.random() * CH, d: Math.random() }));
  }
  function bicoDoJato() {
    const r = jato.getBoundingClientRect();
    const h = ceu.getBoundingClientRect();
    // o bico do Λ fica em (54, 0) num viewBox de 148 × 236 que começa em (−20, −24)
    return { x: r.left - h.left + (74 / 148) * r.width, y: r.top - h.top + (24 / 236) * r.height, esc: r.height / 236 };
  }
  let tAnt = performance.now(), relogio = 0;
  function desenhaCeu(agora) {
    const dt = clamp((agora - tAnt) / 1000, 0, 0.05);
    tAnt = agora;
    relogio += dt;
    ponteiro.x = lerp(ponteiro.x, ponteiro.alvoX, 0.06);
    ponteiro.y = lerp(ponteiro.y, ponteiro.alvoY, 0.06);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, CW, CH);

    // horizonte curvo (a 15 km já dá para ver a curvatura)
    const R = Math.max(CW, CH) * 2.2;
    const hy = CH + R - CH * 0.1;
    const g = ctx.createRadialGradient(CW * 0.5, hy, R * 0.985, CW * 0.5, hy, R * 1.03);
    g.addColorStop(0, 'rgba(70,120,200,0.20)');
    g.addColorStop(0.5, 'rgba(70,120,200,0.06)');
    g.addColorStop(1, 'rgba(70,120,200,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, CH * 0.6, CW, CH * 0.4);
    ctx.strokeStyle = 'rgba(140,180,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(CW * 0.5, hy, R, Math.PI * 1.3, Math.PI * 1.7);
    ctx.stroke();

    // escoamento: quanto mais rápido (Mach), mais longos os riscos
    const vel = 0.55 + machAtual * 0.9;
    const px = (ponteiro.x - 0.5) * 40;
    ctx.lineCap = 'round';
    for (const p of parts) {
      const vy = (90 + 1100 * p.d * p.d) * vel;
      p.y += vy * dt;
      if (p.y - vy * 0.08 > CH) {
        p.y = -Math.random() * 60;
        p.x = Math.random() * CW;
        p.d = Math.random();
      }
      const x = p.x + px * p.d;
      const len = vy * (0.02 + 0.03 * p.d) * machAtual;
      ctx.strokeStyle = `rgba(214,226,240,${0.03 + 0.2 * p.d * p.d})`;
      ctx.lineWidth = 0.6 + 1.2 * p.d;
      ctx.beginPath();
      ctx.moveTo(x, p.y - len);
      ctx.lineTo(x, p.y);
      ctx.stroke();
    }

    // ondas de pressão saindo do bico: com M < 1 elas se acumulam à frente
    const bico = bicoDoJato();
    const c = 150 * Math.max(0.6, bico.esc * 1.4);
    const m = Math.min(machAtual, 0.97);
    const periodo = 0.42;
    const idadeMax = 2.6;
    for (let k = 0; k < 8; k++) {
      const idade = (relogio % periodo) + k * periodo;
      if (idade <= 0 || idade > idadeMax) continue;
      const r = c * idade;
      const cy = bico.y + m * c * idade; // o ar fica para trás enquanto o jato sobe
      const a = 0.32 * (1 - idade / idadeMax);
      ctx.strokeStyle = `rgba(255,140,80,${a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bico.x, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // leve inclinação do jato seguindo o ponteiro
    jato.firstElementChild.style.transform = `translate(${(ponteiro.x - 0.5) * 18}px, ${(ponteiro.y - 0.5) * 10}px) rotate(${(ponteiro.x - 0.5) * 6}deg)`;
  }
  function lacoCeu(agora) {
    if (ceuVisivel && !document.hidden) desenhaCeu(agora);
    else tAnt = agora;
    requestAnimationFrame(lacoCeu);
  }
  window.addEventListener('pointermove', (e) => {
    ponteiro.alvoX = e.clientX / window.innerWidth;
    ponteiro.alvoY = e.clientY / window.innerHeight;
  }, { passive: true });

  /* ── observadores (só anima o que está na tela) ── */
  const io = new IntersectionObserver((entradas) => {
    for (const en of entradas) {
      const el = en.target;
      if (el === ceu) ceuVisivel = en.isIntersecting;
      else if (el.classList.contains('proj')) el._visivel = en.isIntersecting;
      else if (el === barreira && en.isIntersecting && en.intersectionRatio > 0.25) ligaBarreira();
      else if (el.id === 'video') controlaVideo(en.isIntersecting);
      else if (el.id === 'pedido' || el.classList.contains('rodape')) {
        el._dentro = en.isIntersecting;
        medidor.classList.toggle('esconde', !!($('#pedido')._dentro || $('.rodape')._dentro));
      }
      else if (el.classList.contains('revela') && en.isIntersecting) el.classList.remove('fora');
    }
  }, { threshold: [0, 0.25, 0.5] });

  /* ── a barreira: cone desenhado + números ── */
  let barreiraLigada = false;
  if (!reduz) barreira.classList.add('anima');
  function ligaBarreira() {
    if (barreiraLigada) return;
    barreiraLigada = true;
    barreira.classList.add('on');
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

  /* ── o filme ── */
  const video = $('#video'), bPlay = $('#v-play'), bSom = $('#v-som');
  let pausadoPeloUsuario = false;
  function controlaVideo(visivel) {
    if (visivel && !pausadoPeloUsuario && !reduz) video.play().catch(() => {});
    if (!visivel) video.pause();
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

  /* ── hangar: três conceitos desenhados em tempo real ── */
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
    // haste e base
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
    // anel
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
    // reflexo no chão
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
    // órbitas
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
    // mostrador com a hora real
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
  let tProj = 0;
  function lacoProjetos(agora) {
    tProj = agora / 1000;
    for (const p of projetos) {
      if (!p.el._visivel || document.hidden) continue;
      p.mx = lerp(p.mx, p.alvoX, 0.08);
      p.my = lerp(p.my, p.alvoY, 0.08);
      p.foco = lerp(p.foco, p.alvoFoco, 0.06);
      p.c.setTransform(DPR, 0, 0, DPR, 0, 0);
      DESENHOS[p.tipo](p, reduz ? 0 : tProj);
    }
    if (!reduz) requestAnimationFrame(lacoProjetos);
  }
  function desenhaProjetosParados() {
    for (const p of projetos) {
      p.c.setTransform(DPR, 0, 0, DPR, 0, 0);
      DESENHOS[p.tipo](p, 0);
    }
  }

  /* ── pedido: cartão de embarque + WhatsApp / direct ── */
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

  /* ── início ── */
  function iniciar() {
    medir();
    redimensionaCeu();
    redimensionaProjetos();
    io.observe(ceu);
    io.observe(barreira);
    io.observe(video);
    io.observe($('#pedido'));
    io.observe($('.rodape'));
    if (window.scrollY >= M.barreira) boomFeito = true;
    atualizaPedido();
    aoRolar();
    if (reduz) {
      desenhaCeu(performance.now());
      desenhaProjetosParados();
      ligaBarreira();
    } else {
      requestAnimationFrame(lacoCeu);
      requestAnimationFrame(lacoProjetos);
    }
  }
  iniciar();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { medir(); aoRolar(); });
  window.addEventListener('load', () => { medir(); redimensionaProjetos(); aoRolar(); });
  window.addEventListener('resize', () => {
    redimensionaProjetos();
    if (reduz) { desenhaCeu(performance.now()); desenhaProjetosParados(); }
  });
})();
