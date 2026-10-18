import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const logs = []; p.on('pageerror', (e) => logs.push('PAGEERR ' + e)); p.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
await p.goto('http://127.0.0.1:5173/');
await p.evaluate(() => { localStorage.setItem('stickboard.roteiro.v2', '# T\nBetason entra pela esquerda andando.\nBetason faz cara de apaixonada.\nBetason faz o clipe tchau.\nBetason faz o clipe tchau por 3 segundos.'); localStorage.setItem('stickboard.clipes.v1', JSON.stringify([{ ator: 'betason', nome: 'Tchau', estilo: 'ambos', loop: true, passos: [{ tags: ['comemorar'], dur: 0.5, mov: 'balancar', amp: 6, poseBoneco: 'acenar' }, { tags: ['parado'], dur: 0.8, mov: 'pular', poseBoneco: 'parado' }] }])); localStorage.setItem('stickboard.skins.v1', JSON.stringify({ padrao: 'stickman', porPersonagem: {} })); });
for (const t of [1.2, 2.2, 2.8, 4.5]) {
  await p.goto(`http://127.0.0.1:5173/?t=${t}`);
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(500);
  const c = p.locator('.area-palco canvas'); const bb = await c.boundingBox();
  await p.screenshot({ path: `evidencias/35-expressoes-e-clipes/dbg-${t}.png`, clip: bb });
}
console.log(logs);
await b.close();
