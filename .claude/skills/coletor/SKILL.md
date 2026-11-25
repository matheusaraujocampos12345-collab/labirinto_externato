---
name: coletor
description: Primeira etapa do lead-finder. Lê um site, resume em 3 linhas o que ele vende e para quem, monta hashtags, palavras-chave e perfis de referência, escolhe os atores da Apify Store com preço por mil e, só depois do ok do dono, puxa posts e comentários públicos do Instagram e do TikTok para leads/bruto.json.
argument-hint: <link do site>
---

# coletor

Site: **$ARGUMENTS** (se vier vazio, use o site que o lead-finder passou).
Fale em português simples.

## 1. Ler o site (não gasta nada)
- **Link na internet:** leia a página inicial e, se existirem, as páginas de serviços, sobre e contato.
- **Arquivo local:** leia o arquivo.

Escreva **3 linhas**:
1. O que vende.
2. Para quem vende.
3. O que promete ou o que diferencia.

## 2. Montar a busca (não gasta nada)
Crie `leads/busca.json` neste formato:
```json
{
  "site": "...",
  "aprovado": false,
  "resumo": ["linha 1", "linha 2", "linha 3"],
  "instagram": {"hashtags": ["exemplo"], "palavras": [],
                "perfis": [{"usuario": "nome", "status": "a confirmar", "por_que": "..."}]},
  "tiktok": {"hashtags": [], "palavras": ["frase que a pessoa digitaria"], "perfis": []}
}
```
Como escolher:
- Misture dois tipos de busca:
  - **onde a dor aparece:** temas em que o dono do negócio reclama ou pergunta;
  - **onde o cliente está:** os nichos que o site atende.
- **Hashtags e palavras em português**, como as pessoas escrevem. O Instagram busca por hashtag. O TikTok aceita hashtag e frases.
- **Perfis de referência:** só contas reais e públicas, cujo comentário costuma ter dono de negócio. Se não tiver certeza de que a conta existe, marque `"a confirmar"`. Nunca coloque concorrente direto como alvo de contato.
- Comece com no máximo 6 hashtags por rede.
- **Ajustes opcionais por rede**, dentro de `instagram` ou `tiktok`:
  - `"peso"`: divide os perfis entre as redes. Com 0.7 e 0.3, 70% vêm de uma e 30% da outra.
  - `"prioridade": "autores"`: puxa primeiro os donos dos posts. Use em hashtags de nicho, onde quem posta é o negócio.
  - Sem `"prioridade"`, vêm primeiro os comentaristas que fizeram pergunta ou escreveram frase longa.
  - `"comentarios_por_post"`: o padrão é 10. Com 0, a etapa de comentários é desligada nessa rede.

Lição do primeiro teste real:
- hashtags genéricas do Instagram trazem empresas fazendo propaganda nos comentários, e não donos reclamando;
- buscas no TikTok sobre ferramentas que o dono usa, como cardápio digital, trazem donos perguntando.

## 3. Escolher os atores e o custo (não gasta nada)
```bash
python3 .claude/skills/coletor/coletor.py loja             # pesquisa a Apify Store, salva leads/atores.json
python3 .claude/skills/coletor/coletor.py resumo --perfis 10
```
O `loja` escolhe o ator mais usado e bem avaliado de cada etapa (posts, comentários e perfis) e mostra o preço por mil resultados do plano configurado em `plano_apify`.

## PARADA 1: pedir ok
Mostre ao dono:
- as 3 linhas;
- as hashtags, as palavras-chave e os perfis de referência;
- os atores escolhidos, com o preço por mil;
- a estimativa para 10 perfis (o teste) e para 300.

Pergunte se aprova a lista e o custo. **Não rode nada antes do ok.**

## 4. Rodar (GASTA CRÉDITO, só com ok)
1. Com o ok, mude `"aprovado": true` no `leads/busca.json` e rode:
   ```bash
   python3 .claude/skills/coletor/coletor.py rodar --perfis 10 --confirmo-gasto
   ```
2. O script tem duas proteções:
   - põe um teto de gasto em cada execução (`teto_gasto_usd_por_rodada` no config);
   - salva o que veio da Apify em `leads/apify/` e junta tudo em `leads/bruto.json`.
3. Mostre ao dono:
   - quantos perfis vieram por rede;
   - o gasto real informado pela Apify;
   - 3 exemplos de falas encontradas.
4. Para rodar mais perfis (até 300), mostre a nova estimativa e **peça ok de novo**.

Se `leads/apify/` já tiver dados e você só precisar refazer o `bruto.json`, rode `python3 .claude/skills/coletor/coletor.py juntar`.

## Limites
- No máximo 300 perfis (`max_perfis` no config).
- Só conteúdo público. Perfis privados são descartados.
- Nunca imprima o token.
