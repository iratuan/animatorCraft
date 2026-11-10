// Mede a consistência visual dos SVGs dos personagens: espessuras de traço, cores de preenchimento e estilo de bocas/olhos.
// Uso: node tools/auditoria/medir-consistencia.mjs [saida.json]
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const raiz = 'assets/svg/characters';
const arquivos = [];
const percorrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) percorrer(p); else if (p.endsWith('.svg')) arquivos.push(p); } };
percorrer(raiz);

const porPersonagem = {};
for (const f of arquivos) {
  const id = relative(raiz, f).split(/[\\/]/)[0];
  const svg = readFileSync(f, 'utf8');
  const g = (porPersonagem[id] ??= { arquivos: 0, espessuras: {}, preenchimentos: {}, pretoMaciço: 0 });
  g.arquivos++;
  for (const m of svg.matchAll(/stroke-width="([\d.]+)"/g)) { const v = Number(m[1]); g.espessuras[v] = (g.espessuras[v] ?? 0) + 1; }
  for (const m of svg.matchAll(/fill="(#[0-9a-fA-F]{3,6}|[a-z]+)"/g)) { const c = m[1].toLowerCase(); g.preenchimentos[c] = (g.preenchimentos[c] ?? 0) + 1; }
  // preenchimento preto maciço (fora do traço): viola a regra de corpo branco com traço escuro
  g.pretoMaciço += (svg.match(/fill="#14161a"/g) ?? []).length;
}

const resumo = Object.fromEntries(Object.entries(porPersonagem).map(([id, g]) => {
  const espessuras = Object.entries(g.espessuras).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, n]) => `${v}×${n}`);
  const preen = Object.entries(g.preenchimentos).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([c, n]) => `${c}×${n}`);
  return [id, { arquivos: g.arquivos, espessurasMaisComuns: espessuras, preenchimentosMaisComuns: preen, preenchimentoPretoMaciço: g.pretoMaciço }];
}));

const saida = process.argv[2];
if (saida) writeFileSync(saida, JSON.stringify(resumo, null, 2), 'utf8');
for (const [id, r] of Object.entries(resumo)) {
  console.log(`${id.padEnd(13)} arquivos=${String(r.arquivos).padStart(3)}  preto-maciço=${String(r.preenchimentoPretoMaciço).padStart(3)}  traços=${r.espessurasMaisComuns.join(' ')}`);
}
