// Análise estática simples: grafo de imports, ciclos, dependências entre features e exportações não usadas.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
const raiz = 'src';
const arquivos = [];
const varrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? varrer(p) : /\.(ts|tsx)$/.test(n) && arquivos.push(p); } };
varrer(raiz);
const alias = { '@shared/': 'src/shared/', '@renderer/': 'src/renderer/', '@main/': 'src/main/' };
const tenta = (p) => [p + '.ts', p + '.tsx', join(p, 'index.ts'), join(p, 'index.tsx')].find((c) => { try { return statSync(c).isFile(); } catch { return false; } });
const resolver = (de, spec) => { let alvo = null; for (const [a, b] of Object.entries(alias)) if (spec.startsWith(a)) alvo = resolve(spec.replace(a, b)); if (!alvo && spec.startsWith('.')) alvo = resolve(dirname(de), spec); return alvo ? tenta(alvo) ?? (tenta(alvo.replace(/\.json$/, '')) ? null : null) : null; };
const grafo = new Map(), exportadas = new Map(), usos = new Map();
for (const f of arquivos) {
  const t = readFileSync(f, 'utf8');
  const deps = new Set();
  for (const m of t.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) { if (/^(?:import|export)\s+type\s/.test(m[0]) || /^(?:import|export)\s*\{\s*(?:type\s+[\w$]+\s*,?\s*)+\}/.test(m[0])) continue; // import de tipos some na compilação: não conta como dependência real
    const r = resolver(f, m[1]); if (r) { deps.add(relative('.', r).replaceAll('\\', '/')); const nomes = [...m[0].matchAll(/\b([A-Za-zÀ-ÿ_$][\w$]*)\b/g)].map((x) => x[1]); for (const n of nomes) { const k = relative('.', r).replaceAll('\\', '/'); (usos.get(k) ?? usos.set(k, new Set()).get(k)).add(n); } } }
  for (const m of t.matchAll(/^import\s+['"]([^'"]+)['"]/gm)) { const r = resolver(f, m[1]); if (r) deps.add(relative('.', r).replaceAll('\\', '/')); }
  grafo.set(relative('.', f).replaceAll('\\', '/'), deps);
  const ex = [...t.matchAll(/^export\s+(?:async\s+)?(?:const|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
  exportadas.set(relative('.', f).replaceAll('\\', '/'), ex);
}
// ciclos (DFS)
const ciclos = new Set(), estado = new Map();
const dfs = (n, pilha) => { estado.set(n, 1); pilha.push(n); for (const d of grafo.get(n) ?? []) { if (!grafo.has(d)) continue; if (estado.get(d) === 1) ciclos.add([...pilha.slice(pilha.indexOf(d)), d].join(' -> ')); else if (!estado.get(d)) dfs(d, pilha); } pilha.pop(); estado.set(n, 2); };
for (const n of grafo.keys()) if (!estado.get(n)) dfs(n, []);
console.log('CICLOS:', ciclos.size); [...ciclos].slice(0, 10).forEach((c) => console.log('  ', c));
// dependências entre features
const feat = (p) => /src\/renderer\/features\/([^/]+)\//.exec(p)?.[1];
const entre = new Map();
for (const [de, ds] of grafo) { const a = feat(de); if (!a) continue; for (const d of ds) { const b = feat(d); if (b && b !== a) { const k = `${a} -> ${b}`; entre.set(k, (entre.get(k) ?? 0) + 1); } } }
console.log('\nDEPENDÊNCIAS ENTRE FEATURES:'); [...entre].sort().forEach(([k, v]) => console.log('  ', k, v));
// features que dependem do store / de outros layers
const camadas = { shared: 0, renderer: 0 };
for (const [de, ds] of grafo) if (de.startsWith('src/shared/')) for (const d of ds) if (d.startsWith('src/renderer')) console.log('\nVIOLAÇÃO shared -> renderer:', de, d);
// exportações não usadas fora do próprio arquivo
console.log('\nEXPORTAÇÕES SEM USO EXTERNO:');
let n = 0;
for (const [f, ex] of exportadas) { if (/\.test\.ts$|main\.tsx$|index\.ts$/.test(f)) continue; for (const e of ex) { const usado = [...usos].some(([k, set]) => (k === f || (k.endsWith('/index.ts') && grafo.get(k)?.has(f))) && set.has(e)); if (!usado) { console.log('  ', f, e); n++; } } }
console.log('total', n);


