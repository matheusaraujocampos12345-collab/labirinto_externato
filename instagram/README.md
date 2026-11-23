# Automação do Instagram — MACH

Jornada para os posts da @mach.sites saírem sozinhos, no horário marcado, pela API oficial da Meta.

| Etapa | Status |
|---|---|
| 1. Fábrica de posts | ✅ Pronta |
| 2. Calendário de publicações | ✅ Pronto, com 6 posts |
| 3. Robô de publicação | ✅ Pronto e testado em simulação |
| 4. Conectar a conta à Meta | ⏳ Depende de você (passo a passo abaixo) |
| 5. Deixar as mídias num endereço público | ⏳ Junto com a publicação do site |
| 6. Ligar o piloto automático | ⏳ GitHub Actions, a cada hora |

## 1. Fábrica de posts

Escreva os slides num arquivo de texto e as artes saem prontas no padrão da marca:

```bash
node instagram/fabrica/carrossel.mjs instagram/posts/como-funciona.json
```

Tipos de slide: `capa`, `texto`, `lista`, `passos`, `numeros`, `chamada`, `imagem-anotada` (recorte de site com marcadores numerados), `mito` (frase + selo MITO/DEPENDE + resposta) `frase` (foto única com frase grande) e `foto` (foto única com uma tela em destaque). Exemplos no topo de `fabrica/carrossel.mjs`.
As imagens vão para `instagram/posts/<nome>/` junto com a `legenda.txt`.

Prints do site e do vídeo para os posts: `node instagram/fabrica/capturar.mjs` (salva em `instagram/recortes/`).

## 2. Calendário

`calendario.json` lista cada post com data, tipo (`imagem`, `carrossel`, `reels`, `story`), arquivos e legenda.

- `status`: `rascunho` → `agendado` → `publicado` (o robô marca sozinho e guarda o link).
- `modo`: `auto` (o robô publica) ou `manual` (você publica pelo app). Use `manual` quando o post precisa de música da biblioteca do Instagram ou de figurinhas no story; a API não oferece essas duas coisas.

## 3. Robô de publicação

```bash
node instagram/publicar.mjs --testar   # confere tudo e mostra o que seria publicado, sem publicar
node instagram/publicar.mjs            # publica o que está agendado e com horário vencido
```

O teste confere proporção das imagens, tamanho dos arquivos, limite de 2.200 caracteres, 30 hashtags e 20 menções.

## 4. Conexão com a Meta (feita em 22/11/2026)

Usamos a **configuração da API com login unificado** da Meta (apps novos não têm mais o "login do Instagram").

- Portfólio empresarial: **MachEstudio**. App: **Mach Publicado**.
- A @mach.sites está ligada ao portfólio (Configurações do negócio → Perfis do Instagram).
- A chave é de um **usuário do sistema** ("Mach Publicado System User") e **não expira**. Permissões: `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_messages`.
- Id da conta no Instagram: `17841419418755107` (não é segredo; já é o padrão do robô).
- Endereço da API: `graph.facebook.com`, versão `v27.0`.
- Limite da Meta: 100 posts por dia.

A chave **nunca** vai em arquivo nem no chat: o repositório é público. Ela fica só no segredo `IG_ACCESS_TOKEN` do GitHub.
Para trocar a chave: Configurações do negócio → Usuários → Usuários do sistema → Mach Publicado System User → **Gerar token** (e **Revogar tokens** para invalidar as antigas).

Problemas que já apareceram no caminho:
- "Add Instagram profile" não abria nada: o Safari bloqueia a janela. Libere em Safari → Ajustes → Sites → Janelas Pop-up, ou use o Chrome.
- Tela branca depois do login do Instagram: feche a janela e recarregue a página de trás. Se não ligar, desmarque "Impedir rastreamento entre sites" em Safari → Ajustes → Privacidade (só durante a ligação).

## 5. Mídias num endereço público

A API baixa as imagens e vídeos de um link público. Como o repositório é público, o robô usa o próprio GitHub (`raw.githubusercontent.com`) e não precisa de nada extra. Para usar outro endereço, crie a variável `MEDIA_BASE_URL`.

**Imagens só em JPEG.** A Meta não aceita PNG na publicação automática. A fábrica já salva um `.jpg` ao lado de cada `.png`, e o teste do calendário avisa se algum post apontar para PNG.

## 6. Piloto automático

`.github/workflows/instagram-publicar.yml` roda a cada hora: confere o calendário, publica o que venceu e salva o status de volta no calendário.

Para ligar:
1. O Claude precisa conseguir enviar as alterações para o GitHub (reconectar em claude.ai → Configurações → Conectores).
2. As alterações precisam estar na branch principal (`main`): o GitHub só roda tarefas agendadas por ela.
3. No GitHub do repositório: Settings → Secrets and variables → Actions → New repository secret → nome `IG_ACCESS_TOKEN`, valor = a chave.

Enquanto isso não estiver pronto, dá para agendar os mesmos posts pelo próprio Instagram (Configurações avançadas → Agendar) ou pelo Planejador do Meta Business Suite.
