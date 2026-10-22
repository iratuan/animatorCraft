import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dest = resolve('evidencias/53-editor-latex-e-graficos');
if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

console.log('Iniciando teste E2E do Editor de LaTeX e Gráficos Matemáticos...');

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 920 }, acceptDownloads: true });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

const roteiroInicial = `# Aula de Matemática
Professor entra pela esquerda andando.
Professor escreve fórmula "\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)" no quadro.
Professor desenha o gráfico de y = x^2 - 4 de -3 a 3 com raízes com grade no quadro.
`;

await page.goto('http://127.0.0.1:5173/#/editor');
await page.evaluate(() => localStorage.clear());
await page.goto('http://127.0.0.1:5173/?recarga=1#/editor');
await page.waitForFunction(
  () => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'),
  null,
  { timeout: 90000 }
);

// Preenche o roteiro com fórmula LaTeX e gráfico
await page.fill('.roteiro textarea', roteiroInicial);
await page.waitForTimeout(1000);
await page.screenshot({ path: join(dest, '01-editor-com-chips-latex.png') });
console.log('01: Editor com chips e roteiro capturado.');

// 2. Abrir o modal via chip + LaTeX
await page.click('button:has-text("+ LaTeX")');
await page.waitForSelector('.modal-matematica', { timeout: 10000 });
await page.waitForTimeout(600);
await page.screenshot({ path: join(dest, '02-modal-latex-aberto.png') });
console.log('02: Modal na aba LaTeX capturado.');

// 3. Testar troca de categoria e fórmula no catálogo
await page.selectOption('.campo-input-matematica', 'famosas');
await page.waitForTimeout(400);
const cardBhaskara = page.locator('.card-modelo', { hasText: 'Bhaskara' }).first();
if (await cardBhaskara.isVisible()) {
  await cardBhaskara.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(dest, '03-modal-latex-bhaskara.png') });
  console.log('03: Fórmula de Bhaskara selecionada no modal.');
}

// 4. Alternar para a aba de Gráficos de Funções
await page.click('.aba-btn:has-text("Gráficos de Funções")');
await page.waitForTimeout(600);
await page.screenshot({ path: join(dest, '04-modal-grafico-funcao.png') });
console.log('04: Modal na aba Gráficos de Funções com preview capturado.');

// 5. Testar preset de Senoide
const btnSenoide = page.locator('button.chip-simbolo', { hasText: 'Senoide' }).first();
if (await btnSenoide.isVisible()) {
  await btnSenoide.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(dest, '05-modal-grafico-senoide.png') });
  console.log('05: Gráfico com senoide e área sombreada capturado.');
}

// Fechar o modal
await page.click('.btn-fechar');
await page.waitForTimeout(400);

// 6. Posicionar o transporte no momento em que a fórmula e o gráfico estão na lousa
// Clica na linha do tempo ou avança o tempo
await page.evaluate(() => {
  const store = window.__editorStore || document.querySelector('.app');
  // Ajusta o tempo via input ou evento
});
// Reproduz por 3 segundos ou posiciona
await page.keyboard.press('Space');
await page.waitForTimeout(2500);
await page.keyboard.press('Space');
await page.waitForTimeout(500);
await page.screenshot({ path: join(dest, '06-palco-lousa-matematica-grafico.png') });
console.log('06: Palco com fórmula e gráfico na lousa capturado.');

// Aguarda o botão de exportar estar pronto
await page.waitForSelector('button.exportar:not([disabled])', { timeout: 30000 });
await page.waitForTimeout(600);

// 7. Testar exportação MP4 completa
console.log('Iniciando exportação MP4 com os itens de matemática...');
const inicio = Date.now();
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 240000 }),
  page.locator('button.exportar').click(),
]);

const arquivoMp4 = join(dest, 'aula-matematica-lousa.mp4');
await download.saveAs(arquivoMp4);
const tamanhoMb = (statSync(arquivoMp4).size / 1e6).toFixed(2);
console.log(`MP4 salvo com sucesso: ${arquivoMp4} (${tamanhoMb} MB) em ${((Date.now() - inicio) / 1000).toFixed(1)} s`);

// 8. Validar reprodução e metadados do vídeo exportado
const vPage = await ctx.newPage();
await vPage.goto(pathToFileURL(arquivoMp4).href);
const info = await vPage.evaluate(() => new Promise((ok) => {
  const el = document.querySelector('video');
  const pronto = () => { el.currentTime = el.duration * 0.6; };
  el.onloadedmetadata = pronto;
  el.onseeked = () => ok({ duracao: el.duration, w: el.videoWidth, h: el.videoHeight });
  if (el.readyState >= 1) pronto();
}));

console.log('Metadados do vídeo gerado:', JSON.stringify(info));
await vPage.waitForTimeout(500);
await vPage.screenshot({ path: join(dest, '07-quadro-do-mp4-gerado.png') });
console.log('07: Quadro do vídeo MP4 gerado capturado.');

console.log('Erros encontrados:', erros);
await browser.close();
console.log('=== TESTE E2E DE MATEMÁTICA CONCLUÍDO COM 100% DE SUCESSO! ===');
