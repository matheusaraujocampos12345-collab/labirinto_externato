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

Propostas de marca publicadas como páginas (claude.ai, privadas): Talhe, Macte e Mach. A escolhida foi a **Mach**.

## Pendente

### Site-conceito da padaria (ramo próprio)
- **Padaria Quatro Horas**, "a padaria que acorda às 4h". Fica em `instagram/sites-conceito/padaria/`; a versão anterior, recusada, está em `_v1/`.
- **Ramo:** `padaria-quatro-horas`, a pedido do dono (23/11). Mudanças no site da padaria são feitas nesse ramo e só entram na `main` quando ele aprovar.
- **Link para ver o site:** https://claude.ai/artifact/2EPqk3jUE1aUCUoFCp2fEL (privado). Para atualizar, publicar de novo a partir de uma cópia dos arquivos do site em `site/`.
- **Vídeo do forno:** do Coverr, com licença de uso comercial. O mp4 original não fica no repositório, só os quadros editados.

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
- **WhatsApp do pedido:** 5511939045618, em `CONFIG.whatsapp` no `main.js`.
- **Domínio sugerido:** machsites.com.br, com machestudio.com.br de reserva. Os dois estavam livres em 23/11. Falta o dono registrar e decidir a hospedagem (GitHub Pages grátis).
- Falta o número de WhatsApp (`site-mach/main.js`, `CONFIG.whatsapp`).
- Publicar (Netlify Drop ou Cloudflare Pages) e trocar o `og:image` pelo endereço completo.

### 5. GitHub
- Os commits desta branch (`claude/animated-ad-video-30s-ntk1iz`) não subiram: erro 403, o Claude não tem acesso ao repositório.
- Para resolver: reconectar o GitHub em claude.ai/connect-github e instalar o app do Claude no repositório.
