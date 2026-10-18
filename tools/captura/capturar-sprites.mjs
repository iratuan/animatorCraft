// Capturas do app com personagens em sprites: palco, câmera (lousa/rosto), sincronia labial, piscada, danças.
// Uso: node tools/captura/capturar-sprites.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const destino = process.argv[2] ?? 'evidencias/sprites';
const base = 'http://127.0.0.1:5173/';
mkdirSync(destino, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 2100, height: 1100 } });
const erros = []; page.on('pageerror', (e) => erros.push(String(e))); page.on('console', (m) => m.type() === 'error' && erros.push(m.text()));

async function abrir(query) {
  await page.goto(`${base}?${query}`);
  await page.waitForSelector('.status'); await page.waitForTimeout(1200);
}
const palco = async (nome) => { await page.locator('.area-palco canvas').screenshot({ path: join(destino, nome) }); console.log('ok', nome); };
const tela = async (nome) => { await page.screenshot({ path: join(destino, nome) }); console.log('ok', nome); };

await page.goto(base); await page.evaluate(() => localStorage.clear());

await abrir('t=4.0&ator=cringefather');
await tela('01-editor-sprites-cinza.png');
await palco('02-palco-cringefather-falando.png');
await abrir('t=8.5&ator=betason');
await palco('03-palco-betason-falando.png');
await abrir('t=15&ator=cringefather');
await palco('04-palco-bracos-cruzados.png');

// close na lousa (conteúdo ajustado à lousa) e plano aberto
await abrir('t=23.5&ator=cringefather');
await tela('05-close-na-lousa-editor.png');
await palco('06-close-na-lousa.png');
await abrir('t=20.0'); await palco('07-transicao-para-a-lousa.png');
await abrir('t=31.5&ator=betason'); await palco('08-plano-aberto-betason-surpreso.png');

// close no rosto, com a boca em sincronia (vários instantes da mesma fala) e piscada
let n = 9;
for (const t of [40.9, 41.1, 41.3, 41.55, 41.75, 42.35]) {
  await abrir(`t=${t}&ator=betason`); await palco(`${String(n++).padStart(2, '0')}-close-rosto-betason-t${t}.png`);
}
await abrir('t=46.5&ator=erika'); await palco('15-erika-falando.png');

// danças: Laura (balé) e todos juntos
await abrir('t=52.5&ator=laura'); await palco('16-todos-chegam.png');
for (const t of [54.6, 55.2, 55.8]) { await abrir(`t=${t}&ator=laura`); await palco(`17-danca-t${t}.png`); }

// biblioteca e aba aula
await abrir('t=4.0&ator=dario');
await page.click('text=Biblioteca'); await page.waitForTimeout(400);
await tela('18-biblioteca-personagens-e-clipes.png');
await page.click('.abas >> text=Propriedades'); await page.waitForTimeout(300);
await tela('19-propriedades-dario-poses-e-dancas.png');
await page.click('.abas >> text=Aula'); await page.waitForTimeout(300);
await tela('20-aba-aula-papeis-modelos-camera.png');

// conteúdo que não cabe na lousa: aviso no editor
await page.goto(base);
await page.evaluate(() => localStorage.setItem('stickboard.roteiro.v2', '# Texto demais\n\nProfessor entra pela esquerda andando. Professor escreve "Linha um com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha dois com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha três com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha quatro com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha cinco com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha seis com bastante texto para ocupar espaço, muito mais texto ainda, e mais um pouco de texto sem fim" no quadro. Professor escreve "Linha sete com bastante texto para ocupar espaço" no quadro. Professor escreve "Linha oito com bastante texto para ocupar espaço" no quadro.'));
await page.goto(`${base}?t=30&ator=cringefather`); await page.waitForSelector('.status'); await page.waitForTimeout(1200);
await tela('21-aviso-conteudo-ultrapassa-a-lousa.png');

console.log('erros:', erros.slice(0, 5).join(' | ') || 'nenhum');
await browser.close();
