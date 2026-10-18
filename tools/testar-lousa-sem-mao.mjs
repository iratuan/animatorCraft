import { chromium } from 'playwright-core';
const dest = 'evidencias/29-lousa-sem-mao';
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const erros = []; p.on('pageerror', (e) => erros.push(String(e)));
const rot = `[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Escrita\nProfessor entra pela esquerda andando.\nProfessor escreve "Quadrado da soma" no quadro.\nProfessor escreve $(a+b)^2 = a^2 + 2ab + b^2$ no quadro.\nProfessor desenha o gráfico de y = x^2 - 2 no quadro.`;
// preferências antigas de "mão com marcador" ou "traço a traço" não podem trazer a mão de volta
await p.goto('http://127.0.0.1:5173/');
await p.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro.v2', r); localStorage.setItem('stickboard.escrita', 'mao'); }, rot);
const instantes = [['01-texto-sendo-revelado', 3.4], ['02-equacao-sendo-revelada', 6.2], ['03-grafico-sendo-traçado', 9.3]];
for (const [nome, t] of instantes) {
  await p.goto(`http://127.0.0.1:5173/?t=${t}`);
  await p.waitForFunction(() => !document.body.innerText.includes('Carregando personagens'), null, { timeout: 90000 });
  await p.waitForTimeout(900);
  const canvas = p.locator('.area-palco canvas');
  // a mão antiga era pintada com cinza (220,220,220) numa área grande; conta esses pixels no quadro inteiro
  const gr = await canvas.evaluate((c) => { const x = c.getContext('2d'); const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 220 && d[i + 1] === 220 && d[i + 2] === 220) n++; return n; });
  const box = await canvas.boundingBox();
  await p.screenshot({ path: `${dest}/${nome}.png`, clip: box });
  console.log(nome, 't=' + t, '| pixels da cor da mão (linha de base ~150; a mão antiga passava de 3000):', gr);
  if (gr > 1500) throw new Error('parece haver uma mão desenhada na lousa');
}
console.log('seletor de escrita ainda existe na aba Aula?', await (async () => { await p.getByRole('button', { name: 'Aula', exact: true }).click(); return (await p.locator('.propriedades').innerText()).includes('Mão com marcador'); })());
await p.screenshot({ path: `${dest}/04-aba-aula.png` });
console.log('erros', erros);
await b.close();

