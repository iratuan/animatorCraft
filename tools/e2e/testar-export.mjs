// Exporta um MP4 curto pela própria interface, baixa o arquivo e confere duração/resolução reproduzindo-o no navegador.
// Uso: node tools/e2e/testar-export.mjs <pasta-destino> [formato: 16:9 | 9:16]
import { chromium } from 'playwright-core';
import { mkdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const destino = resolve(process.argv[2] ?? 'evidencias');
const formato = process.argv[3] ?? '16:9';
mkdirSync(destino, { recursive: true });

const roteiro = `# Teste

Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Vamos testar a exportação!" irritado. Professor escreve $x^2 + 1$ no quadro. Aluno tem uma ideia.`;

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e));
await page.goto('http://127.0.0.1:5173/#/editor');
await page.evaluate(() => localStorage.clear());
await page.goto('http://127.0.0.1:5173/?recarga=1#/editor');
await page.fill('.roteiro textarea', roteiro);
if (formato === '9:16') await page.click('text=9:16');

const inicio = Date.now();
const [download] = await Promise.all([page.waitForEvent('download', { timeout: 280000 }), page.click('text=Exportar MP4')]);
const arquivo = join(destino, `exportado-${formato.replace(':', 'x')}.mp4`);
await download.saveAs(arquivo);
console.log(`MP4 salvo: ${arquivo} (${(statSync(arquivo).size / 1e6).toFixed(2)} MB) em ${((Date.now() - inicio) / 1000).toFixed(1)} s`);

// confere o arquivo reproduzindo-o
const v = await ctx.newPage();
await v.goto(pathToFileURL(arquivo).href);
const info = await v.evaluate(() => new Promise((ok) => {
  const el = document.querySelector('video');
  const pronto = () => { el.currentTime = el.duration * 0.55; };
  el.onloadedmetadata = pronto;
  el.onseeked = () => ok({ duracao: el.duration, w: el.videoWidth, h: el.videoHeight });
  if (el.readyState >= 1) pronto();
}));
console.log('Metadados do vídeo:', JSON.stringify(info));
await v.waitForTimeout(500);
await v.screenshot({ path: join(destino, `quadro-do-mp4-${formato.replace(':', 'x')}.png`) });
await browser.close();
