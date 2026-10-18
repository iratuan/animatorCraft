import { describe, expect, it } from 'vitest';
import { extrairRoteiro, gerarRoteiro, promptGerar, promptSistema, type MensagemIA } from './ia';

describe('roteiro por IA', () => {
  it('o prompt traz as regras e o elenco atual', () => {
    const s = promptSistema();
    expect(s).toContain('Ao mesmo tempo');
    expect(s).toContain('gráfico de barras');
    expect(s).toContain('CringeFather');
    expect(promptGerar({ tema: 'Produtos notáveis', materia: 'Matemática', serie: '8º ano', duracao: 'curta', personagens: ['erika'], professor: 'cringefather', aluno: 'betason' })).toContain('Erika');
  });

  it('extrai o roteiro de cercas de código e conversa', () => {
    expect(extrairRoteiro('Claro! Aqui está:\n```\n[papéis: professor=Erika, aluno=Dario]\n\n# Cena\nErika entra pela esquerda andando.\n```\nEspero que goste')).toBe('[papéis: professor=Erika, aluno=Dario]\n\n# Cena\nErika entra pela esquerda andando.\n');
    expect(extrairRoteiro('Segue o roteiro\n# Cena 1\nProfessor acena.')).toBe('# Cena 1\nProfessor acena.\n');
  });

  it('valida pelo interpretador e pede correção quando há avisos', async () => {
    const chamadas: MensagemIA[][] = [];
    const pedir = async (_s: string, m: MensagemIA[]) => {
      chamadas.push([...m]);
      return m.length === 1 ? '# Cena\nProfessor entra pela esquerda andando.\nProfessor flutua misteriosamente.' : '# Cena\nProfessor entra pela esquerda andando.\nProfessor faz cara de surpresa.';
    };
    const r = await gerarRoteiro(pedir, 'tema qualquer');
    expect(r.rodadas).toBe(2);
    expect(r.avisosFinais).toEqual([]);
    expect(r.roteiro).toContain('cara de surpresa');
    expect(chamadas[1]!.at(-1)!.content).toContain('Ação não entendida');
  });

  it('desiste depois das tentativas e devolve o que sobrou de aviso', async () => {
    const r = await gerarRoteiro(async () => 'Professor sonha.', 'x', 1);
    expect(r.rodadas).toBe(2);
    expect(r.avisosFinais.length).toBeGreaterThan(0);
  });
});

