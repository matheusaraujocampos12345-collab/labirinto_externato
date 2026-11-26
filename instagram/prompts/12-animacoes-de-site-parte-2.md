# 12 animações de site · parte 2 · os prompts

Do Reels "12 animações de site · parte 2" da @mach.sites.
Copie o prompt do estilo que você quer e cole no seu assistente de IA, ou mande para quem cuida do seu site.

---

## 01 · Letreiro que corre

> Crie uma faixa de largura total com uma frase curta repetida em loop ("SMASH · CHEDDAR · PÃO DE BATATA ·"), andando para a esquerda devagar e sem emenda visível. Quando a pessoa rola a página, a faixa acelera de acordo com a velocidade da rolagem (até umas 6 vezes) e volta suave para a velocidade normal quando ela para. Coloque uma segunda faixa logo abaixo, inclinada para o outro lado, andando no sentido contrário. Use só transform para ficar leve. Se a pessoa desligou as animações no aparelho, deixe as faixas paradas.

## 02 · Letras que sobem

> No título principal, faça cada letra subir de trás de uma máscara invisível (a linha corta o que está abaixo dela), uma depois da outra, com 0,04 s entre elas e 0,5 s de duração cada, com saída suave (ease-out). A segunda linha começa logo depois da primeira. Quando o título termina, uma linha fina na cor de destaque cresce embaixo dele, e o texto de apoio e o botão entram com fade. Uma vez só, ao abrir a página. Mantenha o título como texto de verdade, para o leitor de tela ler a frase inteira e não letra por letra.

## 03 · Antes e depois

> Monte um comparador com duas fotos do mesmo lugar, antes e depois, uma por cima da outra. Uma linha vertical com uma alça redonda (setas para os dois lados) divide as duas: à esquerda aparece o antes e à direita o depois. A pessoa arrasta a alça com o dedo ou com o mouse e a divisão acompanha sem atraso. Coloque as etiquetas "ANTES" e "DEPOIS" nos cantos de baixo. Comece com a alça em 50%. As setas do teclado também movem a alça. No celular, o arraste na foto não pode travar a rolagem da página.

## 04 · Cartões empilhados

> Na seção "Como funciona", coloque cada passo num cartão grande. Ao rolar, cada cartão fica preso no topo (position: sticky) e o próximo sobe por cima dele, deixando uns 20 px do anterior aparecendo. O cartão que fica para trás diminui para 95% e escurece um pouco, como uma pilha. O último cartão leva o número na cor de destaque. Não precisa de JavaScript pesado: sticky e uma animação ligada à rolagem bastam. No celular, funciona igual.

## 05 · Luz que segue o cursor

> Deixe a primeira tela quase toda no escuro: texto e imagens bem apagados, com uma grade de pontos no fundo. Um círculo de luz de uns 400 px segue o cursor com suavidade e acende o que está embaixo: o texto volta à cor normal, os pontos da grade clareiam e aparece um brilho quente bem leve. A borda da luz é macia, sem corte. No celular, a luz segue o dedo ou passeia sozinha, devagar, pela tela. Se a pessoa desligou as animações no aparelho, mostre tudo aceso.

## 06 · Sublinhado que desliza

> No menu do topo, coloque uma linha fina na cor de destaque embaixo do item em que o cursor está. Quando o cursor passa para outro item, a linha desliza até ele e muda para a largura do item novo: a ponta da frente chega primeiro (0,3 s) e a de trás alcança logo depois (0,4 s), como se a linha esticasse. O item em foco fica na cor do texto e os outros ficam um pouco apagados. Ao sair do menu, a linha volta para a página atual. No celular, a linha marca a página atual.

## 07 · Barra de leitura

> Nos artigos do blog, fixe uma barra fina (4 px) na cor de destaque logo abaixo do menu. Ela enche da esquerda para a direita conforme a pessoa lê, ligada à rolagem dentro do artigo: 0% no título e 100% no fim do texto. Num canto de baixo, uma etiqueta pequena mostra "52% · faltam 2 min", com o tempo calculado pelo número de palavras (umas 200 por minuto). No fim, a etiqueta vira "leitura concluída". Use as animações ligadas à rolagem do CSS (scroll-driven animations) ou um código leve.

## 08 · Perguntas que abrem

> Na seção de dúvidas, mostre só as perguntas, uma por linha, com um "+" à direita. Ao tocar numa pergunta, a resposta abre logo abaixo e empurra as outras com suavidade (0,35 s, ease-in-out), e o "+" gira 45° até virar um "×" na cor de destaque. Só uma fica aberta por vez: abrir outra fecha a anterior. Use botões de verdade (com aria-expanded), para funcionar no teclado e com leitor de tela.

## 09 · Item voa para a sacola

> Quando a pessoa toca em "Adicionar", uma miniatura redonda da foto do produto sai do cartão e voa em arco até o ícone da sacola no topo, diminuindo no caminho (0,6 s). Ao chegar, a sacola cresce 14% e volta, rápido e sem quicar, e um contador na cor de destaque aparece ou soma 1. O botão do produto vira "Na sacola". Se a pessoa desligou as animações no aparelho, pule o voo e só atualize o contador.

## 10 · Título que se digita

> No título da primeira tela, deixe o começo fixo ("Seu apê em") e faça a última palavra se digitar letra por letra (uns 0,055 s por letra), com um cursor vertical piscando na cor de destaque. Depois de 1 s, a palavra se apaga rápido e outra se digita no lugar (Pinheiros, Moema, Tatuapé...), em loop. A linha não pode pular quando a palavra muda de tamanho. Para leitores de tela, deixe a frase completa com a primeira palavra.

## 11 · Rolagem na horizontal

> Crie uma seção que fica presa na tela enquanto a pessoa rola para baixo, e use essa rolagem vertical para mover uma fileira de cartões para a esquerda. Quando o último cartão chega, a seção solta e a página continua normal. Uma linha fina embaixo mostra o progresso, e um contador "03 / 05" no canto mostra o cartão atual. No celular, troque por um carrossel que a pessoa arrasta com o dedo.

## 12 · Cortina ao carregar

> Ao abrir o site, mostre uma tela escura com o nome do negócio em letras pequenas e um contador grande de 000 a 100, com uma linha fina na cor de destaque enchendo junto. Dura no máximo 1 s, ou o tempo real de carregar as imagens da primeira tela. No 100, a tela se divide no meio: a metade de cima sobe e a de baixo desce, cada uma levando metade do contador, e aparece a foto da primeira tela fazendo um zoom leve de 118% para 100%. Logo depois, o título sobe de trás de uma máscara. Mostre a cortina só na primeira visita da sessão.

---

Quer isso feito sob medida no seu site? Chama no direct.
