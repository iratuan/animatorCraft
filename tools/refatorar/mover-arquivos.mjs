// Move arquivos do renderer para a nova organização e reescreve todos os imports (convertendo relativos em alias).
// Uso (na raiz): node tools/refatorar/mover-arquivos.mjs [--executar]      sem a opção, só mostra o que faria.
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const executar = process.argv.includes('--executar');
const R = 'src/renderer/';
// caminho antigo -> novo (relativos a src/renderer, sem extensão)
const MAPA = {
  'features/arquivos/services/plataforma': 'features/sistema/services/plataforma',
  'features/arquivos/hooks/useMenus': 'pages/editor/useMenus',
  'features/biblioteca/components/PainelLateral': 'pages/editor/PainelLateral',
  'features/biblioteca/components/PropriedadesPanel': 'features/personagens/components/PropriedadesPanel',
  'features/pacotes-sprites/components/EditorPersonagemModal': 'features/personagens/components/EditorSpritesModal',
  'features/pacotes-sprites/components/ImportarPacoteModal': 'features/personagens/components/ImportarPacoteModal',
  'features/pacotes-sprites/hooks/useCargaInicial': 'pages/editor/useCargaInicial',
  'features/pacotes-sprites/services/exportar': 'features/personagens/services/exportarSprites',
  'features/pacotes-sprites/services/pacotes': 'features/personagens/services/pacotes',
  'features/pacotes-sprites/services/personagens': 'features/personagens/services/bibliotecaSprites',
  'features/personagens/services/personagens': 'features/personagens/services/cadastro',
  'features/personagens/services/useSkins': 'features/personagens/hooks/useSkins',
  'pages/EditorPage': 'pages/editor/EditorPage',
};
for (const nome of ['ator', 'camera', 'cena', 'corpo', 'imagens', 'lousa', 'miniatura', 'sprites', 'tremor']) MAPA[`features/palco/render/${nome}`] = `features/cena/services/${nome}`;
MAPA['features/palco/render/index'] = 'features/cena/index';

const arquivos = [];
const varrer = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? varrer(p) : /\.(ts|tsx)$/.test(n) && arquivos.push(p.replaceAll('\\', '/')); } };
varrer('src');

const EXT = ['.ts', '.tsx', '/index.ts', '/index.tsx'];
const resolverArquivo = (base) => EXT.map((e) => base + e).find((c) => existsSync(c) && statSync(c).isFile());
const semExt = (p) => p.replace(/\.(ts|tsx)$/, '').replace(/\/index$/, '');
const alias = (abs) => abs.startsWith('src/renderer/') ? `@renderer/${abs.slice(R.length)}` : abs.startsWith('src/shared/') ? `@shared/${abs.slice('src/shared/'.length)}` : abs.startsWith('src/main/') ? `@main/${abs.slice('src/main/'.length)}` : abs;
const desalias = (s) => s.startsWith('@renderer/') ? `src/renderer/${s.slice(10)}` : s.startsWith('@shared/') ? `src/shared/${s.slice(8)}` : s.startsWith('@main/') ? `src/main/${s.slice(6)}` : null;

// 1) calcula o novo caminho de cada arquivo
const novoCaminho = new Map();
for (const f of arquivos) {
  if (!f.startsWith(R)) continue;
  const chave = f.slice(R.length).replace(/\.(ts|tsx)$/, '');
  const dest = MAPA[chave];
  if (dest) novoCaminho.set(f, `${R}${dest}${f.endsWith('.tsx') ? '.tsx' : '.ts'}`);
}
const finalDe = (f) => novoCaminho.get(f) ?? f;

// 2) reescreve imports
const RE = /(\bfrom\s+|\bimport\s*\(\s*|^\s*import\s+)(['"])([^'"]+)\2/gm;
let alterados = 0;
const conteudos = new Map();
for (const f of arquivos) {
  const original = readFileSync(f, 'utf8');
  const novo = original.replace(RE, (m, pre, asp, spec) => {
    let absoluto = null;
    if (spec.startsWith('.')) absoluto = resolve(dirname(f), spec).replaceAll('\\', '/').replace(/^.*?\/(src\/)/, 'src/');
    else { const d = desalias(spec); if (d) absoluto = d; }
    if (!absoluto) return m;
    const arq = resolverArquivo(absoluto);
    if (!arq) return m; // json, css, pacote externo
    const destino = finalDe(arq);
    // importar um diretório (index) mantém a forma curta
    const usaIndex = /\/index\.(ts|tsx)$/.test(arq) && !/index['"]?$/.test(spec);
    let novoSpec = alias(usaIndex ? dirname(destino) : semExt(destino));
    if (novoSpec === spec) return m;
    return `${pre}${asp}${novoSpec}${asp}`;
  });
  if (novo !== original) alterados++;
  conteudos.set(f, novo);
}
console.log(`arquivos a mover: ${novoCaminho.size}  | arquivos com imports reescritos: ${alterados}`);
if (!executar) { for (const [a, b] of novoCaminho) console.log(`  ${a.replace(R, '')} -> ${b.replace(R, '')}`); process.exit(0); }

// 3) grava tudo e move
for (const [f, c] of conteudos) writeFileSync(f, c);
for (const [de, para] of novoCaminho) { mkdirSync(dirname(para), { recursive: true }); renameSync(de, para); }
console.log('feito');
void relative;
