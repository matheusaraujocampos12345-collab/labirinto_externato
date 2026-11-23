/* Padaria Quatro Horas — motor do site e primeira tela.
   Tudo o que se mexe é função de (tempo, rolagem). No navegador o tempo é o relógio e a
   rolagem é a do dedo. Em ?captura=1 quem manda é window.__quadro(t, y, vel): dá para filmar
   quadro a quadro, sempre igual. */
(function () {
  'use strict';
  const qs = location.search;
  const captura = /[?&]captura=1/.test(qs);
  const reduzir = !captura && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  if (captura) root.classList.add('captura');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const saida = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const lerp = (a, b, x) => a + (b - a) * x;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const topoDoc = (el) => el.getBoundingClientRect().top + scrollY;
  const setTxt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const cenas = [];
  const S = { t: 0, y: 0, vel: 0, vh: innerHeight, vw: innerWidth };

  // ---------- relógio da padaria ----------
  // Em ?captura=1 o "agora" é fixo: quarta-feira, 9 de dezembro de 2026, 15h47 (+ o tempo do quadro).
  const BASE = new Date(2026, 11, 9, 15, 47, 30).getTime();
  const agora = () => new Date(captura ? BASE + S.t * 1000 : Date.now());
  const FORNADAS = [
    [6, 'Pão francês e bisnaguinha'], [7, 'Pão francês e pão de leite'], [8, 'Pão francês'], [9, 'Pão de queijo'],
    [10, 'Pão francês e baguete'], [11, 'Pão francês'], [12, 'Pão francês e pão italiano'], [13, 'Pão francês'],
    [14, 'Pão francês e rosca de coco'], [15, 'Pão francês e broa de milho'], [16, 'Pão de queijo e sonho'],
    [17, 'Pão francês'], [18, 'Pão francês e baguete'], [19, 'Pão francês, a última do dia'],
  ].map(([h, nome]) => ({ h, nome }));
  const HORARIO = { 0: [7, 13], 1: [6, 20], 2: [6, 20], 3: [6, 20], 4: [6, 20], 5: [6, 20], 6: [6, 18] };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const dois = (n) => String(n).padStart(2, '0');
  const md = (d) => `${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
  const maisDias = (d, n) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() + n); return x; };

  // Natal: a chave e as datas ficam em js/natal.js
  const N = window.NATAL || { ligado: false };
  const forcaNatal = /[?&]natal=([01])/.exec(qs);
  function natalAtivo(d) {
    if (forcaNatal) return forcaNatal[1] === '1';
    if (N.ligado === true || N.ligado === false) return N.ligado;
    const x = md(d);
    return N.inicio <= N.fim ? x >= N.inicio && x <= N.fim : x >= N.inicio || x <= N.fim;
  }
  // horário de um dia: [abre, fecha] ou null (fechado). Na época de Natal valem os horários especiais.
  function horarioDo(d) {
    const x = md(d);
    if (natalAtivo(d) && N.horarios && x in N.horarios) return N.horarios[x];
    return HORARIO[d.getDay()];
  }
  // as fornadas de um dia respeitam o horário: só saem com a loja aberta
  function fornadasDoDia(d) {
    const h = horarioDo(d);
    return h ? FORNADAS.filter((f) => f.h >= h[0] && f.h < h[1]) : [];
  }
  function fornada(d) {
    const s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    const lista = fornadasDoDia(d);
    const i = lista.findIndex((f) => f.h * 3600 > s);
    if (i >= 0) return { lista, i, prox: lista[i], falta: lista[i].h * 3600 - s, amanha: false, outroDia: false, quando: 'hoje', s };
    for (let k = 1; k <= 7; k++) {
      const dia = maisDias(d, k), l = fornadasDoDia(dia);
      if (l.length) return { lista, i: lista.length, prox: l[0], proxLista: l, falta: k * 86400 - s + l[0].h * 3600, amanha: k === 1, outroDia: true, quando: k === 1 ? 'amanhã' : DIAS[dia.getDay()], s };
    }
    return { lista, i: lista.length, prox: FORNADAS[0], proxLista: FORNADAS, falta: 86400, amanha: true, outroDia: true, quando: 'amanhã', s };
  }
  // próxima fornada que traz um produto (para o cardápio: "sai às 16h")
  function proximaDe(produto, d) {
    const agoraMin = d.getHours() * 60 + d.getMinutes();
    for (let k = 0; k <= 7; k++) {
      const dia = k ? maisDias(d, k) : d;
      const f = fornadasDoDia(dia).find((x) => (k > 0 || x.h * 60 > agoraMin) && x.nome.toLowerCase().includes(produto.toLowerCase()));
      if (f) return { h: f.h, amanha: k > 0 };
    }
    return null;
  }
  function loja(d) {
    const hr = horarioDo(d), h = d.getHours() + d.getMinutes() / 60;
    if (!hr) return { aberta: false, abre: null, fecha: null, fechadoHoje: true };
    return { aberta: h >= hr[0] && h < hr[1], abre: hr[0], fecha: hr[1], fechadoHoje: false };
  }
  // quando a loja abre de novo: { h, quando: 'hoje' | 'amanhã' | 'sexta' ... }
  function proximaAbertura(d) {
    const h = d.getHours() + d.getMinutes() / 60, hoje = horarioDo(d);
    if (hoje && h < hoje[0]) return { h: hoje[0], quando: 'hoje' };
    for (let k = 1; k <= 7; k++) { const dia = maisDias(d, k), hr = horarioDo(dia); if (hr) return { h: hr[0], quando: k === 1 ? 'amanhã' : DIAS[dia.getDay()] }; }
    return { h: 6, quando: 'amanhã' };
  }
  const NATAL_ON = natalAtivo(agora());
  if (NATAL_ON) root.classList.add('natal');
  window.QH = { agora, fornada, fornadasDoDia, proximaDe, loja, proximaAbertura, horarioDo, natalAtivo, NATAL_ON, N, md, maisDias, DIAS,
    FORNADAS, HORARIO, dois, suave, saida, lerp, clamp, $, $$, topoDoc, setTxt, cenas, S, captura, reduzir };

  $$('[data-marca]').forEach((el) => { el.innerHTML = Marca.svg({ forma: el.dataset.marca }); });

  // ---------- 1. primeira tela ----------
  const hero = $('.hero'), tela = $('.filme');
  const filme = new Filme(tela, { pasta: 'video', n: 96 });
  const letreiro = $('.hero-letreiro'), texto = $('.hero-texto');
  const placa = $('.placa-quente'), etiqueta = $('.etiqueta'), marcaNav = $('.nav .marca');
  const selo = NATAL_ON ? $('.selo-natal') : null;
  const painelLed = $('.painel-led'), painelFalta = $('.painel-falta'), painel = $('.painel');
  let heroTopo = 0, heroCurso = 1, textoFim = 0, painelTopo = 0;
  cenas.push({
    medir() {
      heroTopo = topoDoc(hero); heroCurso = Math.max(1, hero.offsetHeight - S.vh);
      const r = tela.getBoundingClientRect();
      filme.tamanho(r.width, r.height, captura ? (devicePixelRatio || 1) : Math.min(devicePixelRatio || 1, 2));
      const pin = $('.hero-pin').getBoundingClientRect();
      const ult = $$('.hero-texto > *').filter((el) => el.offsetParent).pop();
      textoFim = ult.getBoundingClientRect().bottom - pin.top;
      painelTopo = painel.getBoundingClientRect().top - pin.top;
    },
    atualizar(s) {
      const d = agora(), f = fornada(d);
      LED.aplicar(painelLed, `${dois(f.prox.h)}:00`, `Próxima fornada às ${f.prox.h}h`);
      const min = Math.floor(f.falta / 60);
      const faltaHtml = f.outroDia ? `<b>${f.quando}</b>` : min >= 90 ? `às <b>${f.prox.h}h</b>` : `faltam <b>${Math.max(1, min)} min</b>`;
      if (painelFalta._h !== faltaHtml) { painelFalta._h = faltaHtml; painelFalta.innerHTML = faltaHtml; }
      painel.setAttribute('aria-label', `Próxima fornada às ${f.prox.h}h: ${f.prox.nome}`);
      painel.classList.toggle('pisca', Math.floor(s.t * 2) % 2 === 0);
      if (s.y > heroTopo + heroCurso + s.vh) return;
      const p = clamp((s.y - heroTopo) / heroCurso, 0, 1);
      const W = s.vw, H = tela.clientHeight;
      // onde fica o quadro nítido: sempre inteiro (16:9), nunca cortado
      let cx, cy, cw, ch;
      if (W / H > 1.05) {
        cw = Math.min(W, H * 16 / 9); ch = cw * 9 / 16; cx = (W - cw) / 2; cy = (H - ch) / 2;
      } else {
        cw = W; ch = W * 9 / 16; cx = 0;
        // em repouso, logo abaixo do texto (em tela baixa pode encostar no painel, nunca no título)
        const repouso = Math.min(textoFim + 18, H - ch);
        const centro = (H - ch) / 2 - H * 0.03;
        cy = lerp(repouso, centro, suave(0.04, 0.34, p));
      }
      const zoom = 1;   // sem aproximação: o quadro fica sempre inteiro
      filme.desenhar(clamp(p / 0.9, 0, 1) * 95, { x: cx, y: cy, w: cw, h: ch }, zoom);
      // o letreiro acende uma vez quando a página abre
      const ligado = s.t > 0.7 || (s.t > 0.25 && s.t < 0.4) ? 1 : 0.2;
      const sai = suave(0.04, 0.30, p);
      letreiro.style.opacity = (ligado * (1 - suave(0.06, 0.24, p))).toFixed(3);
      letreiro.style.transform = `translate3d(0, ${(-sai * 40).toFixed(2)}px, 0)`;
      texto.style.opacity = (1 - suave(0.06, 0.26, p)).toFixed(3);
      texto.style.transform = `translate3d(0, ${(-sai * 40).toFixed(2)}px, 0)`;
      marcaNav.style.opacity = suave(0.18, 0.30, p).toFixed(3);
      // o único destaque de Natal da primeira tela: o selo de encomendas
      if (selo) {
        const e = suave(0.8, 1.5, s.t) * (1 - suave(0.06, 0.24, p));
        selo.style.opacity = e.toFixed(3);
        selo.style.transform = `translate3d(0, ${((1 - suave(0.8, 1.5, s.t)) * 8 - sai * 40).toFixed(2)}px, 0)`;
        selo.style.visibility = e < 0.01 ? 'hidden' : '';
      }
      // pão na luz: a placa PÃO QUENTE acende e a plaquinha de preço aparece em cima do pão
      const x = p - 0.60;
      placa.classList.toggle('acesa', x > 0.05 || (x > 0.015 && x < 0.03));
      const et = suave(0.60, 0.70, p);
      etiqueta.style.opacity = et.toFixed(3);
      // a plaquinha acompanha o pão quando a imagem aproxima
      const px = 0.76, py = 0.12;
      const sx = 0.6 + (px - 0.6) * zoom, sy = 0.62 + (py - 0.62) * zoom;
      etiqueta.style.left = `${(cx + cw * sx - etiqueta.offsetWidth / 2).toFixed(1)}px`;
      etiqueta.style.top = `${(cy + ch * Math.max(0.02, sy)).toFixed(1)}px`;
      etiqueta.style.transform = `translate3d(0, ${((1 - et) * 12).toFixed(2)}px, 0) rotate(-2.5deg)`;
    },
  });

  // ---------- motor ----------
  let alturaAnt = 0;
  function medir() { S.vh = innerHeight; S.vw = innerWidth; cenas.forEach((c) => c.medir && c.medir()); }
  function quadro() {
    const h = root.scrollHeight;
    if (h !== alturaAnt) { alturaAnt = h; medir(); }
    cenas.forEach((c) => c.atualizar(S));
  }
  QH.medir = medir; QH.quadro = quadro;

  if (captura) {
    const moveis = [$('main'), $('.rodape')].filter(Boolean);
    const presos = $$('.hero-pin');
    let ultT = null, ultY = 0;
    window.__quadro = function (t, y, vel) {
      moveis.concat(presos).forEach((el) => { el.style.translate = ''; });
      const yi = Math.floor(y);
      scrollTo(0, yi);
      const frac = scrollY === yi ? y - yi : 0, yx = scrollY + frac;
      if (vel == null) vel = ultT == null || t === ultT ? 0 : (yx - ultY) / (t - ultT);
      ultT = t; ultY = yx; S.t = t; S.y = yx; S.vel = vel;
      quadro();
      if (frac > 0.001) {
        const est = presos.map((el) => { const r = el.parentNode.getBoundingClientRect(); return r.top <= 0 && r.bottom >= innerHeight; });
        moveis.forEach((el) => { el.style.translate = `0 ${(-frac).toFixed(3)}px`; });
        presos.forEach((el, i) => { if (est[i]) el.style.translate = `0 ${frac.toFixed(3)}px`; });
      }
      return yx;
    };
    window.__marcos = () => {
      const m = { hero: heroTopo, heroCurso };
      $$('[data-marco]').forEach((el) => { m[el.dataset.marco] = topoDoc(el); });
      $$('.menu-secao').forEach((el) => { m[el.id] = topoDoc(el); });
      return m;
    };
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      medir();
      filme.pronto.then(() => { medir(); window.__quadro(3, 0, 0); window.__pronto = true; });
    }));
    addEventListener('resize', () => { medir(); quadro(); });
    return;
  }

  let t0 = null;
  function laco(ms) {
    if (t0 == null) t0 = ms;
    S.t = reduzir ? 3 : (ms - t0) / 1000; S.y = scrollY;
    quadro();
    requestAnimationFrame(laco);
  }
  document.fonts.ready.then(() => { medir(); requestAnimationFrame(laco); });
  let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(medir, 80); });
  addEventListener('load', medir);
})();
