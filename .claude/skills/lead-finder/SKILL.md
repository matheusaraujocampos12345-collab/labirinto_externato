---
name: lead-finder
description: Encontra possíveis clientes para um site. Lê o site, busca conversas públicas no Instagram e no TikTok pela Apify, monta perfis com dor, sonho e objeção citados ao pé da letra, procura e-mails publicados e prepara mensagens para o dono aprovar antes de enviar pelo Gmail. Use quando o dono digitar /lead-finder <link do site> ou pedir para achar clientes ou leads.
argument-hint: <link do site>
---

# lead-finder

Site de partida: **$ARGUMENTS**

Fale sempre em português do Brasil, simples e direto: o dono não é programador.
Esta skill coordena quatro skills menores, nesta ordem:

1. `coletor` (`.claude/skills/coletor/SKILL.md`)
2. `montador-de-perfil` (`.claude/skills/montador-de-perfil/SKILL.md`)
3. `cacador-de-email` (`.claude/skills/cacador-de-email/SKILL.md`)
4. `disparador` (`.claude/skills/disparador/SKILL.md`)

Para cada etapa, chame a skill pela ferramenta Skill ou leia o `SKILL.md` dela e siga o passo a passo.

## Regras que valem para tudo

- **Antes de qualquer coisa que gaste crédito ou envie e-mail, pare e peça ok ao dono.** Um ok vale só para o que foi mostrado. Se a quantidade ou o custo mudar, peça de novo.
- **Primeira vez:** teste a cadeia inteira com **10 perfis** e mostre o resultado de cada etapa. Só depois proponha rodar mais, até 300 perfis.
- Só dados **públicos**. Nada de perfil privado, login com conta pessoal ou contorno de bloqueio.
- **Nunca invente frase.** Citação que não existe igual no texto de origem é apagada pelo script.
- **Nunca adivinhe e-mail.** Só vale e-mail publicado, com a fonte.
- Os dados ficam em `leads/`, que o git ignora (o repositório é público). Nunca faça commit de `leads/`, `.env` ou `config.json`.
- Nunca mostre o token da Apify nem a senha do Gmail. Se o dono colar uma chave no chat, recomende gerar outra.

## Antes de começar

1. Rode `python3 .claude/skills/lead-finder/scripts/comum.py`. Ele diz se o `APIFY_TOKEN` está no `.env` sem mostrar o valor.
2. Se não existir `.claude/skills/lead-finder/config.json`:
   - copie o `config.example.json` para `config.json`;
   - pergunte ao dono o nome que vai na assinatura e o site oficial;
   - o arquivo fica só no computador, porque o git ignora.

## Ordem de trabalho

1. **coletor:** lê o site, escreve as 3 linhas e monta hashtags, palavras-chave e perfis de referência. Pesquisa os atores na Apify Store e estima o custo.
   - **PARADA 1:** mostre a lista, os atores, o preço por mil e a estimativa. Espere o ok.
   - Com o ok, rode o teste de 10 perfis.
2. **montador-de-perfil:** descarta quem não tem cara de cliente e extrai dor, sonho e objeção citados. Mostre o resumo.
3. **cacador-de-email:** procura e-mails publicados e monta `leads/lista.csv`. Mostre o resumo.
4. **disparador:**
   - explique como conectar o Gmail;
   - escreva as mensagens e passe pela conferência;
   - **PARADA 2:** mostre todas as mensagens. O dono aprova, edita ou corta. Envie só depois de ele escrever "pode enviar".

No fim de cada etapa, mostre em poucas linhas:
- quantos perfis entraram e quantos saíram, e por quê;
- quanto foi gasto de verdade (a Apify informa);
- os arquivos gerados.

## Teste sem gastar nada

Para mostrar o formato sem dado real nem crédito, use dados fictícios em `leads/exemplo/`:
1. `python3 .claude/skills/coletor/coletor.py simular`
2. `python3 .claude/skills/montador-de-perfil/montador.py preparar --simular`
3. Escreva `leads/exemplo/analise.json`.
4. `python3 .claude/skills/montador-de-perfil/montador.py validar --simular`
5. `python3 .claude/skills/cacador-de-email/cacador.py --simular`
6. `python3 .claude/skills/disparador/disparador.py rascunho --simular`
7. Escreva as mensagens.
8. Rode o disparador com `conferir`, `mostrar` e `enviar --pode-enviar`, todos com `--simular`.
