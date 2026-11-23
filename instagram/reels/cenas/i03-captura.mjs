// Gravação do i03 ("Feito para padaria", 19 s) no site da Padaria Quatro Horas, com 4 subquadros por
// quadro (borrão de movimento). Rolagens lentas, com pausa de ~1 s depois de cada movimento.
// Uso, da raiz do repositório: node instagram/reels/cenas/i03-captura.mjs [--workers 2]
import { gravar, curva, curvaLentaNoInicio } from './padaria-gravar.mjs';

export const DURACAO = 19;
await gravar({
  nome: 'i03-site',
  duracao: DURACAO,
  tomadas: (m) => [
    [0, 3, () => 0, () => 3], // primeira tela parada
    // o pão sai do forno: a rolagem leva 5 s e para; segura 1,3 s
    // (começa mais devagar: no início a mão entra rápido no vídeo do forno)
    [3, 9.5, (t) => (t < 8.6 ? curvaLentaNoInicio(3.0, 8.6, 0, m.heroCurso)(t) : m.heroCurso + 6 * ((t - 8.6) / 0.9)), (t) => 3 + t],
    // a aba Natal do cardápio: parada 1 s, desce devagar pelos itens, para 1,2 s
    [9.5, 14.5, curva([[9.5, m['c-natal'] - 118], [10.5, m['c-natal'] - 114], [13.4, m['c-natal'] + 40], [14.5, m['c-natal'] + 43]]), (t) => 3 + t],
    [14.5, DURACAO, () => 0, () => 3], // primeira tela de novo, no mesmo estado do começo (loop)
  ],
});
