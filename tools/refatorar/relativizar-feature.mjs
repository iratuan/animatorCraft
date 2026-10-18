// Dentro de uma feature, imports da própria feature viram relativos ("./", "../"); entre features, só pelo index (API pública).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
const arquivos = [];
const varrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? varrer(p) : /\.(ts|tsx)$/.test(n) && arquivos.push(p.replaceAll('\\', '/')); } };
varrer('src/renderer/features');
let n = 0;
for (const f of arquivos) {
  const feat = /^src\/renderer\/features\/([^/]+)\//.exec(f)[1];
  const t = readFileSync(f, 'utf8');
  const novo = t.replace(new RegExp(`(from\\s+|import\\s*\\(\\s*)(['"])@renderer/features/${feat}/([^'"]+)\\2`, 'g'), (m, pre, asp, resto) => {
    let rel = posix.relative(posix.dirname(f), `src/renderer/features/${feat}/${resto}`);
    if (!rel.startsWith('.')) rel = './' + rel;
    return `${pre}${asp}${rel}${asp}`;
  });
  if (novo !== t) { writeFileSync(f, novo); n++; }
}
console.log('arquivos reescritos:', n);
void dirname; void relative;
