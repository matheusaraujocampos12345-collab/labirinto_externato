# Site MACH Estúdio

Site-vitrine da MACH: estático, sem back-end. Abra `index.html` num servidor qualquer e pronto.

## Antes de publicar

Abra `main.js` e coloque o número de WhatsApp (DDI + DDD + número, só dígitos):

```js
const CONFIG = {
  whatsapp: '5511999998888',
  instagram: 'mach.sites',
};
```

Enquanto o número estiver vazio, o botão abre o WhatsApp com a mensagem pronta e a pessoa escolhe para quem enviar.

## O que tem no site

| Seção | O que faz |
|---|---|
| Abertura | Céu da estratosfera com ar passando e ondas de pressão saindo do Λ. As ondas se acumulam à frente como num jato real abaixo de Mach 1. |
| Medidor de Mach | Fixo no canto: a rolagem é o acelerador. Vai de M 0,60 até passar de M 2. |
| O problema | Os sites de template empilham enquanto o contador vai de 1 a 47, dá glitch e apaga: "E se o seu fosse diferente?" |
| A barreira | Ao cruzar M 1,0, acontece o estrondo sônico (clarão, anéis, vapor e tremida). O cone de Mach se desenha com o ângulo certo para M 1,4. |
| O filme | O anúncio de 30 s em versão leve (4 MB), toca sem som ao aparecer na tela. |
| Serviços | Ficha técnica: site institucional, landing page, portfólio, animação e 3D. |
| Projetos | Três conceitos animados em tempo real (HALO, ÓRBITA com a hora real, MARÉ). Reagem ao mouse e ao toque. |
| Como funciona | 5 etapas com a rota acendendo conforme a rolagem. |
| Pedido | Formulário que vira um cartão de embarque ao vivo. "Enviar pelo WhatsApp" abre a conversa com a mensagem pronta; "Prefiro o direct" copia o texto e abre o direct da @mach.sites. |

## Como publicar (grátis)

- **Netlify Drop:** entre em app.netlify.com/drop e arraste a pasta `site-mach`. Em segundos o site está no ar com um endereço; depois dá para ligar um domínio próprio.
- **Vercel:** importe o repositório e defina `site-mach` como pasta raiz.
- **GitHub Pages:** coloque o conteúdo desta pasta num repositório próprio (ou na pasta `docs/`) e ative Pages nas configurações.

Depois de publicar, troque `content="assets/og-mach.jpg"` no `index.html` pelo endereço completo (ex.: `https://seudominio.com.br/assets/og-mach.jpg`) para a prévia aparecer bonita no WhatsApp e no Instagram.

## Base open source

- [Lenis](https://github.com/darkroomengineering/lenis) (MIT): rolagem suave, carregada por CDN. Se não carregar, o site usa a rolagem normal.
- Fontes do Google Fonts (licença OFL): Saira, Hanken Grotesk e JetBrains Mono.
- Todo o resto (animações, canvas, efeitos) é código próprio, sem template.

## Repertório

Referências de linguagem visual que inspiraram o site, sem copiar nenhuma delas:
Boom Supersonic (aviação supersônica, tipografia grande no escuro), SpaceX (cenas de tela cheia e pouco texto),
Anduril (estética técnica, dados de telemetria), Lusion e Active Theory (experiências interativas em WebGL)
e Linear (precisão e acabamento de interface).
