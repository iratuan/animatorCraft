// Monta a biblioteca de sprites de um personagem a partir de fichas (atlas) e de uma receita.
//   node tools/montar-biblioteca.mjs <personagem|todos>
// Receita: tools/receitas/<personagem>.json  { id, alturaAlvo, folhas: [{ arquivo, referencia, itens: { "<n>": "pose_parado" | ["rosto_feliz","rosto_boca-m"] } }] }
// Para cada folha: segmenta (tools/segmentar-atlas.mjs), normaliza a escala pela altura do sprite de referência,
// grava <tipo>_<nome>[_n].png em src/renderer/assets/personagens/<id>/ e atualiza o manifesto.
// As cabeças rosto_* são encaixadas no pose_parado comparando as silhuetas (IoU); o encaixe fica no manifesto.
// Nada é pintado sobre o rosto: cada rosto_* é a cabeça original do atlas, com a pele e as cores do próprio personagem.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const destinoBase = join(raiz, 'src/renderer/assets/personagens');
const manifestoPath = join(destinoBase, 'personagens.json');
const tmpBase = join(raiz, 'evidencias/19-atlas-segmentados');
const alvo = process.argv[2];
if (!alvo) { console.error('Uso: node tools/montar-biblioteca.mjs <personagem|todos>'); process.exit(2); }

const receitas = readdirSync(join(raiz, 'tools/receitas')).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(raiz, 'tools/receitas', f), 'utf8')));
const escolhidas = alvo === 'todos' ? receitas : receitas.filter((r) => r.id === alvo);
if (!escolhidas.length) { console.error(`Sem receita para "${alvo}"`); process.exit(2); }

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>');
await page.evaluate(() => {
  const carregar = (b64) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + b64; });
  window.escalar = async (b64, f) => {
    const img = await carregar(b64);
    const w = Math.max(1, Math.round(img.width * f)), h = Math.max(1, Math.round(img.height * f));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, w, h);
    return { b64: c.toDataURL('image/png').split(',')[1], w, h };
  };
  // encaixe da cabeça: procura escala e deslocamento que maximizam a sobreposição das silhuetas na região da cabeça do corpo
  window.encaixar = async (corpoB64, rostoB64) => {
    const corpo = await carregar(corpoB64), rosto = await carregar(rostoB64);
    const cb = document.createElement('canvas'); cb.width = corpo.width; cb.height = corpo.height;
    const cbx = cb.getContext('2d', { willReadFrequently: true }); cbx.drawImage(corpo, 0, 0);
    const Wb = corpo.width, Hb = Math.round(corpo.height * 0.42);
    const bd = cbx.getImageData(0, 0, Wb, Hb).data;
    // centro horizontal da cabeça do corpo: centroide da silhueta nas primeiras linhas (cabelo)
    let sx = 0, n = 0; for (let y = 0; y < Math.round(corpo.height * 0.2); y++) for (let x = 0; x < Wb; x++) if (bd[(y * Wb + x) * 4 + 3] > 128) { sx += x; n++; }
    const cx0 = sx / Math.max(1, n);
    const rc = document.createElement('canvas'); rc.width = rosto.width; rc.height = rosto.height;
    const rcx = rc.getContext('2d', { willReadFrequently: true }); rcx.drawImage(rosto, 0, 0);
    const rd = rcx.getImageData(0, 0, rosto.width, rosto.height).data;
    let rsx = 0, rn = 0; for (let y = 0; y < Math.round(rosto.height * 0.45); y++) for (let x = 0; x < rosto.width; x++) if (rd[(y * rosto.width + x) * 4 + 3] > 128) { rsx += x; rn++; }
    const rcx0 = rsx / Math.max(1, rn);
    // escala prévia: largura máxima do cabelo/cabeça (linhas do topo) do corpo contra a da cabeça avulsa; a busca fica ±15% disso
    const largMax = (dados, W0, linhas) => { let m = 0; for (let y = 0; y < linhas; y++) { let x0 = W0, x1 = -1; for (let x = 0; x < W0; x++) if (dados[(y * W0 + x) * 4 + 3] > 128) { if (x < x0) x0 = x; x1 = x; } if (x1 >= 0) m = Math.max(m, x1 - x0 + 1); } return m; };
    const es0 = largMax(bd, Wb, Math.round(corpo.height * 0.17)) / Math.max(1, largMax(rd, rosto.width, Math.round(rosto.height * 0.5)));
    let melhor = { iou: -1, escala: es0, x: 0, y: 0 };
    for (let es = es0 * 0.85; es <= es0 * 1.15; es += es0 * 0.02) {
      const rw = Math.round(rosto.width * es), rh = Math.round(rosto.height * es);
      const t = document.createElement('canvas'); t.width = rw; t.height = rh;
      const tx = t.getContext('2d', { willReadFrequently: true }); tx.imageSmoothingQuality = 'high'; tx.drawImage(rosto, 0, 0, rw, rh);
      const td = tx.getImageData(0, 0, rw, rh).data;
      for (let dy = -14; dy <= 22; dy += 1) for (let dxx = -16; dxx <= 16; dxx += 1) {
        const ox = Math.round(cx0 - rcx0 * es) + dxx, oy = dy;
        let inter = 0, uni = 0;
        for (let y = 0; y < Hb; y++) for (let x = 0; x < Wb; x++) {
          const a = bd[(y * Wb + x) * 4 + 3] > 128;
          const rx = x - ox, ry = y - oy;
          const b = rx >= 0 && ry >= 0 && rx < rw && ry < rh && td[(ry * rw + rx) * 4 + 3] > 128;
          if (a && b) inter++; if (a || b) uni++;
        }
        const iou = inter / Math.max(1, uni);
        if (iou > melhor.iou) melhor = { iou, escala: es, x: ox, y: oy };
      }
    }
    return melhor;
  };
});

