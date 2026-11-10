// Folha de revisão feita com o MESMO gerador que o app usa (src/shared/domain/personagem-svg/fabrica.ts).
// Uso: npx vite-node tools/auditoria/folha-gerador.ts <saida.html>
import { writeFileSync } from 'node:fs';
import { ATORES, ORDEM_ATORES, gerarSvgCabeca, gerarSvgCompleto, type ActorId } from '../../src/shared/domain';

const saida = process.argv[2] ?? 'folha-gerador.html';
const POSES = ['parado', 'pular', 'rindo'] as const;

const linhas = ORDEM_ATORES.map((id: ActorId) => {
  const a = ATORES[id]!;
  const expressao = a.expressaoPadrao;
  const celulas = POSES.map((pose) => `<td><div class="corpo">${gerarSvgCompleto(id, { pose, expressao })}</div><small>${pose}</small></td>`).join('');
  return `<tr><th>${a.nome}<small>${a.idade} · ${expressao}</small></th>${celulas}<td><div class="cabeca">${gerarSvgCabeca(id, { expressao })}</div><small>cabeça (${expressao})</small></td></tr>`;
});

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Revisão dos personagens (gerador do app)</title>
<style>
body{margin:0;padding:14px;background:#fff;font:12px system-ui,sans-serif;color:#14161a}
h1{font-size:15px;margin:0 0 10px}
table{border-collapse:collapse}
td,th{border:1px solid #ddd;padding:4px;vertical-align:bottom;text-align:center}
th{text-align:left;min-width:150px}
th small{display:block;color:#666;font-weight:400}
.corpo{width:170px;height:220px}.cabeca{width:110px;height:110px}
.corpo svg,.cabeca svg{width:100%;height:100%}
td small{color:#666}
</style></head><body>
<h1>Personagens gerados pelo app (fabrica.ts): poses parado, pular, rindo e cabeça na expressão padrão</h1>
<table><thead><tr><th>Personagem</th>${POSES.map((p) => `<th>${p}</th>`).join('')}<th>cabeça</th></tr></thead>
<tbody>${linhas.join('\n')}</tbody></table>
</body></html>`;
writeFileSync(saida, html, 'utf8');
console.log(`folha com ${ORDEM_ATORES.length} personagens em ${saida}`);
