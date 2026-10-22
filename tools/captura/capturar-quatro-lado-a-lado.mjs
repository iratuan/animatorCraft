import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/47-redesenho-personagens-stickman';
mkdirSync(dest, { recursive: true });

console.log('Capturando vitrine dos 4 personagens lado a lado...');
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();

await win.waitForFunction(() => document.querySelector('.app') || document.querySelector('.home'), null, { timeout: 60000 });
await win.locator('.home-card').first().click();
await win.waitForSelector('.app', { timeout: 60000 });
await win.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.waitForTimeout(1000);

const textareaRoteiro = win.locator('textarea.roteiro-texto, textarea').first();

// Script com os 4 personagens entrando e ficando parados em exibição
await textareaRoteiro.fill(`[cenário: neutro]
# Vitrine dos Personagens
Elizendra entra pela esquerda andando.
Artur entra pela esquerda andando.
Carol entra pela direita andando.
Paraíba entra pela direita correndo.
Todos ficam parados por 5 segundos.`);

await win.waitForTimeout(1500);

// Clicar na régua no instante 9.0s (quando todos já entraram e estão parados em exibição)
const regua = win.locator('.regua');
const boxRegua = await regua.boundingBox();
await win.mouse.click(boxRegua.x + 9.0 * 60, boxRegua.y + boxRegua.height / 2);
await win.waitForTimeout(1000);

const palcoEl = win.locator('.area-palco canvas, canvas').first();
const palcoBox = await palcoEl.boundingBox();

// 1. Palco completo com os 4 personagens
await win.screenshot({
  path: `${dest}/08-vitrine-quatro-personagens-lado-a-lado.png`,
  clip: palcoBox,
});
console.log('Capturado: 08-vitrine-quatro-personagens-lado-a-lado.png');

// 2. Close-up Elizendra (x ~ 0.12)
await win.screenshot({
  path: `${dest}/09-closeup-elizendra.png`,
  clip: {
    x: palcoBox.x + palcoBox.width * 0.05,
    y: palcoBox.y + palcoBox.height * 0.28,
    width: palcoBox.width * 0.16,
    height: palcoBox.height * 0.70,
  },
});
console.log('Capturado: 09-closeup-elizendra.png');

// 3. Close-up Artur (x ~ 0.23)
await win.screenshot({
  path: `${dest}/10-closeup-artur.png`,
  clip: {
    x: palcoBox.x + palcoBox.width * 0.17,
    y: palcoBox.y + palcoBox.height * 0.35,
    width: palcoBox.width * 0.16,
    height: palcoBox.height * 0.63,
  },
});
console.log('Capturado: 10-closeup-artur.png');

// 4. Close-up Paraíba (x ~ 0.75)
await win.screenshot({
  path: `${dest}/12-closeup-paraiba.png`,
  clip: {
    x: palcoBox.x + palcoBox.width * 0.68,
    y: palcoBox.y + palcoBox.height * 0.50,
    width: palcoBox.width * 0.16,
    height: palcoBox.height * 0.48,
  },
});
console.log('Capturado: 12-closeup-paraiba.png');

// 5. Close-up Carol (x ~ 0.86)
await win.screenshot({
  path: `${dest}/11-closeup-carol.png`,
  clip: {
    x: palcoBox.x + palcoBox.width * 0.81,
    y: palcoBox.y + palcoBox.height * 0.30,
    width: palcoBox.width * 0.17,
    height: palcoBox.height * 0.68,
  },
});
console.log('Capturado: 11-closeup-carol.png');

await app.close();
console.log('Todas as capturas atualizadas com sucesso!');
