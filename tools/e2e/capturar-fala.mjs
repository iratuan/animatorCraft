import { chromium } from 'playwright-core';

const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 } });
const p = await ctx.newPage();
await p.goto('http://127.0.0.1:5173/?teste=1&ator=erika#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 60000 });
await p.waitForTimeout(600);

const ROT = `# Aula
Erika entra pela esquerda andando.
Erika diz "Olá turma!" feliz.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROT);
await p.waitForTimeout(800);

const fala = p.locator('.bloco').filter({ hasText: /“Olá turma!”/ }).first();
console.log('Bloco de fala count:', await fala.count());
await fala.click({ button: 'right' });
await p.waitForSelector('.context-menu', { timeout: 5000 });
console.log('Context menu aberto');

// Clica em Editar fala
await p.locator('.context-menu button').first().click();
await p.waitForSelector('.dialog textarea', { timeout: 5000 });
await p.waitForTimeout(300);
await p.screenshot({ path: 'evidencias/48-evidencias-completas/09b-dialog-editar-fala.png' });
console.log('  ✓ 09b-dialog-editar-fala.png');

await p.locator('.dialog textarea').fill('Olá alunos queridos! Sejam bem-vindos à aula.');
await p.waitForTimeout(200);
await p.screenshot({ path: 'evidencias/48-evidencias-completas/09c-dialog-editar-fala-preenchido.png' });
console.log('  ✓ 09c-dialog-editar-fala-preenchido.png');

await p.locator('.dialog button', { hasText: 'Salvar' }).click();
await p.waitForTimeout(600);
await p.screenshot({ path: 'evidencias/48-evidencias-completas/09d-fala-atualizada-timeline.png' });
console.log('  ✓ 09d-fala-atualizada-timeline.png');

await b.close();
console.log('✅ Diálogos de fala capturados com sucesso!');
