import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e))); p.on('console', (m) => m.type() === 'error' && erros.push(m.text()));
await p.goto('http://127.0.0.1:5173/'); await p.evaluate(() => localStorage.clear()); await p.goto('http://127.0.0.1:5173/');
await p.waitForSelector('.status'); await p.waitForTimeout(2500);
const dur = await p.evaluate(() => document.querySelector('.tempo').innerText);
console.log('tempo:', dur.replace(/\s+/g, ' '));
let ult = '';
for (let t = 0; t < 75; t += 0.5) {
  await p.goto(`http://127.0.0.1:5173/?t=${t}`); await p.waitForSelector('.status'); await p.waitForTimeout(150);
  const s = await p.evaluate(() => document.querySelector('.status span').innerText);
  if (s !== ult) { console.log(t.toFixed(1), s.slice(0, 70)); ult = s; }
}
console.log('erros:', erros.slice(0, 5).join(' | ') || 'nenhum');
await b.close();
