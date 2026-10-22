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

  it('elenco oficial inclui Véia, Véio, Paraíba e Mingau com danças e poses válidas', () => {
    expect(ATORES.veia).toBeDefined();
    expect(ATORES.veio).toBeDefined();
    expect(ATORES.paraiba).toBeDefined();
    expect(ATORES.mingau).toBeDefined();
    expect(ORDEM_ATORES).toContain('veia');
    expect(ORDEM_ATORES).toContain('veio');
    expect(ORDEM_ATORES).toContain('paraiba');
    expect(ORDEM_ATORES).toContain('mingau');

    const roteiro = `Véia entra pela esquerda andando. Véia diz "Onde você pensa que vai, Cringe?". Ao mesmo tempo, Paraíba dança por 2 segundos. Mingau entra pelo centro. Mingau diz "Miau!".`;
    const r = parseRoteiro(roteiro);
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes.some((a) => 'ator' in a && a.ator === 'veia')).toBe(true);
    expect(r.cenas[0]!.acoes.some((a) => 'ator' in a && a.ator === 'paraiba')).toBe(true);
    expect(r.cenas[0]!.acoes.some((a) => 'ator' in a && a.ator === 'mingau')).toBe(true);
  });

  it('Erika é a personagem mais alta de todo o elenco', () => {
    expect(ATORES.erika).toBeDefined();
    for (const [id, ator] of Object.entries(ATORES)) {
      if (id !== 'erika') {
        expect(ATORES.erika.altura, `Erika (${ATORES.erika.altura}px) deve ser maior que ${ator.nome} (${ator.altura}px)`).toBeGreaterThan(ator.altura);
      }
    }
  });
});
