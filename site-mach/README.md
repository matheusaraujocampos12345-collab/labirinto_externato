# Site MACH Estúdio (versão única)

Site oficial da MACH: estático, sem back-end. Abra `index.html` num servidor qualquer e pronto.
Esta versão junta o site anterior (identidade MACH, medidor, estrondo, filme e cartão de embarque)
com as ideias da outra versão (MACH em 3D sobre a água, cartão que inclina, página que se ajusta,
passos em rolagem lateral, feixes de luz, perguntas frequentes e o jatinho do rodapé).

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Todos os textos, na ordem da página. Cada seção começa com um comentário numerado (`<!-- 1 · ABERTURA -->`). |
| `styles.css` | Cores, fontes e visual. As cores ficam no começo, em `:root`. |
| `main.js` | Número do WhatsApp e tudo o que se mexe, menos o 3D. |
| `mach3d.js` | O 3D (abertura e símbolo dos passos). Só é baixado quando o aparelho aguenta. |
| `assets/` | Imagens, filme, ícone e a imagem de compartilhamento. |

## A ordem da página

| # | Seção | O que faz |
|---|---|---|
| 1 | Abertura | As letras MΛCH em 3D sobre um espelho d'água. A rolagem guia a câmera e troca as frases. |
| 2 | O problema | Sites de template empilham, o contador vai de 1 a 47, dá glitch e apaga: "E se o seu fosse diferente?" |
| 2b | A barreira e o filme | Ao cruzar M 1.0, o estrondo sônico (um só). "Cada site começa do zero." e o filme de 30 s. |
| 3 | As provas | Cartão que inclina com o dedo, página que se ajusta (celular, tablet, computador) e os três conceitos do hangar. |
| 4 | Como funciona | 4 passos em rolagem lateral. O símbolo Λ em 3D vai do traço ao sólido conforme os passos passam. |
| 5 | A chamada | "Quer um site que só a sua empresa tem?" sob feixes de luz. |
| 6 | Pedido | O cartão de embarque se monta enquanto a pessoa preenche. Abre o WhatsApp ou copia o texto para o direct. |
| 7 | Dúvidas | Perguntas frequentes em sanfona (abrir uma fecha a outra). |
| 8 | Rodapé | Um jatinho escreve MACH no céu. Tocar no desenho faz o voo de novo. |

O **medidor de Mach** fica no canto da tela da abertura até o filme. Depois do estrondo ele sai de cena.

## Onde mudar as coisas

**Número do WhatsApp e Instagram:** no começo do `main.js`.

```js
const CONFIG = {
  whatsapp: '5511939045618',   // DDI + DDD + número, só dígitos
  instagram: 'mach.sites',
};
```

O número também aparece uma vez no `index.html` (botão "Enviar pelo WhatsApp"), só como reserva caso o JavaScript não carregue. Se trocar o número, troque nos dois lugares.

**Textos:** direto no `index.html`. Procure a frase e troque. As perguntas frequentes ficam na seção 7.
As frases que aparecem na abertura 3D são os blocos `id="s1"` a `id="s4"`.

**Cores:** no começo do `styles.css`:

```css
--estrato: #0a0c0f;   /* fundo */
--titanio2: #1b2026;  /* superfícies */
--aluminio: #dfe3e7;  /* texto */
--nevoa: #8a929b;     /* texto de apoio */
--laranja: #ff6b1a;   /* acento: no máximo um destaque por tela */
```

As cores do 3D ficam dentro do `mach3d.js` (o laranja aparece como `1.0, .42, .10`).

**Fontes:** Saira (títulos), Hanken Grotesk (texto) e JetBrains Mono (números e rótulos), carregadas do Google Fonts no `index.html`.

## Rápido e leve

- O 3D é feito em WebGL puro, sem biblioteca. O arquivo inteiro tem cerca de 26 KB.
- O `mach3d.js` só é baixado se a pessoa não pediu "menos movimento" no aparelho e não está em modo de economia de dados.
- Se o aparelho não tiver WebGL, a abertura vira uma tela comum com uma imagem estática: `assets/abertura-3d.jpg` (computador) e `assets/abertura-3d-celular.jpg` (celular). Os passos mostram o símbolo Λ parado.
- O símbolo 3D dos passos só liga quando a seção chega perto da tela.
- O filme (4 MB) só é baixado quando aparece na tela.
- Com "menos movimento" ligado: sem rolagem suave, sem tremor e sem animações automáticas.

As imagens estáticas foram geradas a partir do próprio 3D (captura de tela sem os textos). Se o 3D mudar, gere as duas de novo.

## Como publicar (grátis)

- **Netlify Drop:** entre em app.netlify.com/drop e arraste a pasta `site-mach`. Em segundos o site está no ar com um endereço; depois dá para ligar um domínio próprio.
- **Vercel:** importe o repositório e defina `site-mach` como pasta raiz.
- **GitHub Pages:** coloque o conteúdo desta pasta num repositório próprio (ou na pasta `docs/`) e ative Pages nas configurações.

Depois de publicar, troque `content="assets/og-mach.jpg"` no `index.html` pelo endereço completo
(ex.: `https://seudominio.com.br/assets/og-mach.jpg`) para a prévia aparecer bonita no WhatsApp e no Instagram.

## Atenção: o filme de 30 s

Nos primeiros segundos, o filme mostra de propósito um site de template com a frase "Eleve seu negócio ao próximo nível", como sátira.
Se preferir que a frase não apareça em lugar nenhum do site, ela fica em `video-anuncio/src/genericSite.js`: troque e gere o filme de novo.

## Base open source

- [Lenis](https://github.com/darkroomengineering/lenis) 1.1.13 (MIT): rolagem suave, carregada do jsdelivr. Se não carregar, o site usa a rolagem normal.
- Fontes do Google Fonts (licença OFL): Saira, Hanken Grotesk e JetBrains Mono.
- Todo o resto (3D, animações, canvas, efeitos) é código próprio, sem template.
