# lead-finder

Acha possíveis clientes para um site, em 4 etapas, e para para você aprovar antes de gastar crédito ou enviar e-mail.

Para usar, digite no Claude Code:

```
/lead-finder https://seu-site.com.br
```

## As 4 etapas

| Etapa | O que faz | Gera |
|---|---|---|
| `coletor` | Lê o site e monta hashtags, palavras e perfis de referência. **Para, mostra o custo e espera seu ok.** Depois puxa posts e comentários públicos do Instagram e do TikTok pela Apify. | `leads/bruto.json` |
| `montador-de-perfil` | Descarta concorrentes, marcas grandes, robôs e pessoas físicas. Extrai DOR, SONHO e OBJEÇÃO como **citação literal com link**. Citação que não existe igual é apagada. | `leads/perfis.json` |
| `cacador-de-email` | Procura e-mail **publicado** (bio, link na bio, site da empresa) e guarda a fonte. Sem e-mail, fica "sem contato". | `leads/lista.csv` |
| `disparador` | Escreve mensagens que começam pela frase da pessoa. **Mostra todas para você aprovar.** Envia só depois de "pode enviar", no máximo 20 por dia. | `leads/enviados.csv` |

## Configurar (uma vez)

1. **Chave da Apify:** no arquivo `.env` da raiz ou em `site-mach/.env`:
   ```
   APIFY_TOKEN=sua-chave
   ```
   A chave fica em console.apify.com, em Settings, API & Integrations. Se ela já apareceu em algum chat, gere outra lá e troque no `.env`.
2. **Seus dados:** copie `config.example.json` para `config.json`, na mesma pasta, e preencha seu nome (vai na assinatura) e o site. O `config.json` não vai para o GitHub.
3. **Gmail:** escolha uma das duas opções. O `disparador` explica cada uma antes de enviar.
   - **A, senha de app (envio automático):**
     1. Ative a verificação em duas etapas em myaccount.google.com, na aba Segurança.
     2. Abra myaccount.google.com/apppasswords e crie uma senha chamada "lead-finder".
     3. No `.env`, coloque:
        ```
        GMAIL_USER=seu-email@gmail.com
        GMAIL_APP_PASSWORD=as 16 letras, sem espaços
        ```
     4. O envio roda no seu computador. A versão na nuvem do Claude Code não alcança o Gmail.
   - **B, conector do Gmail do Claude:** o conector cria **rascunhos** e você clica em Enviar. Depois, o comando `registrar` anota quem já recebeu.

## Proteções

- **Repositório público:** `leads/`, `.env` e `config.json` estão no `.gitignore`. Nenhum dado de pessoa vai para o GitHub.
- **Crédito:**
  - o coletor só roda com a busca aprovada (`"aprovado": true`) e com `--confirmo-gasto`;
  - cada execução tem teto de gasto (`teto_gasto_usd_por_rodada`);
  - o máximo é de 300 perfis.
- **Nada inventado:**
  - as citações são conferidas letra por letra no texto original;
  - os e-mails só valem com fonte pública, sem adivinhar e sem vazamento.
- **LGPD e boas práticas:**
  - prioriza empresas e descarta pessoas físicas;
  - toda mensagem leva seu nome, a empresa e "Se não quiser receber mais, é só responder SAIR.";
  - quem pede para sair entra em `leads/nao-contatar.csv` e nunca mais recebe nada.
- **Envio:**
  - só sai o que você aprovou, depois de "pode enviar";
  - no máximo 20 por dia, com 3 a 7 minutos entre um e outro;
  - ninguém recebe duas vezes.

## Custo (Apify Store, plano gratuito, novembro de 2026)

| Rede | Etapa | Ator | US$ por mil |
|---|---|---|---|
| Instagram | posts (hashtags) | apify/instagram-hashtag-scraper | 2,60 |
| Instagram | posts (perfis de referência) | apify/instagram-scraper | 2,70 |
| Instagram | comentários | apify/instagram-comment-scraper | 2,60 |
| Instagram | perfis | apify/instagram-profile-scraper | 2,60 |
| TikTok | posts | clockworks/tiktok-scraper | 3,70 |
| TikTok | comentários | clockworks/tiktok-comments-scraper | 1,25 |
| TikTok | perfis | clockworks/tiktok-profile-scraper | 3,00 |

A Apify exige um teto mínimo de US$ 0,50 por execução, mas os limites de quantidade de cada busca mantêm o gasto real em centavos no teste. A estimativa é de cerca de **US$ 0,25 para o teste de 10 perfis** e **US$ 4,20 para 300**. Os preços mudam: rode `coletor.py loja` para ver os atuais.

## Testar sem gastar nada

Rode as etapas com `--simular`. Elas usam 10 perfis fictícios em `leads/exemplo/`, sem internet, sem crédito e sem e-mail. O passo a passo está no `SKILL.md` do `lead-finder`.
