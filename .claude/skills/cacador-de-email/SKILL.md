---
name: cacador-de-email
description: Terceira etapa do lead-finder. Para cada perfil mantido em leads/perfis.json, procura um e-mail que a pessoa publicou (campo de contato, bio, link na bio, site da empresa) e guarda a fonte. Não adivinha formato e não usa vazamento. Gera leads/lista.csv.
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
4. O site da empresa: página inicial, página de contato e rodapé. Ele lê no máximo 5 páginas por perfil, espera 1 segundo entre elas e respeita o `robots.txt`.

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
`leads/lista.csv` tem estas colunas: perfil, rede, link, negocio, dor, sonho, objecao, email, fonte_email.

Mostre ao dono quantos têm e-mail, quantos ficaram sem contato e 3 linhas de exemplo.
