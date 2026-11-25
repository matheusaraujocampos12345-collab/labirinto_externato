# Site MACH Estúdio

Site oficial da MACH: estático, sem back-end. Abra `index.html` num servidor qualquer e pronto.
Feito primeiro para o celular, com menu fixo, seções curtas e o pedido de orçamento pelo WhatsApp.

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Todos os textos, na ordem da página. |
| `styles.css` | Cores, fontes e visual do site (menos a primeira tela). |
| `main.js` | Configuração (WhatsApp, Instagram, chave da Equus), menu do celular, vídeos, pedido e o jatinho do rodapé. |
| `primeira-tela.css` e `primeira-tela.js` | A primeira tela, num componente separado (veja abaixo). |
| `assets/` | Imagens, vídeos leves dos trabalhos, ícone e imagem de compartilhamento. |

## A ordem da página

| # | Seção | O que tem |
|---|---|---|
| 1 | Primeira tela | Túnel de anéis (ondas de choque) e riscos de ar em volta de um celular com o site da Equus. Tudo se mexe sozinho; na rolagem o túnel acelera e o celular vem para a frente. Depois de 1 tela de rolagem, uma onda de choque laranja passa e revela o grafite do site. Título, uma linha e os botões "Pedir orçamento" e "Ver trabalhos". |
| 2 | O que fazemos | Institucional, landing page, portfólio e cardápio ou catálogo, em cartões claros, com uma frase cada. |
| 3 | Trabalhos | Equus Genetics (**cliente real**), Padaria Quatro Horas e Barbearia Navalha (**conceitos**). Um vídeo curto de cada, uma vez só. |
| 4 | Como funciona (clara) | 4 passos: conversa, orçamento, desenho e construção, no ar. |
| 5 | O que está incluso | Multiplataforma, animação sob medida, carregamento rápido, WhatsApp e Instagram, ajuda com domínio e hospedagem. |
| 6 | Dúvidas (clara) | 6 perguntas em sanfona (abrir uma fecha a outra). |
| 7 | Pedido | Formulário curto que monta o cartão de embarque (claro) e abre o WhatsApp com a mensagem pronta, ou copia o texto para o direct. |
| 8 | Rodapé | O jatinho escreve MACH no céu (com o Λ laranja), contato e links. |

## A primeira tela (componente para trocar)

Fica em três lugares, todos marcados com "PRIMEIRA TELA":
- o bloco entre `<!-- PRIMEIRA TELA · início -->` e `<!-- PRIMEIRA TELA · fim -->` no `index.html`;
- `primeira-tela.css`;
- `primeira-tela.js`.

Para trocar a primeira tela, substitua só essas três partes. O resto do site não depende delas.

Como funciona:
- **Parada:** os anéis avançam e pulsam devagar, passam riscos de ar, o celular flutua e gira de leve e um brilho percorre a borda dele.
- **Rolando:** a seção tem 2 telas de altura e o palco fica preso durante 1 tela. O túnel acelera, o celular vai para o centro e vem na direção da câmera, e no fim uma onda de choque laranja revela o grafite do site.
- **Mouse (computador):** anéis e celular se mexem de leve com o mouse. **Toque (celular):** um toque dá um impulso no túnel e puxa a perspectiva para o lado tocado.
- É tudo em canvas 2D e CSS, sem WebGL e sem biblioteca. Sem JavaScript, a mesma composição aparece parada, com os anéis em CSS. Com "menos movimento" ligado no aparelho, nada prende a rolagem e tudo fica parado.
- **Modo leve automático:** se o aparelho não segurar o ritmo nos primeiros segundos, o túnel baixa a resolução e o número de riscos. O desenho continua o mesmo.

## Onde mudar as coisas

**WhatsApp, Instagram e a chave da Equus:** no começo do `main.js`.

```js
const CONFIG = {
  whatsapp: '5511939045618',   // DDI + DDD + número, só dígitos
  instagram: 'mach.sites',
  mostrarEquus: true,          // false = tira a Equus do site
};
```

O número aparece também no `index.html` (menu, botão do pedido e rodapé), como texto e como reserva caso o JavaScript não carregue. Se trocar o número, procure `5511939045618` e `93904-5618` nos dois arquivos.

**Equus Genetics (cliente real):** com `mostrarEquus: false`, a Equus some da primeira tela e dos trabalhos. A primeira tela passa a mostrar a Padaria Quatro Horas (conceito) e o texto dos trabalhos muda sozinho.
O navegador ainda baixa a imagem do celular da Equus (46 KB), porque ela é a primeira imagem da página, mas ela não aparece. Para tirar de vez, apague também `assets/equus-celular.*` e `assets/trabalho-equus*`.

