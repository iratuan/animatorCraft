import { chromium } from 'playwright-core';
const dest = 'evidencias/23-simultaneo-personagens-manual';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]

# Simultâneo
Professor entra pela esquerda andando. Aluno entra pela direita andando.
Professor diz "Um momento, por favor". Aluno dança por 6 segundos. Professor aponta.`;
await p.goto('http://127.0.0.1:5173/');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=5');
await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(600);
await p.screenshot({ path: `${dest}/04-antes-do-arrasto.png` });
const alvo = p.locator('.bloco', { hasText: 'danca atual' }).first();
const fonte = p.locator('.bloco', { hasText: 'aponta' }).first();
const a = await fonte.boundingBox(), c = await alvo.boundingBox();
await p.mouse.move(a.x + 10, a.y + 8); await p.mouse.down();
await p.mouse.move(a.x + 40, a.y + 8, { steps: 4 });
await p.mouse.move(c.x + c.width / 2, c.y + 8, { steps: 8 });
await p.screenshot({ path: `${dest}/05-arrastando.png` });
await p.mouse.up();
await p.waitForTimeout(500);
console.log((await p.locator('textarea').first().inputValue()).split('\n').slice(-2).join(' / '));
await p.screenshot({ path: `${dest}/06-depois-do-arrasto.png` });
// stickman
await p.getByRole('button', { name: 'Stickman' }).first().click();
await p.waitForTimeout(500);
await p.screenshot({ path: `${dest}/07-skin-stickman.png` });
console.log('erros', erros);
await b.close();

