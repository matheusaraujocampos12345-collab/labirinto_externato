# Projetos da MACH — o que existe e o que falta

## Pronto
| Peça | Onde | Como gerar de novo |
|---|---|---|
| Vídeo publicitário 30 s (9:16) | `video-anuncio/anuncio-mach-30s.mp4` | `cd video-anuncio && npm run build` (config em `config.js`) |
| Logo (SVG/PNG, avatar, favicon) | `marca-mach/` | `python3 marca-mach/gerar_logo.py` e `node marca-mach/exportar_png.mjs` |
| Site-vitrine (estático) | `site-mach/` | abrir `index.html` num servidor. Guia em `site-mach/README.md` |
| Carrossel "Por que MACH" (6 slides) | `carrossel-sobre/slides/` | `node carrossel-sobre/gerar.mjs` (já postado) |
| Carrossel "5 sinais de cara de template" (7 slides) | `carrossel-sinais/slides/` | `node carrossel-sinais/gerar.mjs` |
| Anúncio do lançamento: teaser 16 s + capa | `anuncio-lancamento/teaser-lancamento-9x16.mp4` | `python3 anuncio-lancamento/teaser.py` (cenas em `anuncio-lancamento/cenas/`) |
| Anúncio do lançamento: post e story estáticos (versão antiga) | `anuncio-lancamento/*.png` | `node anuncio-lancamento/gerar.mjs` |
| "Silêncio de rádio": post + story animado | `anuncio-silencio/` | `node anuncio-silencio/gerar.mjs` |
| Fábrica de carrosséis (texto → slides) | `instagram/fabrica/carrossel.mjs` | ver `instagram/README.md` |
| Calendário e robô de publicação | `instagram/calendario.json`, `instagram/publicar.mjs` | `node instagram/publicar.mjs --testar` |
| Piloto automático (a cada hora) | `.github/workflows/instagram-publicar.yml` | roda no GitHub depois de configurar os segredos |
| Reels "12 animações de site", partes 1, 2 e 3 (27 s cada) | `instagram/reels/i15-…`, `i16-12-animacoes-de-site-parte-2.mp4`, `i17-12-animacoes-de-site-parte-3.mp4` | `node instagram/reels/motor/render.mjs instagram/reels/cenas/i16.js` (ou `i17.js`) |

Propostas de marca publicadas como páginas (claude.ai, privadas): Talhe, Macte e Mach. A escolhida foi a **Mach**.

## Pendente

### Site-conceito da padaria (ramo próprio)
- **Padaria Quatro Horas**, "a padaria que acorda às 4h". Fica em `instagram/sites-conceito/padaria/`; a versão anterior, recusada, está em `_v1/`.
- **Ramo:** `padaria-quatro-horas`, a pedido do dono (23/11). Mudanças no site da padaria são feitas nesse ramo e só entram na `main` quando ele aprovar.
- **Link para ver o site:** https://claude.ai/artifact/2EPqk3jUE1aUCUoFCp2fEL (privado). Para atualizar, publicar de novo a partir de uma cópia dos arquivos do site em `site/`.
- **Vídeo do forno:** do Coverr, com licença de uso comercial. O mp4 original não fica no repositório, só os quadros editados.

### Ideias para depois
- **Site de venda de medalhas** (ideia do dono, 24/11): animações de gente correndo e recebendo medalha, com "coisas absurdas" de movimento. Pode virar o próximo site-conceito ("Feito para…") ou um cliente real.

### 0. Pauta de conteúdo
- **Rodada 1 (23/11):** o dono aprovou as 23 ideias e a rotina, sem ajustes. Os dados estão em `instagram/pauta/pauta-r1.json`.
- **Rodada 2 (23/11, em aprovação):** as peças prontas da semana 1, publicadas no mesmo link. Os ids das respostas são `p-<id>` e o do calendário é `calendario-s1`. Para gerar de novo: `python3 instagram/pauta/gerar_rodada2.py <pasta>/previas && python3 instagram/pauta/montar.py`, depois publicar `pauta-mach.html` com `root=<pasta>` e os arquivos de `previas/`.
- **Peças prontas da semana 1:**
  - Reels em `instagram/reels/`: i01, i02, i03, i04, i05, i06 e i11 (mp4, capa e prévia), com o motor em `instagram/reels/motor/`.
  - Carrosséis em `instagram/posts/`: raio-x-primeira-tela, checklist-contratar-site, mito-animacao-lenta e feito-para-padaria.
  - Fotos: manifesto e quadro-heroi-padaria.
  - Stories em `instagram/stories/semana-1/`.
  - Site-conceito "Casca & Miolo" em `instagram/sites-conceito/padaria/`.
