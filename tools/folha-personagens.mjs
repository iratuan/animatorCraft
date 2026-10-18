// Folha de personagens em alta resolução: o elenco parado e em pose, com o palco quase em tamanho real.
// Uso: node tools/folha-personagens.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const destino = process.argv[2] ?? 'evidencias/folha';
const base = 'http://127.0.0.1:5173/';
mkdirSync(destino, { recursive: true });
const roteiro = `# Folha

Professor entra pela esquerda andando. Aluno entra pela direita andando. Mãe entra pela esquerda andando. Caçula entra pela direita andando. Priminha entra pela direita andando. Todos ficam parados. Priminha acena. Aluno diz "Eu só vim pelo lanche!" feliz. Professor cruza os braços. Todos dançam juntos por 5 segundos.`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 2100, height: 1100 } });
async function abrir(t) {
  await page.goto(base);
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro', r); }, roteiro);
  await page.goto(`${base}?t=${t}&ator=aluno`);
  await page.waitForSelector('canvas'); await page.waitForTimeout(500);
}
async function palco(nome, regiao) {
  const box = await page.locator('.area-palco canvas').boundingBox();
  const clip = regiao ? { x: box.x + box.width * regiao[0], y: box.y + box.height * regiao[1], width: box.width * regiao[2], height: box.height * regiao[3] } : box;
  await page.screenshot({ path: join(destino, nome), clip }); console.log('ok', nome);
}
await abrir(7.9);
await palco('01-elenco-parado.png');
await palco('02-detalhe-esquerda-professor-e-mae.png', [0, 0.3, 0.42, 0.7]);
await palco('03-detalhe-direita-priminha-cacula-aluno.png', [0.58, 0.3, 0.42, 0.7]);
await abrir(10.5);
await palco('04-elenco-em-acao.png');
await abrir(17.5);
await palco('05-todos-dancam.png');
await browser.close();
