import { describe, expect, it } from 'vitest';
import { ROTEIRO_EXEMPLO } from './exemplo';
import { resumirRoteiro } from './resumo';

describe('resumo do roteiro (tela inicial)', () => {
  it('roteiro em branco é vazio, mesmo com papéis e título de cena', () => {
    expect(resumirRoteiro('')).toMatchObject({ vazio: true, cenas: 0, palavras: 0 });
    const r = resumirRoteiro('[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n');
    expect(r).toMatchObject({ vazio: true, cenas: 1, titulo: 'Cena 1' });
  });
  it('conta cenas, palavras e reconhece o exemplo', () => {
    const r = resumirRoteiro('# Abertura\nProfessor entra pela esquerda andando.\n\n# Fim\nProfessor acena. [nota: nada]\r\n');
    expect(r).toMatchObject({ vazio: false, exemplo: false, cenas: 2, titulo: 'Abertura', palavras: 7 });
    const e = resumirRoteiro(ROTEIRO_EXEMPLO);
    expect(e.exemplo).toBe(true);
    expect(e.cenas).toBe(3);
    expect(resumirRoteiro(`${ROTEIRO_EXEMPLO}\nProfessor acena.`).exemplo).toBe(false);
  });
  it('não quebra com texto estranho', () => {
    expect(() => resumirRoteiro('#\n# \n#x\n\u0000\n[\n')).not.toThrow();
    expect(resumirRoteiro('# Título   \nfala').titulo).toBe('Título');
  });
});
