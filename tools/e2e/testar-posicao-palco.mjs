import { chromium } from 'playwright-core';
const dest = 'evidencias/23-simultaneo-personagens-manual';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const roteiro = `[papéis: professor=CringeFather, aluno=BetaSon]

# Posição
Professor entra pela esquerda andando. Aluno entra pela direita andando.
Professor diz "Um momento, por favor". Aluno dança por 6 segundos. Professor aponta.`;
await p.goto('http://127.0.0.1:5173/#/editor');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, roteiro);
await p.goto('http://127.0.0.1:5173/?t=4.6#/editor');
await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
await p.waitForTimeout(800);
const cv = p.locator('.area-palco canvas');
const box = await cv.boundingBox();
await p.screenshot({ path: `${dest}/10-antes-posicionar.png` });
// arrasta o professor (esquerda, ~13%) até ~45%
const y = box.y + box.height * 0.7;
await p.mouse.move(box.x + box.width * 0.13, y); await p.mouse.down();
await p.mouse.move(box.x + box.width * 0.2, y, { steps: 4 });
await p.mouse.move(box.x + box.width * 0.45, y, { steps: 10 });
await p.screenshot({ path: `${dest}/11-arrastando-personagem.png` });
await p.mouse.up(); await p.waitForTimeout(1500);
console.log('acoes apos soltar:', await p.locator('.tempo-painel small').first().innerText());
const txt = await p.locator('textarea').first().inputValue();
console.log(txt.split('\n').slice(-2).join(' / '));
await p.screenshot({ path: `${dest}/12-depois-posicionar.png` });
console.log('erros', erros);
await b.close();




