# Padaria Quatro Horas — site-conceito

Episódio 1 da série **"Feito para…"** da MACH Estúdio. Padaria fictícia, site de verdade.

**Para ver:** abra o `index.html` com dois cliques. Funciona sem internet: vídeo, fontes, desenhos e código estão todos nesta pasta.

## A direção
**A padaria que acorda às 4h.** O letreiro de neon aceso no escuro, a luz do forno e o bairro com os postes acesos contam que o pão começa antes do sol.
Padaria de bairro não vende "experiência artesanal": vende pão quente na hora certa. Cada seção tem uma função para o cliente: ver o pão, saber a próxima fornada, escolher no cardápio, chegar até a loja e pedir.

Detalhes que nenhum template teria: o **letreiro de neon** desenhado traço a traço, o **painel de senha de LED** com os números desenhados à mão, a **plaquinha de preço espetada no pão** e a plaquinha de letras de encaixe que marca o que **acabou** no cardápio.

## O vídeo da primeira tela
- **Arquivo:** "Taking bread out of the oven", do Coverr, enviado em 09/10/2020: https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt
- **Licença:** Coverr License (https://coverr.co/license). Uso grátis em projetos comerciais e pessoais, sem precisar dar crédito, e pode editar. Não pode revender nem redistribuir o arquivo do jeito que veio.
- Por isso o mp4 original **não fica no repositório**. O site usa 96 quadros WebP com a cor corrigida:
  - `video/m/` (1080×608): celular e tablet, 1,9 MB;
  - `video/h/` (1440×810): computador, 2,5 MB;
  - `video/b/` (192×108): o mesmo quadro desfocado, que preenche o resto da tela, 0,4 MB.
  O navegador baixa só o conjunto da tela dele. Os quadros carregam em etapas (1 a cada 32, depois 1 a cada 16 e assim por diante), então a tela nunca fica vazia.
- **O quadro aparece sempre inteiro (16:9).** No celular ele ocupa a largura da tela e o resto é o próprio vídeo desfocado e escurecido, então a mão, a assadeira e o pão nunca são cortados. O trecho usado vai de 0,9 s a 8,3 s, num plano só: a mão puxa a assadeira e o pão chega na luz. O vídeo anda para a frente e para trás com a rolagem.
- A foto da seção de encomendas é um quadro do segundo plano do mesmo vídeo (9 s, o pão soltando vapor).
- Para gerar de novo: `python3 ferramentas/preparar_video.py` (baixa o clipe para uma pasta temporária).
- **Num cliente real**, o vídeo seria filmado no forno do próprio cliente, com o pão dele, de madrugada. Um vídeo de banco serve só para o conceito.

## Fontes
Familjen Grotesk em todo o texto, Bungee só no preço da plaquinha e Tilt Neon na placa PÃO QUENTE. Todas com licença OFL (ver `fontes/LEIA-ME.txt`). O logotipo e os números de LED não usam fonte: são desenhados à mão em SVG (`js/marca.js` e `js/led.js`).

## O que tem no site
1. **Primeira tela:** o pão saindo do forno, letreiro de neon, painel com a próxima fornada, placa PÃO QUENTE e plaquinha de preço.
2. **Fornadas:** painel de senha ao vivo com a hora do aparelho (fornada toda hora cheia, das 6h às 19h), a lista do dia e o botão "Avise 5 min antes da próxima".
3. **Cardápio:** Pães, Salgados, Doces e bolos, e Bebidas e café, com 6 a 7 itens cada. Cada item tem nome, descrição curta, preço e unidade. As abas pulam de seção (no celular ficam presas no alto; no computador, na coluna da esquerda) e mostram onde a pessoa está. O que sai na próxima hora ganha "sai às 16h", e o que acabou ganha a plaquinha "acabou". Para mudar preço ou item, edite a lista no começo de `js/cardapio.js`.
4. **Como chegar:** mapa do bairro desenhado à mão, com o caminho até a porta, o horário, WhatsApp e "Copiar endereço".
5. **Encomendas:** três passos e o botão "Pedir pelo WhatsApp" (`https://wa.me/`, sem número).
6. Rodapé com endereço, horário, encomendas e a linha "Site-conceito por MACH Estúdio · @mach.sites · negócio fictício".

Funciona em celular (em pé e deitado), tablet e computador, e respeita quem desliga as animações no aparelho. As animações têm função: o vídeo anda com a rolagem, a aba do cardápio acompanha a seção, os itens e blocos entram de leve ao chegar na tela e o caminho do mapa se desenha uma vez.

## Arquivos
- `index.html`, `css/site.css`
- `js/marca.js` (logotipo), `js/led.js` (números do painel), `js/filme.js` (vídeo quadro a quadro), `js/site.js` (motor e primeira tela), `js/cardapio.js` (itens e abas), `js/secoes.js` (fornadas, mapa e encomenda)
- `video/`, `foto/` e `fontes/`
- `captura/` (entregas para o Instagram) e `ferramentas/` (scripts)
- `_v1/`: a primeira versão (Casca & Miolo), guardada só como histórico.

## Gerar as capturas de novo
Precisa de Node 18+, Playwright com Chromium, ffmpeg e Python 3 com numpy e Pillow. Na pasta do site:

```bash
node ferramentas/filmar.mjs        # captura/rolagem-bruta.mp4 (1080x1920, 30 fps, 20 s, sem áudio)
python3 ferramentas/montar_paleta.py && node ferramentas/quadros.mjs   # captura/quadros/*.jpg e a primeira tela em 1080x1920
```

A captura usa `index.html?captura=1`: a página expõe `window.__quadro(t, y)` e cada quadro sai do tempo e da rolagem, sem depender do relógio, então sai igual toda vez. Nesse modo a hora fica fixa (quarta, 15h47), para o painel mostrar "16:00, faltam 12 min".

As capturas em `captura/etapas/` são da construção da primeira tela da versão anterior e ficaram como registro.
