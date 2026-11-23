/* Padaria Quatro Horas — motor do site.
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
  if (/[?&]paleta=1/.test(qs)) root.classList.add('modo-paleta');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  const saida = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const topoDoc = (el) => el.getBoundingClientRect().top + scrollY;
  const setTxt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
  const cenas = [];
  const S = { t: 0, y: 0, vel: 0, vh: innerHeight, vw: innerWidth };

  // ---------- relógio da padaria ----------
  // Em ?captura=1 o "agora" é fixo: quarta-feira, 15h47 (+ o tempo do quadro).
  const BASE = new Date(2026, 10, 25, 15, 47, 30).getTime();
  const agora = () => new Date(captura ? BASE + S.t * 1000 : Date.now());
  const FORNADAS = [
    [6, 'Pão francês e bisnaguinha'], [7, 'Pão francês e pão de leite'], [8, 'Pão francês'], [9, 'Pão de queijo'],
    [10, 'Pão francês e baguete'], [11, 'Pão francês'], [12, 'Pão francês e pão italiano'], [13, 'Pão francês'],
    [14, 'Pão francês e rosca de coco'], [15, 'Pão francês e broa de milho'], [16, 'Pão de queijo e sonho'],
    [17, 'Pão francês'], [18, 'Pão francês e baguete'], [19, 'Pão francês, a última do dia'],
  ].map(([h, nome]) => ({ h, nome }));
  const HORARIO = { 0: [7, 13], 1: [6, 20], 2: [6, 20], 3: [6, 20], 4: [6, 20], 5: [6, 20], 6: [6, 18] };
  function fornada(d) {
    const s = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds() + d.getMilliseconds() / 1000;
    let i = FORNADAS.findIndex((f) => f.h * 3600 > s), amanha = false, falta;
    if (i < 0) { i = 0; amanha = true; falta = 86400 - s + FORNADAS[0].h * 3600; } else falta = FORNADAS[i].h * 3600 - s;
    const desde = i > 0 && !amanha ? s - FORNADAS[i - 1].h * 3600 : 1e9;   // segundos desde a última fornada
    return { i, prox: FORNADAS[i], falta, amanha, desde, s };
  }
  function loja(d) {
    const [a, f] = HORARIO[d.getDay()], h = d.getHours() + d.getMinutes() / 60;
    return { aberta: h >= a && h < f, abre: a, fecha: f };
  }
  const dois = (n) => String(n).padStart(2, '0');
  window.QH = { agora, fornada, loja, FORNADAS, HORARIO, dois, suave, saida, clamp, $, $$, topoDoc, setTxt, cenas, S, captura, reduzir };

  // ---------- marca e painéis ----------
  $$('[data-marca]').forEach((el) => { el.innerHTML = Marca.svg({ forma: el.dataset.marca, neon: el.dataset.neon !== 'nao', cor: el.dataset.cor }); });

  // ---------- 1. primeira tela ----------
  const hero = $('.hero'), tela = $('.filme');
  const filme = new Filme(tela, { pasta: 'video', n: 96 });
  const letreiro = $('.hero-letreiro'), texto = $('.hero-texto'), rola = $('.rola');
  const placa = $('.placa-quente'), etiqueta = $('.etiqueta'), marcaNav = $('.nav .marca');
  const painelLed = $('.painel-led'), painelFalta = $('.painel-falta b'), painel = $('.painel');
  let heroTopo = 0, heroCurso = 1;
  // a placa acende como neon de verdade: dois piscos e fica
  const acesa = (x) => x > 0.10 || (x > 0.02 && x < 0.045) || (x > 0.065 && x < 0.08);
  cenas.push({
    medir() {
      heroTopo = topoDoc(hero); heroCurso = Math.max(1, hero.offsetHeight - S.vh);
      const r = tela.getBoundingClientRect();
      filme.tamanho(r.width, r.height, captura ? (devicePixelRatio || 1) : Math.min(devicePixelRatio || 1, 2));
    },
    atualizar(s) {
      const d = agora(), f = fornada(d);
      const hh = f.amanha ? '06:00' : `${dois(f.prox.h)}:00`;
      LED.aplicar(painelLed, hh, `Próxima fornada às ${f.prox.h}h`);
      const min = Math.floor(f.falta / 60);
      setTxt(painelFalta, f.amanha || min >= 90 ? (f.amanha ? 'amanhã' : `às ${f.prox.h}h`) : `${Math.max(1, min)} min`);
      painel.setAttribute('aria-label', `Próxima fornada às ${f.prox.h}h: ${f.prox.nome}`);
      painel.classList.toggle('pisca', Math.floor(s.t * 2) % 2 === 0);
      if (s.y > heroTopo + heroCurso + s.vh) return;
      const p = clamp((s.y - heroTopo) / heroCurso, 0, 1);
      // o vídeo: 0 a 92% da rolagem percorre os 96 quadros; o fim segura o pão com vapor
      filme.desenhar(clamp(p / 0.92, 0, 1) * 95);
      // o letreiro acende piscando quando a página abre
      const liga = s.t;
      const ligado = liga > 0.9 || (liga > 0.25 && liga < 0.38) || (liga > 0.55 && liga < 0.7) ? 1 : 0.18;
      const sai = suave(0.06, 0.34, p);
      letreiro.style.transform = `translate3d(0, ${(-sai * s.vh * 0.18).toFixed(2)}px, 0)`;
      letreiro.style.opacity = (ligado * (1 - suave(0.10, 0.28, p))).toFixed(3);
      texto.style.opacity = (1 - suave(0.08, 0.30, p)).toFixed(3);
      texto.style.transform = `translate3d(0, ${(-sai * s.vh * 0.12).toFixed(2)}px, 0)`;
      rola.style.opacity = (1 - suave(0.01, 0.06, p)).toFixed(3);
      marcaNav.style.opacity = suave(0.22, 0.34, p).toFixed(3);
      // pão na luz: a placa PÃO QUENTE acende e a plaquinha de preço entra
      placa.classList.toggle('acesa', acesa(p - 0.58));
      const et = suave(0.58, 0.68, p);
      etiqueta.style.opacity = et.toFixed(3);
      etiqueta.style.transform = `translate3d(0, ${((1 - et) * 18).toFixed(2)}px, 0) rotate(${(-4 + et * 2).toFixed(2)}deg)`;
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
  QH.medir = medir;

  if (captura) {
    const moveis = [$('main'), $('.rodape')].filter(Boolean);
    const presos = $$('.hero-pin, [data-preso]');
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
      $$('[data-marco]').forEach((el) => { m[el.dataset.marco] = topoDoc(el); if (el.dataset.preso != null || el.querySelector('[data-preso]')) m[el.dataset.marco + 'Curso'] = el.offsetHeight - innerHeight; });
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
