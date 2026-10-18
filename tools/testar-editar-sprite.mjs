import { chromium } from 'playwright-core';
const dest = 'evidencias/21-exportar-editar-sprites';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
await p.goto('http://127.0.0.1:5173/?ator=laura');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Editar / exportar sprites de Laura').click();
await p.waitForTimeout(400);
const vazios = await p.locator('.espaco.vazio').count();
const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('.espaco-caixa', { has: p.locator('.espaco.vazio', { hasText: 'brava' }) }).first().locator('.espaco-png').click()]);
await fc.setFiles(`${dest}/teste-rosto.png`);
await p.waitForTimeout(1200);
console.log('vazios antes', vazios, 'depois', await p.locator('.espaco.vazio').count());
console.log('msg:', await p.locator('.barra-status, footer').last().innerText().catch(() => '?'));
await p.screenshot({ path: `${dest}/02-laura-rosto-brava-criado.png` });
console.log('erros', erros);
await b.close();


