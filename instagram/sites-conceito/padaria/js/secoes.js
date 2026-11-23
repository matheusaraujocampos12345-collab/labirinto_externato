/* Padaria Quatro Horas — as seções depois da primeira tela. Usa o motor de js/site.js (window.QH). */
(function () {
  'use strict';
  const { agora, fornada, loja, FORNADAS, HORARIO, dois, suave, saida, clamp, $, $$, topoDoc, setTxt, cenas, reduzir } = window.QH;
  const aleatorio = (semente) => () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647; };

  // ---------- barra e status ----------
  const nav = $('.nav'), hero = $('.hero');
  const statusCurto = $('[data-status]'), statusLongo = $('[data-status-longo]'), statusBox = $('.status-loja');
  const diasLi = $$('.horario li');
  let heroFim = 0;
  cenas.push({
    medir() { heroFim = topoDoc(hero) + hero.offsetHeight - innerHeight; },
    atualizar(s) {
      const d = agora(), l = loja(d);
      const amanha = HORARIO[(d.getDay() + (d.getHours() >= l.fecha ? 1 : 0)) % 7][0];
      setTxt(statusCurto, l.aberta ? `Aberta até ${l.fecha}h` : `Fechada · abre às ${amanha}h`);
      setTxt(statusLongo, l.aberta ? `Aberta agora · fecha às ${l.fecha}h` : `Fechada agora · abre às ${amanha}h`);
      statusBox.classList.toggle('fechada', !l.aberta);
      diasLi.forEach((li) => li.classList.toggle('hoje', li.dataset.dias.split(',').includes(String(d.getDay()))));
      nav.classList.toggle('com-fundo', s.y > heroFim - 40);
    },
  });

  // ---------- 2. próxima fornada: painel de senha ----------
  const senha = $('.senha'), ledG = $('[data-led-grande]'), ledF = $('[data-led-falta]');
  const fHora = $('[data-f-hora]'), fNome = $('[data-f-nome]'), lista = $('.lista-fornadas');
  const regua = $('.regua'), reguaAgora = $('.regua-agora'), agoraTxt = $('[data-agora]');
  const marcas = FORNADAS.map((f) => {
    const m = document.createElement('span');
    m.className = 'regua-marca' + (f.h % 3 === 0 ? ' longa' : '');
    m.style.left = `${((f.h - 6) / 13) * 100}%`;
    if (f.h % 3 === 0) m.dataset.h = `${f.h}h`;
    regua.insertBefore(m, reguaAgora);
    return m;
  });
  let senhaTopo = 0, chaveLista = '';
  cenas.push({
    medir() { senhaTopo = topoDoc(senha); },
    atualizar(s) {
      const d = agora(), f = fornada(d);
      setTxt(fHora, f.amanha ? '6h' : `${f.prox.h}h`);
      setTxt(fNome, `${f.prox.nome}.`);
      // linha de agora na régua
      const frac = clamp((f.s / 3600 - 6) / 13, 0, 1);
      reguaAgora.style.left = `${(frac * 100).toFixed(3)}%`;
      setTxt(agoraTxt, `agora ${d.getHours()}h${dois(d.getMinutes())}`);
      marcas.forEach((m, k) => {
        m.classList.toggle('feita', !f.amanha && k < f.i);
        m.classList.toggle('proxima', k === f.i && !f.amanha);
      });
      const chave = `${f.i}-${f.amanha}-${Math.floor(f.falta / 60)}`;
      if (chave !== chaveLista) {
        chaveLista = chave;
        const ini = clamp(f.i - 2, 0, FORNADAS.length - 5);
        lista.innerHTML = FORNADAS.slice(ini, ini + 5).map((x, k) => {
          const j = ini + k;
          let cls = '', est;
          if (f.amanha) est = 'amanhã';
          else if (j < f.i) { cls = 'saiu'; est = 'saiu'; }
          else if (j === f.i) { cls = 'proxima'; const m = Math.floor(f.falta / 60); est = m >= 60 ? `em ${Math.floor(m / 60)}h${dois(m % 60)}` : `em ${Math.max(1, m)} min`; }
          else { const m = Math.round((x.h * 3600 - f.s) / 60); est = `em ${Math.floor(m / 60)}h${dois(m % 60)}`; }
          return `<li class="${cls}"><span class="lf-h">${x.h}h</span><span class="lf-nome">${x.nome}</span><span class="lf-est">${est}</span></li>`;
        }).join('');
      }
      if (Math.abs(senhaTopo - s.y) > s.vh * 1.6) return;
      // ao entrar na tela o painel liga: teste dos segmentos (88:88) e depois a hora
      const e = reduzir ? 1 : suave(s.vh * 0.95, s.vh * 0.45, senhaTopo - s.y);
      const teste = e < 0.55;
      senha.style.setProperty('--liga', (teste ? suave(0.05, 0.4, e) : 1).toFixed(3));
      const hh = f.amanha ? '06:00' : `${dois(f.prox.h)}:00`;
      const falta = f.falta >= 100 * 60 ? `${dois(Math.floor(f.falta / 3600))}:${dois(Math.floor(f.falta / 60) % 60)}` : `${dois(Math.floor(f.falta / 60))}:${dois(Math.floor(f.falta) % 60)}`;
      LED.aplicar(ledG, teste ? '88:88' : hh, `Próxima fornada às ${f.prox.h}h`);
      LED.aplicar(ledF, teste ? '88:88' : falta, 'Tempo que falta');
      senha.classList.toggle('pisca', !teste && Math.floor(s.t * 2) % 2 === 1);
    },
  });
  const avise = $('.avise');
  avise.addEventListener('click', async () => {
    const on = avise.getAttribute('aria-pressed') !== 'true';
    avise.setAttribute('aria-pressed', String(on));
    const f = fornada(agora());
    setTxt($('[data-avise]'), on ? `Combinado. Aviso às ${f.prox.h - 1}h55` : 'Me avisa 5 min antes');
    clearTimeout(avise._t);
    if (on && 'Notification' in window) {
      try { if (Notification.permission === 'default') await Notification.requestPermission(); } catch (e) { /* sem permissão */ }
      avise._t = setTimeout(() => {
        if (Notification.permission === 'granted') new Notification('Padaria Quatro Horas', { body: `${f.prox.nome}: sai do forno em 5 minutos.` });
      }, Math.max(0, f.falta - 300) * 1000);
    }
  });

  // ---------- 3. cardápio: quadro de letras de encaixe ----------
  const ITENS = [
    ['Pão francês', 'kg 19,90'], ['Pão de queijo', '3,50'], ['Sonho de creme', '7,00', 'acabou'], ['Bolo de fubá', 'fatia 6,50'],
    ['Baguete', '9,00'], ['Broa de milho', '4,50'], ['Pão na chapa', '6,00'], ['Misto quente', '13,00'], ['Café coado', '4,50'], ['Pingado', '5,50'],
  ];
  const linhasQ = $('.quadro-linhas'), lido = $('.cardapio-lido'), bilhete = $('.bilhete');
  const rnd = aleatorio(4004);
  const letras = [];
  const montaPalavra = (txt) => [...txt.toUpperCase()].map((ch) => {
    if (ch === ' ') return '<span class="esp"></span>';
    const r = ((rnd() - 0.5) * 3.2).toFixed(2), dy = ((rnd() - 0.5) * 1.6).toFixed(2);
    return `<span class="letra" style="--r:${r}deg;--dy:${dy}px">${ch}</span>`;
  }).join('');
  linhasQ.innerHTML = `<div class="ql ql-topo"><span>${montaPalavra('Preços de hoje')}</span><span>${montaPalavra('R$')}</span></div>`
    + ITENS.map(([n, p, extra]) => `<div class="ql${extra ? ' ql-' + extra : ''}"><span>${montaPalavra(n)}</span><span>${montaPalavra(p)}</span></div>`).join('');
  lido.innerHTML = ITENS.map(([n, p, extra]) => `<li>${n}: R$ ${p.replace('kg ', '').replace('fatia ', '')}${p.startsWith('kg') ? ' o quilo' : p.startsWith('fatia') ? ' a fatia' : ''}${extra ? ' (acabou, volta às 16h)' : ''}</li>`).join('');
  $$('.letra', linhasQ).forEach((el) => letras.push(el));
  const cardapio = $('.cardapio'), linhaSonho = $('.ql-acabou');
  let cardTopo = 0, cardCurso = 1;
  cenas.push({
    medir() { cardTopo = topoDoc(cardapio); cardCurso = Math.max(1, cardapio.offsetHeight - innerHeight); },
    atualizar(s) {
      if (s.y < cardTopo - s.vh * 1.2 || s.y > cardTopo + cardCurso + s.vh) return;
      const p = reduzir ? 1 : clamp((s.y - cardTopo + s.vh * 0.35) / (cardCurso + s.vh * 0.35), 0, 1);
      const N = letras.length;
      letras.forEach((el, i) => {
        const ini = 0.03 + (i / N) * 0.70;
        const e = clamp((p - ini) / 0.022, 0, 1);
        if (el._e === e) return;
        el._e = e;
        el.style.opacity = e.toFixed(3);
        el.style.transform = e >= 1 ? '' : `translate3d(0, ${((1 - e) * -10).toFixed(2)}px, 0) scale(${(1.25 - 0.25 * e).toFixed(3)})`;
      });
      const b = suave(0.80, 0.88, p);
      bilhete.style.opacity = b.toFixed(3);
      bilhete.style.transform = `rotate(${(-6 + b * 2).toFixed(2)}deg) translate3d(0, ${((1 - b) * -14).toFixed(2)}px, 0)`;
      linhaSonho.style.opacity = (1 - b * 0.55).toFixed(3);
    },
  });

  // ---------- 4. cartão de ponto ----------
  const cartao = $('.cartao'), horas = $$('.c-hora', cartao);
  const rc = aleatorio(355);
  horas.forEach((h) => { h.style.setProperty('--r', `${((rc() - 0.5) * 6).toFixed(2)}deg`); h.style.setProperty('--x', `${((rc() - 0.5) * 6).toFixed(1)}px`); });
  let cartaoTopo = 0;
  cenas.push({
    medir() { cartaoTopo = topoDoc(cartao); },
    atualizar(s) {
      if (Math.abs(cartaoTopo - s.y) > s.vh * 1.6) return;
      const e = reduzir ? 1 : suave(s.vh * 0.92, s.vh * 0.2, cartaoTopo - s.y);
      cartao.style.transform = `translate3d(0, ${((1 - saida(e)) * 40).toFixed(2)}px, 0) rotate(${(-2.2 + (1 - e) * -3).toFixed(2)}deg)`;
      horas.forEach((h, k) => {
        const c = clamp((e - 0.18 - k * 0.14) / 0.06, 0, 1);
        h.style.opacity = (c * 0.92).toFixed(3);
        h.style.transform = `translate(var(--x), 0) rotate(var(--r)) scale(${(1.6 - 0.6 * saida(c)).toFixed(3)})`;
      });
    },
  });

  // ---------- 5. encomenda: o saco de pão ----------
  const saco = $('.saco'), sacoPaes = $('.saco-paes'), comanda = $('.comanda');
  $('.saco-carimbo').innerHTML = Marca.svg({ forma: 'letreiro', neon: false, cor: '#3B2312' }).replace('<svg ', '<svg width="300" height="214" ');
  let sacoTopo = 0;
  cenas.push({
    medir() { sacoTopo = topoDoc(saco); },
    atualizar(s) {
      if (Math.abs(sacoTopo - s.y) > s.vh * 1.6) return;
      const e = reduzir ? 1 : suave(s.vh * 1.0, s.vh * 0.3, sacoTopo - s.y);
      saco.style.transform = `translate3d(0, ${((1 - saida(e)) * 50).toFixed(2)}px, 0)`;
      sacoPaes.setAttribute('transform', `translate(0 ${((1 - saida(suave(0.2, 1, e))) * 80).toFixed(2)})`);
      const c = suave(0.45, 0.9, e);
      comanda.style.opacity = c.toFixed(3);
      comanda.style.transform = `rotate(${(14 - c * 10).toFixed(2)}deg) translate3d(0, ${((1 - c) * -24).toFixed(2)}px, 0)`;
    },
  });

  // ---------- 6. endereço: mapa da madrugada ----------
  const mapa = $('.mapa'), rota = $('.rota'), onda = $('.voce-onda'), brilho = $('.padaria-brilho'), aPe = $('.a-pe');
  const POSTES = [[40, 348], [110, 330], [214, 274], [262, 248], [340, 200], [154, 70], [160, 180], [176, 320], [178, 400], [60, 120], [230, 112], [350, 98], [296, 60], [300, 170], [304, 330], [306, 410], [90, 243], [240, 252]];
  $('.postes').innerHTML = POSTES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="18" fill="url(#g-poste)"/><circle cx="${x}" cy="${y}" r="1.7" fill="#F6C98A"/>`).join('');
  let mapaTopo = 0;
  cenas.push({
    medir() { mapaTopo = topoDoc(mapa); },
    atualizar(s) {
      const l = loja(agora());
      setTxt(aPe, l.aberta ? '6 MIN A PÉ · ABERTA' : '6 MIN A PÉ · FECHADA');
      if (Math.abs(mapaTopo - s.y) > s.vh * 1.6) return;
      const e = reduzir ? 1 : suave(s.vh * 0.85, s.vh * 0.30, mapaTopo - s.y);
      rota.setAttribute('stroke-dasharray', `${saida(e).toFixed(4)} 1`);
      const fo = (s.t * 0.7) % 1;
      onda.setAttribute('r', (8 + fo * 14).toFixed(2));
      onda.style.opacity = ((1 - fo) * 0.3).toFixed(3);
      brilho.style.opacity = (0.75 + 0.25 * Math.sin(s.t * 1.7)).toFixed(3);
    },
  });
  const copiar = $('[data-copiar]');
  copiar.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copiar.dataset.copiar); copiar.textContent = 'Endereço copiado'; }
    catch (e) { copiar.textContent = copiar.dataset.copiar; }
    setTimeout(() => { copiar.textContent = 'Copiar endereço'; }, 2400);
  });

  // ---------- rodapé ----------
  const rodapeLetreiro = $('.rodape-letreiro'), rodape = $('.rodape');
  let rodTopo = 0;
  cenas.push({
    medir() { rodTopo = topoDoc(rodape); },
    atualizar(s) {
      if (Math.abs(rodTopo - s.y) > s.vh * 1.5) return;
      const e = suave(s.vh * 0.9, s.vh * 0.5, rodTopo - s.y);
      const k = e * 3.2;   // acende piscando
      rodapeLetreiro.style.opacity = (k > 2.4 || (k > 0.6 && k < 1.0) || (k > 1.5 && k < 1.8) ? 1 : 0.15).toFixed(2);
    },
  });
  if (window.QH.medir) window.QH.medir();
})();
