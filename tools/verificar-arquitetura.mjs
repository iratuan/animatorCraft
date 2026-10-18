// Falha (exit 1) se alguma regra de camadas for violada. Rodado por `npm run check`.
//  1. shared/ não importa de renderer/ nem de main/
//  2. uma feature só importa de outra pelo index dela (@renderer/features/<nome>), nunca por caminho interno
//  3. features/ não importam de pages/
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const arquivos = [];
const varrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? varrer(p) : /\.(ts|tsx)$/.test(n) && arquivos.push(p.replaceAll('\\', '/')); } };
varrer('src');

const erros = [];
for (const f of arquivos) {
  const texto = readFileSync(f, 'utf8');
  const minha = /^src\/renderer\/features\/([^/]+)\//.exec(f)?.[1];
  const linhas = texto.split('\n');
  linhas.forEach((l, i) => {
    const m = /(?:from|import\()\s*['"]([^'"]+)['"]/.exec(l);
    if (!m) return;
    const spec = m[1];
    const onde = `${f}:${i + 1}`;
    if (f.startsWith('src/shared/') && /@renderer|@main|renderer\/|main\//.test(spec)) erros.push(`${onde} shared não pode importar de renderer/main (${spec})`);
    const fundo = /^@renderer\/features\/([^/]+)\/.+/.exec(spec);
    if (fundo && fundo[1] !== minha) erros.push(`${onde} importe pelo index da feature: @renderer/features/${fundo[1]} (${spec})`);
    if (minha && /@renderer\/pages\//.test(spec)) erros.push(`${onde} feature não pode importar de pages (${spec})`);
  });
}
if (erros.length) { console.error(erros.join('\n')); console.error(`\n${erros.length} violação(ões) de arquitetura`); process.exit(1); }
console.log('arquitetura ok: camadas respeitadas');
