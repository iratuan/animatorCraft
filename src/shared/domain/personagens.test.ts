import { describe, expect, it } from 'vitest';
import { ATORES, ORDEM_ATORES, atoresPersonalizados, registrarAtor, removerAtor } from './characters';
import { sequenciasPara, roteiroDaSequencia } from './sequencias';
import { parseRoteiro } from './script/parser';

describe('personagens criados pelo usuário', () => {
  it('registra, aparece no roteiro e pode ser removido', () => {
    const r = registrarAtor({ nome: 'Tia Marta', apelidos: ['tia'], altura: 480, dancaPadrao: 'danca_hippie' });
    expect(r).toEqual({ id: 'tia-marta' });
    expect(ORDEM_ATORES).toContain('tia-marta');
    const p = parseRoteiro('Tia Marta entra pela esquerda andando. Marta diz "Oi!". Tia dança.');
    expect(p.avisos).toEqual([]);
    expect(p.cenas[0]!.acoes.map((a) => 'ator' in a && a.ator)).toEqual(['tia-marta', 'tia-marta', 'tia-marta']);
    expect(p.cenas[0]!.acoes[2]).toMatchObject({ tipo: 'pose', pose: 'danca_hippie' });
    expect(atoresPersonalizados().map((a) => a.id)).toContain('tia-marta');
    expect(removerAtor('tia-marta')).toBe(true);
    expect(ATORES['tia-marta']).toBeUndefined();
  });

  it('as sequências da biblioteca funcionam para o personagem novo', () => {
    registrarAtor({ nome: 'Zeca' });
    for (const s of sequenciasPara('zeca')) expect(parseRoteiro(roteiroDaSequencia(s, 'zeca')).avisos, s.id).toEqual([]);
    removerAtor('zeca');
  });

  it('recusa nome repetido, palavra do roteiro e apelido de outro personagem; não apaga os originais', () => {
    expect('erro' in registrarAtor({ nome: 'Erika' })).toBe(true);
    expect('erro' in registrarAtor({ nome: 'Aluno' })).toBe(true);
    expect('erro' in registrarAtor({ nome: 'Beto', apelidos: ['dario'] })).toBe(true);
    expect(removerAtor('erika')).toBe(false);
    expect(ATORES.erika).toBeDefined();
  });

  it('o professor/aluno continuam sendo papéis, não nomes', () => {
    registrarAtor({ nome: 'Professora Lia' });
    expect(ATORES['professora-lia']!.apelidos).not.toContain('professora');
    removerAtor('professora-lia');
  });
});
