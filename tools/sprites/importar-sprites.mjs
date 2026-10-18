// Importa um pacote de sprites (.zip ou pasta) para o projeto, seguindo docs/SPRITES.md.
//   node tools/sprites/importar-sprites.mjs <pacote.zip|pasta> [--mesclar] [--simular]
// --mesclar : mantém os sprites antigos do personagem (padrão: substitui quando o pacote traz 3+ poses)
// --simular : só valida e mostra o relatório
// Usa as mesmas regras do app (packages/core/src/nomenclatura.ts) e o Edge para remover fundo branco e aparar bordas.
import { chromium } from 'playwright-core';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { analisarPacote, POSES_CONHECIDAS } from '../../src/shared/domain/nomenclatura.ts';
import { ORDEM_ATORES } from '../../src/shared/domain/characters.ts';
import { EXPRESSOES } from '../../src/shared/domain/poses.ts';

const args = process.argv.slice(2);
const entrada = args.find((a) => !a.startsWith('--'));
const mesclar = args.includes('--mesclar'), simular = args.includes('--simular');
if (!entrada) { console.error('Uso: node tools/sprites/importar-sprites.mjs <pacote.zip|pasta> [--mesclar] [--simular]'); process.exit(2); }

const raiz = resolve(import.meta.dirname, '../..');
const destino = join(raiz, 'src/renderer/assets/personagens');
const manifestoPath = join(destino, 'personagens.json');

// 1) abrir o pacote
let pasta = resolve(entrada), temp = null;
if (/\.zip$/i.test(entrada)) {
  temp = mkdtempSync(join(tmpdir(), 'stickboard-pacote-'));
  execFileSync('powershell', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${pasta}' -DestinationPath '${temp}' -Force`]);
  pasta = temp;
}
const listar = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? listar(p) : [p]; });
const arquivos = listar(pasta).map((p) => relative(pasta, p).replace(/\\/g, '/'));

// 2) validar
const rel = analisarPacote(arquivos, { personagens: ORDEM_ATORES, expressoes: [...EXPRESSOES], posesConhecidas: POSES_CONHECIDAS });
console.log(`Pacote: ${entrada} — ${rel.sprites.length} sprite(s) reconhecido(s)`);
for (const [id, r] of Object.entries(rel.resumo)) console.log(`  ${id}: ${r.poses.length} poses${Object.keys(r.quadros).length ? ' (quadros: ' + Object.entries(r.quadros).map(([n, q]) => `${n}×${q}`).join(', ') + ')' : ''}, ${r.rostos.length} rostos, ${r.props.length} props`);
for (const a of rel.avisos) console.log('  ⚠', a);
for (const e of rel.erros) console.log('  ✖', e);
if (rel.erros.length) { console.error('\nCorrija os erros acima e rode de novo.'); if (temp) rmSync(temp, { recursive: true, force: true }); process.exit(1); }
if (simular) { console.log('\n(simulação: nada foi gravado)'); if (temp) rmSync(temp, { recursive: true, force: true }); process.exit(0); }

