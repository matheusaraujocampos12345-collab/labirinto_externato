# Padaria Quatro Horas — site-conceito (versão 2)

Episódio 1 da série **"Feito para…"** da MACH Estúdio. Padaria fictícia, site de verdade.

**Para ver:** abra o `index.html` com dois cliques. Funciona sem internet: vídeo, fontes, desenhos e código estão todos nesta pasta.

## A direção
**A padaria que acorda às 4h.** O site acontece de madrugada: o letreiro de neon aceso na rua escura, a luz do forno, o bairro com os postes acesos e a turma que bate o ponto antes do sol.
Padaria de bairro não vende "experiência artesanal". Vende pão quente na hora certa, e o site mostra isso com objetos que o cliente já conhece do balcão.

O que nenhum template teria:
- o **letreiro de neon** desenhado traço a traço, com o tubo apagado ligando as letras;
- o **painel de senha de LED** com os números desenhados à mão (liga fazendo o teste 88:88);
- o **cardápio de letras de encaixe**, montado letra por letra com a rolagem;
- o **cartão de ponto** carimbando 03:40, 04:00, 04:30;
- a **plaquinha de preço espetada no pão** e o **saco de pão com a comanda grampeada**.

## O vídeo da primeira tela
- **Arquivo:** "Taking bread out of the oven", do Coverr, enviado em 09/10/2020: https://coverr.co/videos/taking-bread-out-of-the-oven-5wqvt1ulxt
- **Licença:** Coverr License (https://coverr.co/license). Uso grátis em projetos comerciais e pessoais, sem precisar dar crédito, e pode editar. Não pode revender nem redistribuir o arquivo do jeito que veio.
- Por isso o mp4 original **não fica no repositório**. O site usa só 96 quadros recortados, com a cor corrigida e comprimidos em WebP: `video/v/` (608×1080, celular e tablet em pé, 1,7 MB) e `video/h/` (1280×720, computador, 2,1 MB). O navegador baixa só o conjunto da tela dele.
- O trecho usado vai de 0,9 s a 9,8 s do clipe: a mão puxa a assadeira e o pão chega na luz. O vídeo anda para a frente e para trás com a rolagem. Os quadros carregam em etapas (1 a cada 32, depois 1 a cada 16 e assim por diante), então a tela nunca fica vazia.
- Para gerar de novo: `python3 ferramentas/preparar_video.py` (baixa o clipe para uma pasta temporária).
- **Num cliente real**, o vídeo seria filmado no forno do próprio cliente, com o pão dele, de madrugada. Um vídeo de banco serve só para o conceito.

## Fontes
Bungee (títulos), Familjen Grotesk (texto) e Tilt Neon (placa PÃO QUENTE), todas com licença OFL (ver `fontes/LEIA-ME.txt`). O logotipo e os números de LED não usam fonte: são desenhados à mão em SVG (`js/marca.js` e `js/led.js`).

## O que tem no site
1. **Primeira tela:** vídeo do pão saindo do forno, letreiro de neon, painel com a próxima fornada, placa PÃO QUENTE e plaquinha de preço.
2. **Próxima fornada:** painel de senha ao vivo com a hora do aparelho (fornada toda hora cheia, das 6h às 19h), régua do dia e botão "Me avisa 5 min antes".
3. **Cardápio:** quadro de letras com preço de hoje e o bilhete de "acabou" no sonho.
4. **A turma da madrugada:** cartão de ponto de quem acende o forno.
5. **Encomenda pelo WhatsApp** (`https://wa.me/`, sem número), com o saco de pão e a comanda.
6. **Endereço:** mapa do bairro de madrugada, desenhado à mão, com o caminho até a porta, o horário e "Copiar endereço".
7. Rodapé: "Site-conceito por MACH Estúdio · @mach.sites · negócio fictício".

Funciona em celular (em pé e deitado), tablet e computador, e respeita quem desliga as animações no aparelho.

## Arquivos
- `index.html`, `css/site.css`, `js/` (`marca.js` logotipo, `led.js` números, `filme.js` vídeo quadro a quadro, `site.js` motor e primeira tela, `secoes.js` demais seções)
- `video/` (quadros do vídeo), `fontes/`
- `captura/` (entregas para o Instagram), `ferramentas/` (scripts)
- `_v1/`: a primeira versão (Casca & Miolo), guardada só como histórico.

## Gerar as capturas de novo
Precisa de Node 18+, Playwright com Chromium, ffmpeg e Python 3 com numpy e Pillow. Na pasta do site:

```bash
node ferramentas/filmar.mjs        # captura/rolagem-bruta.mp4 (1080x1920, 30 fps, 20 s, sem áudio)
python3 ferramentas/montar_paleta.py && node ferramentas/quadros.mjs   # captura/quadros/*.jpg e a primeira tela em 1080x1920
```

A captura usa `index.html?captura=1`: a página expõe `window.__quadro(t, y)` e cada quadro sai do tempo e da rolagem, sem depender do relógio. Por isso sai igual toda vez. Nesse modo a hora fica fixa (quarta, 15h47), para o painel mostrar "16:00, faltam 12 min".
