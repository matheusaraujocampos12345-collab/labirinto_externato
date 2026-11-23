/* Casca & Miolo — motor do site.
   Tudo o que se mexe é função de (tempo, rolagem). No navegador, o tempo é o relógio
   e a rolagem é a do dedo. No modo ?captura=1, quem manda é window.__quadro(t, y, vel),
   o que permite filmar quadro a quadro sem engasgo. */
(function () {
  'use strict';
  const qs = location.search;
  const captura = /[?&]captura=1/.test(qs);
  const reduzir = !captura && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (captura) root.classList.add('captura');
  if (/[?&]paleta=1/.test(qs)) root.classList.add('modo-paleta');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const saida = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const lerp = (a, b, x) => a + (b - a) * x;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const topoDoc = (el) => el.getBoundingClientRect().top + window.scrollY;
  const setTxt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };

  const cenas = [];
  const S = { t: 0, y: 0, vel: 0, vh: innerHeight, vw: innerWidth };

  // ---------- relógio da padaria ----------
  // No modo de captura o "agora" é fixo: quarta-feira, 15h27min30s (+ o tempo do quadro).
  const BASE_CAPTURA = new Date(2026, 10, 25, 15, 27, 30).getTime();
  const agora = () => new Date(captura ? BASE_CAPTURA + S.t * 1000 : Date.now());
  const FORNADAS = [
    ['05:40', 'Pão francês', 180], ['06:20', 'Pão francês', 180], ['07:00', 'Croissant', 36], ['07:40', 'Pão francês', 150],
    ['08:20', 'Fermentação natural', 24], ['09:00', 'Pão de queijo', 120], ['09:40', 'Pão francês', 150], ['10:20', 'Baguete', 30],
    ['11:00', 'Broa de milho', 40], ['11:40', 'Pão francês', 150], ['12:20', 'Fermentação natural', 24], ['13:00', 'Pão de queijo', 120],
    ['13:40', 'Pão francês', 150], ['14:20', 'Bolo de fubá', 6], ['15:00', 'Pão de queijo', 120], ['15:40', 'Fermentação natural', 24],
    ['16:20', 'Pão francês e sonho', 150], ['17:00', 'Baguete', 30], ['17:40', 'Pão francês', 180], ['18:20', 'Pão de queijo', 120],
    ['19:00', 'Pão francês', 180],
  ].map(([h, nome, qtd]) => { const [hh, mm] = h.split(':').map(Number); return { min: hh * 60 + mm, h: `${hh}h${String(mm).padStart(2, '0')}`, nome, qtd }; });
  const CICLO = 40 * 60;
  function estadoFornada(d) {
    const s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    let i = FORNADAS.findIndex((f) => f.min * 60 > s);
    let falta, amanha = false;
    if (i < 0) { i = 0; amanha = true; falta = 24 * 3600 - s + FORNADAS[0].min * 60; }
    else falta = FORNADAS[i].min * 60 - s;
    return { i, prox: FORNADAS[i], falta, amanha, frac: clamp(1 - falta / CICLO, 0, 1), s };
  }
  const HORARIO = { 0: [7, 13], 1: [6, 20], 2: [6, 20], 3: [6, 20], 4: [6, 20], 5: [6, 20], 6: [6, 18] };
  function estadoLoja(d) {
    const [a, f] = HORARIO[d.getDay()];
    const h = d.getHours() + d.getMinutes() / 60;
    return { aberto: h >= a && h < f, abre: a, fecha: f };
  }
  const mmss = (s) => { s = Math.max(0, Math.floor(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const hhmm = (d) => `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;

  // ---------- 1. primeira tela ----------
  const hero = $('.hero'), cena = $('.cena');
  let forno = null;
  try { forno = window.Forno && cena ? new window.Forno(cena) : null; } catch (e) { console.warn(e); }
  if (!forno || !forno.ok) root.classList.add('sem-webgl');
  const linhas = $$('.hero h1 .l > span');
  const rotulo = $('.hero .rotulo'), apoio = $('.hero .apoio'), rolar = $('.rolar');
  const chipMin = $('[data-fornada-min]'), chipPrep = $('[data-fornada-prep]');
  let heroTopo = 0, heroCurso = 1;
  cenas.push({
    medir() {
      heroTopo = topoDoc(hero);
      heroCurso = Math.max(1, hero.offsetHeight - S.vh);
      if (forno && forno.ok) {
        const r = cena.getBoundingClientRect();
        const dpr = captura ? (window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, 2);
        forno.tamanho(r.width, r.height, dpr);
        const pin = $('.hero-pin').getBoundingClientRect();
        const ultimo = apoio.offsetParent ? apoio : $('.hero h1');
        forno.textoFim = ultimo.getBoundingClientRect().bottom - pin.top;
        forno.fadeMin = forno.textoFim + (apoio.offsetParent ? 70 : 40);
      }
    },
    atualizar(s) {
      const f = estadoFornada(agora());
      const longeChip = f.falta >= 90 * 60;
      setTxt(chipPrep, longeChip ? 'às' : 'em');
      setTxt(chipMin, longeChip ? f.prox.h : `${Math.max(1, Math.floor(f.falta / 60))} min`);
      const prog = clamp((s.y - heroTopo) / heroCurso, 0, 1);
      if (s.y > heroTopo + heroCurso + s.vh) return;
      linhas.forEach((el, i) => {
        const e = suave(0.15 + i * 0.12, 1.05 + i * 0.12, s.t);
        const sobe = prog * s.vh * (0.10 + i * 0.035);
        el.style.transform = `translate3d(0, ${((1 - e) * 105).toFixed(2)}%, 0)`;
        el.parentNode.style.transform = `translate3d(0, ${(-sobe).toFixed(2)}px, 0)`;
        el.parentNode.style.opacity = (1 - suave(0.30 + i * 0.05, 0.80, prog)).toFixed(3);
      });
      const entra = suave(0.7, 1.6, s.t);
      rotulo.style.opacity = (entra * (1 - suave(0.10, 0.45, prog))).toFixed(3);
      rotulo.style.transform = `translate3d(0, ${(-prog * s.vh * 0.08).toFixed(2)}px, 0)`;
      apoio.style.opacity = (entra * (1 - suave(0.15, 0.50, prog))).toFixed(3);
      apoio.style.transform = `translate3d(0, ${((1 - entra) * 14 - prog * s.vh * 0.16).toFixed(2)}px, 0)`;
      if (rolar) {
        rolar.style.opacity = (entra * (1 - suave(0.02, 0.12, prog))).toFixed(3);
        rolar.style.setProperty('--fase', ((s.t * 0.6) % 1).toFixed(3));
      }
      if (forno && forno.ok) {
        const vapor = suave(0.0, 1.4, s.t) * (1 + prog * 0.35);
        forno.desenhar(s.t + 20, prog, s.vel, s.y, vapor);
      }
    },
  });

  // ---------- navegação: muda de cor conforme a seção ----------
  const nav = $('.nav');
  let faixas = [];
  cenas.push({
    medir() { faixas = $$('main > section, .rodape').map((el) => ({ top: topoDoc(el), tema: el.dataset.tema || 'escuro' })); },
    atualizar(s) {
      let tema = 'hero';
      for (const f of faixas) if (f.top <= s.y + 34) tema = f.tema;
      if (nav.dataset.tema !== tema) nav.dataset.tema = tema;
    },
  });

  // ---------- 2. vitrine que se monta ----------
  const vitrine = $('.vitrine'), estante = $('.estante');
  if (window.Vitrine) window.Vitrine.montar(estante);
  const itens = $$('.item', estante), vidros = $$('.vidro', estante);
  const contagem = $('[data-contagem]'), horaAgora = $('[data-hora-agora]');
  let vitTopo = 0, vitCurso = 1;
  cenas.push({
    medir() { vitTopo = topoDoc(vitrine); vitCurso = Math.max(1, vitrine.offsetHeight - S.vh); },
    atualizar(s) {
      if (s.y < vitTopo - s.vh * 1.2 || s.y > vitTopo + vitCurso + s.vh) return;
      const p = reduzir ? 1 : clamp((s.y - vitTopo) / vitCurso, 0, 1);
      vidros.forEach((v, i) => { v.style.transform = `scaleX(${suave(0.0 + i * 0.05, 0.12 + i * 0.05, p).toFixed(4)})`; });
      let n = 0;
      itens.forEach((el, i) => {
        const ini = 0.06 + i * 0.072, dur = 0.14;
        const e = clamp((p - ini) / dur, 0, 1);
        const pos = saida(e), gira = saida(clamp(e * 1.3, 0, 1));
        const lado = Math.floor(i / 3) % 2 === 0 ? -1 : 1;
        const x = lerp(lado * 80, 0, pos), y = lerp(-52, 0, pos), r = lerp(lado * -14, 0, gira);
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${r.toFixed(2)}deg)`;
        el.style.opacity = suave(0, 0.35, e).toFixed(3);
        const cap = el.querySelector('figcaption');
        cap.style.opacity = suave(0.55, 1, e).toFixed(3);
        cap.style.transform = `translate3d(0, ${((1 - suave(0.55, 1, e)) * 8).toFixed(2)}px, 0)`;
        if (e > 0.6 && !el.classList.contains('acabou')) n++;
      });
      setTxt(contagem, String(n));
      setTxt(horaAgora, hhmm(agora()));
    },
  });

  // ---------- 3. próxima fornada ----------
  const relogio = $('.relogio'), arco = $('.arco'), brasa = $('.brasa'), tiques = $('.tiques');
  const fitas = $$('.relogio .fita'), segEl = $('[data-fornada-seg]'), minEl = $('.relogio .min');
  const emEl = $('.relogio .em'), horaLonge = $('.relogio .hora-longe');
  const horaEl = $('[data-fornada-hora]'), nomeEl = $('[data-fornada-nome]'), qtdEl = $('[data-fornada-qtd]');
  const listaF = $('.fornadas');
  const NT = 40;
  const linhasT = [];
  for (let k = 0; k < NT; k++) {
    const a = (k / NT) * Math.PI * 2 - Math.PI / 2, longo = k % 10 === 0;
    const r1 = longo ? 136 : 140, r2 = 150;
    const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    l.setAttribute('x1', (160 + Math.cos(a) * r1).toFixed(2)); l.setAttribute('y1', (160 + Math.sin(a) * r1).toFixed(2));
    l.setAttribute('x2', (160 + Math.cos(a) * r2).toFixed(2)); l.setAttribute('y2', (160 + Math.sin(a) * r2).toFixed(2));
    l.setAttribute('stroke-width', longo ? 2 : 1.2);
    tiques.appendChild(l); linhasT.push(l);
  }
  fitas.forEach((f) => { f.innerHTML = Array.from({ length: 11 }, (_, i) => `<span>${i % 10}</span>`).join(''); });
  let relTopo = 0, listaChave = '';
  function desenharLista(f) {
    const chave = `${f.i}-${Math.floor(f.falta / 60)}-${f.amanha}`;
    if (chave === listaChave) return;
    listaChave = chave;
    const ini = clamp(f.i - 2, 0, FORNADAS.length - 5);
    listaF.innerHTML = FORNADAS.slice(ini, ini + 5).map((x, k) => {
      const j = ini + k;
      let classe = '', est = '';
      if (f.amanha || j > f.i) {
        const em = Math.round((x.min * 60 - f.s) / 60);
        est = f.amanha ? 'amanhã' : em >= 60 ? `em ${Math.floor(em / 60)}h${String(em % 60).padStart(2, '0')}` : `em ${em} min`;
      } else if (j === f.i) { classe = 'agora'; est = 'no forno'; }
      else { classe = 'passou'; est = 'saiu'; }
      return `<li class="${classe}"><span class="f-hora">${x.h}</span><span class="f-nome">${x.nome}</span><span class="f-est">${est}</span></li>`;
    }).join('');
  }
  cenas.push({
    medir() { relTopo = topoDoc(relogio); },
    atualizar(s) {
      const f = estadoFornada(agora());
      desenharLista(f);
      setTxt(horaEl, f.prox.h);
      setTxt(nomeEl, f.prox.nome.toLowerCase());
      setTxt(qtdEl, `${f.prox.qtd} unidades`);
      // de madrugada (mais de 90 min de espera) o relógio mostra o horário, não os minutos
      const longe = f.falta >= 90 * 60;
      relogio.classList.toggle('longe', longe);
      setTxt(emEl, longe ? 'primeira fornada' : 'sai em');
      setTxt(horaLonge, f.prox.h);
      setTxt(segEl, longe ? (f.amanha ? 'amanhã' : 'hoje') : mmss(f.falta));
      if (s.y < relTopo - s.vh * 1.3 || s.y > relTopo + s.vh * 1.2) return;
      const e = reduzir ? 1 : suave(s.vh * 0.95, s.vh * 0.30, relTopo - s.y);
      const eArco = suave(0.25, 1, e);
      const frac = f.frac * eArco;
      arco.setAttribute('stroke-dasharray', `${frac.toFixed(4)} 1`);
      const ang = frac * Math.PI * 2 - Math.PI / 2;
      brasa.setAttribute('transform', `translate(${(160 + Math.cos(ang) * 128).toFixed(2)} ${(160 + Math.sin(ang) * 128).toFixed(2)})`);
      brasa.style.opacity = (longe ? 0 : eArco * (0.85 + 0.15 * Math.sin(s.t * 5.3))).toFixed(3);
      linhasT.forEach((l, k) => {
        const vis = suave(k / NT - 0.04, k / NT + 0.02, e * 1.06);
        const aceso = k / NT < frac ? 1 : 0.32;
        l.style.opacity = (vis * aceso).toFixed(3);
      });
      // número que rola como um contador mecânico
      const minutos = Math.floor(f.falta / 60);
      const resto = f.falta - minutos * 60;
      let V = minutos - suave(0.45, 0, resto);
      V = V * suave(0.15, 1, e);
      const un = V - 10 * Math.floor(V / 10);
      const dez = Math.floor(V / 10) + clamp(un - 9, 0, 1);
      fitas[1].style.transform = `translate3d(0, ${(-un).toFixed(4)}em, 0)`;
      fitas[0].style.transform = `translate3d(0, ${(-dez).toFixed(4)}em, 0)`;
      fitas[0].parentNode.style.display = minutos >= 10 || V >= 9.5 ? '' : 'none';
      minEl.setAttribute('aria-label', `${minutos} minutos`);
    },
  });
  const avise = $('.avise');
  avise.addEventListener('click', async () => {
    const on = avise.getAttribute('aria-pressed') !== 'true';
    avise.setAttribute('aria-pressed', String(on));
    const f = estadoFornada(agora());
    const quando = new Date(agora().getTime() + Math.max(0, f.falta - 300) * 1000);
    setTxt($('[data-avise]'), on ? `Aviso ligado para as ${hhmm(quando)}` : 'Me avise 5 min antes');
    clearTimeout(avise._t);
    if (on && 'Notification' in window) {
      try { if (Notification.permission === 'default') await Notification.requestPermission(); } catch (e) { /* sem permissão */ }
      avise._t = setTimeout(() => {
        if (Notification.permission === 'granted') new Notification('Casca & Miolo', { body: `${f.prox.nome} sai do forno em 5 minutos.` });
      }, Math.max(0, f.falta - 300) * 1000);
    }
  });

  // ---------- 4. da casca ao miolo ----------
  const corte = $('.corte'), gAlv = $('.alveolos'), marcas = $$('.marca-n'), paleta = $('.paleta'), barras = $$('.paleta li');
  const alv = [];
  (function gerarAlveolos() {
    let semente = 214;
    const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };
    const NS = 'http://www.w3.org/2000/svg';
    // fibras do miolo: o forno estica a massa de baixo para cima
    const fibras = document.createElementNS(NS, 'g');
    fibras.setAttribute('stroke', '#CFAB86'); fibras.setAttribute('fill', 'none'); fibras.setAttribute('opacity', '.35');
    let d = '';
    for (let k = 0; k < 46; k++) {
      const x0 = 60 + (k / 45) * 280 + (rnd() - .5) * 8, y0 = 214;
      const ang = ((x0 - 200) / 160) * 1.1;
      const len = 60 + rnd() * 90;
      const x1 = x0 + Math.sin(ang) * len * 0.5, y1 = y0 - len * 0.55;
      const x2 = x0 + Math.sin(ang) * len, y2 = y0 - len;
      d += `M${x0.toFixed(1)} ${y0}Q${(x1 + (rnd() - .5) * 14).toFixed(1)} ${y1.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }
    fibras.innerHTML = `<path d="${d}" stroke-width=".7"/>`;
    gAlv.appendChild(fibras);
    const blob = (r, ry, n) => {
      const pts = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2, f = 0.72 + rnd() * 0.5;
        pts.push([Math.cos(a) * r * f, Math.sin(a) * ry * f]);
      }
      let p = `M${((pts[0][0] + pts[n - 1][0]) / 2).toFixed(2)} ${((pts[0][1] + pts[n - 1][1]) / 2).toFixed(2)}`;
      for (let k = 0; k < n; k++) {
        const c = pts[k], nx = pts[(k + 1) % n];
        p += `Q${c[0].toFixed(2)} ${c[1].toFixed(2)} ${((c[0] + nx[0]) / 2).toFixed(2)} ${((c[1] + nx[1]) / 2).toFixed(2)}`;
      }
      return p + 'Z';
    };
    let tent = 0;
    while (alv.length < 150 && tent++ < 6000) {
      const x = 40 + rnd() * 320, y = 62 + rnd() * 156;
      const dx = (x - 200) / 158, dy = (y - 214) / 148;
      const dentro = dx * dx + dy * dy;
      if (dentro > 0.84 || y > 210) continue;
      const centro = 1 - Math.sqrt(dentro);
      const q = rnd();
      const r = q < 0.62 ? 1.1 + rnd() * 2.2 : q < 0.9 ? 3 + rnd() * 4 : 6 + rnd() * (4 + centro * 10);
      if (alv.some((a) => Math.hypot(a.x - x, a.y - y) < a.r + r + 1.8)) continue;
      const g = document.createElementNS(NS, 'g');
      const ry = r * (1.1 + rnd() * 0.5), rot = ((x - 200) / 160) * 25 + (rnd() - 0.5) * 30;
      const forma = blob(r, ry, r > 3 ? 7 : 5);
      g.innerHTML = `<path d="${forma}" fill="#C9A47A" opacity=".55"/>`
        + `<path d="${forma}" transform="translate(0 ${(ry * 0.22).toFixed(2)}) scale(.82)" fill="#E9D9BD"/>`
        + (r > 2.5 ? `<path d="M${(-r * 0.6).toFixed(2)} ${(ry * 0.62).toFixed(2)}Q0 ${(ry * 1.0).toFixed(2)} ${(r * 0.6).toFixed(2)} ${(ry * 0.62).toFixed(2)}" stroke="#FBF6EC" stroke-width=".8" fill="none" opacity=".85"/>` : '');
      gAlv.appendChild(g);
      alv.push({ x, y, r, rot, g, ini: rnd() * 0.5 + (1 - centro) * 0.18 });
    }
  })();
  let corteTopo = 0, paletaTopo = 0;
  cenas.push({
    medir() { corteTopo = topoDoc(corte); paletaTopo = topoDoc(paleta); },
    atualizar(s) {
      if (s.y < corteTopo - s.vh * 1.4 || s.y > paletaTopo + s.vh) return;
      const e = reduzir ? 1 : suave(s.vh * 0.92, s.vh * 0.18, corteTopo - s.y);
      alv.forEach((a) => {
        const k = saida(clamp((e - a.ini) / 0.3, 0, 1));
        a.g.setAttribute('transform', `translate(${a.x.toFixed(2)} ${a.y.toFixed(2)}) rotate(${a.rot.toFixed(1)}) scale(${k.toFixed(4)})`);
      });
      marcas.forEach((m, k) => { m.style.opacity = suave(0.55 + k * 0.08, 0.7 + k * 0.08, e).toFixed(3); });
      const ep = reduzir ? 1 : suave(s.vh * 0.98, s.vh * 0.45, paletaTopo - s.y);
      barras.forEach((b, k) => { b.style.transform = `scaleY(${saida(clamp((ep - k * 0.05) / 0.55, 0, 1)).toFixed(4)})`; });
    },
  });

  // ---------- 5. encomenda ----------
  const saco = $('.saco'), sacoPao = $('.saco-pao'), etiqueta = $('.etiqueta');
  let sacoTopo = 0;
  cenas.push({
    medir() { sacoTopo = topoDoc(saco); },
    atualizar(s) {
      if (Math.abs(sacoTopo - s.y) > s.vh * 1.6) return;
      const e = reduzir ? 1 : suave(s.vh * 1.0, s.vh * 0.25, sacoTopo - s.y);
      saco.style.transform = `translate3d(0, ${((1 - saida(e)) * 40).toFixed(2)}px, 0)`;
      sacoPao.setAttribute('transform', `translate(0 ${((1 - saida(suave(0.25, 1, e))) * 70).toFixed(2)})`);
      etiqueta.setAttribute('transform', `translate(164 132) rotate(${(8 + Math.sin(s.t * 1.4) * 2 * e).toFixed(2)} 0 0)`);
    },
  });

  // ---------- 6. mapa e horário ----------
  const mapaCaixa = $('.mapa-caixa'), rota = $('.rota'), onda = $('.voce-onda'), fumacas = $$('.fumaca-mapa path, .fumaca path');
  const tempoAPe = $('.tempo-a-pe'), statusEl = $('[data-status]'), statusBox = $('.status-loja');
  const diasLi = $$('.horario li');
  let mapaTopo = 0;
  cenas.push({
    medir() { mapaTopo = topoDoc(mapaCaixa); },
    atualizar(s) {
      const d = agora(), loja = estadoLoja(d);
      const st = loja.aberto ? `Aberto agora · fecha às ${loja.fecha}h` : `Fechado agora · abre às ${HORARIO[(d.getDay() + (d.getHours() >= loja.fecha ? 1 : 0)) % 7][0]}h`;
      setTxt(statusEl, st);
      statusBox.classList.toggle('fechado', !loja.aberto);
      diasLi.forEach((li) => li.classList.toggle('hoje', li.dataset.dias.split(',').includes(String(d.getDay()))));
      // fumaça da xícara e da chaminé do alfinete
      fumacas.forEach((p, k) => {
        const fase = (s.t * 0.45 + k * 0.37) % 1;
        p.style.strokeDasharray = '0.45 1';
        p.style.strokeDashoffset = (1 - fase * 1.45).toFixed(3);
        p.style.opacity = (Math.sin(fase * Math.PI) * 0.9).toFixed(3);
      });
      if (Math.abs(mapaTopo - s.y) > s.vh * 1.6) return;
      const e = reduzir ? 1 : suave(s.vh * 0.85, s.vh * 0.36, mapaTopo - s.y);
      rota.setAttribute('stroke-dasharray', `${saida(e).toFixed(4)} 1`);
      tempoAPe.style.opacity = suave(0.85, 1, e).toFixed(3);
      const fo = (s.t * 0.7) % 1;
      onda.setAttribute('r', (8 + fo * 14).toFixed(2));
      onda.style.opacity = ((1 - fo) * 0.35).toFixed(3);
    },
  });
  const copiar = $('[data-copiar]');
  copiar.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copiar.dataset.copiar); copiar.textContent = 'Endereço copiado'; }
    catch (e) { copiar.textContent = copiar.dataset.copiar; }
    setTimeout(() => { copiar.textContent = 'Copiar endereço'; }, 2400);
  });

  const rodape = $('.rodape');
  let rodTopo = 0;
  cenas.push({ medir() { rodTopo = topoDoc(rodape); }, atualizar() {} });

  // ---------- motor ----------
  function medir() {
    S.vh = innerHeight; S.vw = innerWidth;
    cenas.forEach((c) => c.medir && c.medir());
  }
  let alturaAnt = 0;
  function quadro() {
    const h = document.documentElement.scrollHeight;
    if (h !== alturaAnt) { alturaAnt = h; medir(); }
    cenas.forEach((c) => c.atualizar(S));
  }
  window.CM = { S, medir, FORNADAS };

  if (captura) {
    // O navegador só rola em pixel inteiro. Para a câmera andar liso, a fração que sobra
    // vira um deslocamento do conteúdo (e as partes presas na tela são compensadas).
    const moveis = [$('main'), $('.rodape')];
    const presos = $$('.hero-pin, .vitrine-pin');
    let ultimoT = null, ultimoY = 0;
    window.__quadro = function (t, y, vel) {
      moveis.concat(presos).forEach((el) => { el.style.translate = ''; });
      const yi = Math.floor(y);
      window.scrollTo(0, yi);
      const frac = window.scrollY === yi ? y - yi : 0;
      const yExato = window.scrollY + frac;
      if (vel == null) vel = ultimoT == null || t === ultimoT ? 0 : (yExato - ultimoY) / (t - ultimoT);
      ultimoT = t; ultimoY = yExato;
      S.t = t; S.y = yExato; S.vel = vel;
      quadro();
      if (frac > 0.001) {
        const estado = presos.map((el) => { const r = el.parentNode.getBoundingClientRect(); return r.top <= 0 && r.bottom >= innerHeight; });
        moveis.forEach((el) => { el.style.translate = `0 ${(-frac).toFixed(3)}px`; });
        presos.forEach((el, i) => { if (estado[i]) el.style.translate = `0 ${frac.toFixed(3)}px`; });
      }
      return yExato;
    };
    window.__altura = () => document.documentElement.scrollHeight;
    window.__marcos = () => ({
      vitrine: vitTopo, vitrineCurso: vitCurso, hero: heroTopo, heroCurso, relogio: relTopo, corte: corteTopo,
      paleta: paletaTopo, saco: sacoTopo, mapa: mapaTopo, rodape: rodTopo,
      fornada: topoDoc($('.fornada')), anatomia: topoDoc($('.anatomia')), encomenda: topoDoc($('.encomenda')), endereco: topoDoc($('.mapa')),
    });
    const pronto = () => { medir(); window.__quadro(3, 0, 0); requestAnimationFrame(() => { medir(); window.__quadro(3, 0, 0); window.__pronto = true; }); };
    document.fonts.ready.then(() => requestAnimationFrame(pronto));
    addEventListener('resize', () => { medir(); quadro(); });
    return;
  }

  let t0 = null, yAnt = scrollY, tAnt = 0, velS = 0;
  function laco(ms) {
    if (t0 == null) t0 = ms;
    const t = (ms - t0) / 1000;
    const dt = Math.max(1e-3, t - tAnt);
    const y = scrollY;
    velS += ((y - yAnt) / dt - velS) * Math.min(1, dt * 8);
    yAnt = y; tAnt = t;
    S.t = reduzir ? 3 + t * 0.0001 : t; S.y = y; S.vel = reduzir ? 0 : clamp(velS, -4000, 4000);
    quadro();
    requestAnimationFrame(laco);
  }
  document.fonts.ready.then(() => { medir(); requestAnimationFrame(laco); });
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(medir, 80); });
  addEventListener('load', medir);
})();