- **Mudança feita pelo Claude, a confirmar com o dono na rodada 2:** o i11 deixou de ser "60 minutos contra o relógio" e virou "Do zero à primeira tela", sem cronômetro.
- **Calendário da semana 1:** manifesto no domingo 29/11 às 19h. De segunda 30/11 a sábado 05/12, conforme a tabela da página. A foto da padaria fica de reserva para a semana 2.
- **Formato que mais deu alcance (26/11):** o i15 ("12 animações de site", gancho "Comenta PROMPT") teve mais visualizações e mais interações de quem não segue. O dono pediu para seguir nessa linha. Foram feitos o **i16 (parte 2)** e o **i17 (parte 3)**, cada um com 12 efeitos novos, para postar em 27/11 às 12h e às 19h (o dono posta com música). A moldura comum (selo, título, janela, lista e fecho) está em `instagram/reels/cenas/catalogo.js`: uma parte nova só precisa dos 12 efeitos. Prompts: `instagram/prompts/12-animacoes-de-site-parte-2.md` e `-parte-3.md`, com os .txt em `instagram/prompts/txt/parte-2/` e `parte-3/` e um .txt com todos de cada parte.

- **Referências de vídeo (26/11, em aprovação):** 12 formatos de vídeo com tecnologia (efeito explicado, site 3D com IA, comenta a palavra, antes e depois, certo × errado, dica de código, lista de ferramentas, animação explicativa, tipografia animada, construção acelerada, análise de site, humor), com 34 links de exemplo. Página (privada): https://claude.ai/artifact/GaPU4FSTL2RrncMnBypCie. Cópia em `instagram/pauta/referencias-video.html`. As respostas ficam na coleção `formatos` (doc = id do formato, campos `decisao` aprovar|talvez|nao e `nota`); ler com ArtifactData. Esta sessão não alcança TikTok nem YouTube: só alguns números de alcance foram confirmados pela busca; o resto está como "não conferido". Conferir pela Apify custa centavos, mas precisa do ok do dono.
- **Resultado (26/11):** o dono aprovou os 12 formatos, sem comentários. Primeiros vídeos feitos no mesmo dia, sem filmar ninguém: **i18** (errado × certo 01: botão do WhatsApp), **i19** (como um site abre em 1 segundo) e **i20** (antes e depois, Doceria Laço, fictícia, com "Comenta SITE"). Celular e site fictício em `instagram/reels/cenas/celular.js`; roteiros em `instagram/reels/roteiros-finais.md`. Faltam: efeito explicado, site 3D com IA, dica de código, lista de ferramentas, tipografia animada, construção acelerada, análise de site e humor (os dois últimos funcionam melhor com o dono na câmera ou na voz).

- **Rotina de postagens (26/11, em aprovação):** página https://claude.ai/artifact/8RqyQicJrNfc9jvwPBQCJe (cópia em `instagram/pauta/rotina-postagens.html`). Semana-modelo (versão 2, a pedido do dono: 3 por dia): 16 posts (12 Reels, 4 carrosséis), de segunda a sexta às 9h, 12h e 19h, e sábado às 11h. O das 9h é o **Efeito do dia**: um efeito por vez dos vídeos de 12 animações (36 prontos = 7 semanas), Reels de 8,1 s em loop com "Comenta PROMPT", gerado por `cenas/efeito-do-dia.js` (arquivos `cenas/efeito-do-dia/e01.js` a `e36.js`; saída em `instagram/reels/efeito-do-dia/`). Teste de 2 semanas: se o alcance por post cair muito até 12/12, volta para 2 por dia. Domingo do dono passa a ~50 min (ou o robô posta os efeitos sem música). Fixos: seg 19h e sex 19h "12 animações" (Comenta PROMPT); ter 12h errado × certo; ter 19h antes e depois (Comenta SITE); qua 19h efeito explicado; qui 12h animação explicativa; sex 12h efeito explicado ou site 3D com IA; carrosséis seg 12h, qua 12h, qui 19h e sáb 11h. Ciclo: quinta o Claude produz a semana seguinte; sexta o dono aprova; sábado o Claude monta o calendário (robô = carrosséis) e o kit dos Reels; domingo o dono agenda os 7 Reels no app, com música (≈30 min); segunda o dono manda prints dos insights. Dia do dono: responder comentários na primeira hora depois das 12h e das 19h (mensagens prontas para PROMPT e SITE na página), 20 mensagens de prospecção às 19h30 e 2 ou 3 stories. Próximas semanas propostas: 27/11 i16 (12h) e i17 (19h); 01/12 19h i20; 03/12 12h i18; 10/12 12h i19; semana de 07/12 com 9 peças a produzir a partir de 03/12. Respostas na coleção `decisoes` (grade, dia, semana-1, semana-2). Depois do ok: atualizar `calendario.json` na `main`.

