import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/47-redesenho-personagens-stickman';
mkdirSync(dest, { recursive: true });

console.log('Iniciando captura dos 4 novos personagens stickman...');
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
  const x = box.x + segundos * 60;
  await win.mouse.click(x, box.y + box.height / 2);
  await win.waitForTimeout(800);
}

// 1. Cena principal com os 4 personagens juntos no palco
await textareaRoteiro.fill(`[cenário: lousa]
# Novos Personagens Redesenhados
Elizendra entra pela esquerda andando.
Elizendra diz "Vejam que gracinha meu avental de florzinha e colher de pau!".
Artur entra pela esquerda andando.
Artur diz "Minha camiseta de controle de videogame ficou top!".
Carol entra pela direita andando.
Carol diz "Meu rabo de cavalo alto e estampa de raio estão demais!".
Paraíba entra pelo centro correndo.
Paraíba diz "Au au!".
Todos dançam por 2 segundos.`);

await win.waitForTimeout(1500);

// Clicar no momento em que todos estão no palco em ação
await clicarReguaTempo(13.0);
await win.screenshot({ path: `${dest}/01-todos-os-quatro-personagens-palco.png` });
console.log('Capturado: 01-todos-os-quatro-personagens-palco.png');

// 2. Foco detalhado na Elizendra (vovó) e Artur
await textareaRoteiro.fill(`[cenário: lousa]
# Detalhes Elizendra e Artur
Elizendra entra pela esquerda andando.
Elizendra diz "Queridinhos, venham provar meus biscoitos deliciosos!".
Artur entra pela direita andando.
Artur diz "Com certeza dona Elizendra, gamer também ama biscoito!".`);

await win.waitForTimeout(1500);
await clicarReguaTempo(6.5);
await win.screenshot({ path: `${dest}/02-detalhe-elizendra-e-artur.png` });
console.log('Capturado: 02-detalhe-elizendra-e-artur.png');

// 3. Foco detalhado na Carol e no cãozinho Paraíba
await textareaRoteiro.fill(`[cenário: lousa]
# Detalhes Carol e Paraiba
Carol entra pela esquerda correndo.
Carol diz "Paraíba, pega a bolinha!".
Paraíba entra pela direita correndo.
Paraíba diz "Au au au!".
Paraíba pula.`);

await win.waitForTimeout(1500);
await clicarReguaTempo(6.5);
await win.screenshot({ path: `${dest}/03-detalhe-carol-e-paraiba.png` });
console.log('Capturado: 03-detalhe-carol-e-paraiba.png');

// 4. Captura do transporte (tempo da animacao e zoom) sem nenhum componente indesejado entre eles
const transporteBox = await win.locator('.transporte').boundingBox();
if (transporteBox) {
  await win.screenshot({
    path: `${dest}/04-barra-transporte-tempo-e-zoom-limpa.png`,
    clip: transporteBox,
  });
  console.log('Capturado: 04-barra-transporte-tempo-e-zoom-limpa.png');
}

await app.close();
console.log('Todas as capturas dos novos personagens stickman foram concluídas!');
