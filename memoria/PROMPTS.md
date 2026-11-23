# Prompts da MACH

## 1. Pedido original do vídeo de 30 s (texto do dono)

> Crie um vídeo publicitário animado de 30 segundos, vertical 9:16 (1080x1920, 30fps), para a [EMPRESA X], estúdio que cria sites com animações de nível premium.
>
> CONCEITO
> Quem procura um site para a empresa só encontra sites iguais, com "cara de IA". O vídeo mostra essa repetição até cansar, quebra tudo e revela o contraste: um site com animação digna de lançamento de produto.
>
> ATO 1 — O PROBLEMA (0–13s)
> - Abertura: um cursor digita "criar site para minha empresa" numa barra de busca e aperta Enter.
> - Surge um site genérico: degradê roxo-azul, título "Eleve seu negócio ao próximo nível", botão "Comece agora", três cards com ícones, ilustração 3D de bolhas brilhantes, fonte sans-serif padrão.
> - Os sites passam em scroll vertical com transições rápidas (whip pan, slide). Todo site novo tem o MESMO layout: só mudam o logo e a cor de destaque. O ritmo acelera a cada corte, de 1,5s para 0,2s por site.
> - Contador no canto superior: "Site 1"... "Site 12"... "Site 47".
> - Estética: plana, fria, brilhosa demais, clichê de template.
> - Texto na tela: "Procurando um site pra sua empresa?" → "Todos parecem… isso."
>
> ATO 2 — A QUEBRA (13–16s)
> - A tela trava: glitch digital, separação RGB, pixels rasgando. O áudio corta.
> - Corte seco para preto absoluto. 1 segundo de silêncio.
> - Texto branco, centralizado, revelado por máscara de baixo para cima: "E se o seu fosse diferente?"
>
> ATO 3 — O NÍVEL PREMIUM (16–25s)
> - Estética de lançamento de produto: fundo preto/grafite, luz de estúdio suave, muito espaço vazio, tipografia sans-serif grande e fina.
> - Movimentos: texto gigante entra com desfoque→foco; um smartphone mostrando o site gira lentamente com reflexos realistas; seções do site deslizam em parallax; números contam; easing suave (ease-in-out), nada brusco.
> - Câmera: dolly lento, macro em detalhes, profundidade de campo rasa.
> - Texto na tela: "Animação de verdade." → "Feita sob medida."
>
> ATO 4 — CHAMADA (25–30s)
> - O logo da [EMPRESA X] se monta a partir de linhas finas.
> - Texto: "Sites que ninguém confunde com template."
> - Abaixo: [@instagram] · [site.com.br]
>
> ÁUDIO
> - Atos 1–2: trilha de banco genérica, alegre e repetitiva, que acelera junto com os cortes e distorce até sumir no glitch.
> - Atos 3–4: grave e minimalista (piano ou synth com pulsos), com whooshes sutis sincronizados aos movimentos.
>
> REGRAS
> - Contraste máximo entre os atos: Ato 1 saturado, rápido e barulhento; Ato 3 escuro, lento e silencioso.
> - Todo texto em português do Brasil e legível.
> - Não usar nome, logo, produtos ou site da Apple.

## 2. Pedidos seguintes (em ordem)
1. Nome marcante e identidade de cor e estilo própria.
2. Um nome curto e forte. Ele escolheu **Mach** "por conta dos jatos, que são tecnologia pura".
3. Trocar o nome no vídeo e produzir o logo.
4. Nome para o Instagram (escolhido: mach.sites) e bio. Depois, bio com tópicos separados por barra e uma palavra ligada a jatos ("supersônico").
5. Tirar o site do vídeo e deixar só o @mach.sites.
6. Legenda para o vídeo fixado no topo do perfil.
7. Site-vitrine com todas as características da marca, pedido por WhatsApp ou direct, sem back-end, "que não tenha cara de IA" e com o tema de jatos.
8. Carrossel "sobre nós", depois simplificado (sem a história do nome, sem fórmula, "multiplataforma").
9. Indicação de música (não música própria).
10. Legenda curta, que provoque a diferenciação.
11. Carrossel novo ("5 sinais de cara de template").
12. Anúncio de que o site está sendo criado e será um lançamento (virou o teaser em vídeo "checklist de pré-voo").
13. Vídeo de bastidores da Equus Genetics (pendente).
14. Post "sumimos porque estamos num projeto gigante" ("Silêncio de rádio").
15. Automação de posts no Instagram (conexão com a Meta pronta; falta o GitHub para ligar o piloto automático).
16. Pesquisar referências virais (TikTok, Instagram, YouTube), propor rotina e ideias para aprovar e montar um calendário com 2 posts por dia ou mais (rodada 1 em aprovação).

## 3. Modelos de prompt para continuar
- **Novo carrossel:** "Crie um carrossel de N slides sobre [tema] com a fábrica (`instagram/fabrica/carrossel.mjs`), no padrão da MACH, com legenda curta. Não reaproveite textos do site."
- **Novo story ou Reels:** "Crie um story animado de 8 a 16 s sobre [tema] no estilo HUD da MACH (radar, cantoneiras, régua de Mach), sem áudio."
- **Agendar:** "Adicione o post [nome] ao `instagram/calendario.json` para [data e hora], modo auto, e rode `node instagram/publicar.mjs --testar`."
- **Ligar o piloto automático:** "O GitHub já está conectado. Envie os commits, leve a automação para a main e me guie para criar o segredo IG_ACCESS_TOKEN."
