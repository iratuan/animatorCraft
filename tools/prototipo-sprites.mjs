// Protótipo: fatia as fichas de personagem (grade 3x3) de ./referencias em sprites PNG transparentes
// e monta uma cena de teste (colorida e em preto e branco) para avaliar o estilo no palco.
// Uso: node tools/prototipo-sprites.mjs <pasta-destino>
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const destino = resolve(process.argv[2] ?? 'evidencias/sprites');
mkdirSync(destino, { recursive: true });
const raiz = resolve(import.meta.dirname, '..');
const fichas = ['CringeFather', 'BetaSon', 'Erika', 'Dario', 'Laura'];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.setContent('<body></body>');

// ---- 1) fatiar
await page.evaluate(() => {
  window.fatiar = async (src) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = src; });
    const W = img.width, H = img.height;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, W, H).data;
    const fg = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4; if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) fg[y * W + xx] = 1; }
    // separadores da grade 3x3: vales nos perfis de projeção (poucos pixels de tinta) perto de 1/3 e 2/3
    const perfilX = new Float32Array(W), perfilY = new Float32Array(H);
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (fg[y * W + xx]) { perfilX[xx]++; perfilY[y]++; }
    const suave = (p, n) => p.map((_, k) => { let s = 0, c2 = 0; for (let t = -6; t <= 6; t++) { const q = k + t; if (q >= 0 && q < n) { s += p[q]; c2++; } } return s / c2; });
    const sx = suave(perfilX, W), sy = suave(perfilY, H);
    const vale = (p, n, a, b) => { let best = Math.round(n * a), v = Infinity; for (let k = Math.round(n * a); k <= Math.round(n * b); k++) if (p[k] < v) { v = p[k]; best = k; } return best; };
    const cx1 = vale(sx, W, 0.25, 0.42), cx2 = vale(sx, W, 0.58, 0.75), cy1 = vale(sy, H, 0.25, 0.42), cy2 = vale(sy, H, 0.58, 0.75);
    const xs = [0, cx1, cx2, W], ys = [0, cy1, cy2, H];
    const cel = new Map();
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) {
      let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
      for (let y = ys[r]; y < ys[r + 1]; y++) for (let xx = xs[q]; xx < xs[q + 1]; xx++) if (fg[y * W + xx]) { n++; if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (n > 400) cel.set(r * 3 + q, { x0, y0, x1: x1 + 1, y1: y1 + 1 });
    }    const out = [];
    for (const key of [...cel.keys()].sort((a, b) => a - b)) {
      const b = cel.get(key), pad = 4, cw = b.x1 - b.x0 + pad * 2, ch = b.y1 - b.y0 + pad * 2;
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
      const cx = cc.getContext('2d', { willReadFrequently: true }); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cw, ch); cx.drawImage(c, b.x0 - pad, b.y0 - pad, cw, ch, 0, 0, cw, ch);
      const id = cx.getImageData(0, 0, cw, ch), p = id.data, vis = new Uint8Array(cw * ch), fila = [];
      const branco = (i) => p[i * 4] > 238 && p[i * 4 + 1] > 238 && p[i * 4 + 2] > 238;
      for (let xx = 0; xx < cw; xx++) { fila.push(xx, (ch - 1) * cw + xx); } for (let yy = 0; yy < ch; yy++) { fila.push(yy * cw, yy * cw + cw - 1); }
      while (fila.length) { const q = fila.pop(); if (vis[q] || !branco(q)) continue; vis[q] = 1; const qx = q % cw, qy = (q / cw) | 0; if (qx > 0) fila.push(q - 1); if (qx < cw - 1) fila.push(q + 1); if (qy > 0) fila.push(q - cw); if (qy < ch - 1) fila.push(q + cw); }
      for (let i = 0; i < cw * ch; i++) if (vis[i]) p[i * 4 + 3] = 0;
      cx.putImageData(id, 0, 0);
      out.push({ celula: key, w: cw, h: ch, png: cc.toDataURL('image/png') });
    }
    return out;
  };
});

const manifesto = {};
for (const nome of fichas) {
  const src = 'data:image/jpeg;base64,' + readFileSync(join(raiz, 'referencias', nome + '.jpg')).toString('base64');
  const poses = await page.evaluate((s) => window.fatiar(s), src);
  manifesto[nome] = poses.map((p, i) => ({ arquivo: `${nome}-${i + 1}.png`, celula: p.celula, w: p.w, h: p.h }));
  poses.forEach((p, i) => writeFileSync(join(destino, `${nome}-${i + 1}.png`), Buffer.from(p.png.split(',')[1], 'base64')));
  console.log(nome, poses.length, 'sprites');
}
writeFileSync(join(destino, 'manifesto.json'), JSON.stringify(manifesto, null, 2));

// ---- 2) cena de teste (cores e P&B)
const dados = {};
for (const nome of fichas) dados[nome] = manifesto[nome].map((m) => 'data:image/png;base64,' + readFileSync(join(destino, m.arquivo)).toString('base64'));
await page.evaluate(async ({ dados }) => {
  const carregar = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = s; });
  window.imgs = {}; for (const [n, l] of Object.entries(dados)) window.imgs[n] = await Promise.all(l.map(carregar));
}, { dados });
for (const modo of ['colorido', 'pb']) {
  await page.evaluate((modo) => {
    document.body.innerHTML = '<canvas id="c" width="1920" height="1080" style="display:block"></canvas>';
    const ctx = document.getElementById('c').getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 980); ctx.lineTo(1920, 980); ctx.stroke();
    ctx.lineWidth = 9; ctx.strokeRect(330, 50, 1260, 680); ctx.lineWidth = 3; ctx.strokeRect(344, 64, 1232, 652);
    ctx.fillStyle = '#000'; ctx.font = '700 120px "Ink Free","Segoe Print",cursive'; ctx.textAlign = 'center';
    ctx.fillText('Quadrado da soma', 960, 220); ctx.font = '700 150px "Ink Free","Segoe Print",cursive'; ctx.fillText('(a+b)² = a² + 2ab + b²', 960, 470);
    const altura = { CringeFather: 560, BetaSon: 420, Erika: 520, Dario: 330, Laura: 280 };
    const pos = [['CringeFather', 3, 230], ['Erika', 1, 560], ['Laura', 1, 1560], ['Dario', 1, 1380], ['BetaSon', 6, 1700]];
    for (const [nome, idx, x] of pos) {
      const im = window.imgs[nome][idx - 1], ref = window.imgs[nome][0];
      const k = altura[nome] / ref.height; const w = im.width * k, h = im.height * k;
      const t = document.createElement('canvas'); t.width = Math.ceil(w); t.height = Math.ceil(h);
      const tc = t.getContext('2d', { willReadFrequently: true }); tc.drawImage(im, 0, 0, w, h);
      if (modo === 'pb') { const d = tc.getImageData(0, 0, t.width, t.height); const p = d.data; for (let i = 0; i < p.length; i += 4) { const l = 0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]; const v = l < 150 ? 20 : 255; p[i] = p[i + 1] = p[i + 2] = v; } tc.putImageData(d, 0, 0); }
      ctx.drawImage(t, x - w / 2, 985 - h);
    }
  }, modo);
  await page.screenshot({ path: join(destino, `cena-${modo}.png`) });
  console.log('ok cena', modo);
}
await browser.close();


