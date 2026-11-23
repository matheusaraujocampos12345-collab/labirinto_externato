# MACH Estúdio — memória do projeto

Este repositório guarda tudo da **MACH Estúdio**, estúdio de sites com animação de nível premium (Instagram: **@mach.sites**).
Fale sempre em **português do Brasil**, de forma simples e direta: o dono não é programador.

Antes de criar qualquer coisa, leia:

1. `memoria/MARCA.md`: nome, logo, cores, fontes, voz e perfil do Instagram
2. `memoria/PREFERENCIAS.md`: do que o dono gosta, do que não gosta e como trabalhar com ele
3. `memoria/PROJETOS.md`: o que já existe, onde está, como gerar de novo e o que está pendente
4. `memoria/PROMPTS.md`: os pedidos originais e modelos de prompt
5. `memoria/FOTOS.md`: índice de imagens e prints de referência

## Regras rápidas

- Visual: fundo escuro ("estratosfera" #0A0C0F), texto alumínio #DFE3E7, **laranja #FF6B1A só como acento** (no máximo um destaque por tela).
- Fontes: Saira (títulos e marcações), Hanken Grotesk (texto) e JetBrains Mono (números e rótulos).
- Símbolos da marca: o **Λ laranja** (o "A" do logo), os **diamantes de choque** (três losangos) e a régua de velocidade "M 0.40 → M 1.20".
- Texto: frases curtas, com ponto final, no máximo uma referência de aviação por peça. Nada genérico.
- Legendas do Instagram: curtas (2 a 3 linhas + 3 hashtags).
- Nunca usar: degradê roxo-azul, "eleve seu negócio ao próximo nível", nome, logo ou produtos da Apple.
- O nome se explica só assim: Mach é a medida de velocidade dos jatos. Não contar outra origem.
- O repositório é público: nada pessoal nos arquivos (nome do dono, origem interna do nome, prints de contas). Isso fica só no pacote de memória privado.
- Não reaproveitar textos do site em posts: cada post precisa de ideia própria.
- Senhas nunca no chat. Chaves (tokens) só por formulário seguro ou pelos segredos do GitHub.
- Para ações externas (publicar, enviar, apagar), confirme antes com o dono.

## Comandos úteis

```bash
node instagram/fabrica/carrossel.mjs instagram/posts/<nome>.json   # gera um carrossel a partir de texto
node instagram/publicar.mjs --testar                                # confere o calendário de posts
python3 marca-mach/gerar_logo.py && node marca-mach/exportar_png.mjs  # regenera o logo
cd video-anuncio && npm run build                                   # renderiza o vídeo de 30 s
```

Requisitos: Node 18+, Python 3 com numpy e Pillow, ffmpeg, Playwright com Chromium e fonttools (`pip install fonttools`).

O `index.html` e os arquivos `susto*` na raiz são de um projeto antigo (um jogo de labirinto). Não mexa neles.
