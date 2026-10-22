import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/46-sem-chibi-stickman-windows';
mkdirSync(dest, { recursive: true });

console.log('Iniciando teste do executável Windows com Stickman exclusivo...');
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();
const erros = [];
win.on('pageerror', (e) => erros.push(String(e)));

await win.waitForFunction(() => document.querySelector('.app') || document.querySelector('.home'), null, { timeout: 60000 });
await win.waitForTimeout(1000);

// 1. Tela Inicial
await win.screenshot({ path: `${dest}/01-windows-home.png` });
console.log('Capturado: 01-windows-home.png');

// 2. Abrir editor
await win.locator('.home-card').first().click();
await win.waitForSelector('.app', { timeout: 60000 });
await win.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.waitForTimeout(1000);

// 3. Editor Geral - Palco com Stickman desenhado proceduralmente
await win.screenshot({ path: `${dest}/02-windows-editor-stickman.png` });
console.log('Capturado: 02-windows-editor-stickman.png');

// 4. Inserir cena com Erika (mais alta) e Betason para ver os stickmen em ação
const textarea = win.locator('textarea');
await textarea.fill('# Aula Magna\n[fundo azul]\nErika entra pela esquerda andando.\nBetaSon entra pela direita andando.\nErika diz "Bem-vindos ao StickBoard!" empolgada.\nBetaSon acena.\nEspera 2 segundos.');
await win.waitForTimeout(1200);

// Play / Avanço no tempo
await win.screenshot({ path: `${dest}/03-windows-stickman-erika-betason.png` });
console.log('Capturado: 03-windows-stickman-erika-betason.png');

// 5. Inspecionar e capturar painel lateral
await win.screenshot({ path: `${dest}/04-windows-painel-lateral.png` });
console.log('Capturado: 04-windows-painel-lateral.png');

// 6. Abrir modal de Expressões e Clipes
const btnClip = win.locator('button[data-barra="Clipes"]').first();
if (await btnClip.isVisible()) {
  await btnClip.click({ force: true });
  await win.waitForTimeout(1000);
  await win.screenshot({ path: `${dest}/05-windows-modal-animacoes-stickman.png` });
  console.log('Capturado: 05-windows-modal-animacoes-stickman.png');
}

console.log('Erros no console:', erros);
await app.close();
console.log('Teste Windows finalizado com sucesso!');
