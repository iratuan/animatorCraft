import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { gerarConfigsPadraoTodosPersonagens, serializarPersonagemJSON } from '../src/shared/domain/personagem-config';
import { ATORES } from '../src/shared/domain/characters';
import { CLIPES_PADRAO_PERSONAGEM } from '../src/shared/domain/clipes';

const pastaDestino = join(process.cwd(), 'personagens');
mkdirSync(pastaDestino, { recursive: true });

const configs = gerarConfigsPadraoTodosPersonagens();
let gerados = 0;

for (const [id, config] of Object.entries(configs)) {
  const spec = ATORES[id];
  if (!spec) continue;
  const clipes = CLIPES_PADRAO_PERSONAGEM.filter((c) => c.ator === id);
  const caminho = join(pastaDestino, `${id}.json`);
  const conteudo = serializarPersonagemJSON(spec, clipes, 2);
  writeFileSync(caminho, conteudo, 'utf8');
  console.log(`[OK] Gerado: personagens/${id}.json (${clipes.length} clipes)`);
  gerados++;
}

console.log(`\nConcluído com sucesso! ${gerados} personagens exportados para a pasta 'personagens/'.`);