// 3) processar as imagens no navegador: tirar fundo branco (se não houver transparência) e aparar bordas
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage();
await page.setContent('<body></body>');
await page.evaluate(() => {
  window.preparar = async (b64) => {
    const img = await new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => erro(new Error('PNG inválido')); i.src = 'data:image/png;base64,' + b64; });
    const lim = 1600, k = Math.min(1, lim / Math.max(img.width, img.height));
    const W = Math.max(1, Math.round(img.width * k)), H = Math.max(1, Math.round(img.height * k));
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H), p = d.data;
    const temAlfa = [0, W - 1, (H - 1) * W, H * W - 1].some((i) => p[i * 4 + 3] < 250);
    if (!temAlfa) {
      const vis = new Uint8Array(W * H), fila = [];
      const branco = (i) => p[i * 4] > 238 && p[i * 4 + 1] > 238 && p[i * 4 + 2] > 238;
      for (let i = 0; i < W; i++) fila.push(i, (H - 1) * W + i);
      for (let j = 0; j < H; j++) fila.push(j * W, j * W + W - 1);
      while (fila.length) { const q = fila.pop(); if (vis[q] || !branco(q)) continue; vis[q] = 1; const qx = q % W, qy = (q / W) | 0; if (qx > 0) fila.push(q - 1); if (qx < W - 1) fila.push(q + 1); if (qy > 0) fila.push(q - W); if (qy < H - 1) fila.push(q + W); }
      for (let i = 0; i < W * H; i++) if (vis[i]) p[i * 4 + 3] = 0;
      x.putImageData(d, 0, 0);
    }
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) if (p[(yy * W + xx) * 4 + 3] > 8) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
    if (x1 < 0) throw new Error('imagem totalmente transparente');
    const pad = 2, cw = x1 - x0 + 1 + pad * 2, ch = y1 - y0 + 1 + pad * 2;
    const o = document.createElement('canvas'); o.width = cw; o.height = ch;
    o.getContext('2d').drawImage(c, x0 - pad, y0 - pad, cw, ch, 0, 0, cw, ch);
    return { png: o.toDataURL('image/png').split(',')[1], w: cw, h: ch };
  };
});

// 4) gravar e atualizar o manifesto
const manifesto = existsSync(manifestoPath) ? JSON.parse(readFileSync(manifestoPath, 'utf8')) : {};
const falhas = [];
for (const [id, resumo] of Object.entries(rel.resumo)) {
  const meta = rel.meta[id] ? JSON.parse(readFileSync(join(pasta, rel.meta[id]), 'utf8')) : {};
  const m = (manifesto[id] ??= { nome: id, altura: 400, sprites: [] });
  const substituir = !mesclar && resumo.poses.length >= 3;
  if (substituir) { for (const s of m.sprites) rmSync(join(destino, s.arquivo), { force: true }); m.sprites = []; }
  const caixaAntiga = m.sprites.find((s) => s.tags[0] === 'parado')?.rosto?.cabeca;
  mkdirSync(join(destino, id), { recursive: true });
  for (const s of rel.sprites.filter((x) => x.personagem === id)) {
    try {
      const r = await page.evaluate((b) => window.preparar(b), readFileSync(join(pasta, s.caminho)).toString('base64'));
      const arquivo = `${id}/${s.tipo}_${s.nome}${s.variante ? `_${s.variante}` : ''}.png`;
      writeFileSync(join(destino, arquivo), Buffer.from(r.png, 'base64'));
      const ehParado = s.tipo === 'pose' && s.nome === 'parado' && (s.variante === null || s.variante === 1);
      const info = { arquivo, w: r.w, h: r.h, tags: [s.nome], tipo: s.tipo, variante: s.variante, ancora: meta.ancora?.[s.nome] ?? 'pes', ...(ehParado ? { rosto: { cabeca: meta.cabeca ?? caixaAntiga ?? { x: 0.1, y: 0, w: 0.8, h: 0.3 } } } : {}) };
      m.sprites = m.sprites.filter((o) => !((o.tipo ?? 'pose') === s.tipo && o.tags[0] === s.nome && (o.variante ?? null) === s.variante));
      m.sprites.push(info);
    } catch (e) { falhas.push(`${s.caminho}: ${e.message}`); }
  }
  console.log(`  ${id}: ${substituir ? 'substituído' : 'mesclado'} (${m.sprites.length} sprites no total)`);
}
writeFileSync(manifestoPath, JSON.stringify(manifesto, null, 2));
await browser.close();
if (temp) rmSync(temp, { recursive: true, force: true });
if (falhas.length) { console.error('\nFalharam:\n' + falhas.join('\n')); process.exit(1); }
console.log('\nPronto. Recompile o app (npm run build -w @stickboard/web) para usar os novos sprites.');