const manifesto = existsSync(manifestoPath) ? JSON.parse(readFileSync(manifestoPath, 'utf8')) : {};

for (const rec of escolhidas) {
  console.log(`\n== ${rec.id}`);
  const pasta = join(destinoBase, rec.id);
  rmSync(pasta, { recursive: true, force: true }); mkdirSync(pasta, { recursive: true });
  const sprites = [];
  let corpoParado = null; const rostos = [];
  for (const folha of rec.folhas) {
    const seg = join(tmpBase, folha.arquivo.replace(/\.png$/i, ''));
    if (!existsSync(join(seg, 'indice.json'))) execFileSync('node', [join(raiz, 'tools/segmentar-atlas.mjs'), join(raiz, 'referencias', folha.arquivo), seg], { stdio: 'inherit' });
    const indice = JSON.parse(readFileSync(join(seg, 'indice.json'), 'utf8')).sprites;
    const ref = indice.find((s) => s.n === folha.referencia);
    if (!ref) throw new Error(`${folha.arquivo}: referência ${folha.referencia} não existe`);
    const fator = rec.alturaAlvo / ref.h;
    console.log(`  ${folha.arquivo}: referência #${folha.referencia} (${ref.h}px) → escala ${fator.toFixed(3)}`);
    for (const [n, nomes] of Object.entries(folha.itens)) {
      const arquivoPng = join(seg, `${String(n).padStart(3, '0')}.png`);
      if (!existsSync(arquivoPng)) { console.warn(`  ! sprite #${n} não existe em ${folha.arquivo}`); continue; }
      const esc = await page.evaluate(([b, f]) => window.escalar(b, f), [readFileSync(arquivoPng).toString('base64'), fator]);
      for (const nome of [].concat(nomes)) {
        const m = /^(pose|rosto|prop)_([a-z0-9]+(?:-[a-z0-9]+)*)(?:_(\d+))?$/.exec(nome);
        if (!m) throw new Error(`nome inválido na receita: ${nome}`);
        const arquivo = `${rec.id}/${nome}.png`;
        writeFileSync(join(destinoBase, arquivo), Buffer.from(esc.b64, 'base64'));
        const info = { arquivo, w: esc.w, h: esc.h, tags: [m[2]], tipo: m[1], variante: m[3] ? Number(m[3]) : null, ancora: (folha.topo ?? []).includes(nome) ? 'topo' : 'pes' };
        sprites.push({ info, b64: esc.b64 });
        if (nome === 'pose_parado') corpoParado = { info, b64: esc.b64 };
        if (m[1] === 'rosto') rostos.push({ info, b64: esc.b64 });
      }
    }
  }
  if (!corpoParado) throw new Error(`${rec.id}: a receita precisa de pose_parado`);
  // caixa da cabeça do pose_parado (fração do sprite) e encaixe de cada rosto
  corpoParado.info.rosto = { cabeca: rec.cabeca ?? { x: 0.05, y: 0, w: 0.9, h: 0.38 } };
  for (const r of rostos) {
    const e = await page.evaluate(([c, f]) => window.encaixar(c, f), [corpoParado.b64, r.b64]);
    r.info.encaixe = { x: e.x, y: e.y, escala: Number(e.escala.toFixed(3)) };
    console.log(`  encaixe ${r.info.tags[0].padEnd(16)} IoU ${e.iou.toFixed(2)}  escala ${e.escala.toFixed(2)}  (${e.x},${e.y})`);
  }
  manifesto[rec.id] = { nome: rec.nome ?? rec.id, altura: rec.alturaAlvo, sprites: sprites.map((s) => s.info) };
  console.log(`  ${sprites.length} sprites gravados`);
}
writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2));
await browser.close();
console.log('\nmanifesto atualizado:', manifestoPath);


