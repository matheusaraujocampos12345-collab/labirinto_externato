# Casca & Miolo — site-conceito de padaria

Episódio 1 da série **"Feito para…"** da MACH Estúdio. Padaria fictícia, site de verdade.

**Para ver:** abra o `index.html` com dois cliques. Funciona sem internet: fontes, desenhos e código estão todos nesta pasta.

## O que tem no site
- **Primeira tela:** forno de lenha, pá e pão de fermentação natural pintados em WebGL (sem fotos). O vapor se mexe com o tempo e entorta com a velocidade da rolagem; rolando, o pão vem para perto.
- **Vitrine que se monta:** nove itens desenhados entram nas prateleiras conforme a rolagem. O sonho aparece como "acabou".
- **Próxima fornada:** relógio ao vivo com a hora do aparelho (fornada a cada 40 min, das 5h40 às 19h). De madrugada mostra o horário da primeira fornada. Botão "Me avise 5 min antes".
- **Da casca ao miolo:** corte do pão com as bolhas crescendo e a paleta de cores que saiu do pão.
- **Encomenda pelo WhatsApp** (link `https://wa.me/`, sem número) e **mapa desenhado** com o caminho até a porta, horário e "Copiar endereço".
- Celular, tablet e computador. Respeita quem desliga animações no aparelho.

## Arquivos
- `index.html`, `css/site.css`, `js/forno.js` (a pintura da primeira tela), `js/vitrine.js` (itens do balcão), `js/site.js` (movimento, relógio, mapa)
- `fontes/`: Fraunces, Instrument Sans e DM Mono (licença OFL, ver `fontes/LEIA-ME.txt`)
- `captura/`: vídeo, quadros, paleta, etapas e decisões para o Instagram
- `ferramentas/`: scripts de captura e de medição das cores

## Gerar as capturas de novo
Precisa de Node 18+, Playwright com Chromium e ffmpeg. Na pasta do site:

```bash
node ferramentas/filmar.mjs     # captura/rolagem-bruta.mp4 (1080x1920, 30 fps, 19,5 s, sem áudio)
node ferramentas/quadros.mjs    # captura/quadros/*.jpg (1080x1350) e captura/primeira-tela-1080x1920.jpg
```

A captura usa o modo `index.html?captura=1`: a página expõe `window.__quadro(t, y)` e cada quadro é desenhado a partir do tempo e da rolagem, sem depender do relógio, então sai igual toda vez. Nesse modo a hora é fixa (quarta, 15h27) para o relógio mostrar "12 min". `&paleta=1` mostra os códigos das cores.

Rodapé obrigatório: "Site-conceito por MACH Estúdio · @mach.sites · negócio fictício".
