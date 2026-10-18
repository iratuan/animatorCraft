import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const rot = `# T\nCringeFather entra pela esquerda andando.\nCringeFather fica na posição 50%.\nCringeFather diz "a" feliz.\nCringeFather diz "b" brava.\nCringeFather diz "c" triste.\nCringeFather diz "d" assustado.\nCringeFather diz "e" confuso.\nCringeFather diz "f" entediado.`;
await p.goto('http://127.0.0.1:5173/');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, rot);
let i = 0;
for (const t of [3.6, 5.3, 7.0, 8.7, 10.4, 12.1]) {
  await p.goto(`http://127.0.0.1:5173/?t=${t}`);
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(500);
  const c = p.locator('.area-palco canvas'); const bb = await c.boundingBox();
  await p.screenshot({ path: `evidencias/34-auditoria-lancamento/cf-zoom-${i++}.png`, clip: { x: bb.x + bb.width * 0.40, y: bb.y + bb.height * 0.28, width: bb.width * 0.2, height: bb.height * 0.42 } });
}
await b.close();
