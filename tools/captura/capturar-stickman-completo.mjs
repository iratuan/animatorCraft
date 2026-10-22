import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/45-stickman-completo-windows';
mkdirSync(dest, { recursive: true });

console.log('Iniciando bateria completa de testes e capturas do StickBoard Stickman no Windows...');
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();
const erros = [];
win.on('pageerror', (e) => erros.push(String(e)));

await win.waitForFunction(() => document.querySelector('.app') || document.querySelector('.home'), null, { timeout: 60000 });
await win.waitForTimeout(1000);

// 1. Tela Inicial
await win.screenshot({ path: `${dest}/01-windows-tela-inicial.png` });
console.log('Capturado: 01-windows-tela-inicial.png');

// 2. Abrir editor
await win.locator('.home-card').first().click();
await win.waitForSelector('.app', { timeout: 60000 });
await win.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.waitForTimeout(1000);

// 3. Aba Personagens / Elenco Completo Stickman
const botaoPersonagens = win.locator('button.nav-item:has-text("Personagens"), button:has-text("Personagens")').first();
if (await botaoPersonagens.count() > 0) {
  await botaoPersonagens.click();
  await win.waitForTimeout(800);
}
await win.screenshot({ path: `${dest}/02-windows-aba-personagens-elenco.png` });
console.log('Capturado: 02-windows-aba-personagens-elenco.png');

// 4. Teste Stickman em Ação 1: Comparativo de Altura (Erika a mais alta vs Cringefather) e Diálogo
const textareaRoteiro = win.locator('textarea.roteiro-texto, textarea').first();
if (await textareaRoteiro.count() > 0) {
  await textareaRoteiro.fill(`[cenário: lousa]
# Erika a mais alta e Cringefather
Erika entra pela esquerda andando.
Erika diz "Veja como fiquei elegante e sou a mais alta da família!".
Cringefather entra pela direita andando.
Cringefather diz "Pelas leis da física quântica, isso é inegável!".
Erika dança por 2 segundos.`);
  await win.waitForTimeout(1500);
}
await win.screenshot({ path: `${dest}/03-windows-stickman-erika-alta-cringefather.png` });
console.log('Capturado: 03-windows-stickman-erika-alta-cringefather.png');

// 5. Teste Stickman em Ação 2: Crianças (BetaSon moletom alien, Dario dinossauro, Laura laços)
if (await textareaRoteiro.count() > 0) {
  await textareaRoteiro.fill(`[cenário: neutro]
# Crianças em Ação
BetaSon entra pela esquerda correndo.
BetaSon diz "Hey guys, look at my alien stickman hoodie!".
Dario entra pelo centro andando.
Dario diz "Olha o dinossauro!".
Laura entra pela direita pulando.
Laura diz "Eu sou a priminha mais sapeca!".
Laura pula por 2 segundos.`);
  await win.waitForTimeout(1500);
}
await win.screenshot({ path: `${dest}/04-windows-stickman-criancas-betason-dario-laura.png` });
console.log('Capturado: 04-windows-stickman-criancas-betason-dario-laura.png');

// 6. Teste Stickman em Ação 3: Novos Personagens (Véia com xale, Véio de poeta e cão Paraíba com rabo abanando)
if (await textareaRoteiro.count() > 0) {
  await textareaRoteiro.fill(`[cenário: lousa]
# Família Completa: Véia, Véio e Paraíba
Véia entra pela esquerda andando.
Véia diz "Menino Cringe, você deu comida pro Paraíba?".
Véio entra pela direita andando.
Véio diz "Ó nobre Paraíba, amigo de quatro patas e pura poesia!".
Paraíba entra pelo centro correndo.
Paraíba diz "Au au!".
Paraíba dança por 2 segundos.`);
  await win.waitForTimeout(1500);
}
await win.screenshot({ path: `${dest}/05-windows-stickman-veia-veio-paraiba.png` });
console.log('Capturado: 05-windows-stickman-veia-veio-paraiba.png');

// 7. Teste Stickman em Cenários: Podcast com microfones estilizados e telejornal
if (await textareaRoteiro.count() > 0) {
  await textareaRoteiro.fill(`[cenário: podcast]
# Podcast Stickman Show
Cringefather entra pela esquerda.
Cringefather diz "Bem-vindos ao episódio 42 do Podcast Ciência Cringe!".
BetaSon entra pela direita.
BetaSon diz "Hoje vamos debater se robôs sonham com pizza!".`);
  await win.waitForTimeout(1500);
}
await win.screenshot({ path: `${dest}/06-windows-stickman-cenario-podcast.png` });
console.log('Capturado: 06-windows-stickman-cenario-podcast.png');

// 8. Aba Aula / Modelos e Roteiros Prontos
const botaoAula = win.locator('button.nav-item:has-text("Aula"), button:has-text("Aula")').first();
if (await botaoAula.count() > 0) {
  await botaoAula.click();
  await win.waitForTimeout(800);
}
await win.screenshot({ path: `${dest}/07-windows-aba-aula-modelos.png` });
console.log('Capturado: 07-windows-aba-aula-modelos.png');

console.log('Erros em runtime observados:', erros);
await app.close();
console.log('Bateria completa de testes do executável Windows concluída!');
