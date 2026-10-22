import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const DEST = 'evidencias/48-evidencias-completas';
mkdirSync(DEST, { recursive: true });

const BASE = process.env.BASE ?? 'http://127.0.0.1:5173/';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1700, height: 950 } });
const p = await ctx.newPage();

await p.goto(`${BASE}?teste=1&ator=erika#/editor`);
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 60000 });
await p.waitForTimeout(600);

const ROT = `# Aula de Ciências
Erika entra pela esquerda andando.
Erika diz "Olá turma! Hoje aprenderemos sobre a gravidade." feliz.
Dario entra pela direita andando.
Dario diz "Professora, gravidade é força?" animado.
`;
await p.evaluate((r) => window.__sb.store.getState().setRoteiro(r), ROT);
await p.waitForTimeout(800);

// 1. Chips de Ação Rápida no Roteiro
await p.screenshot({ path: `${DEST}/24-ux-chips-rapidos-roteiro.png` });
console.log('✓ 24-ux-chips-rapidos-roteiro.png');

// 2. Badges de Áudio na Linha do Tempo (com 🎙️+)
await p.screenshot({ path: `${DEST}/25-ux-timeline-audio-badges.png` });
console.log('✓ 25-ux-timeline-audio-badges.png');

// 3. Modal de Gravação de Áudio Aprimorado
const fala = p.locator('.bloco').filter({ hasText: /Olá/ }).first();
console.log('Bloco fala count:', await fala.count());
await fala.click({ button: 'right' });
await p.waitForSelector('.context-menu', { timeout: 5000 });
await p.waitForTimeout(200);

const btnGravar = p.locator('.context-menu button').nth(1);
await btnGravar.click();
await p.waitForSelector('.dialog h3', { timeout: 5000 });
await p.waitForTimeout(400);
await p.screenshot({ path: `${DEST}/26-ux-dialog-gravacao-microfone.png` });
console.log('✓ 26-ux-dialog-gravacao-microfone.png');
await p.locator('.dialog button', { hasText: 'Cancelar' }).click();
await p.waitForTimeout(300);

// 4. Modo Tela Cheia / Apresentação do Palco
const btnTelaCheia = p.locator('button[title*="tela cheia"], .btn-tela-cheia').first();
if (await btnTelaCheia.count() > 0) {
  await btnTelaCheia.click();
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${DEST}/27-ux-palco-tela-cheia.png` });
  console.log('✓ 27-ux-palco-tela-cheia.png');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(300);
}

await b.close();
console.log('✅ Novas evidências de UX capturadas com sucesso!');
