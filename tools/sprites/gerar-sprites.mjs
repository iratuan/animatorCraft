// Gera a biblioteca de sprites do app a partir das fichas de personagem em ./referencias.
//   node tools/sprites/gerar-sprites.mjs
// Saída: src/renderer/assets/personagens/<id>/<n>.png (fundo transparente, cores originais) e personagens.json
// (o app converte para escala de cinza em tempo de execução). Âncoras de rosto ficam em tools/sprites/rostos.json.
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '../..');
const saida = join(raiz, 'src/renderer/assets/personagens');
const mapa = JSON.parse(readFileSync(join(raiz, 'tools/sprites/mapa-poses.json'), 'utf8'));
const rostosPath = join(raiz, 'tools/sprites/rostos.json');
const rostos = existsSync(rostosPath) ? JSON.parse(readFileSync(rostosPath, 'utf8')) : {};
mkdirSync(saida, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>');
await page.evaluate(() => {
  window.fatiar = async (src) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const W = img.width, H = img.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const fg = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4; if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) fg[y * W + xx] = 1; }
    const perfilX = new Float32Array(W), perfilY = new Float32Array(H);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (fg[y * W + xx]) { perfilX[xx]++; perfilY[y]++; }
    const suave = (p, n) => p.map((_, k) => { let s = 0, c2 = 0; for (let t = -6; t <= 6; t++) { const q = k + t; if (q >= 0 && q < n) { s += p[q]; c2++; } } return s / c2; });
    const sx = suave(perfilX, W), sy = suave(perfilY, H);
    const vale = (p, n, a, b) => { let best = Math.round(n * a), v = Infinity; for (let k = Math.round(n * a); k <= Math.round(n * b); k++) if (p[k] < v) { v = p[k]; best = k; } return best; };
    const xs = [0, vale(sx, W, 0.25, 0.42), vale(sx, W, 0.58, 0.75), W], ys = [0, vale(sy, H, 0.25, 0.42), vale(sy, H, 0.58, 0.75), H];
    const out = [];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
      for (let y = ys[r]; y < ys[r + 1]; y++) for (let xx = xs[q]; xx < xs[q + 1]; xx++) if (fg[y * W + xx]) { n++; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (n < 400) continue;
      const pad = 4, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
      const cx = cc.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
      const id = cx.getImageData(0, 0, cw, ch), p = id.data, vis = new Uint8Array(cw * ch), fila = [];
      const branco = (i) => p[i * 4] > 238 && p[i * 4 + 1] > 238 && p[i * 4 + 2] > 238;
      for (let xx = 0; xx < cw; xx++) fila.push(xx, (ch - 1) * cw + xx);
      for (let yy = 0; yy < ch; yy++) fila.push(yy * cw, yy * cw + cw - 1);
      while (fila.length) { const q2 = fila.pop(); if (vis[q2] || !branco(q2)) continue; vis[q2] = 1; const qx = q2 % cw, qy = (q2 / cw) | 0; if (qx > 0) fila.push(q2 - 1); if (qx < cw - 1) fila.push(q2 + 1); if (qy > 0) fila.push(q2 - cw); if (qy < ch - 1) fila.push(q2 + cw); }
      for (let i = 0; i < cw * ch; i++) if (vis[i]) p[i * 4 + 3] = 0;
      cx.putImageData(id, 0, 0);
      out.push({ w: cw, h: ch, png: cc.toDataURL('image/png') });
    }
    return out;
  };
});

const manifesto = {};
for (const [id, cfg] of Object.entries(mapa.personagens)) {
  const jpg = join(raiz, 'referencias', cfg.ficha + '.jpg');
  const sprites = await page.evaluate((s) => window.fatiar(s), 'data:image/jpeg;base64,' + readFileSync(jpg).toString('base64'));
  if (sprites.length !== 9) console.warn(`ATENÇÃO: ${id} gerou ${sprites.length} sprites (esperado 9)`);
  mkdirSync(join(saida, id), { recursive: true });
  manifesto[id] = {
    nome: cfg.nome, altura: cfg.altura,
    sprites: sprites.map((s, i) => {
      writeFileSync(join(saida, id, `${i + 1}.png`), Buffer.from(s.png.split(',')[1], 'base64'));
      return { arquivo: `${id}/${i + 1}.png`, w: s.w, h: s.h, tags: [cfg.tags[i] ?? `pose${i + 1}`], ancora: (cfg.topo ?? []).includes(cfg.tags[i]) ? 'topo' : 'pes', ...(rostos[id]?.[String(i + 1)] ? { rosto: rostos[id][String(i + 1)] } : {}) };
    }),
  };
  console.log(id, sprites.length, 'sprites');
}
writeFileSync(join(saida, 'personagens.json'), JSON.stringify(manifesto, null, 2));
await browser.close();
console.log('manifesto em', join(saida, 'personagens.json'));



