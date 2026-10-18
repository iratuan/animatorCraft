// Recorta os sprites de um atlas PNG em PNGs individuais com fundo transparente.
//   node tools/sprites/segmentar-atlas.mjs <atlas.png> <pasta-saida> [--modo auto|alfa|branco] [--minimo 150]
// Dois tipos de atlas aparecem nas referências:
//   alfa   : sprites opacos sobre uma névoa colorida SEMITRANSPARENTE (o canal alfa já separa tudo)
//   branco : imagem opaca com fundo branco/cinza-claro (às vezes com xadrez "pintado"); o fundo é a região clara ligada às bordas
// Sprites que se encostam são separados por "vales" de ocupação (colunas/linhas quase vazias entre dois blocos grandes).
// Saída: <pasta>/<nnn>.png, indice.json (caixas, na ordem de leitura) e diagnostico.png (caixas numeradas sobre cinza).
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const entrada = resolve(args[0]), saida = resolve(args[1] ?? 'atlas-saida');
const opt = (nome, padrao) => { const i = args.indexOf(`--${nome}`); return i >= 0 ? args[i + 1] : padrao; };
const modoPedido = opt('modo', 'auto'), minimo = Number(opt('minimo', 150));
mkdirSync(saida, { recursive: true });

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>');
const r = await page.evaluate(async ({ b64, modoPedido, minimo }) => {
  const img = await new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
  const W = img.width, H = img.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H).data;
  const modo = modoPedido === 'auto' ? (d[3] < 10 ? 'alfa' : 'branco') : modoPedido;

  // ---- 1) máscara dos sprites (fg) e alfa de cada pixel
  const fg = new Uint8Array(W * H), alfa = new Uint8Array(W * H);
  if (modo === 'alfa') {
    const LIM = 140;
    for (let i = 0; i < W * H; i++) { const a = d[i * 4 + 3]; if (a >= LIM) { fg[i] = 1; alfa[i] = 255; } else if (a > LIM - 60) { alfa[i] = Math.round(((a - (LIM - 60)) / 60) * 255); } }
  } else {
    // fundo = região clara e pouco saturada ligada às bordas (o xadrez claro e o branco); o que está cercado por contorno fica
    const claro = (i) => { const r0 = d[i * 4], g0 = d[i * 4 + 1], b0 = d[i * 4 + 2]; return Math.min(r0, g0, b0) >= 205 && Math.max(r0, g0, b0) - Math.min(r0, g0, b0) <= 28; };
    const bg = new Uint8Array(W * H), fila = [];
    for (let i = 0; i < W; i++) fila.push(i, (H - 1) * W + i);
    for (let j = 0; j < H; j++) fila.push(j * W, j * W + W - 1);
    while (fila.length) {
      const q = fila.pop(); if (bg[q] || !claro(q)) continue; bg[q] = 1;
      const qx = q % W, qy = (q / W) | 0;
      if (qx > 0) fila.push(q - 1); if (qx < W - 1) fila.push(q + 1); if (qy > 0) fila.push(q - W); if (qy < H - 1) fila.push(q + W);
    }
    for (let i = 0; i < W * H; i++) if (!bg[i]) { fg[i] = 1; alfa[i] = 255; }
    // anel de 1 px do sprite que encosta no fundo: meio transparente (suaviza o serrilhado e some com a franja clara)
    for (let y = 1; y < H - 1; y++) for (let xx = 1; xx < W - 1; xx++) {
      const i = y * W + xx; if (!fg[i]) continue;
      if (bg[i - 1] || bg[i + 1] || bg[i - W] || bg[i + W]) alfa[i] = claro(i) ? 0 : 170;
    }
  }

  // ---- 2) componentes conexos (8-vizinhança) sobre a máscara
  const lab = new Int32Array(W * H), caixas = [], areas = [0];
  for (let s = 0; s < W * H; s++) {
    if (!fg[s] || lab[s]) continue;
    const id = areas.length, f = [s]; lab[s] = id; let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
    while (f.length) {
      const p = f.pop(); const px = p % W, py = (p / W) | 0; area++;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const qx = px + dx, qy = py + dy; if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const q = qy * W + qx; if (fg[q] && !lab[q]) { lab[q] = id; f.push(q); } }
    }
    areas.push(area);
    if (area >= minimo) caixas.push({ x0, y0, x1: x1 + 1, y1: y1 + 1, area, id });
  }
  // poeira do fundo (componentes pequenos soltos): some da máscara e dos recortes, mesmo dentro da caixa de um sprite maior
  for (let i = 0; i < W * H; i++) if (lab[i] && areas[lab[i]] < minimo) { fg[i] = 0; alfa[i] = 0; }

  // ---- 3) separa sprites encostados por vales de ocupação (recursivo)
  const ocup = (r, eixo) => {
    const n = eixo === 'x' ? r.x1 - r.x0 : r.y1 - r.y0, o = new Float32Array(n);
    for (let y = r.y0; y < r.y1; y++) for (let xx = r.x0; xx < r.x1; xx++) if (fg[y * W + xx] && lab[y * W + xx] === r.id) o[eixo === 'x' ? xx - r.x0 : y - r.y0]++;
    // suaviza (janela 5)
    return o.map((_, i) => { let s = 0, k = 0; for (let t = -2; t <= 2; t++) if (i + t >= 0 && i + t < n) { s += o[i + t]; k++; } return s / k; });
  };
  const aparar = (r) => { // encolhe a caixa até os pixels reais
    let x0 = r.x1, y0 = r.y1, x1 = r.x0, y1 = r.y0, area = 0;
    for (let y = r.y0; y < r.y1; y++) for (let xx = r.x0; xx < r.x1; xx++) if (fg[y * W + xx] && lab[y * W + xx] === r.id) { area++; if (xx < x0) x0 = xx; if (xx >= x1) x1 = xx + 1; if (y < y0) y0 = y; if (y >= y1) y1 = y + 1; }
    return area ? { x0, y0, x1, y1, area, id: r.id } : null;
  };
  const dividir = (r, prof = 0) => {
    if (prof > 8) return [r];
    for (const eixo of ['x', 'y']) {
      const n = eixo === 'x' ? r.x1 - r.x0 : r.y1 - r.y0; if (n < 56) continue;
      const o = ocup(r, eixo), pico = Math.max(...o);
      let melhor = -1, menor = Infinity;
      for (let i = 24; i < n - 24; i++) {
        const esq = Math.max(...o.slice(0, i)), dir = Math.max(...o.slice(i + 1));
        if (esq < 0.5 * pico || dir < 0.5 * pico) continue;           // os dois lados precisam ter um bloco grande
        if (o[i] <= 0.22 * Math.min(esq, dir) && o[i] < menor) { menor = o[i]; melhor = i; }
      }
      if (melhor < 0) continue;
      const a = eixo === 'x' ? { x0: r.x0, y0: r.y0, x1: r.x0 + melhor, y1: r.y1 } : { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y0 + melhor };
      const b = eixo === 'x' ? { x0: r.x0 + melhor, y0: r.y0, x1: r.x1, y1: r.y1 } : { x0: r.x0, y0: r.y0 + melhor, x1: r.x1, y1: r.y1 };
      const pa = aparar(a), pb = aparar(b);
      if (!pa || !pb || pa.area < minimo * 3 || pb.area < minimo * 3) continue;
      return [...dividir(pa, prof + 1), ...dividir(pb, prof + 1)];
    }
    return [r];
  };
  let rects = caixas.flatMap((k) => dividir(k));

  // ---- 4) ordem de leitura: linhas (centro y a menos de 55 px) e, em cada linha, esquerda → direita
  rects.forEach((k) => { k.cx = (k.x0 + k.x1) / 2; k.cy = (k.y0 + k.y1) / 2; });
  rects.sort((a, b) => a.cy - b.cy);
  const linhas = [];
  for (const k of rects) { const l = linhas.find((l) => Math.abs(l.cy - k.cy) < 55); if (l) { l.itens.push(k); l.cy = (l.cy * (l.itens.length - 1) + k.cy) / l.itens.length; } else linhas.push({ cy: k.cy, itens: [k] }); }
  rects = linhas.sort((a, b) => a.cy - b.cy).flatMap((l) => l.itens.sort((a, b) => a.cx - b.cx));

  // ---- 5) recorte RGBA: só os pixels do componente dentro da caixa
  const saidas = [];
  rects.forEach((k, idx) => {
    const pad = 2, cw = k.x1 - k.x0 + pad * 2, ch = k.y1 - k.y0 + pad * 2;
    const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
    const cx = cc.getContext('2d', { willReadFrequently: true });
    const im = cx.createImageData(cw, ch), p = im.data;
    for (let yy = k.y0; yy < k.y1; yy++) for (let xx = k.x0; xx < k.x1; xx++) {
      const i = yy * W + xx, a = alfa[i]; if (!a) continue;
      if (lab[i] && lab[i] !== k.id) continue; // pixel de outro sprite que só invade a caixa
      const o = ((yy - k.y0 + pad) * cw + (xx - k.x0 + pad)) * 4;
      p[o] = d[i * 4]; p[o + 1] = d[i * 4 + 1]; p[o + 2] = d[i * 4 + 2]; p[o + 3] = a;
    }
    cx.putImageData(im, 0, 0);
    saidas.push({ n: idx + 1, x: k.x0, y: k.y0, w: k.x1 - k.x0, h: k.y1 - k.y0, png: cc.toDataURL('image/png').split(',')[1] });
  });

  // ---- 6) diagnóstico
  const dg = document.createElement('canvas'); dg.width = W; dg.height = H;
  const dx = dg.getContext('2d'); dx.fillStyle = '#cfd6de'; dx.fillRect(0, 0, W, H);
  const lm = document.createElement('canvas'); lm.width = W; lm.height = H;
  const lx = lm.getContext('2d'), li = lx.createImageData(W, H);
  for (let i = 0; i < W * H; i++) if (alfa[i]) { li.data[i * 4] = d[i * 4]; li.data[i * 4 + 1] = d[i * 4 + 1]; li.data[i * 4 + 2] = d[i * 4 + 2]; li.data[i * 4 + 3] = alfa[i]; }
  lx.putImageData(li, 0, 0); dx.drawImage(lm, 0, 0);
  dx.font = '700 13px sans-serif';
  saidas.forEach((s) => { dx.strokeStyle = '#e11d48'; dx.lineWidth = 1.2; dx.strokeRect(s.x, s.y, s.w, s.h); dx.lineWidth = 3; dx.fillStyle = '#fff'; dx.strokeStyle = '#000'; dx.strokeText(String(s.n), s.x + 2, s.y + 13); dx.fillText(String(s.n), s.x + 2, s.y + 13); });
  return { W, H, modo, saidas, diagnostico: dg.toDataURL('image/png').split(',')[1] };
}, { b64: readFileSync(entrada).toString('base64'), modoPedido, minimo });

for (const s of r.saidas) writeFileSync(join(saida, `${String(s.n).padStart(3, '0')}.png`), Buffer.from(s.png, 'base64'));
writeFileSync(join(saida, 'diagnostico.png'), Buffer.from(r.diagnostico, 'base64'));
writeFileSync(join(saida, 'indice.json'), JSON.stringify({ atlas: entrada, modo: r.modo, largura: r.W, altura: r.H, sprites: r.saidas.map(({ n, x, y, w, h }) => ({ n, x, y, w, h })) }, null, 1));
console.log(`${r.saidas.length} sprites (${r.modo}) em ${saida}`);
await browser.close();




