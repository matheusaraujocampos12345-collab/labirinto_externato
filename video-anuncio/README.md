# Anúncio animado 30 s — MACH Estúdio

Vídeo publicitário vertical **9:16 · 1080×1920 · 30 fps · 30 s** para um estúdio que cria sites com animação premium.

Arquivo final: **`anuncio-mach-30s.mp4`** (H.264 + AAC 48 kHz, pronto para Reels/TikTok/Shorts).

## Roteiro implementado

| Tempo | Ato | O que acontece |
|---|---|---|
| 0–2,5 s | 1 — O problema | Cursor clica numa barra de busca e digita "criar site para minha empresa" (com sugestões de autocompletar); tecla Enter. Legenda: **"Procurando um site pra sua empresa?"** |
| 2,5–12,9 s | 1 | Site genérico: degradê roxo-azul, "Eleve seu negócio ao próximo nível", botão "Comece agora", três cards com ícones, bolhas 3D brilhantes, fonte sans-serif padrão. 28 cortes (slide, whip pan com desfoque de movimento, zoom) que aceleram de **1,5 s → 0,2 s por site**; só mudam o logo e a cor de destaque. Contador "Site 1" … "Site 12" … "Site 47". Legenda: **"Todos parecem… isso."** |
| 12,9–13,7 s | 2 — A quebra | Glitch: separação RGB, fatias rasgadas, macroblocos, quantização; o áudio gagueja e corta |
| 13,7–14,7 s | 2 | Preto absoluto, **1 s de silêncio digital** |
| 14,7–16 s | 2 | **"E se o seu fosse diferente?"**, branco, revelado por máscara de baixo para cima |
| 16–18,8 s | 3 — Premium | Grafite, luz de estúdio, poeira em desfoque. **"Animação de verdade."** entra letra a letra (desfoque → foco), dolly lento |
| 18,3–21,9 s | 3 | Smartphone genérico em 3D real (three.js) gira devagar com reflexos de estúdio e reflexo no piso; a tela mostra um site premium com parallax interno; câmera faz macro na borda/botões com profundidade de campo rasa |
| 21,6–25 s | 3 | Rack focus. **"Feita sob medida."** + seções do site em parallax + números contando: **60 FPS · 100% SOB MEDIDA · 47 → 0 TEMPLATES** |
| 25–30 s | 4 — Chamada | 12 linhas finas atravessam a tela e montam o logo **MΛCH**; estrondo sônico no encaixe; os diamantes de choque acendem sob o Λ; descritor ESTÚDIO; **"Sites que ninguém confunde com template."**; `@mach.sites` |

**Áudio** (sintetizado do zero, sem samples de terceiros): Atos 1–2 com trilha "de banco" alegre e repetitiva (ukulele, glockenspiel, palmas) que acelera de 112 → 192 bpm junto com os cortes, sobe de tom, satura e vira bitcrush até sumir no glitch. Atos 3–4 com pulsos graves, piano esparso, pad escuro e whooshes sincronizados aos movimentos, impacto grave e estrondo sônico duplo no encaixe do logo, diamantes acendendo. Ato 1 ≈ −9 LUFS, Ato 3 ≈ −19 LUFS (contraste de ~10 dB).

Nenhum nome, logo, produto ou site da Apple é usado: o celular é genérico (câmera em furo), a tipografia é Inter e as marcas exibidas nos sites são fictícias.

## Trocar @, site e slogan

Edite `config.js`:

```js
export const BRAND = {
  name: 'MACH Estúdio',
  instagram: '@mach.sites',
  site: '',                     // vazio = não aparece no vídeo
  tagline: ['Sites que ninguém', 'confunde com template.'],
};
```

O logo do Ato 4 vem de `src/logoMach.js`, gerado por `python3 ../marca-mach/gerar_logo.py` (mesma geometria dos arquivos do logo).

e gere de novo (abaixo). Para trocar só o fim, basta re-renderizar os quadros 750–899:
`node scripts/render.mjs --out out/frames --from 750 --to 899` e depois o passo do ffmpeg em `scripts/build.sh`.

## Como gerar

Requisitos: Node 18+, Python 3 com `numpy`, `ffmpeg`, Playwright com Chromium (`npm i && npx playwright install chromium`) e as fontes **Inter / Inter Display** e **Liberation Sans** instaladas no sistema.

```bash
npm run build          # quadros + trilha + MP4
```

Partes separadas:

```bash
node scripts/export-timeline.mjs                                   # linha do tempo → out/timeline.json
node scripts/render.mjs --out out/preview --frames 0,120,450,600   # prévia de quadros soltos
python3 scripts/make_audio.py                                      # trilha → out/trilha.wav
```

## Estrutura

- `src/timeline.js` — todos os tempos (cortes, digitação, deixas); o áudio lê a mesma linha do tempo.
- `src/act1.js`, `src/genericSite.js` — busca, site de template, transições, contador, legendas.
- `src/act2.js` — glitch, preto, texto com máscara.
- `src/act3.js`, `src/phone3d.js`, `src/premiumSite.js`, `src/studio.js` — estética premium, celular 3D, números.
- `src/act4.js`, `src/logoMach.js` — logo MACH montado por linhas, estrondo sônico e chamada final.
- `vendor/fonts/` — Saira (OFL), usada no slogan.
- `scripts/make_audio.py` — síntese da trilha.
- `vendor/` — three.js r170 (licença MIT em `vendor/THREE-LICENSE`).
