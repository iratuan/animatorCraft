// Gera recortes em alta resolução de cada estilo de traço e monta uma imagem de comparação lado a lado.
// Uso: node tools/comparar-estilos.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const destino = resolve(process.argv[2] ?? 'evidencias/estilos');
const base = 'http://127.0.0.1:5173/';
mkdirSync(destino, { recursive: true });
const roteiro = `# Estilos

Professor entra pela esquerda andando. Aluno entra pela direita andando. Mãe entra pela esquerda andando. Caçula entra pela direita andando. Priminha entra pela direita andando. Todos ficam parados. Aluno diz "Eu só vim pelo lanche!" feliz. Todos dançam juntos por 5 segundos.`;
const estilos = [['limpo', 'A — Linha limpa'], ['tinta', 'B — Tinta de pincel'], ['rabisco', 'C — Rabisco de caderno']];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 2100, height: 1100 }, deviceScaleFactor: 2 });
const arquivos = [];
for (const [id] of estilos) {
  await page.goto(base);
  await page.evaluate((r) => { localStorage.clear(); localStorage.setItem('stickboard.roteiro', r); }, roteiro);
  await page.goto(`${base}?estilo=${id}&t=7.9&ator=aluno`);
  await page.waitForSelector('canvas'); await page.waitForTimeout(500);
  const box = await page.locator('.area-palco canvas').boundingBox();
  // dois recortes: Professor+Mãe (esquerda) e Priminha+Caçula+Aluno (direita)
  for (const [lado, x0, w] of [['esq', 0.05, 0.3], ['dir', 0.62, 0.38]]) {
    const arq = join(destino, `${id}-${lado}.png`);
    await page.screenshot({ path: arq, clip: { x: box.x + box.width * x0, y: box.y + box.height * 0.3, width: box.width * w, height: box.height * 0.68 } });
    arquivos.push(arq);
  }
}
// montagem
const html = `<body style="margin:0;background:#fff;font:600 30px Segoe UI;display:grid;grid-template-columns:repeat(3,1fr);gap:0">
${estilos.map(([id, nome]) => `<div style="border:2px solid #000;padding:8px"><div style="padding:6px 10px">${nome}</div>
<div style="display:flex;gap:4px;align-items:flex-end"><img style="height:360px" src="data:image/png;base64,${readFileSync(join(destino, id + '-esq.png')).toString('base64')}"><img style="height:360px" src="data:image/png;base64,${readFileSync(join(destino, id + '-dir.png')).toString('base64')}"></div></div>`).join('')}</body>`;
const p2 = await browser.newPage({ viewport: { width: 2400, height: 470 }, deviceScaleFactor: 1 });
await p2.setContent(html);
await p2.waitForTimeout(800);
await p2.screenshot({ path: join(destino, '00-comparacao-estilos.png') });
console.log('ok', join(destino, '00-comparacao-estilos.png'));
await browser.close();

