// Folha de contato: monta sprites já segmentados (de tools/sprites/segmentar-atlas.mjs) numa grade com o número de cada um.
//   node tools/sprites/folha-contato.mjs <pasta-segmentada> <indices: 1-5,16,20-25> <saida.png> [tamanho-celula=190] [colunas=6]
import { chromium } from 'playwright-core';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [pasta, lista, saida, tam = '190', cols = '6'] = process.argv.slice(2);
const indices = lista.split(',').flatMap((p) => { const [a, b] = p.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
const T = Number(tam), C = Number(cols);
const itens = indices.map((n) => { const f = join(resolve(pasta), `${String(n).padStart(3, '0')}.png`); return existsSync(f) ? { n, src: 'data:image/png;base64,' + readFileSync(f).toString('base64') } : null; }).filter(Boolean);
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: C * (T + 12) + 12, height: 900 } });
await p.setContent(`<body style="margin:0;background:#cfd6de;font:700 14px sans-serif"><div style="display:grid;grid-template-columns:repeat(${C},${T}px);gap:12px;padding:12px">${itens.map((i) => `<div style="position:relative;height:${T}px;background:#e6ebf0;display:flex;align-items:center;justify-content:center"><img src="${i.src}" style="max-width:${T}px;max-height:${T}px"><span style="position:absolute;left:3px;top:2px;color:#fff;-webkit-text-stroke:3px #000;paint-order:stroke;font-size:15px">${i.n}</span></div>`).join('')}</div></body>`);
await p.waitForTimeout(700);
await p.screenshot({ path: resolve(saida), fullPage: true });
await b.close();
console.log('ok', itens.length, 'sprites');
