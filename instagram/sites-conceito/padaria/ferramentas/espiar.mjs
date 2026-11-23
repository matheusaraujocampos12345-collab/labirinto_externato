// Captura de conferência (não entra nas entregas).
// Uso: node ferramentas/espiar.mjs saida.png [t] [scrollY] [largura] [altura] [extra]
import { servidor, navegador, abrir, quadro } from './comum.mjs';
const [saida, t = '2', y = '0', largura = '432', altura = '768', extra = ''] = process.argv.slice(2);
const srv = await servidor();
const browser = await navegador();
const page = await abrir(browser, srv.url, { largura: +largura, altura: +altura, escala: +largura > 900 ? 1 : 2.5, extra });
await quadro(page, +t, +y);
await page.waitForTimeout(200);
await page.screenshot({ path: saida });
await browser.close(); srv.fechar();
