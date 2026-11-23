/* Padaria Quatro Horas — fornadas, endereço e encomenda. Usa o motor de js/site.js (window.QH). */
(function () {
  'use strict';
  const { agora, fornada, loja, FORNADAS, HORARIO, dois, suave, saida, clamp, $, $$, topoDoc, setTxt, cenas, reduzir } = window.QH;

  // ---------- barra e status da loja ----------
  const nav = $('.nav'), hero = $('.hero');
  const statusCurto = $('[data-status]'), statusLongo = $('[data-status-longo]'), statusBox = $('.status-loja');
  const diasLi = $$('.horario li'), linksNav = $$('.nav-links a');
  const alvosNav = linksNav.map((a) => document.querySelector(a.getAttribute('href')));
  let heroFim = 0, toposNav = [];
  cenas.push({
    medir() { heroFim = topoDoc(hero) + hero.offsetHeight - innerHeight; toposNav = alvosNav.map((el) => topoDoc(el)); },
    atualizar(s) {
      const d = agora(), l = loja(d);
      const abre = HORARIO[(d.getDay() + (d.getHours() >= l.fecha ? 1 : 0)) % 7][0];
      setTxt(statusCurto, l.aberta ? `Aberta até ${l.fecha}h` : `Fechada · abre às ${abre}h`);
      setTxt(statusLongo, l.aberta ? `Aberta agora · fecha às ${l.fecha}h` : `Fechada agora · abre às ${abre}h`);
      statusBox.classList.toggle('fechada', !l.aberta);
      nav.classList.toggle('fechada', !l.aberta);
      diasLi.forEach((li) => li.classList.toggle('hoje', li.dataset.dias.split(',').includes(String(d.getDay()))));
      nav.classList.toggle('com-fundo', s.y > heroFim - 40);
      let k = -1;
      toposNav.forEach((t, i) => { if (s.y + s.vh * 0.4 >= t) k = i; });
      linksNav.forEach((a, i) => a.classList.toggle('ativa', i === k));
    },
  });

  // ---------- 2. fornadas: painel de senha e a lista do dia ----------
  const senha = $('.senha'), ledG = $('[data-led-grande]'), ledF = $('[data-led-falta]');
  const fNome = $('[data-f-nome]'), lista = $('.lista-fornadas');
  let senhaTopo = 0, chaveLista = '';
  cenas.push({
    medir() { senhaTopo = topoDoc(senha); },
    atualizar(s) {
      const d = agora(), f = fornada(d);
      setTxt(fNome, f.prox.nome.toLowerCase());
      const chave = `${f.i}-${f.amanha}-${Math.floor(f.falta / 60)}`;
      if (chave !== chaveLista) {
        chaveLista = chave;
        const ini = clamp(f.i - 1, 0, FORNADAS.length - 5);
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
      const hh = f.amanha ? '06:00' : `${dois(f.prox.h)}:00`;
      const falta = f.falta >= 100 * 60 ? `${dois(Math.floor(f.falta / 3600))}:${dois(Math.floor(f.falta / 60) % 60)}` : `${dois(Math.floor(f.falta / 60))}:${dois(Math.floor(f.falta) % 60)}`;
      LED.aplicar(ledG, hh, `Próxima fornada às ${f.prox.h}h`);
      LED.aplicar(ledF, falta, 'Tempo que falta');
      senha.classList.toggle('pisca', Math.floor(s.t * 2) % 2 === 1);
    },
  });
  const avise = $('.avise');
  avise.addEventListener('click', async () => {
    const on = avise.getAttribute('aria-pressed') !== 'true';
    avise.setAttribute('aria-pressed', String(on));
    const f = fornada(agora());
    setTxt($('[data-avise]'), on ? `Combinado: aviso às ${f.prox.h - 1}h55` : 'Avise 5 min antes da próxima');
    clearTimeout(avise._t);
    if (on && 'Notification' in window) {
      try { if (Notification.permission === 'default') await Notification.requestPermission(); } catch (e) { /* sem permissão */ }
      avise._t = setTimeout(() => {
        if (Notification.permission === 'granted') new Notification('Padaria Quatro Horas', { body: `${f.prox.nome}: sai do forno em 5 minutos.` });
      }, Math.max(0, f.falta - 300) * 1000);
    }
  });

  // ---------- 4. endereço: mapa do bairro ----------
  const mapa = $('.mapa'), rota = $('.rota'), onda = $('.voce-onda'), aPe = $('.a-pe');
  const POSTES = [[40, 348], [110, 330], [214, 274], [262, 248], [340, 200], [154, 70], [160, 180], [176, 320], [178, 400], [60, 120], [230, 112], [350, 98], [300, 170], [304, 330], [306, 410], [90, 243]];
  $('.postes').innerHTML = POSTES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="14" fill="url(#g-poste)"/><circle cx="${x}" cy="${y}" r="1.5" fill="#E5AC68" opacity=".9"/>`).join('');
  let mapaTopo = 0;
  cenas.push({
    medir() { mapaTopo = topoDoc(mapa); },
    atualizar(s) {
      const l = loja(agora());
      setTxt(aPe, l.aberta ? '6 min a pé · aberta' : '6 min a pé · fechada');
      if (Math.abs(mapaTopo - s.y) > s.vh * 1.6) return;
      // o caminho se desenha uma vez, quando o mapa chega na tela
      const e = reduzir ? 1 : suave(s.vh * 0.85, s.vh * 0.35, mapaTopo - s.y);
      rota.setAttribute('stroke-dasharray', `${saida(e).toFixed(4)} 1`);
      const fo = (s.t * 0.6) % 1;
      onda.setAttribute('r', (8 + fo * 12).toFixed(2));
      onda.style.opacity = ((1 - fo) * 0.25).toFixed(3);
    },
  });
  const copiar = $('[data-copiar]');
  copiar.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copiar.dataset.copiar); copiar.textContent = 'Endereço copiado'; }
    catch (e) { copiar.textContent = copiar.dataset.copiar; }
    setTimeout(() => { copiar.textContent = 'Copiar endereço'; }, 2400);
  });

  // ---------- entradas suaves de cada bloco (uma vez, quando chega na tela) ----------
  const blocos = $$('.secao .cab, .senha, .dia, .mapa, .horario, .encomenda-foto, .passos, .encomenda-texto .botao');
  cenas.push({
    medir() { blocos.forEach((b) => { b.style.transform = ''; b._t = topoDoc(b); }); },
    atualizar(s) {
      if (reduzir) return;
      blocos.forEach((b) => {
        const e = suave(s.vh * 1.0, s.vh * 0.82, b._t - s.y);
        if (b._e === e) return;
        b._e = e;
        b.style.opacity = e.toFixed(3);
        b.style.transform = e >= 1 ? '' : `translate3d(0, ${((1 - e) * 20).toFixed(2)}px, 0)`;
      });
    },
  });
  if (window.QH.medir) window.QH.medir();
})();
