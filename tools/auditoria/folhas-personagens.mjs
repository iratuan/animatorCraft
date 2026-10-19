// Folha de contato por personagem: 8 momentos (entrar, falar com várias expressões, apontar, dançar) para olhar com os próprios olhos.
import { chromium } from 'playwright-core';
const dest = 'evidencias/34-auditoria-lancamento';
const ids = [['CringeFather'], ['BetaSon'], ['Erika'], ['Dario'], ['Laura'], ['Elizendra'], ['Artur'], ['Carol']];
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = [], avisos = [];
p.on('pageerror', (e) => erros.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') avisos.push(m.text()); });
const quadros = {};
for (const [nome] of ids) {
  const rot = `# Teste\n${nome} entra pela esquerda andando.\n${nome} fica na posição 50%.\n${nome} diz "Feliz" feliz.\n${nome} diz "Brava" brava.\n${nome} diz "Triste" triste.\n${nome} diz "Surpresa" surpreso.\n${nome} aponta.\n${nome} dança por 3 segundos.\n${nome} pula.\n${nome} acena.`;
  await p.goto('http://127.0.0.1:5173/#/editor');
  await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, rot);
  quadros[nome] = [];
  for (const t of [0.8, 3.4, 5.5, 7.5, 9.5, 12, 14, 17]) {
    await p.goto(`http://127.0.0.1:5173/?t=${t}#/editor`);
    await p.waitForFunction(() => document.querySelector('.app') && !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
    await p.waitForTimeout(500);
    quadros[nome].push(await p.locator('.area-palco canvas').evaluate((c) => { const o = document.createElement('canvas'); o.width = 480; o.height = 270; o.getContext('2d').drawImage(c, 0, 0, 480, 270); return o.toDataURL('image/png'); }));
  }
}
const f = await b.newPage({ viewport: { width: 1920, height: 1100 } });
for (const [nome] of ids) {
  await f.setContent(`<body style="margin:0;background:#fff"><canvas id=c width=1920 height=540></canvas></body>`);
  await f.evaluate(async (urls) => { const c = document.getElementById('c'); const x = c.getContext('2d'); let i = 0; for (const u of urls) { const im = new Image(); im.src = u; await im.decode(); x.drawImage(im, (i % 4) * 480, Math.floor(i / 4) * 270); i++; } }, quadros[nome]);
  await f.locator('#c').screenshot({ path: `${dest}/${nome}.png` });
}
console.log('erros', erros); console.log('avisos de console', [...new Set(avisos)].slice(0, 10));
await b.close();
