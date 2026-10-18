// Gera as capturas de tela de evidência em ./evidencias usando o Edge instalado (sem baixar navegador).
// Uso: node tools/captura/capturar.mjs <pasta-destino> [url] ; cada captura é descrita em CAPTURAS abaixo.
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const destino = process.argv[2] ?? 'evidencias';
const base = process.argv[3] ?? 'http://127.0.0.1:5173/';
mkdirSync(destino, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
const erros = [];
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
page.on('pageerror', (e) => erros.push(String(e)));

async function abrir(query = '') {
  await page.goto(`${base}?${query}`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}?${query}`);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(400);
}
const foto = async (nome) => { await page.screenshot({ path: join(destino, nome) }); console.log('ok', nome); };

await abrir('t=7.2&ator=professor');
await foto('01-editor-visao-geral.png');

await abrir('t=17&ator=aluno');
await foto('02-fala-e-quadro-aluno-selecionado.png');

await abrir('t=0.8&ator=professor');
await foto('03-entrada-andando.png');

await abrir('t=21&ator=professor');
await foto('03b-escrevendo-no-quadro-com-a-mao.png');

await abrir('t=27&ator=professor');
await foto('03c-formula-no-quadro.png');

await abrir('t=40&ator=aluno');
await foto('03d-elenco-completo.png');

await abrir('t=7.2&ator=aluno');
await page.evaluate(() => document.querySelector('.props .corpo').scrollTo(0, 9999));
await foto('03e-biblioteca-de-poses.png');

await page.click('text=Biblioteca');
await foto('04-biblioteca-de-atores.png');

await abrir('t=7.2&ator=aluno');
await page.click('text=Biblioteca');
await page.evaluate(() => document.querySelector('.props .corpo').scrollTo(0, 560));
await foto('04b-biblioteca-sequencias-padrao.png');
await page.click('text=Acertei!');
await page.waitForTimeout(300);
await page.screenshot({ path: join(destino, '04c-sequencia-inserida-no-roteiro.png') });
console.log('ok 04c-sequencia-inserida-no-roteiro.png');

await abrir('t=7.2');
await page.click('text=9:16');
await page.waitForTimeout(300);
await foto('05-formato-vertical-shorts.png');

if (erros.length) console.log('ERROS DO CONSOLE:\n' + erros.join('\n'));
await browser.close();
