/* Padaria Quatro Horas — NATAL.
   Tudo o que é de Natal no site sai daqui: o selo da primeira tela, a aba "Natal" do cardápio,
   o bloco de encomendas e os horários de fim de ano.

   PARA DESLIGAR: troque  ligado: 'auto'  por  ligado: false  e salve. Pronto.
   Com 'auto', o Natal aparece sozinho de 'inicio' até 'fim' e some depois, todo ano.
   Para testar: index.html?natal=1 (liga) ou index.html?natal=0 (desliga). */
window.NATAL = {
  ligado: 'auto',          // 'auto' = só entre as datas abaixo · true = sempre · false = desligado
  inicio: '11-15',         // mês-dia em que o Natal aparece no site
  fim: '01-01',            // último dia (depois disso o site volta ao normal)
  encomendasAte: '12-20',  // último dia para encomendar
  encomendasHora: 13,      // até que horas desse dia (20/12 é domingo: a loja fecha às 13h)
  retirada: 'de 21 a 24/12',
  natal: '12-25',

  // horários especiais (mês-dia): [abre, fecha] ou null para fechado
  horarios: {
    '12-24': [6, 18],
    '12-25': null,
    '12-31': [6, 17],
    '01-01': null,
  },
  horariosTexto: [
    ['24/12', 'Véspera de Natal', '6h às 18h'],
    ['25/12', 'Natal', 'Fechado'],
    ['31/12', 'Véspera de Ano-Novo', '6h às 17h'],
    ['01/01', 'Ano-Novo', 'Fechado'],
  ],

  mensagemWhatsApp: 'Quero encomendar para o Natal:',

  // a aba do cardápio. marca: 'encomenda' (só sob encomenda) ou 'dezembro' (no balcão, só em dezembro)
  cardapio: {
    id: 'c-natal', titulo: 'Natal', nota: 'Só em dezembro. Encomendas até 20/12.', itens: [
      { nome: 'Panetone da casa, 500 g', desc: 'Fermentação natural de 36 horas, laranja cristalizada e uva-passa.', preco: '69,00', un: '', marca: 'dezembro' },
      { nome: 'Panetone da casa, 1 kg', desc: 'A mesma massa, no tamanho da mesa da família.', preco: '119,00', un: '', marca: 'encomenda' },
      { nome: 'Chocotone, 500 g', desc: 'Massa de panetone com gotas de chocolate meio amargo.', preco: '74,00', un: '', marca: 'dezembro' },
      { nome: 'Rabanada', desc: 'Pão francês da casa, leite, canela e açúcar.', preco: '6,50', un: 'a unidade', marca: 'datas', datas: ['12-23', '12-24'] },
      { nome: 'Pão de mel', desc: 'Mel, cravo e canela, coberto de chocolate meio amargo.', preco: '7,50', un: 'a unidade', marca: 'dezembro' },
      { nome: 'Pão de frutas', desc: 'Massa amanteigada com frutas secas e nozes.', preco: '48,00', un: '600 g', marca: 'dezembro' },
      { nome: 'Tender fatiado', desc: 'Assado aqui, com glaçado de laranja. Pronto para servir.', preco: '98,00', un: 'o quilo', marca: 'encomenda' },
      { nome: 'Cesta de Natal', desc: 'Panetone 500 g, 4 pães de mel, geleia de goiaba e café da casa.', preco: '189,00', un: '', marca: 'encomenda' },
    ],
  },
};
