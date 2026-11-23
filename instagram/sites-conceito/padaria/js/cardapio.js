/* Padaria Quatro Horas — o cardápio. Para mudar preço ou item, é só editar a lista abaixo.
   forno: nome que aparece na lista de fornadas (js/site.js); se a próxima é em até 90 min,
   o item ganha "sai às 16h" (se for em até 60 min). acabou: true mostra a plaquinha de letras "acabou". */
(function () {
  'use strict';
  const CARDAPIO = [
    { id: 'c-paes', titulo: 'Pães', nota: 'Pão francês sai toda hora cheia.', itens: [
      { nome: 'Pão francês', desc: 'Casca fina que estala, miolo branco e leve.', preco: '19,90', un: 'o quilo', forno: 'pão francês' },
      { nome: 'Pão italiano', desc: 'Fermentação natural de 24 horas, casca grossa.', preco: '24,90', un: 'o quilo', forno: 'pão italiano' },
      { nome: 'Baguete', desc: 'Massa de longa fermentação, crocante por fora.', preco: '9,00', un: 'a unidade', forno: 'baguete' },
      { nome: 'Pão de forma da casa', desc: 'Fatiado na hora. Sem conservante.', preco: '16,00', un: '500 g' },
      { nome: 'Bisnaguinha', desc: 'Macia, para o lanche da escola. Pacote com 10.', preco: '9,50', un: 'o pacote', forno: 'bisnaguinha' },
      { nome: 'Pão de leite', desc: 'Massa levemente doce, vem em 6.', preco: '12,00', un: 'o pacote', forno: 'pão de leite' },
      { nome: 'Broa de milho', desc: 'Fubá e erva-doce, receita mineira.', preco: '4,50', un: 'a unidade', forno: 'broa de milho' },
    ] },
    { id: 'c-salgados', titulo: 'Salgados', nota: 'Assados e fritos durante o dia.', itens: [
      { nome: 'Pão de queijo', desc: 'Polvilho azedo e queijo meia cura.', preco: '3,50', un: 'a unidade', forno: 'pão de queijo' },
      { nome: 'Coxinha de frango', desc: 'Massa de batata, frango desfiado e requeijão.', preco: '8,50', un: 'a unidade' },
      { nome: 'Esfirra de carne', desc: 'Aberta, com cebola e limão.', preco: '6,50', un: 'a unidade' },
      { nome: 'Empada de palmito', desc: 'Massa amanteigada que desmancha.', preco: '8,00', un: 'a unidade' },
      { nome: 'Misto quente', desc: 'No pão de forma da casa, na chapa.', preco: '13,00', un: '' },
      { nome: 'Pão na chapa', desc: 'Pão francês com manteiga, na chapa.', preco: '6,00', un: '' },
    ] },
    { id: 'c-doces', titulo: 'Doces e bolos', nota: 'Bolo inteiro sob encomenda.', itens: [
      { nome: 'Sonho de creme', desc: 'Recheio de creme de baunilha e açúcar por cima.', preco: '7,00', un: 'a unidade', forno: 'sonho', acabou: true },
      { nome: 'Bolo de fubá com goiabada', desc: 'Úmido, com pedaços de goiabada.', preco: '6,50', un: 'a fatia' },
      { nome: 'Bolo de cenoura', desc: 'Cobertura de chocolate que endurece.', preco: '7,00', un: 'a fatia' },
      { nome: 'Rosca de coco', desc: 'Coco fresco ralado e leite condensado.', preco: '22,00', un: 'a unidade', forno: 'rosca de coco' },
      { nome: 'Pudim de leite', desc: 'Calda de caramelo, sem furinhos.', preco: '9,00', un: 'a fatia' },
      { nome: 'Carolina', desc: 'Massa choux com doce de leite.', preco: '4,00', un: 'a unidade' },
    ] },
    { id: 'c-bebidas', titulo: 'Bebidas e café', nota: 'Café coado na hora.', itens: [
      { nome: 'Café coado', desc: 'Grão torrado em Minas, xícara de 150 ml.', preco: '4,50', un: '' },
      { nome: 'Pingado', desc: 'Café com um pouco de leite vaporizado.', preco: '5,50', un: '' },
      { nome: 'Média', desc: 'Copo americano, meio café, meio leite.', preco: '6,00', un: '' },
      { nome: 'Média com pão na chapa', desc: 'O café da manhã de balcão, até as 10h.', preco: '10,50', un: '' },
      { nome: 'Suco de laranja', desc: 'Espremido na hora, 300 ml.', preco: '9,00', un: '' },
      { nome: 'Chocolate quente', desc: 'Leite integral e chocolate meio amargo.', preco: '8,00', un: '' },
    ] },
  ];
  window.CARDAPIO = CARDAPIO;

  const { agora, proximaDe, suave, clamp, $, $$, topoDoc, setTxt, cenas, reduzir, dois } = window.QH;
  const letras = (txt) => [...txt].map((ch, i) => `<i style="--r:${(((i * 37) % 7) - 3) * 0.9}deg">${ch}</i>`).join('');

  // ---------- monta o cardápio ----------
  const menu = $('[data-menu]');
  menu.innerHTML = CARDAPIO.map((sec) => `
    <section class="menu-secao" id="${sec.id}" aria-labelledby="${sec.id}-t">
      <header class="menu-cab"><h3 id="${sec.id}-t">${sec.titulo}</h3><p>${sec.nota}</p></header>
      <ul class="itens">${sec.itens.map((it, k) => `
        <li class="item${it.acabou ? ' acabou' : ''}" data-forno="${it.forno || ''}">
          <div class="item-linha"><h4 class="item-nome">${it.nome}</h4><p class="item-preco"><span class="rs">R$</span> ${it.preco}</p></div>
          <div class="item-linha item-linha-2"><p class="item-desc">${it.desc}</p>${it.un ? `<p class="item-un">${it.un}</p>` : ''}</div>
          <p class="item-tag"></p>
        </li>`).join('')}
      </ul>
    </section>`).join('');
  $$('[data-letras]').forEach((el) => { el.innerHTML = letras(el.dataset.letras); });

  // ---------- marcas "sai às 16h" e "acabou" ----------
  const itens = $$('.item', menu);
  let chave = '';
  function marcar() {
    const d = agora(), c = `${d.getHours()}`;
    if (c === chave) return;
    chave = c;
    itens.forEach((li) => {
      const tag = li.querySelector('.item-tag'), produto = li.dataset.forno;
      const prox = produto ? proximaDe(produto, d) : null;
      if (li.classList.contains('acabou')) {
        tag.innerHTML = `<span class="tag tag-acabou">${letras('acabou')}</span><span class="tag-texto">volta ${prox ? `às ${prox.h}h` : 'amanhã'}</span>`;
        return;
      }
      const em = prox && !prox.amanha ? (prox.h * 60 - (d.getHours() * 60 + d.getMinutes())) : 1e9;
      tag.innerHTML = em <= 60 ? `<span class="tag tag-sai">sai às ${prox.h}h</span>` : '';
    });
  }

  // ---------- abas: pular de seção e saber onde está ----------
  const abas = $('.abas'), linksAba = $$('[data-aba]', abas), marcaAba = $('.abas-marca', abas);
  const secoes = $$('.menu-secao', menu), horaAgora = $('[data-hora-agora]');
  let topos = [], abaAtual = -1;
  linksAba.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const alvo = document.getElementById(a.dataset.aba);
    const desconto = (innerWidth >= 1024 ? 96 : 118);
    scrollTo({ top: topoDoc(alvo) - desconto, behavior: reduzir ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${a.dataset.aba}`);
  }));
  cenas.push({
    medir() { topos = secoes.map((s) => topoDoc(s)); abaAtual = -1; },
    atualizar(s) {
      marcar();
      const d = agora();
      setTxt(horaAgora, `${d.getHours()}h${dois(d.getMinutes())}`);
      // aba ativa: a última seção cujo topo já passou da linha das abas
      let k = 0;
      topos.forEach((t, i) => { if (s.y + s.vh * 0.32 >= t) k = i; });
      if (k !== abaAtual) {
        abaAtual = k;
        linksAba.forEach((a, i) => a.classList.toggle('ativa', i === k));
        const a = linksAba[k];
        marcaAba.style.width = `${a.offsetWidth}px`;
        marcaAba.style.transform = innerWidth >= 1024 ? `translate3d(0, ${a.offsetTop}px, 0)` : `translate3d(${a.offsetLeft}px, 0, 0)`;
        marcaAba.style.height = innerWidth >= 1024 ? `${a.offsetHeight}px` : '';
        if (innerWidth < 1024 && abas.scrollWidth > abas.clientWidth) abas.scrollLeft = Math.max(0, a.offsetLeft - 16);
      }
      // os itens entram com a rolagem (só ao chegar na parte de baixo da tela; lidos, ficam parados)
      if (reduzir) return;
      itens.forEach((li) => {
        const t = li._t ?? (li._t = topoDoc(li));
        const e = suave(s.vh * 1.0, s.vh * 0.84, t - s.y);
        if (li._e === e) return;
        li._e = e;
        li.style.opacity = (0.0 + e).toFixed(3);
        li.style.transform = e >= 1 ? '' : `translate3d(0, ${((1 - e) * 14).toFixed(2)}px, 0)`;
      });
    },
  });
  const medirOriginal = cenas[cenas.length - 1].medir;
  cenas[cenas.length - 1].medir = function () { itens.forEach((li) => { li.style.transform = ''; li._t = undefined; li._e = undefined; }); medirOriginal(); };
})();