#### Rodada 1 (histórico)
- Pesquisa de formatos virais (TikTok, Instagram, YouTube) feita em 22/11/2026. Resumo e links em `instagram/pauta/gerar_pauta.py`.
- Página de aprovação (privada): https://claude.ai/artifact/89mfWgXYLJCoRe3amwfzrm. O dono marca Aprovar, Ajustar ou Não gostei em cada ideia e na rotina. As respostas ficam na coleção `respostas` da página (ler com a ferramenta ArtifactData).
- Rotina proposta: 2 posts por dia de segunda a sexta (12h e 19h), 1 no sábado, stories todo dia. 7 Reels + 4 carrosséis por semana. Começo na segunda 30/11 (01/12 é terça).
- Quadros: Isso é um site, Caixa-preta, Feito para…, Em 30 segundos, Template × sob medida, Raio-X, Pra salvar, Seu site em 3 detalhes, Barreira do som, Bancada (stories).
- 23 ideias (11 Reels, 6 carrosséis, 2 fotos, 4 stories). Depois da aprovação: produzir as peças, mandar para nova aprovação e montar o calendário.
- Para mudar a página: editar `instagram/pauta/gerar_pauta.py` (conteúdo) ou `pagina.html` (visual), rodar `python3 gerar_pauta.py && python3 montar.py` e publicar `pauta-mach.html` no mesmo link.
- Atenção: a publicação automática não põe música da biblioteca do Instagram nem stickers. Reels com música e stories com enquete ficam no modo manual.

### 1. Automação do Instagram (LIGADA em 23/11/2026)
- **Robô ligado:** a tarefa `.github/workflows/instagram-publicar.yml` está na `main` e roda a cada hora (minuto 7, UTC). O teste de leitura passou ("@mach.sites"). A Meta baixou uma imagem do `raw.githubusercontent.com` sem problema.
- **Chave:** está no segredo **`IG_ACESS_TOKEN`** (com um "C" só, como o dono salvou). O workflow aceita esse nome e também `IG_ACCESS_TOKEN`. A chave antiga, colada no chat, ainda funciona: o dono preferiu não revogar.
- **Regra do dono:** **perguntar antes de cada post que o robô vai publicar.** Só depois do "pode" o post vira `modo: auto` no calendário da `main`. O dono autorizou editar o `calendario.json` direto na `main`; para qualquer outra mudança, abrir pedido e juntar.
- **Trava contra post repetido:** antes de publicar, o robô compara a legenda com os posts dos últimos 3 dias.
- **Reels:** sempre manuais. O dono põe a música no app.
- **Primeiro post do robô:** manifesto, 23/11 ao meio-dia.

