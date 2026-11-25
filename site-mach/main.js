/* MACH Estúdio — site oficial (sem back-end)
   ─────────────────────────────────────────────
   CONFIGURAÇÃO */
const CONFIG = {
  // WhatsApp com DDI + DDD, só dígitos. Vazio = o WhatsApp abre e a pessoa escolhe o contato.
  whatsapp: '5511939045618',
  instagram: 'mach.sites',
  // Equus Genetics (cliente real) na primeira tela e nos trabalhos.
  // false = some tudo da Equus; a primeira tela passa a mostrar a Padaria Quatro Horas (conceito).
  mostrarEquus: true,
};

(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hash = (n) => {
    let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b);
    x ^= x >>> 13;
    x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };

  /* ── Equus: liga e desliga (CONFIG.mostrarEquus) ── */
  $$('[data-equus]').forEach((el) => { if (!CONFIG.mostrarEquus) el.remove(); });
  $$('[data-sem-equus]').forEach((el) => { if (CONFIG.mostrarEquus) el.remove(); else el.hidden = false; });

  /* ── menu do celular ── */
  const menuBtn = $('#menu-btn'), menu = $('#menu-cel');
  function abreMenu(abrir) {
    menu.hidden = !abrir;
    menuBtn.setAttribute('aria-expanded', String(abrir));
    menuBtn.setAttribute('aria-label', abrir ? 'Fechar o menu' : 'Abrir o menu');
    if (abrir) { const primeiro = $('a', menu); if (primeiro) primeiro.focus(); }
  }
  menuBtn.addEventListener('click', () => abreMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) abreMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { abreMenu(false); menuBtn.focus(); } });
  document.addEventListener('click', (e) => { if (!menu.hidden && !e.target.closest('.topo')) abreMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1100 && !menu.hidden) abreMenu(false); });

  /* ── vídeos dos trabalhos: cada um carrega só perto da tela, toca sem som e para fora dela ── */
  const videos = $$('.trab-video video');
  const perto = new IntersectionObserver((en) => {
    en.forEach((x) => {
      if (!x.isIntersecting) return;
      const v = x.target;
      v.poster = v.dataset.poster;
      v.src = v.dataset.src;
      v.preload = 'metadata';
      perto.unobserve(v);
    });
  }, { rootMargin: '300px 0px' });
  const naTela = new IntersectionObserver((en) => {
    en.forEach((x) => {
      const v = x.target;
      if (x.isIntersecting && !v._pausadoPeloUsuario && !reduz) v.play().catch(() => {});
      else if (!x.isIntersecting) v.pause();
    });
  }, { threshold: 0.35 });
  videos.forEach((v) => {
    const btn = $('.video-btn', v.parentElement);
    const marca = () => {
      const tocando = !v.paused;
      btn.classList.toggle('tocando', tocando);
      btn.setAttribute('aria-label', tocando ? 'Pausar o vídeo' : 'Reproduzir o vídeo');
    };
    v.addEventListener('play', marca);
    v.addEventListener('pause', marca);
    const alterna = () => {
      if (!v.src) { v.poster = v.dataset.poster; v.src = v.dataset.src; }
      if (v.paused) { v._pausadoPeloUsuario = false; v.play().catch(() => {}); }
      else { v._pausadoPeloUsuario = true; v.pause(); }
    };
    btn.addEventListener('click', alterna);
    v.addEventListener('click', alterna);
    perto.observe(v);
    naTela.observe(v);
  });

  /* ── blocos entram suaves (só os que começam fora da tela) ── */
  if (!reduz && 'IntersectionObserver' in window) {
    const ioB = new IntersectionObserver((en) => {
      en.forEach((x) => { if (x.isIntersecting) { x.target.classList.remove('fora'); ioB.unobserve(x.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    $$('[data-revela]').forEach((el) => {
      if (el.getBoundingClientRect().top > window.innerHeight * 0.95) {
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
  const CODIGOS = { 'Site institucional': 'INS', 'Landing page': 'LDP', 'Portfólio': 'PRT', 'Cardápio ou catálogo': 'CAT', 'Ainda não sei': '???' };
  const voo = 'MCH-' + String(1000 + Math.floor(Math.random() * 9000));
  $('#c-voo').textContent = voo;
  const bZap = $('#b-zap'), bDirect = $('#b-direct'), cartao = $('#cartao'), barras = $('#c-barras');
  const erroNome = $('#erro-nome');

  function dados() {
    return {
      nome: campo('nome').value.trim(),
      empresa: campo('empresa').value.trim(),
      tipo: marcado('tipo'),
      msg: campo('msg').value.trim(),
    };
  }
  function mensagem(d) {
    const linhas = ['Olá, MACH! Quero um orçamento de site.', ''];
    linhas.push(`Nome: ${d.nome || '—'}`);
    if (d.empresa) linhas.push(`Empresa: ${d.empresa}`);
    linhas.push(`Tipo: ${d.tipo || 'Ainda não sei'}`);
    if (d.msg) linhas.push('', `Sobre o projeto: ${d.msg}`);
    linhas.push('', `Cartão de embarque ${voo}`);
    return linhas.join('\n');
  }
  function desenhaBarras(semente) {
    let s = 0;
    for (const ch of semente) s = (s * 31 + ch.charCodeAt(0)) | 0;
    let html = '';
    for (let i = 0; i < 40; i++) html += `<i style="width:${1 + Math.floor(hash(s + i * 97) * 3.4)}px"></i>`;
    barras.innerHTML = html;
  }
  function atualizaPedido() {
    const d = dados();
    $('#c-nome').textContent = d.nome || '—';
    $('#c-empresa').textContent = d.empresa || '—';
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
  atualizaPedido();

  /* ══ RODAPÉ · um jatinho escreve MACH no céu ══ */
  (function jatinho() {
    const ceu = $('#ceu');
    if (!ceu) return;
    const svg = $('svg', ceu), NS = 'http://www.w3.org/2000/svg';
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
      const u = clamp((agora - t0) / 5200), dist = u * total;
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
})();
