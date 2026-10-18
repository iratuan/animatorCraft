import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
await p.goto('http://127.0.0.1:5173/'); await p.evaluate(() => localStorage.clear());
await p.goto('http://127.0.0.1:5173/?ator=laura&teste=1');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.getByText('Editar / exportar sprites de Laura').click();
await p.locator('[data-espaco="rosto_brava"]').click();
await p.waitForFunction(() => !!window.__motorEditor);
await p.evaluate(() => { const m = window.__motorEditor; m.definir('ferramenta', 'pincel'); m.definir('tamanho', 18); m.definir('cor', '#ff3300'); });
const pos = (x, y) => p.evaluate(([x, y]) => { const m = window.__motorEditor, s = m.paraTela(x, y), r = m.canvas.getBoundingClientRect(); return { x: r.left + s.x, y: r.top + s.y }; }, [x, y]);
const a = await pos(40, 60), d = await pos(100, 60);
await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(d.x, d.y, { steps: 6 }); await p.mouse.up();
await p.getByRole('button', { name: 'Salvar no sprite' }).click();
await p.waitForSelector('[data-testid="ei-canvas"]', { state: 'detached', timeout: 15000 });
for (let i = 0; i < 6; i++) {
  await p.waitForTimeout(500);
  console.log(i, await p.evaluate(() => { const e = document.querySelector('[data-espaco="rosto_brava"]'); window.__marca ??= e; return { igual: e === window.__marca, modais: document.querySelectorAll('.modal').length, msg: document.body.innerText.includes('Falha') }; }));
}
console.log('erros', erros.slice(0, 4));
await b.close();
