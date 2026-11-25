---
name: disparador
description: Última etapa do lead-finder. Escreve, para cada lead com e-mail ou WhatsApp publicado e uma frase citada (dor, desejo ou pergunta), uma mensagem curta que começa pela frase exata da pessoa. Mostra todas para o dono aprovar, editar ou cortar. E-mail só sai pelo Gmail depois de "pode enviar", no máximo 20 por dia, com intervalo. WhatsApp vira uma lista com link pronto para o dono mandar à mão. Nunca repete ninguém e respeita quem pediu SAIR.
---

# disparador

Fale em português simples. Use `--simular` em todos os comandos para testar com os dados de `leads/exemplo/`.

## 0. Antes de tudo: explicar o Gmail
Explique as duas opções e pergunte qual o dono prefere.

**Opção A: senha de app (envio automático)**
1. Ative a verificação em duas etapas em myaccount.google.com, na aba Segurança.
2. Abra myaccount.google.com/apppasswords, crie uma senha com o nome "lead-finder" e copie os 16 caracteres.
3. No arquivo `.env` (na raiz ou em `site-mach/`), coloque:
   ```
   GMAIL_USER=seu-email@gmail.com
   GMAIL_APP_PASSWORD=a senha de 16 letras, sem espaços
   ```
   **Nunca cole a senha no chat.**
4. O envio usa `smtp.gmail.com` e lê as respostas em `imap.gmail.com`, para achar quem pediu SAIR.
   - Sessões do Claude Code na nuvem não alcançam o Gmail. O envio precisa rodar no computador do dono, no Claude Code do app ou do terminal.
   - Contas de empresa (Google Workspace) podem ter a senha de app bloqueada pelo administrador.

**Opção B: conector do Gmail do Claude (rascunhos)**
- O conector cria **rascunhos** na conta do dono, e ele clica em Enviar em cada um.
- Para conectar: claude.ai, Configurações, Conectores, Gmail.
- Depois que o dono enviar, rode `disparador.py registrar --numeros 1,2,...`. Assim a skill sabe quem já recebeu e nunca repete.

Confira se existe `.claude/skills/lead-finder/config.json` com o nome do remetente. Sem ele, a conferência não deixa passar.

## 1. Rascunho
```bash
python3 .claude/skills/disparador/disparador.py rascunho
```
O comando cria `leads/mensagens.json` só para quem publicou e-mail ou WhatsApp **e** tem uma frase citada. Quem já recebeu ou pediu para sair fica de fora.
- **Frase de abertura:** a DOR. Sem dor, o DESEJO (campo sonho). Sem desejo, a PERGUNTA que a pessoa fez. Sem nada disso, a frase do FATO público do negócio. Ela não leva aspas, e a citação que a prova aparece para o dono na aprovação.
- **Canal:** e-mail, se a pessoa publicou um. Se só publicou WhatsApp, o canal é WhatsApp, que o dono envia à mão.

## 2. Escrever
Preencha `assunto` e `corpo` de cada mensagem em `leads/mensagens.json`:
- **Comece pela frase de abertura**, igual ao campo `abertura`. Se for dor, desejo ou pergunta, ela vai entre aspas, porque são palavras da pessoa. Se for fato, vai sem aspas. Se ela for uma pergunta, responda em poucas palavras logo depois, como "Tem, sim.".
- **Uma frase** que liga essa dor ao que o dono vende (`o_que_vendo` no config). Seja concreto: diga o que muda para a pessoa.
- **Termine com uma pergunta.**
- Sem link, sem preço ou valor, sem "vi seu perfil".
- Curta: até 90 palavras. Frases curtas, com ponto final.
- **Não escreva assinatura nem a linha do SAIR.** O script coloca o nome, a empresa e "Se não quiser receber mais, é só responder SAIR.".
- **Só no e-mail:** assunto curto, até 60 caracteres, sem CAIXA ALTA. No WhatsApp não há assunto.

## 3. Conferir
```bash
python3 .claude/skills/disparador/disparador.py conferir
```
Corrija até tudo dar OK.

## PARADA 2: mostrar TODAS ao dono
```bash
python3 .claude/skills/disparador/disparador.py mostrar
```
Mostre as mensagens no chat, numeradas, exatamente como vão sair. O dono aprova, edita ou corta:
- **para editar:** mude o texto no `mensagens.json` e rode `conferir` de novo;
- **para aprovar:** `aprovar --numeros 1,3` ou `aprovar --todas`;
- **para cortar:** `cortar --numeros 2`.

## 4. Enviar (só depois de "pode enviar")
**Só rode este passo se o dono escrever "pode enviar".** Aprovar mensagens não é o mesmo que autorizar o envio.
```bash
python3 .claude/skills/disparador/disparador.py enviar --pode-enviar
```
- Envia só as **aprovadas**, no máximo `limite_diario` (20) por dia, com 3 a 7 minutos de intervalo. Rode em segundo plano: 20 mensagens levam cerca de 1 hora e meia.
- Antes do lote, lê as respostas no Gmail e coloca quem pediu SAIR em `leads/nao-contatar.csv`.
- Nunca envia para quem já está em `leads/enviados.csv` ou em `leads/nao-contatar.csv`.
- Cada envio é registrado na hora em `leads/enviados.csv`.

## 5. WhatsApp: o dono envia à mão (só depois de "pode enviar")
```bash
python3 .claude/skills/disparador/disparador.py whatsapp
```
- Gera `leads/whatsapp-para-chamar.md` com um link wa.me por pessoa. O dono toca no link, o WhatsApp abre com a mensagem pronta, ele confere e envia.
- No máximo `limite_diario` por dia.
- **Nunca automatize o envio pelo WhatsApp.** Isso pode bloquear o número do dono.
- Depois que o dono disser quais enviou, rode `registrar --numeros 4,5`. Assim ninguém recebe duas vezes.

Se alguém pedir para sair, por qualquer canal:
```bash
python3 .claude/skills/disparador/disparador.py sair --contato pessoa@empresa.com.br   # ou +5511999999999
```
