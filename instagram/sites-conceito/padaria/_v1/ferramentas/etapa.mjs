// Salva uma captura 1080x1920 da primeira tela e registra o horário real em captura/etapas/etapas.json.
// Uso: node ferramentas/etapa.mjs <numero> <slug> "<descrição>"
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { RAIZ, servidor, navegador, abrir, quadro } from './comum.mjs';

const [num, slug, descricao] = process.argv.slice(2);
const pasta = path.join(RAIZ, 'captura', 'etapas');
fs.mkdirSync(pasta, { recursive: true });
const arquivo = `${String(num).padStart(2, '0')}-${slug}.png`;

const srv = await servidor();
const browser = await navegador();
const page = await abrir(browser, srv.url);
await quadro(page, 2.0, 0);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(pasta, arquivo) });
await browser.close();
srv.fechar();

const horario = execSync('date -Iseconds').toString().trim();
const jp = path.join(pasta, 'etapas.json');
const dados = fs.existsSync(jp) ? JSON.parse(fs.readFileSync(jp, 'utf8')) : { etapas: [] };
dados.etapas = dados.etapas.filter((e) => e.numero !== Number(num));
dados.etapas.push({ numero: Number(num), etapa: descricao, arquivo, horario });
dados.etapas.sort((a, b) => a.numero - b.numero);
fs.writeFileSync(jp, JSON.stringify(dados, null, 2) + '\n');
console.log(`${arquivo} salvo às ${horario}`);
