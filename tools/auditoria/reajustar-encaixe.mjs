// Reajusta o encaixe de rostos mal medidos: procura (x, y, escala) em torno do que as outras expressões do mesmo personagem usam
// e escolhe a que mais se sobrepõe à silhueta da cabeça do pose_parado. Uso: node tools/auditoria/reajustar-encaixe.mjs <personagem> <rosto> [--gravar]
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
const [, , pid, rosto, flag] = process.argv;
const arq = 'src/renderer/assets/personagens/personagens.json';
const man = JSON.parse(readFileSync(arq, 'utf8'));
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage();
await p.goto('http://127.0.0.1:5173/');
const melhor = await p.evaluate(async ({ pers, rosto, pid }) => {
  const carregar = async (u) => { const i = new Image(); i.src = u; await i.decode(); return i; };
  const parado = pers.sprites.find((s) => s.tags[0] === 'parado');
  const alvo = pers.sprites.find((s) => s.tipo === 'rosto' && s.tags[0] === rosto);
  const corpo = await carregar(`/src/renderer/assets/personagens/${parado.arquivo}`);
  const img = await carregar(`/src/renderer/assets/personagens/${alvo.arquivo}`);
  const W = parado.w, H = Math.ceil(parado.rosto.cabeca.h * parado.h) + 6;
  const cc = document.createElement('canvas'); cc.width = W; cc.height = parado.h; cc.getContext('2d').drawImage(corpo, 0, 0, W, parado.h);
  const ac = cc.getContext('2d').getImageData(0, 0, W, parado.h).data;
  const outros = pers.sprites.filter((s) => s.tipo === 'rosto' && s.encaixe && s.tags[0] !== rosto);
  const med = (k) => outros.map((s) => s.encaixe[k]).sort((a, c) => a - c)[Math.floor(outros.length / 2)];
  const x0 = med('x'), y0 = med('y'), e0 = med('escala');
  let best = { iou: -1 };
  const f = document.createElement('canvas'); f.width = W; f.height = parado.h; const fx = f.getContext('2d');
  for (let es = e0 - 0.25; es <= e0 + 0.25; es += 0.02) for (let oy = y0 - 8; oy <= y0 + 8; oy++) for (let ox = x0 - 8; ox <= x0 + 8; ox++) {
    fx.clearRect(0, 0, W, parado.h); fx.drawImage(img, ox, oy, img.width * es, img.height * es);
    const af = fx.getImageData(0, 0, W, H).data;
    let inter = 0, uni = 0;
    for (let i = 3; i < W * H * 4; i += 4) { const a = ac[i] > 128, c = af[i] > 128; if (a && c) inter++; if (a || c) uni++; }
    const iou = inter / Math.max(1, uni);
    if (iou > best.iou) best = { iou, x: ox, y: oy, escala: +es.toFixed(3) };
  }
  return { best, ref: { x0, y0, e0 }, atual: alvo.encaixe };
}, { pers: man[pid], rosto, pid });
console.log(JSON.stringify(melhor));
if (flag === '--gravar') {
  const s = man[pid].sprites.find((s) => s.tipo === 'rosto' && s.tags[0] === rosto);
  s.encaixe = { x: melhor.best.x, y: melhor.best.y, escala: melhor.best.escala };
  writeFileSync(arq, JSON.stringify(man));
  console.log('gravado');
}
await b.close();
