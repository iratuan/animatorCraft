import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/45-stickman-completo-windows';
mkdirSync(dest, { recursive: true });

console.log('Capturando momentos de palco clicando na régua da timeline...');
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();

await win.waitForFunction(() => document.querySelector('.app') || document.querySelector('.home'), null, { timeout: 60000 });
await win.locator('.home-card').first().click();
await win.waitForSelector('.app', { timeout: 60000 });
await win.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.waitForTimeout(1000);

const textareaRoteiro = win.locator('textarea.roteiro-texto, textarea').first();

async function clicarReguaTempo(segundos) {
  const regua = win.locator('.regua');
  const box = await regua.boundingBox();
  // zoom padrão é 60px/s
  const x = box.x + segundos * 60;
  await win.mouse.click(x, box.y + box.height / 2);
  await win.waitForTimeout(600);
}

// 1. Comparativo de Altura: Erika (a mais alta) e Cringefather
await textareaRoteiro.fill(`[cenário: lousa]
# Comparativo de Altura
Erika entra pela esquerda andando.
Erika diz "Veja como fiquei elegante e sou a mais alta da família!".
Cringefather entra pela direita andando.
Cringefather diz "Pelas leis da física quântica, isso é inegável!".
Erika dança por 2 segundos.`);
await win.waitForTimeout(1200);
await clicarReguaTempo(10.0);
await win.screenshot({ path: `${dest}/08-windows-palco-erika-e-cringefather.png` });
console.log('Capturado: 08-windows-palco-erika-e-cringefather.png');

// 2. Família Completa: Véia, Véio e Paraíba
await textareaRoteiro.fill(`[cenário: lousa]
# Familia Completa
Véia entra pela esquerda andando.
Véia diz "Menino Cringe, você viu o Paraíba?".
Véio entra pela direita andando.
Véio diz "Ó nobre Paraíba, amigo de quatro patas e pura poesia!".
Paraíba entra pelo centro correndo.
Paraíba diz "Au au!".
Paraíba dança por 2 segundos.`);
await win.waitForTimeout(1200);
await clicarReguaTempo(11.0);
await win.screenshot({ path: `${dest}/09-windows-palco-veia-veio-paraiba.png` });
console.log('Capturado: 09-windows-palco-veia-veio-paraiba.png');

// 3. Crianças em ação (BetaSon alien hoodie, Dario dinossauro, Laura sapeca)
await textareaRoteiro.fill(`[cenário: neutro]
# Criancas em Acao
BetaSon entra pela esquerda correndo.
BetaSon diz "Hey guys, look at my alien stickman hoodie!".
Dario entra pelo centro andando.
Dario diz "Olha o dinossauro!".
Laura entra pela direita pulando.
Laura diz "Eu sou a priminha mais sapeca!".
Laura pula por 2 segundos.`);
await win.waitForTimeout(1200);
await clicarReguaTempo(11.0);
await win.screenshot({ path: `${dest}/10-windows-palco-criancas-betason-dario-laura.png` });
console.log('Capturado: 10-windows-palco-criancas-betason-dario-laura.png');

// 4. Cenário Podcast
await textareaRoteiro.fill(`[cenário: podcast]
# Podcast Stickman Show
Cringefather entra pela esquerda andando.
Cringefather diz "Bem-vindos ao episódio 42 do Podcast Ciência Cringe!".
BetaSon entra pela direita andando.
BetaSon diz "Hoje vamos debater se robôs sonham com pizza!".`);
await win.waitForTimeout(1200);
await clicarReguaTempo(6.5);
await win.screenshot({ path: `${dest}/11-windows-palco-cenario-podcast-bancada.png` });
console.log('Capturado: 11-windows-palco-cenario-podcast-bancada.png');

await app.close();
console.log('Capturas de palco com régua concluídas com sucesso!');
