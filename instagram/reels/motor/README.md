# Motor dos Reels da MACH

Gera Reels 1080×1920, 30 fps, H.264 (yuv420p, CRF 18, faststart), **sem áudio**: o dono escolhe a música no app.
Cada Reels é um módulo JavaScript com uma função `desenhar(ctx, t)`. O motor abre o módulo no Chromium, desenha quadro a quadro num canvas, salva os PNG e chama o ffmpeg.

## Gerar

Da raiz do repositório:

```bash
node instagram/reels/motor/render.mjs instagram/reels/cenas/i04.js          # vídeo + capa + prévia
node instagram/reels/motor/render.mjs instagram/reels/cenas/i04.js --quadros 0,90,300 --grade   # só conferir quadros
bash instagram/reels/gerar-todos.sh                                         # todos os Reels
```

Sai em `instagram/reels/`: `<nome>.mp4`, `<id>-capa.jpg` (JPEG 92) e `previas/<id>.mp4` (720×1280, até ~3 MB).
Opções: `--workers 2` (padrão), `--grade` (mostra a zona segura e o recorte 4:5), `--so-capa`, `--manter` (guarda os PNG em `.quadros/`).

## Criar um Reels novo

```js
// instagram/reels/cenas/padaria.js
import { fundo, bloco, rotulo, assinatura, COR } from '../motor/marca.js';

export default {
  id: 'i03',                      // nome da capa e da prévia
  nome: 'i03-feito-para-padaria', // nome do mp4
  duracao: 16,                    // segundos
  fontes: [],                     // fontes extras: [{ familia, arquivo: '/caminho.ttf', peso, estilo }]
  async preparar(ctx) {},         // opcional: carregar imagens, montar layouts
  desenhar(ctx, t, f) {           // t em segundos, f = número do quadro (pode ser async)
    fundo(ctx);
    rotulo(ctx, t, { texto: 'Feito para', y: 292, entra: 0, entrada: 'corte' });
    bloco(ctx, t, { texto: 'Esse site é de uma padaria.', y: 340, tamanho: 84, entra: 0, entrada: 'corte' });
    assinatura(ctx, t, { entra: 12, sai: 15 });
  },
  capa(ctx) {},                   // opcional: capa própria (gancho no centro: o perfil corta em 4:5)
};
```

## Sobreposição da marca (`marca.js`)

Use sempre estes blocos: todo Reels fica com o mesmo visual.

- `bloco(ctx, t, op)`: texto com entrada e saída. `estilo`: `titulo` (Saira 300), `texto` (Hanken Grotesk), `rotulo` (JetBrains Mono maiúsculo espaçado) ou `marcacao` (Saira expandida). `entrada`: `mascara` (a linha sobe de trás de uma máscara), `palavras`, `fade` ou `corte`. `saida`: `mascara`, `fade` ou `corte`. `destaque: 'palavra'` pinta de laranja (um por tela). `painel` e `sombra` ajudam a ler sobre vídeo.
- `rotulo(...)`, `assinatura(...)` (o "@mach.sites" pequeno), `dedo(...)` (toque na tela), `cantoneiras(...)`, `diamantes(...)`, `vinheta(...)`.
- `faixa(ctx, t, op)`: faixa de largura total para pôr texto sobre um site gravado (abre e fecha pela linha do meio). Use a cor escura do próprio site para não brigar com ele (o i03 e o i11 usam o "Forno" da padaria).
- `COR`, `FONTE`, `ZONA` (x 90–940, y 260–1440).

O motor **avisa no fim** se algum texto ficou fora da zona segura.

Outros módulos: `tempo.js` (curvas suaves, `chaves()` para animar por pontos, `carregarImagem()`), `camadas.js` (desmontar uma cena em camadas, como no i04 e no i05) e `../cenas/comum.js` (texto que acende, riscos de ar, trilho de progresso).

## Gravar um site de verdade (`capturar.mjs`)

Para filmar um site nosso (como o i01): crie um arquivo de configuração e grave antes de renderizar.

```bash
node instagram/reels/motor/capturar.mjs instagram/reels/cenas/i01-captura.mjs
```

A gravação é exata: viewport 432×768 com escala 2,5 (dá 1080×1920), relógio da página parado e avançando 1000/30 ms por quadro, rolagem com `window.scrollTo` e animações CSS presas ao mesmo relógio. Bloqueie a Lenis (`bloquear: ['**/lenis*']`): sem ela o site rola nativo. Os quadros vão para `.quadros/<nome>/` com um `meta.json` (rolagem e posição dos elementos pedidos) e o módulo do Reels desenha por cima.

Para usar um vídeo pronto (como a rolagem da padaria no i03 e no i11), extraia os quadros com o ffmpeg para `.quadros/<nome>/q_%05d.png` (`-start_number 0`) e desenhe com `carregarImagem()`. O `gerar-todos.sh` faz isso.

## Regras que valem para todo Reels

- Abre já em movimento, com o texto na tela. Nunca com logo ou tela parada.
- Todo texto do roteiro aparece na tela, dentro da zona segura.
- Termina no mesmo quadro em que começou (loop).
- Cortes em múltiplos de 0,5 s (funciona com qualquer música de ~120 bpm).
- Laranja #FF6B1A só como acento. No máximo uma referência de aviação por peça.
- Movimento suave: nada de quicar ou balançar.

Requisitos: Node 18+, Playwright com Chromium e ffmpeg. As fontes estão em `fontes/` (licença OFL).