#### Histórico da automação
- **Decisões do dono (23/11):** repositório **público, sem nada pessoal** (a origem do nome, o nome do dono e os prints da Meta saíram dos arquivos e do histórico, e ficam só no pacote de memória privado). **Reels com música, postos por ele:** os Reels ficam em modo manual e ele escolhe a música no app. Carrosséis e fotos saem sozinhos.
- Enquanto o GitHub não volta, os posts saem pelo agendamento do app do Instagram, usando o kit da semana (uma pasta por post, com a legenda).
- **Conexão com a Meta pronta (22/11/2026).** Login unificado, app "Mach Publicado", portfólio MachEstudio, @mach.sites ligada ao portfólio.
- A chave é do usuário do sistema "Mach Publicado System User" e não expira. Teste só de leitura passou: acessa a @mach.sites (id `17841419418755107`) com `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments` e `instagram_manage_messages`. Limite de 100 posts por dia.
- O dono colou essa chave no chat. Ela **não foi salva em nenhum arquivo**. Na hora de guardar no GitHub, o ideal é gerar uma nova e revogar esta (passo a passo em `instagram/README.md`, seção 4).
- O robô já usa `graph.facebook.com` v27.0 e o id da conta como padrão. Só falta o segredo `IG_ACCESS_TOKEN`.
- Imagens precisam ser JPEG: o calendário já aponta para `.jpg` e a fábrica salva os dois formatos.
- Mídias: o repositório é público, então o robô baixa do `raw.githubusercontent.com`.
- **O que falta:** (1) reconectar o GitHub para enviar os commits; (2) levar as alterações para a `main` (o agendamento do GitHub só roda nela); (3) criar o segredo `IG_ACCESS_TOKEN`; (4) um post de teste aprovado pelo dono.
- Plano B enquanto isso: agendar pelo próprio Instagram (Configurações avançadas → Agendar).
- Atenção: como o repositório é público, a pasta `memoria/` também fica visível quando for enviada (inclui a origem interna do nome). Decidir com o dono se fica assim.

### 2. Calendário atual (`instagram/calendario.json`)
- 24/11 12h: Silêncio de rádio (post) · 24/11 19h: Silêncio de rádio (story)
- 26/11 12h: Carrossel 5 sinais
- 28/11 18h: Teaser do lançamento (**manual**, por causa da música do Instagram)
- 01/12: vago. O carrossel "Como funciona" virou rascunho porque repetia o site. Ideias: "1 segundo quadro a quadro" (30 quadros do vídeo), "o mesmo site, sem e com movimento", "mitos sobre site".
- Equus Genetics: rascunho.

### 3. Vídeo da Equus Genetics (cliente)
- Ideia: Reels de bastidores, "estou reformando o site da @equusgenetics". Roteiro em `anuncio-lancamento/textos.md`.
- Falta: saber o que a empresa faz (não há nada sobre ela na internet), o link do site atual, se o dono aparece na câmera e a autorização do cliente para mostrar o site e marcar o perfil.

