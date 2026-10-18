// Capturas do elenco (todos em cena), das expressões de cada personagem e de cada dança.
// Uso: node tools/captura/capturar-personagens.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const destino = process.argv[2] ?? 'evidencias/personagens';
const base = 'http://127.0.0.1:5173/';
mkdirSync(destino, { recursive: true });

const roteiro = `# Elenco

Professor entra pela esquerda andando. Aluno entra pela direita andando. Mãe entra pela esquerda andando. Caçula entra pela direita andando. Priminha entra pela direita andando. Professor dança funky por 4 segundos. Aluno dança no estilo atual por 4 segundos. Mãe dança hippie por 4 segundos. Caçula dança descoordenada por 4 segundos. Priminha dança balé por 4 segundos. Todos dançam juntos por 5 segundos.`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));
page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));

async function abrir(query) {
  await page.goto(base);
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro', r); }, roteiro);
  await page.goto(`${base}?${query}`);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await page.waitForTimeout(500);
}
const foto = async (nome, clip) => { await page.screenshot({ path: join(destino, nome), clip }); console.log('ok', nome); };
const palco = async (nome) => {
  const box = await page.locator('.area-palco canvas').boundingBox();
  await foto(nome, box);
};

await abrir('t=7.9&ator=betason');
await foto('00-elenco-completo-editor.png');
await palco('01-elenco-completo-palco.png');

const dancas = [['cringefather', 9.6, 'funky-professor'], ['betason', 13.6, 'atual-aluno'], ['erika', 17.6, 'hippie-mae'], ['dario', 21.6, 'descoordenada-cacula'], ['laura', 25.6, 'ballet-priminha']];
let n = 2;
for (const [ator, t, nome] of dancas) {
  await abrir(`t=${t}&ator=${ator}`);
  await palco(`${String(n++).padStart(2, '0')}-danca-${nome}.png`);
}
for (const t of [29.4, 30.6, 31.8]) {
  await abrir(`t=${t}&ator=cringefather`);
  await palco(`${String(n++).padStart(2, '0')}-todos-dancam-juntos-t${t}.png`);
}
// folha de expressões de cada personagem (painel Propriedades)
for (const ator of ['cringefather', 'betason', 'erika', 'dario', 'laura']) {
  await abrir(`t=7.9&ator=${ator}`);
  const box = await page.locator('.props').boundingBox();
  await foto(`${String(n++).padStart(2, '0')}-expressoes-${ator}.png`, box);
}
if (erros.length) console.log('ERROS:\n' + erros.join('\n'));
await browser.close();



