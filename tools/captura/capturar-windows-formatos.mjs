import { _electron as electron } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const dest = 'evidencias/44-formatos-cenarios-windows';
mkdirSync(dest, { recursive: true });

console.log('Iniciando captura de evidências no executável Windows (Formatos, Cenários e Novos Personagens)...');
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

// 3. Abrir aba Aula para visualizar modelos e papéis (incluindo novos personagens)
const botaoAula = win.locator('button.nav-item:has-text("Aula"), button:has-text("Aula")').first();
if (await botaoAula.count() > 0) {
  await botaoAula.click();
  await win.waitForTimeout(600);
}
await win.screenshot({ path: `${dest}/02-windows-aba-aula-modelos.png` });
console.log('Capturado: 02-windows-aba-aula-modelos.png');

// 4. Carregar modelo de Podcast
const botaoPodcast = win.locator('button.seq:has-text("Podcast")').first();
if (await botaoPodcast.count() > 0) {
  await botaoPodcast.click();
  await win.waitForTimeout(800);
}
await win.screenshot({ path: `${dest}/03-windows-cenario-podcast.png` });
console.log('Capturado: 03-windows-cenario-podcast.png');

// 5. Carregar modelo de Telejornal Drops da Semana
const botaoTelejornal = win.locator('button.seq:has-text("Drops da Semana")').first();
if (await botaoTelejornal.count() > 0) {
  await botaoTelejornal.click();
  await win.waitForTimeout(800);
}
await win.screenshot({ path: `${dest}/04-windows-cenario-telejornal.png` });
console.log('Capturado: 04-windows-cenario-telejornal.png');

// 6. Testar elenco com Véia e Véio
const textareaRoteiro = win.locator('textarea.roteiro-texto, textarea').first();
if (await textareaRoteiro.count() > 0) {
  await textareaRoteiro.fill(`[cenário: lousa]
# Cena da Família
Véia entra pela esquerda andando.
Véia diz "Cringefather, você viu o Paraíba?".
Véio entra pela direita andando.
Véio diz "A poesia está no ar!".`);
  await win.waitForTimeout(1000);
}
await win.screenshot({ path: `${dest}/05-windows-novos-personagens-veia-veio.png` });
console.log('Capturado: 05-windows-novos-personagens-veia-veio.png');

console.log('Erros detectados no runtime:', erros);
await app.close();
console.log('Capturas do executável Windows concluídas com sucesso!');