**Textos:** direto no `index.html`. Procure a frase e troque.

**Cores (60/30/10):** no começo do `styles.css`:

```css
--fundo: #16181b;   /* 60% · grafite, o fundo da maior parte do site */
--texto: #e9ecef;   /* texto sobre o grafite */
--apoio: #9ba1a8;   /* texto de apoio sobre o grafite */
--claro: #f4f2ee;   /* 30% · off-white: cartões de serviço, "Como funciona", "Dúvidas", cartão do pedido */
--tinta: #111214;   /* texto sobre o off-white */
--apoio-claro: #5f636a; /* texto de apoio sobre o off-white */
--laranja: #ff6b1a; /* 10% · botões, Λ, selos e pequenos destaques */
--laranja-texto: #c2410a; /* laranja para texto pequeno sobre o off-white (contraste AA) */
```

Para trocar uma seção de cor, basta pôr ou tirar a classe `clara` dela no `index.html`.
O texto dos botões laranja é escuro (#111214), porque branco sobre o laranja não tem contraste suficiente.
A primeira tela usa um grafite quase preto (#0D0E10), definido em `primeira-tela.css`.

**Fontes:** Saira (títulos), Hanken Grotesk (texto) e JetBrains Mono (só em rótulos pequenos), do Google Fonts.

## Vídeos dos trabalhos

Versões leves (720p, sem som, em loop), feitas a partir dos Reels:

| Arquivo | Origem | Tamanho |
|---|---|---|
| `assets/trabalho-equus.mp4` | `instagram/reels/i13-equus-tela-cheia.mp4` (inteiro, 16,5 s) | 1,7 MB |
| `assets/trabalho-padaria.mp4` | `instagram/reels/i12-padaria-em-uso.mp4` (0 a 34 s, sem o convite final) | 1,6 MB |
| `assets/trabalho-navalha.mp4` | `instagram/reels/i02-o-site-que-todo-mundo-tem.mp4` (6,5 a 17,5 s, só a Navalha) | 0,3 MB |

Cada vídeo só é baixado quando a pessoa chega perto dele, toca sem som quando está na tela e para quando sai. Há um botão para pausar.
Para gerar de novo (exemplo da Equus):

```bash
ffmpeg -i instagram/reels/i13-equus-tela-cheia.mp4 -an -vf scale=720:1280 -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart site-mach/assets/trabalho-equus.mp4
```

## O que o dono pode completar depois

O site não mostra números que não temos. Quando houver, dá para acrescentar:
- **preço inicial** ("a partir de R$ …"), na seção "O que está incluso" e na pergunta "Quanto custa?";
- **prazo médio** ("em média … semanas"), na pergunta "Quanto tempo leva?";
- **novos clientes reais** em "Trabalhos", com autorização de cada um;
- **depoimentos** de clientes, se houver.

## Rápido e leve

Medido num celular simulado (390×844, rede de 1,6 Mbps com 150 ms de atraso):
- texto na tela em cerca de 1,2 s;
- a primeira carga é de cerca de 280 KB (115 KB do site e 165 KB de fontes);
- a página inteira, sem os vídeos, tem cerca de 390 KB. Os 3 vídeos somam 3,5 MB e só são baixados se a pessoa rolar até eles.

Fluidez da primeira tela, medida num navegador de teste sem placa de vídeo (num aparelho de verdade tende a ser melhor):
- celular 390×844: 60 fps parado e rolando;
- celular 390×844 com o processador 4 vezes mais lento: 59 a 60 fps;
- celular 360×640 com o processador 4 vezes mais lento: 48 a 57 fps;
- computador 1440×900 em tela de alta resolução: cerca de 53 fps.

## Como publicar (grátis)

- **Netlify Drop:** entre em app.netlify.com/drop e arraste a pasta `site-mach`. Em segundos o site está no ar com um endereço; depois dá para ligar um domínio próprio.
- **Vercel:** importe o repositório e defina `site-mach` como pasta raiz.
- **GitHub Pages:** coloque o conteúdo desta pasta num repositório próprio (ou na pasta `docs/`) e ative Pages nas configurações.

Depois de publicar, troque `content="assets/og-mach.jpg"` no `index.html` pelo endereço completo
(ex.: `https://seudominio.com.br/assets/og-mach.jpg`) para a prévia aparecer bonita no WhatsApp e no Instagram.

## Base

- Fontes do Google Fonts (licença OFL): Saira, Hanken Grotesk e JetBrains Mono.
- Nenhuma biblioteca. Todo o código (túnel de anéis, menu, vídeos, pedido, jatinho) é próprio, sem template.
