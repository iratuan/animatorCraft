import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
const dest = 'evidencias/25-graficos'; mkdirSync(dest, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const rot = (texto) => `[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Gráfico\nProfessor entra pela esquerda andando.\n${texto}\n[close na lousa]`;
const casos = [
  ['funcao', 'Professor desenha o gráfico de y = x^2 - 2 no quadro.'],
  ['seno', 'Professor desenha o gráfico de y = sen(x) de -6 a 6 no quadro.'],
  ['barras', 'Professor desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3, Pera=6 no quadro.'],
  ['pizza', 'Professor desenha um gráfico de pizza: Sim=70, Não=20, Talvez=10 no quadro.'],
];
for (const [nome, texto] of casos) {
  await p.goto('http://127.0.0.1:5173/');
  await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); }, rot(texto));
  await p.goto('http://127.0.0.1:5173/?t=8');
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(900);
  const box = await p.locator('.area-palco canvas').boundingBox();
  await p.screenshot({ path: `${dest}/${nome}.png`, clip: box });
  console.log(nome, 'avisos:', await p.locator('.roteiro .badge').innerText());
}
console.log('erros', erros);
await b.close();
