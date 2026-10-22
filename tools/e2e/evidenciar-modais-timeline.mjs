import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dest = resolve('evidencias/57-modais-timeline-tema');
if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

console.log('Iniciando captura de evidências dos modais da timeline no tema do app...');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

await page.goto('http://127.0.0.1:5173/#/editor');
await page.waitForFunction(
  () => document.querySelector('.timeline-geral') && !document.body.innerText.includes('Carregando personagens'),
  null,
  { timeout: 90000 }
);
await page.waitForTimeout(1000);

// Insere um roteiro com falas explícitas
const roteiroTeste = `# Aula de Teste
CringeFather diz: "Olá turma! Bem-vindos à aula de hoje."
BetaSon diz: "E aí professor, qual é a matéria de hoje?"
`;

await page.fill('.roteiro textarea', roteiroTeste);
await page.waitForTimeout(1200);

// 1. Localiza um bloco de fala na linha do tempo
const blocoFala = page.locator('.trilho .bloco.fala').first();
await blocoFala.waitFor({ state: 'visible', timeout: 10000 });

// Clica com botão direito ou esquerdo no bloco para disparar o menu de contexto
await blocoFala.click({ button: 'right' });
await page.waitForSelector('.context-menu-timeline', { timeout: 5000 });
await page.waitForTimeout(400);

// Captura do menu de contexto escuro/estilizado
await page.screenshot({ path: join(dest, '01-menu-contexto-timeline-tema.png') });
console.log('01: Menu de contexto da timeline capturado.');

// 2. Clica em "Editar fala"
await page.click('.context-menu-timeline button:has-text("Editar fala")');
await page.waitForSelector('.modal[aria-label="Editar fala do personagem"]', { timeout: 5000 });
await page.waitForTimeout(400);

// Captura do modal Editar fala no tema do app
await page.screenshot({ path: join(dest, '02-modal-editar-fala-tema.png') });
console.log('02: Modal Editar Fala capturado.');

// Fecha o modal clicando em Cancelar
await page.click('.modal-botoes button:has-text("Cancelar")');
await page.waitForTimeout(400);

// 3. Clica novamente no bloco de fala com botão direito para abrir o menu de contexto
await blocoFala.click({ button: 'right' });
await page.waitForSelector('.context-menu-timeline', { timeout: 5000 });
await page.waitForTimeout(400);

// Clica em "Gravar áudio"
await page.click('.context-menu-timeline button:has-text("Gravar áudio")');
await page.waitForSelector('.modal h3:has-text("Áudio da fala")', { timeout: 5000 });
await page.waitForTimeout(400);

// Captura do modal Gravar Áudio na aba microfone
await page.screenshot({ path: join(dest, '03-modal-gravar-audio-microfone-tema.png') });
console.log('03: Modal Gravar Áudio (Microfone) capturado.');

// Alterna para a aba Escolher Arquivo
await page.click('button:has-text("Escolher arquivo")');
await page.waitForTimeout(400);

// Captura do modal Gravar Áudio na aba escolher arquivo
await page.screenshot({ path: join(dest, '04-modal-gravar-audio-arquivo-tema.png') });
console.log('04: Modal Gravar Áudio (Arquivo) capturado.');

// Fecha o modal
await page.click('.modal-botoes button:has-text("Cancelar")');
await page.waitForTimeout(400);

console.log('Erros registrados:', erros);
await browser.close();
console.log('=== EVIDÊNCIAS DOS MODAIS DA TIMELINE COLETADAS COM SUCESSO! ===');
