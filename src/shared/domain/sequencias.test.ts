import { describe, expect, it } from 'vitest';
import { ATORES, ORDEM_ATORES } from './characters';
import { DANCA_PADRAO } from './poses';
import { parseRoteiro } from './script/parser';
import { roteiroDaSequencia, SEQUENCIAS, sequenciasPara } from './sequencias';

describe('sequências padrão', () => {
  it('todas viram ações válidas, sem avisos, para cada ator permitido', () => {
    for (const ator of ORDEM_ATORES) {
      for (const seq of sequenciasPara(ator)) {
        const r = parseRoteiro(roteiroDaSequencia(seq, ator));
        expect(r.avisos, `${seq.id} / ${ator}`).toEqual([]);
        expect(r.cenas[0]!.acoes.length, `${seq.id} / ${ator}`).toBeGreaterThan(1);
      }
    }
  });

  it('respeita o filtro por ator e cada personagem de ficha tem clipes próprios', () => {
    expect(sequenciasPara('betason').some((s) => s.id === 'cringe-funky')).toBe(false);
    expect(sequenciasPara('cringefather').some((s) => s.id === 'cringe-funky')).toBe(true);
    expect(SEQUENCIAS.length).toBeGreaterThan(25);
    for (const a of ORDEM_ATORES.filter((id) => ATORES[id]!.temSprites)) {
      expect(sequenciasPara(a).filter((s) => s.atores?.includes(a)).length, a).toBeGreaterThanOrEqual(3);
    }
  });

  it('dança é temporária e cada ator dança no seu estilo', () => {
    for (const a of ORDEM_ATORES) {
      const acao = parseRoteiro(`${ATORES[a]!.nome} dança por 3 segundos.`).cenas[0]!.acoes[0]!;
      expect(acao, a).toMatchObject({ tipo: 'pose', pose: DANCA_PADRAO[a], duracao: 3 });
    }
    expect(parseRoteiro('Aluno dança.').cenas[0]!.acoes[0]).toMatchObject({ duracao: 4 });
  });
});
