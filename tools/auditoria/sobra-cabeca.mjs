// Mede, para cada rosto, quanto da cabeça ORIGINAL do pose_parado continua aparecendo depois de colocar o rosto no encaixe.
// Valores altos = "cabeça dupla" visível no vídeo.
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';
const man = JSON.parse(readFileSync('src/renderer/assets/personagens/personagens.json', 'utf8'));
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/');
const res = await p.evaluate(async (man) => {
  const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
  const out = [];
  for (const [id, pers] of Object.entries(man)) {
    const parado = pers.sprites.find((s) => s.tags[0] === 'parado');
    const corpo = await carregar(`/src/renderer/assets/personagens/${parado.arquivo}`);
    const cb = parado.rosto.cabeca;
    const hx = 0, hw = parado.w, hy = 0, hh = Math.ceil(cb.h * parado.h) + 6;
    const alphaCorpo = (() => { const c = document.createElement('canvas'); c.width = parado.w; c.height = parado.h; const x = c.getContext('2d'); x.drawImage(corpo, 0, 0, parado.w, parado.h); return x.getImageData(0, 0, parado.w, parado.h).data; })();
    for (const s of pers.sprites.filter((s) => s.tipo === 'rosto' && s.encaixe)) {
      const img = await carregar(`/src/renderer/assets/personagens/${s.arquivo}`);
      const c = document.createElement('canvas'); c.width = parado.w; c.height = parado.h; const x = c.getContext('2d');
      const e = s.encaixe; x.drawImage(img, e.x, e.y, img.width * e.escala, img.height * e.escala);
      const af = x.getImageData(0, 0, parado.w, parado.h).data;
      let orig = 0, sobra = 0;
      for (let yy = hy; yy < Math.min(hh, parado.h); yy++) for (let xx = hx; xx < hx + hw; xx++) { const i = (yy * parado.w + xx) * 4 + 3; if (alphaCorpo[i] > 128) { orig++; if (af[i] < 128) sobra++; } }
      out.push({ id, rosto: s.tags[0], sobra: +(sobra / Math.max(1, orig)).toFixed(3) });
    }
  }
  return out;
}, man);
const piores = res.filter((r) => r.sobra > 0.12).sort((a, c) => c.sobra - a.sobra);
console.log('rostos com sobra da cabeça original > 12%:'); for (const r of piores) console.log(' ', r.id, r.rosto, r.sobra);
const media = {}; for (const r of res) (media[r.id] ??= []).push(r.sobra);
for (const [id, v] of Object.entries(media)) console.log(id, 'mediana', v.sort((a, c) => a - c)[Math.floor(v.length / 2)]);
await b.close();
