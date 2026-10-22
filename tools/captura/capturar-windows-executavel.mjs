import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/43-fase-3-windows';
mkdirSync(dest, { recursive: true });

console.log('Iniciando teste do executável Windows empacotado...');
const app = await electron.launch({ executablePath: 'release/win-unpacked/StickBoard.exe', args: [] });
const win = await app.firstWindow();
const erros = [];
win.on('pageerror', (e) => erros.push(String(e)));

await win.waitForFunction(() => document.querySelector('.app') || document.querySelector('.home'), null, { timeout: 60000 });
await win.waitForTimeout(1000);

// 1. Tela Inicial
await win.screenshot({ path: `${dest}/01-windows-tela-inicial.png` });
console.log('Capturado: 01-windows-tela-inicial.png');

// 2. Abrir editor clicando no card da home
await win.locator('.home-card').first().click();
await win.waitForSelector('.app', { timeout: 60000 });

await win.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await win.waitForTimeout(1000);

// 3. Editor com Nova Barra de Status e Menus
await win.screenshot({ path: `${dest}/02-windows-editor-barra-status.png` });
console.log('Capturado: 02-windows-editor-barra-status.png');

// 4. Abrir Menu Arquivo com Novo Projeto / Salvar / Salvar Como
await win.getByText('Arquivo').first().click();
await win.waitForTimeout(400);
await win.screenshot({ path: `${dest}/03-windows-menu-arquivo.png` });
console.log('Capturado: 03-windows-menu-arquivo.png');

// 5. Abrir Menu Exportar com Roteiro para Atores
await win.getByText('Exportar').first().click();
await win.waitForTimeout(400);
await win.screenshot({ path: `${dest}/04-windows-menu-exportar-vozes.png` });
console.log('Capturado: 04-windows-menu-exportar-vozes.png');

console.log('Erros encontrados:', erros);
await app.close();
console.log('Teste concluído com sucesso!');
