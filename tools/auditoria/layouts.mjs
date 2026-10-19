import { chromium } from 'playwright-core';
const d = 'evidencias/34-auditoria-lancamento';
const b = await chromium.launch({ channel: 'msedge', headless: true });
for (const [nome, w, h] of [['min-1100x640', 1100, 640], ['hd-1600x900', 1600, 900], ['tablet-1280x800', 1280, 800], ['pequeno-900x600', 900, 600]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto('http://127.0.0.1:5173/#/editor'); await p.evaluate(() => localStorage.clear()); await p.goto('http://127.0.0.1:5173/?t=6#/editor');
  await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${d}/layout-${nome}.png` });
  const rolagem = await p.evaluate(() => ({ x: document.documentElement.scrollWidth > innerWidth, y: document.documentElement.scrollHeight > innerHeight }));
  console.log(nome, 'rolagem da página', rolagem, 'erros', erros);
  await p.close();
}
await b.close();
