// Gera uma página com o corpo inteiro (pose parado) e a cabeça de cada personagem, lado a lado, para revisar a identidade visual.
// Uso: node tools/auditoria/folha-personagens.mjs <saida.html>
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const saida = process.argv[2];
const raiz = 'assets/svg/characters';
const personagens = readdirSync(raiz).sort();
const celulas = personagens.map((id) => {
  const corpo = join(raiz, id, 'base', 'corpo_inteiro.svg');
  const cabeca = join(raiz, id, 'base', 'cabeca.svg');
  const ler = (f) => (existsSync(f) ? readFileSync(f, 'utf8').replace(/<\?xml[^>]*>/, '') : '<svg></svg>');
  return `<figure><div class="corpo">${ler(corpo)}</div><div class="cabeca">${ler(cabeca)}</div><figcaption>${id}</figcaption></figure>`;
});
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Folha de personagens</title>
<style>
body{margin:0;padding:16px;background:#fff;font:13px system-ui,sans-serif;color:#14161a}
h1{font-size:16px;margin:0 0 12px}
.grade{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
figure{margin:0;border:1px solid #d8d8d8;border-radius:6px;padding:6px;text-align:center}
.corpo{height:250px}.corpo svg{width:100%;height:100%}
.cabeca{height:90px;margin-top:4px}.cabeca svg{width:100%;height:100%}
figcaption{margin-top:4px;font-weight:600}
</style></head><body>
<h1>Personagens: corpo inteiro (parado) e cabeça</h1>
<div class="grade">${celulas.join('\n')}</div>
</body></html>`;
writeFileSync(saida, html, 'utf8');
console.log(`folha com ${personagens.length} personagens em ${saida}`);
