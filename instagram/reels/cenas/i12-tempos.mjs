// Tempos do i12 (segundos), usados pela gravação (Node) e pelo Reels (navegador).
export const DURACAO = 45;

// toques: [tempo, elemento, { evento, nota }]
export const TOQUES = [
  [14.5, 'aba', { evento: 'toque-aba-natal', nota: 'toque na aba Natal do cardápio' }],
  [18.5, 'mais1', { evento: 'adicionar', nota: 'toque em Adicionar no panetone de 1 kg' }],
  [19.7, 'mais1', { evento: 'mais', nota: 'toque em + (2 panetones de 1 kg)' }],
  [21.0, 'mais2', { evento: 'adicionar', nota: 'toque em Adicionar no chocotone' }],
  [28.5, 'zap', { evento: 'toque-whatsapp', nota: 'toque em Encomendar pelo WhatsApp', soVisual: true }],
];

// textos: [entra, sai]
export const TEXTOS = {
  gancho: [0, 3.0],
  aba: [15.4, 17.9],
  itens: [19.2, 22.4],
  pedido: [24.8, 28.3],
  mensagem: [29.3, 33.8],
  mapa: [37.6, 40.3],
  convite: [40.8, 43.6],
  volta: [43.7, DURACAO],
};

// etapas para a trilha discreta
export const ETAPAS = [[0, 13.5, 0], [13.5, 29, 1], [29, 34, 2], [34, 40.5, 3], [40.5, DURACAO, 0]];
