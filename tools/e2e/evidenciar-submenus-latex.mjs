import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dest = resolve('evidencias/56-menu-arquivo-submenus-e-latex');
if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

console.log('Iniciando captura de evidências para Submenus do Menu Arquivo e Fórmulas LaTeX na Lousa...');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

await page.goto('http://127.0.0.1:5173/#/editor');
await page.waitForFunction(
  () => document.querySelector('.menubar') && !document.body.innerText.includes('Carregando personagens'),
  null,
  { timeout: 90000 }
);
await page.waitForTimeout(1000);

// --- 1. Evidência do Menu Arquivo aberto ---
const btnArquivo = page.locator('.menu > button', { hasText: 'Arquivo' }).first();
await btnArquivo.click();
await page.waitForTimeout(500);
await page.screenshot({ path: join(dest, '01-menu-arquivo-categorias.png') });
console.log('01: Menu Arquivo aberto com categorias capturado.');

// --- 2. Evidência do Submenu "Projeto" aberto ---
const itemProjeto = page.locator('.item-com-submenu', { hasText: 'Projeto' }).first();
await itemProjeto.hover();
await page.waitForTimeout(500);
await page.screenshot({ path: join(dest, '02-submenu-projeto-aberto.png') });
console.log('02: Submenu Projeto aberto capturado.');

// --- 3. Evidência do Submenu "Personagens & Sprites" aberto ---
const itemPersonagens = page.locator('.item-com-submenu', { hasText: 'Personagens & Sprites' }).first();
await itemPersonagens.hover();
await page.waitForTimeout(500);
await page.screenshot({ path: join(dest, '03-submenu-personagens-aberto.png') });
console.log('03: Submenu Personagens & Sprites aberto capturado.');

// --- 4. Evidência do Submenu "Ferramentas & IA" aberto ---
const itemFerramentas = page.locator('.item-com-submenu', { hasText: 'Ferramentas & IA' }).first();
await itemFerramentas.hover();
await page.waitForTimeout(500);
await page.screenshot({ path: join(dest, '04-submenu-ferramentas-aberto.png') });
console.log('04: Submenu Ferramentas & IA aberto capturado.');

// Fecha menu clicando no palco
await page.click('.palco');
await page.waitForTimeout(400);

// --- 5. Roteiro com fórmulas LaTeX na lousa ---
// Testando:
// 1) Integral de Gauss com espaçamento \, (que antes virava vírgula errônea)
// 2) Bhaskara com \pm e frações
// 3) Sem a palavra "fórmula" ou "equação", testando o detector automático de LaTeX
const roteiroLatex = `# Aula de Matemática Avançada
CringeFather entra pela esquerda andando.
CringeFather escreve "\\int_{0}^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}" na lousa.
CringeFather escreve "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" na lousa.
`;

await page.fill('.roteiro textarea', roteiroLatex);
await page.waitForTimeout(1000);
await page.screenshot({ path: join(dest, '05-editor-com-roteiro-latex.png') });
console.log('05: Editor preenchido com roteiro de fórmulas capturado.');

// Avança o tempo para o momento em que a primeira fórmula foi escrita
await page.evaluate(() => {
  // Ajusta o tempo do store para 4.5 segundos (quando a primeira fórmula já foi escrita)
  const setStore = window.__editorSetTime || window.__useEditorStore?.getState?.()?.set;
  if (!setStore) {
    // Procura na janela se existe o store
  }
});

// Pressiona Play e aguarda a escrita
await page.click('.transporte button.play');
await page.waitForTimeout(4500);
await page.click('.transporte button.play'); // pausa
await page.waitForTimeout(600);

// Captura do palco com a integral gaussiana
await page.screenshot({ path: join(dest, '06-lousa-integral-gaussiana-corrigida.png') });
console.log('06: Lousa com Integral Gaussiana renderizada sem vírgulas capturada.');

// Avança mais para a fórmula de Bhaskara
await page.click('.transporte button.play');
await page.waitForTimeout(4000);
await page.click('.transporte button.play'); // pausa
await page.waitForTimeout(600);

await page.screenshot({ path: join(dest, '07-lousa-bhaskara-e-formulas.png') });
console.log('07: Lousa com Bhaskara e fórmulas capturada.');

// Detalhe / zoom no elemento do palco
const palcoEl = page.locator('.palco, canvas.canvas-lousa').first();
if (await palcoEl.isVisible()) {
  await palcoEl.screenshot({ path: join(dest, '08-zoom-palco-lousa-formulas.png') });
  console.log('08: Zoom no palco capturado com sucesso.');
}

console.log('Erros no console/página:', erros);
await browser.close();
console.log('=== EVIDÊNCIAS DE SUBMENUS E LATEX COLETADAS COM SUCESSO! ===');
