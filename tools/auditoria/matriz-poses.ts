// Matriz de revisão: todas as poses (linhas) para todos os personagens (colunas), com o gerador do app.
// Uso: npx vite-node tools/auditoria/matriz-poses.ts <saida.html>
import { writeFileSync } from 'node:fs';
import { ATORES, ORDEM_ATORES, POSES, gerarSvgCompleto, type ActorId } from '../../src/shared/domain';

const saida = process.argv[2] ?? 'matriz-poses.html';
const cabecalho = ORDEM_ATORES.map((id: ActorId) => `<th>${ATORES[id]!.nome}</th>`).join('');
const linhas = POSES.map((pose) => {
  const celulas = ORDEM_ATORES.map((id: ActorId) => {
    const expressao = ATORES[id]!.expressaoPadrao;
    return `<td><div class="c">${gerarSvgCompleto(id, { pose, expressao })}</div></td>`;
  }).join('');
  return `<tr><th class="p">${pose}</th>${celulas}</tr>`;
});

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Matriz de poses</title>
<style>
body{margin:0;padding:10px;background:#fff;font:11px system-ui,sans-serif;color:#14161a}
table{border-collapse:collapse}
td,th{border:1px solid #e3e3e3;padding:2px;text-align:center}
th{font-weight:600;background:#f5f5f5}
th.p{text-align:left;min-width:120px}
.c{width:88px;height:116px}.c svg{width:100%;height:100%}
</style></head><body>
<table><thead><tr><th class="p">pose</th>${cabecalho}</tr></thead><tbody>
${linhas.join('\n')}
</tbody></table></body></html>`;
writeFileSync(saida, html, 'utf8');
console.log(`matriz ${POSES.length} poses x ${ORDEM_ATORES.length} personagens em ${saida}`);
