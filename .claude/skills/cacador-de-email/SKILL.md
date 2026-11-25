---
name: cacador-de-email
description: Terceira etapa do lead-finder. Para cada perfil mantido em leads/perfis.json, procura o e-mail e o WhatsApp que a empresa publicou (campo de contato, bio, posts dela, link na bio, site da empresa) e guarda a fonte de cada um. Não adivinha formato e não usa vazamento. Gera leads/lista.csv.
---

# cacador-de-email

Fale em português simples.

## Rodar
```bash
python3 .claude/skills/cacador-de-email/cacador.py            # dados reais (acessa a internet)
python3 .claude/skills/cacador-de-email/cacador.py --simular  # dados fictícios, sem internet
```

## Onde ele procura, nesta ordem
1. O e-mail público do perfil, quando a Apify traz o campo de contato.
2. A bio do perfil.
3. O link na bio. Se for um agregador (Linktree e parecidos), segue para o site da empresa.
4. O site da empresa: página inicial, página de contato e rodapé. Ele lê no máximo 6 páginas por perfil, espera 1 segundo entre elas e respeita o `robots.txt`.

5. **Links curtos que a própria empresa pôs na bio** (wa.link, bit.ly, abre.ai e parecidos) são seguidos só para achar o número ou o site dela. Links `wa.me/message/…` escondem o número de propósito: esses perfis ficam "sem contato".
6. O que já foi achado fica em `leads/contatos.json`, e uma nova rodada não repete a busca. Para refazer do zero, rode com `--refazer`.

## WhatsApp
Pequeno negócio no Brasil costuma publicar WhatsApp, e não e-mail. O caçador também guarda o WhatsApp **publicado** pela própria empresa, com a fonte:
- link wa.me no perfil ou no site;
- celular escrito na bio ou num post da própria empresa.

Ele nunca procura número em outro lugar. O WhatsApp serve para o **dono chamar à mão**: o robô nunca envia mensagem pelo WhatsApp.

## Regras
- **Só vale e-mail escrito em algum lugar público**, sempre com a fonte (o link onde apareceu).
- **Nunca adivinhe formato**, como `contato@empresa.com.br` "porque deve ser".
- **Nunca use vazamento**, base comprada ou ferramenta de "descobrir e-mail".
- O script descarta coisas que parecem e-mail mas não são:
  - nomes de imagem, como `logo@2x.png`;
  - e-mails de sistema, como `noreply`, `sentry` e `wixpress`;
  - modelos, como `seuemail@`.
- Sem e-mail, o lead fica como **"sem contato"**. Não insista.
- Só coloque um e-mail à mão se o dono mostrar onde ele está publicado, e anote a fonte.

## Resultado
`leads/lista.csv` tem estas colunas: perfil, rede, link, negocio, dor, sonho, objecao, pergunta, email, fonte_email, whatsapp, fonte_whatsapp.

Mostre ao dono quantos têm e-mail, quantos só têm WhatsApp, quantos ficaram sem contato e 3 linhas de exemplo.
