// Gera o index.ts (API pública) de cada feature a partir do que as outras camadas realmente importam e
// reescreve esses imports para passarem pelo index. Também junta imports repetidos do mesmo módulo.
// Uso: node tools/refatorar/gerar-barris.mjs [--executar]
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const executar = process.argv.includes('--executar');
const arquivos = [];
const varrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? varrer(p) : /\.(ts|tsx)$/.test(n) && arquivos.push(p.replaceAll('\\', '/')); } };
varrer('src/renderer');

const featureDe = (p) => /^src\/renderer\/features\/([^/]+)\//.exec(p)?.[1] ?? null;
const desalias = (s) => (s.startsWith('@renderer/') ? `src/renderer/${s.slice(10)}` : null);
const resolverArq = (base) => ['.ts', '.tsx', '/index.ts', '/index.tsx'].map((e) => base + e).find((c) => existsSync(c) && statSync(c).isFile());

// tipos exportados por arquivo
const ehTipo = (arq, nome) => new RegExp(`export\\s+(?:interface|type)\\s+${nome}\\b`).test(readFileSync(arq, 'utf8'));

const RE = /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+(['"])([^'"]+)\3;?/gm;
const barril = new Map(); // feature -> Map(arquivoOrigem -> Map(nome -> ehTipo))
const alteracoes = new Map();

for (const f of arquivos) {
  const minha = featureDe(f);
  let texto = readFileSync(f, 'utf8');
  texto = texto.replace(RE, (m, tipoTodo, nomes, asp, spec) => {
    const abs = desalias(spec);
    if (!abs) return m;
    const alvo = featureDe(`${abs}.ts`) ?? featureDe(`${abs}/x.ts`);
    if (!alvo || alvo === minha) return m;
    const arq = resolverArq(abs);
    if (!arq || /\/index\.(ts|tsx)$/.test(arq)) return m; // já passa pelo index
    const ficha = barril.get(alvo) ?? barril.set(alvo, new Map()).get(alvo);
    const mapa = ficha.get(arq) ?? ficha.set(arq, new Map()).get(arq);
    for (const parte of nomes.split(',').map((s) => s.trim()).filter(Boolean)) {
      const t = parte.startsWith('type ') || !!tipoTodo;
      const nome = parte.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim();
      mapa.set(nome, (mapa.get(nome) ?? false) || t || ehTipo(arq, nome));
    }
    return `import ${tipoTodo ?? ''}{${nomes}} from ${asp}@renderer/features/${alvo}${asp};`;
  });
  alteracoes.set(f, texto);
}

// junta imports repetidos do mesmo módulo dentro do arquivo
const juntar = (texto) => {
  const vistos = new Map();
  return texto.replace(/^import\s+(type\s+)?\{([^}]+)\}\s+from\s+(['"])(@renderer\/features\/[^'"/]+)\3;?\r?\n?/gm, (m, tipoTodo, nomes, asp, spec) => {
    const lista = nomes.split(',').map((s) => s.trim()).filter(Boolean).map((s) => (tipoTodo && !s.startsWith('type ') ? `type ${s}` : s));
    if (!vistos.has(spec)) { vistos.set(spec, { lista }); return `@@${spec}@@\n`; }
    vistos.get(spec).lista.push(...lista); return '';
  }).replace(/@@(@renderer\/features\/[^@]+)@@\n/g, (m, spec) => {
    const lista = [...new Set(vistos.get(spec).lista)];
    return `import { ${lista.join(', ')} } from '${spec}';\n`;
  });
};

console.log('features com API pública:');
const textosIndex = new Map();
for (const [feat, arqs] of barril) {
  const indice = `src/renderer/features/${feat}/index.ts`;
  const existente = existsSync(indice) ? readFileSync(indice, 'utf8') : '';
  const linhas = [];
  const jaExportado = new Set([...existente.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)].map((x) => x[1]));
  for (const [arq, nomes] of [...arqs].sort()) {
    const rel = './' + arq.slice(`src/renderer/features/${feat}/`.length).replace(/\.(ts|tsx)$/, '');
    const valores = [...nomes].filter(([n, t]) => !t && !jaExportado.has(n)).map(([n]) => n).sort();
    const tipos = [...nomes].filter(([n, t]) => t && !jaExportado.has(n)).map(([n]) => n).sort();
    if (valores.length) linhas.push(`export { ${valores.join(', ')} } from '${rel}';`);
    if (tipos.length) linhas.push(`export type { ${tipos.join(', ')} } from '${rel}';`);
  }
  if (!linhas.length) continue;
  const cab = existente ? existente.trimEnd() + '\n' : `/** API pública da feature "${feat}": o resto do app só importa daqui. */\n`;
  textosIndex.set(indice, cab + linhas.join('\n') + '\n');
  console.log(`  ${feat}: ${linhas.length} linha(s)`);
}
if (!executar) process.exit(0);
for (const [f, t] of alteracoes) writeFileSync(f, juntar(t));
for (const [i, t] of textosIndex) writeFileSync(i, t);
console.log('feito');
