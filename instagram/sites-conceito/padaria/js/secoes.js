/* Padaria Quatro Horas — fornadas, endereço e encomenda. Usa o motor de js/site.js (window.QH). */
(function () {
  'use strict';
  const { agora, fornada, loja, proximaAbertura, NATAL_ON, N, md, maisDias, DIAS, dois, suave, saida, clamp, $, $$, topoDoc, setTxt, cenas, reduzir } = window.QH;

  // ---------- barra e status da loja ----------
  const nav = $('.nav'), hero = $('.hero');
  const statusCurto = $('[data-status]'), statusLongo = $('[data-status-longo]'), statusBox = $('.status-loja');
  const diasLi = $$('.horario li'), linksNav = $$('.nav-links a').filter((a) => NATAL_ON || !a.classList.contains('so-natal'));
  const alvosNav = linksNav.map((a) => document.querySelector(a.getAttribute('href')));
  let heroFim = 0, toposNav = [];
  cenas.push({
    medir() { heroFim = topoDoc(hero) + hero.offsetHeight - innerHeight; toposNav = alvosNav.map((el) => topoDoc(el)); },
    atualizar(s) {
      const d = agora(), l = loja(d), ab = proximaAbertura(d);
      const abre = ab.quando === 'hoje' ? `abre às ${ab.h}h` : ab.quando === 'amanhã' ? `abre amanhã às ${ab.h}h` : `abre ${ab.quando} às ${ab.h}h`;
      setTxt(statusCurto, l.aberta ? `Aberta até ${l.fecha}h` : `Fechada · ${abre}`);
      setTxt(statusLongo, l.aberta ? `Aberta agora · fecha às ${l.fecha}h` : `Fechada agora · ${abre}`);
      statusBox.classList.toggle('fechada', !l.aberta);
      nav.classList.toggle('fechada', !l.aberta);
      diasLi.forEach((li) => li.dataset.dias && li.classList.toggle('hoje', li.dataset.dias.split(',').includes(String(d.getDay()))));
      nav.classList.toggle('com-fundo', s.y > heroFim - 40);
      let k = -1;
      toposNav.forEach((t, i) => { if (s.y + s.vh * 0.4 >= t) k = i; });
      linksNav.forEach((a, i) => a.classList.toggle('ativa', i === k));
    },
  });

  // ---------- 2. fornadas: painel de senha e a lista do dia ----------
  const senha = $('.senha'), ledG = $('[data-led-grande]'), ledF = $('[data-led-falta]');
  const fNome = $('[data-f-nome]'), lista = $('.lista-fornadas'), diaTitulo = $('.dia-titulo');
  let senhaTopo = 0, chaveLista = '';
  cenas.push({
    medir() { senhaTopo = topoDoc(senha); },
    atualizar(s) {
      const d = agora(), f = fornada(d);
      setTxt(fNome, f.prox.nome.toLowerCase());
      const chave = `${f.i}-${f.outroDia}-${Math.floor(f.falta / 60)}`;
      if (chave !== chaveLista) {
        chaveLista = chave;
        // a lista é do dia: hoje, ou o próximo dia aberto quando as fornadas de hoje acabaram
        const doDia = f.outroDia ? f.proxLista : f.lista;
        setTxt(diaTitulo, f.outroDia ? `${f.quando === 'amanhã' ? 'Amanhã' : f.quando[0].toUpperCase() + f.quando.slice(1)} no forno` : 'Hoje no forno');
        const ini = clamp(f.outroDia ? 0 : f.i - 1, 0, Math.max(0, doDia.length - 5));
        lista.innerHTML = doDia.slice(ini, ini + 5).map((x, k) => {
          const j = ini + k;
          let cls = '', est;
          if (f.outroDia) { cls = j === 0 ? 'proxima' : ''; est = f.quando; }
          else if (j < f.i) { cls = 'saiu'; est = 'saiu'; }
          else if (j === f.i) { cls = 'proxima'; const m = Math.floor(f.falta / 60); est = m >= 60 ? `em ${Math.floor(m / 60)}h${dois(m % 60)}` : `em ${Math.max(1, m)} min`; }
          else { const m = Math.round((x.h * 3600 - f.s) / 60); est = `em ${Math.floor(m / 60)}h${dois(m % 60)}`; }
          return `<li class="${cls}"><span class="lf-h">${x.h}h</span><span class="lf-nome">${x.nome}</span><span class="lf-est">${est}</span></li>`;
        }).join('');
      }
      // os números saem desde o começo (se só aparecessem perto da tela, a página "pularia" de altura)
      const hh = `${dois(f.prox.h)}:00`;
      const falta = f.falta >= 100 * 60 ? `${dois(Math.floor(f.falta / 3600))}:${dois(Math.floor(f.falta / 60) % 60)}` : `${dois(Math.floor(f.falta / 60))}:${dois(Math.floor(f.falta) % 60)}`;
      LED.aplicar(ledG, hh, `Próxima fornada às ${f.prox.h}h`);
      LED.aplicar(ledF, falta, 'Tempo que falta');
      if (Math.abs(senhaTopo - s.y) > s.vh * 1.6) return;
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

  // ---------- Natal: selo, prazo no painel de LED, horários de fim de ano e o fio de luzes ----------
  if (NATAL_ON) {
    const [mPrazo, dPrazo] = N.encomendasAte.split('-').map(Number), [mNatal, dNatal] = N.natal.split('-').map(Number);
    const anoDe = (d) => (d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear());
    const prazoDe = (d) => new Date(anoDe(d), mPrazo - 1, dPrazo, N.encomendasHora || 18, 0, 0);
    const natalDe = (d) => new Date(anoDe(d), mNatal - 1, dNatal);
    const abertas = (d) => d < prazoDe(d);
    const seloT = $('[data-selo-titulo]'), seloS = $('[data-selo-sub]');
    const prazoRot = $('[data-prazo-rot]'), prazoLed = $('[data-prazo-led]'), prazoUn = $('[data-prazo-un]'), prazoQuando = $('[data-prazo-quando]');
    const bloco = $('.natal-bloco'), fio = $('.fio', bloco);
    $('[data-horarios-natal]').innerHTML = N.horariosTexto.map(([dia, nome, h]) =>
      `<li class="${/fechado/i.test(h) ? 'fechado' : ''}"><span class="hn-dia">${dia}</span><span class="hn-nome">${nome}</span><b>${h}</b></li>`).join('');
    // fio de luzes: um fio que cai entre os ganchos, com lâmpadas quentes
    const LARG = 1200, ganchos = 8, lampadas = [];
    let caminho = 'M0 6';
    for (let g = 0; g < ganchos; g++) {
      const x0 = (g * LARG) / ganchos, x1 = ((g + 1) * LARG) / ganchos;
      caminho += `Q${(x0 + x1) / 2} 34 ${x1} 6`;
      for (let b = 1; b <= 3; b++) {
        const t = b / 4, x = x0 + (x1 - x0) * t, y = 6 + 2 * (1 - t) * t * 28 + 5;
        lampadas.push({ x, y, fase: (g * 3 + b) * 1.7 });
      }
    }
    fio.innerHTML = `<svg viewBox="0 0 ${LARG} 50" preserveAspectRatio="none"><path d="${caminho}" fill="none" stroke="#3A3036" stroke-width="1.4" vector-effect="non-scaling-stroke"/></svg>`
      + `<div class="lampadas">${lampadas.map((l) => `<i style="left:${(l.x / LARG) * 100}%;top:${l.y}px"></i>`).join('')}</div>`;
    const bulbos = $$('.lampadas i', fio);
    let blocoTopo = 0, chaveNatal = '';
    cenas.push({
      medir() { blocoTopo = topoDoc(bloco); },
      atualizar(s) {
        const d = agora(), aberto = abertas(d);
        const chave = `${aberto}-${d.getDate()}-${d.getHours()}-${d.getMinutes()}`;
        if (chave !== chaveNatal) {
          chaveNatal = chave;
          setTxt(seloT, aberto ? 'Encomendas de Natal abertas' : 'Horários de fim de ano');
          setTxt(seloS, aberto ? `Panetone e cestas até ${dPrazo}/${mPrazo}` : '24/12 até as 18h · 25/12 fechado');
          const diasNatal = Math.round((natalDe(d) - maisDias(d, 0)) / 86400000);
          if (aberto) {
            const falta = (prazoDe(d) - d) / 1000;
            setTxt(prazoRot, 'Encomendas fecham em');
            if (falta >= 86400) { LED.aplicar(prazoLed, String(Math.ceil(falta / 86400)).padStart(2, ' '), `${Math.ceil(falta / 86400)} dias`); setTxt(prazoUn, 'dias'); }
            else { LED.aplicar(prazoLed, `${dois(Math.floor(falta / 3600))}:${dois(Math.floor(falta / 60) % 60)}`, 'horas'); setTxt(prazoUn, 'horas'); }
            prazoQuando.innerHTML = `${DIAS[prazoDe(d).getDay()][0].toUpperCase() + DIAS[prazoDe(d).getDay()].slice(1)}, ${dPrazo}/${mPrazo}, às ${N.encomendasHora}h. Natal em <span>${diasNatal}</span> dias.`;
          } else {
            // depois do Natal o painel sai; ficam os horários de fim de ano
            prazoLed.closest('.natal-prazo').style.display = diasNatal > 0 ? '' : 'none';
            setTxt(prazoRot, 'Faltam para o Natal');
            LED.aplicar(prazoLed, String(Math.max(0, diasNatal)).padStart(2, ' '), `${diasNatal} dias`);
            setTxt(prazoUn, 'dias');
            prazoQuando.textContent = 'Encomendas encerradas. Panetone e chocotone seguem no balcão até 24/12.';
          }
        }
        if (Math.abs(blocoTopo - s.y) > s.vh * 1.6) return;
        // as lâmpadas piscam devagar, cada uma no seu tempo
        bulbos.forEach((b, i) => { b.style.opacity = (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(s.t * 1.3 + lampadas[i].fase))).toFixed(3); });
      },
    });
  }

  // ---------- entradas suaves de cada bloco (uma vez, quando chega na tela) ----------
  const blocos = $$('.secao .cab, .senha, .dia, .mapa, .horario, .encomenda-foto, .passos, .encomenda-texto .botao, .natal-prazo, .natal-horarios, .natal-acoes')
    .filter((b) => b.offsetParent !== null || getComputedStyle(b).display !== 'none');
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
