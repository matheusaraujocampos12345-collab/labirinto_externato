---
name: montador-de-perfil
description: Segunda etapa do lead-finder. Lê leads/bruto.json, descarta concorrentes, marcas grandes, robôs e pessoas físicas, e extrai de cada perfil restante DOR, SONHO e OBJEÇÃO como citações literais com o link do post de origem. Nunca inventa frase. Gera leads/perfis.json.
---

# montador-de-perfil

Fale em português simples. Use `--simular` nos comandos para trabalhar com os dados fictícios de `leads/exemplo/`.

## 1. Preparar
```bash
python3 .claude/skills/montador-de-perfil/montador.py preparar
```
Leia `leads/para-analisar.md`. Cada perfil mostra:
- a bio;
- os seguidores;
- as falas numeradas, cada uma com o link;
- pistas automáticas, como "concorrente?" ou "robô?". As pistas só ajudam. Quem decide é você.

Com muitos perfis, trabalhe em blocos de uns 30.

## 2. Decidir e citar
Para cada perfil, escreva em `leads/analise.json`:
```json
[{"id": "instagram:usuario", "status": "manter", "negocio": "Padaria artesanal",
  "dor": {"citacao": "trecho copiado igual", "link": "link da fala"},
  "sonho": {"citacao": "", "link": ""},
  "objecao": {"citacao": "", "link": ""}}]
```
**Status:** use `manter` ou um destes motivos de descarte:
- `descartado: concorrente`: faz sites, é agência, social media, tráfego ou designer;
- `descartado: marca grande`: rede nacional, verificada ou com muitos seguidores;
- `descartado: robô`: sorteio, "ganhe seguidores", texto repetido;
- `descartado: pessoa física`: perfil pessoal sem negócio. Por cuidado com a LGPD, priorizamos empresas;
- `descartado: sem cara de cliente`: qualquer outro motivo, com uma palavra de explicação.

**Citações:**
- **DOR:** o problema que a pessoa vive hoje.
- **SONHO:** o que ela quer que aconteça.
- **OBJEÇÃO:** o que a faria hesitar em comprar, como preço, tempo ou frustração anterior.
- Copie o trecho **exatamente** como está, letra por letra, de uma fala do **próprio perfil**. Pode ser um pedaço de frase.
- Não corrija a escrita, não junte frases e não resuma.
- Use o link da fala de onde copiou.
- **Sem citação boa, o campo fica vazio.** Vazio é melhor que inventado.

## 3. Validar (trava anti-invenção)
```bash
python3 .claude/skills/montador-de-perfil/montador.py validar
```
O script confere cada citação no texto original:
- se a frase não aparece igual, ele **apaga** a citação e avisa;
- se aparece em outro post do mesmo perfil, ele corrige o link.

O resultado vai para `leads/perfis.json`.

## 4. Mostrar ao dono
Mostre:
- quantos ficaram e quantos saíram, por motivo;
- 3 exemplos com dor, sonho e objeção;
- os avisos da trava.
