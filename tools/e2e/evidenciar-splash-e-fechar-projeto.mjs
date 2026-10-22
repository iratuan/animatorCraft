import { chromium } from 'playwright-core';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dest = resolve('evidencias/58-splash-e-fechar-projeto');
if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

console.log('Iniciando captura de evidências: Splash Screen e Fechamento de Projeto com Salvaguarda...');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 960 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

// =========================================================================
// 1. TELA DE SPLASH (SPLASH SCREEN)
// =========================================================================
console.log('1. Navegando para a aplicação com Splash Screen ativada...');
await page.goto('http://127.0.0.1:5173/#/');

// Captura a splash tela durante a animação e progresso
const splash = page.locator('.splash-tela');
await splash.waitFor({ state: 'visible', timeout: 5000 });
await page.waitForTimeout(350); // Captura o progresso inicial e animação do giz
await page.screenshot({ path: join(dest, '01-splash-screen-carregando.png') });
console.log('✓ 01: Screenshot da Splash Screen em execução capturado.');

// Aguarda a splash tela desaparecer suavemente com fade-out
await splash.waitFor({ state: 'detached', timeout: 8000 });
await page.waitForTimeout(300);

// Captura a Tela Inicial pronta após o splash
await page.screenshot({ path: join(dest, '02-tela-inicial-pos-splash.png') });
console.log('✓ 02: Screenshot da Tela Inicial pós-splash capturado.');

// =========================================================================
// 2. EDITOR COM PROJETO E BARRA DE STATUS / MENUBAR
// =========================================================================
console.log('2. Abrindo o Editor...');
// Clica no card "Novo projeto em branco"
await page.locator('[data-teste="novo"]').click();
await page.waitForSelector('.menubar', { timeout: 15000 });
await page.waitForTimeout(800);

// Digita alteração no roteiro para ativar modificado === true
const textareaRoteiro = page.locator('textarea').first();
await textareaRoteiro.fill('# Aula de Física Quântica\nProfessor diz "Bem-vindos à nova aula!".\nAluno acena.');
await page.waitForTimeout(600);

// Captura editor com projeto modificado e badge no menubar
await page.screenshot({ path: join(dest, '03-editor-projeto-modificado.png') });
console.log('✓ 03: Screenshot do Editor com alterações não salvas capturado.');

// =========================================================================
// 3. MENU ARQUIVO > PROJETO > FECHAR PROJETO
// =========================================================================
console.log('3. Abrindo Menu Arquivo > Projeto...');
const btnArquivo = page.locator('.menu > button', { hasText: 'Arquivo' }).first();
await btnArquivo.click();
await page.waitForTimeout(300);

const itemProjeto = page.locator('.item-com-submenu', { hasText: 'Projeto' }).first();
await itemProjeto.hover();
await page.waitForTimeout(400);

// Captura menu aberto evidenciando o item "Fechar projeto" com atalho Ctrl+W
await page.screenshot({ path: join(dest, '04-menu-arquivo-fechar-projeto.png') });
console.log('✓ 04: Screenshot do menu com "Fechar projeto" capturado.');

// Clica no item "Fechar projeto"
const itemFechar = page.locator('button', { hasText: 'Fechar projeto' }).first();
await itemFechar.click();
await page.waitForTimeout(400);

// =========================================================================
// 4. DIÁLOGO DE SALVAGUARDA DE DADOS
// =========================================================================
console.log('4. Verificando modal de salvaguarda de dados...');
await page.waitForSelector('.modal-fechar-projeto', { timeout: 5000 });
await page.screenshot({ path: join(dest, '05-modal-fechar-projeto-salvaguarda.png') });
console.log('✓ 05: Screenshot do modal de salvaguarda de dados capturado.');

// Testa o botão Cancelar (mantém no editor sem descartar)
const btnCancelar = page.locator('[data-teste="fechar-cancelar"]');
await btnCancelar.click();
await page.waitForTimeout(300);

// Reabre usando o botão de fechar direto na Menubar
console.log('5. Testando botão de fechamento na Menubar...');
const btnFecharMenubar = page.locator('[data-teste="btn-fechar-projeto-menubar"]');
await btnFecharMenubar.click();
await page.waitForTimeout(300);
await page.waitForSelector('.modal-fechar-projeto', { timeout: 5000 });

// Clica em "Descartar e Fechar" para voltar à tela inicial limpando estado
console.log('6. Confirmando "Descartar e Fechar"...');
const btnDescartar = page.locator('[data-teste="fechar-descartar"]');
await btnDescartar.click();
await page.waitForTimeout(600);

// Captura tela inicial de volta
await page.screenshot({ path: join(dest, '06-retorno-tela-inicial-apos-fechar.png') });
console.log('✓ 06: Screenshot da Tela Inicial após fechar projeto capturado.');

if (erros.length > 0) {
  console.warn('Erros de página detectados:', erros);
} else {
  console.log('✓ Sucesso: 0 erros de runtime!');
}

await browser.close();
console.log('Todas as evidências foram geradas com sucesso em evidencias/58-splash-e-fechar-projeto/');