### 4. Site
- **24/11: versão única.** Juntei o site do projeto com a outra versão, feita em outra conversa (MACH 3D no espelho d'água, cartão que inclina, página que se ajusta, 4 passos, perguntas frequentes, jatinho no céu). Os arquivos estão em `site-mach/` e a estrutura está no README. Prévia privada: https://claude.ai/artifact/XDCprjyAEsF4u9PgZzXhqK
- **Pendente (pedido do dono, para depois):** pôr o site da Equus Genetics (equusbr.com, feito pelo dono) como exemplo de trabalho real no site da MACH, na seção "As provas" ou no hangar. Usar as capturas de `instagram/reels/fontes-equus/` e confirmar antes a autorização do cliente.
- **Pendente (pedido do dono, 24/11):** melhorar a abertura (hero) com o MACH 3D. O dono achou as animações longas demais e a abertura feia no celular. Ideia: abertura mais curta (menos frases e menos rolagem presa), enquadramento próprio para celular em pé e chegar mais rápido ao problema e ao estrondo.
- **25/11: reforma pedida pelo dono.** Paleta 60/30/10 (off-white #F4F2EE / grafite #16181B / laranja #FF6B1A); primeira tela tipo "Aether" (celular no centro com anéis de choque em túnel, 1 tela); site completo para celular (menu, o que fazemos, trabalhos, como funciona, incluso, dúvidas, pedido); saiu o vídeo de 30 s. A primeira tela é um componente isolado: `primeira-tela.css` e `primeira-tela.js`.
- **WhatsApp do pedido:** 5511939045618, em `CONFIG.whatsapp` no `main.js`.
- **Domínio sugerido:** machsites.com.br, com machestudio.com.br de reserva. Os dois estavam livres em 23/11. Falta o dono registrar e decidir a hospedagem (GitHub Pages grátis).
- Falta o número de WhatsApp (`site-mach/main.js`, `CONFIG.whatsapp`).
- Publicar (Netlify Drop ou Cloudflare Pages) e trocar o `og:image` pelo endereço completo.

### 5. GitHub
- Resolvido em 23/11: o GitHub foi reconectado e os pushes desta branch (`claude/animated-ad-video-30s-ntk1iz`) funcionam.

### 6. Prospecção (skill `/lead-finder`, 25/11)
- **Onde está:** as skills ficam em `.claude/skills/`: `lead-finder`, `coletor`, `montador-de-perfil`, `cacador-de-email` e `disparador`. Cada uma tem o seu SKILL.md, e o README está em `lead-finder/`.
- **Fora do GitHub:**
  - os dados de pessoas, em `leads/`;
  - o `config.json`, com o nome na assinatura;
  - o `.env`.
- **Apify (plano grátis, US$ 5 por mês):** no ciclo de 25/11 a 24/12 já foram gastos cerca de US$ 0,58.
- **O que funciona melhor:**
  - Buscar **donos de posts em hashtags de nicho no Instagram**. Eles publicam WhatsApp.
  - Abrir a mensagem com o gancho de **prévia com o nome do negócio** ("Posso te mostrar como ficaria…?").
  - No Brasil, pequeno negócio quase nunca publica e-mail. Por isso o WhatsApp é enviado **à mão pelo dono** (link pronto), nunca por robô.
- **Rodada 2:**
  - 7 mensagens aprovadas por WhatsApp;
  - 1 aceitou ver a prévia (Doces Helena, prévia feita em `previas/doces-helena/`).
- **Rodada 3 (25/11):**
  - 99 perfis novos de 8 hashtags de nicho (bolos, doces, hambúrguer, pizza, tatuagem, floricultura, barbearia e padaria);
  - 64 com cara de cliente e 37 com WhatsApp publicado;
  - 37 mensagens esperando o envio. O dono pediu para trocar o gancho de prévia; o gancho atual é o **cumprimento** ("Bom dia/Boa tarde/Boa noite, tudo bem? Vi o perfil da X e achei que o trabalho tem muito potencial. Aqui é da MACH Estúdio… Posso te mostrar um exemplo?"), com a saudação trocada pela hora em que o dono abre a mensagem. O dono liberou "vi o perfil de…". Quem topar recebe um exemplo que já existe, sem trabalho novo;
  - o Claude **não envia** pelo WhatsApp (não há conector, e robô em massa derruba o número). A saída é uma **página privada, "Fila de envio"** (artifact 2xvs1aj4uRfCt1GGdVLUoW): um botão por negócio abre o WhatsApp com a mensagem escrita, o dono envia e marca. O histórico fica no banco da página (coleção `envios`, documento `m<n>`), e o Claude lê de lá para registrar no `leads/enviados.csv`;
  - a rodada custou US$ 0,55, e o mês está em US$ 1,16 dos US$ 5.
  - **Envio de 25/11:** a fila registrou 12 enviadas (mensagens 8 a 19, entre 19h44 e 19h50) e o dono confirmou que os 20 do dia contam também os 7 da rodada anterior (1 a 7), registrados à parte: 19 contabilizados. Faltam 25 na fila (20 a 44): 20 amanhã e 5 no dia seguinte. No fim do dia 25/11 o dono pediu para o robô postar o Reels i15 (12 estilos de animação, "comenta PROMPT") às 19h; como o robô não põe música do Instagram e o i15 só existe no ramo de trabalho, o dono escolheu postar ele mesmo, com música. Prompts para o direct: `instagram/prompts/12-animacoes-de-site.md`. O limite de 20 por dia é uma regra de segurança nossa, não do WhatsApp; o que derruba número são denúncias e bloqueios, e a fila foi usada com ~25 s entre envios, rápido demais.
- **Prévias para clientes:** ficam em `previas/<cliente>/` (fora do git, porque têm fotos e dados do cliente). Cada uma tem:
  - o site, em `site/`;
  - as imagens e o vídeo, em `entrega/`;
  - o LEIA-ME, com o que confirmar antes de publicar.
- **Regras das prévias:**
  - não publicar na internet sem a autorização do cliente;
  - preço só se o cliente publicou;
  - não usar foto de banco de imagens como se fosse produto do cliente.
