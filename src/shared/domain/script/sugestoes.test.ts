import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './parser';
import { candidatosDoAtor, diagnosticoDe, distancia, separarFrase, sugerirParecidos, sugestoesDeFrase } from './sugestoes';

describe('distancia', () => {
  it('conta trocas de letra e ignora acento e caixa', () => {
    expect(distancia('pulla', 'pula')).toBe(1);
    expect(distancia('Véia', 'veia')).toBe(0);
    expect(distancia('dança', 'danca')).toBe(0);
  });
});

describe('sugerirParecidos', () => {
  it('devolve o mais parecido e descarta o que está longe', () => {
    expect(sugerirParecidos('pulla', ['pula', 'dança', 'acena'])).toEqual(['pula']);
    expect(sugerirParecidos('xyzabc', ['pula', 'acena'])).toEqual([]);
    expect(sugerirParecidos('', ['pula'])).toEqual([]);
  });
});

describe('separarFrase', () => {
  it('separa sujeito, predicado e pontuação final', () => {
    expect(separarFrase('Professor e Aluno dançam juntos.')).toEqual({ sujeito: 'Professor e Aluno', predicado: 'dançam juntos', final: '.' });
    expect(separarFrase('Professor pulla.')).toEqual({ sujeito: 'Professor', predicado: 'pulla', final: '.' });
  });

  it('frase sem sujeito reconhecido fica toda no predicado', () => {
    expect(separarFrase('Xurumela pula.')).toEqual({ sujeito: '', predicado: 'Xurumela pula', final: '.' });
  });
});

describe('sugestoesDeFrase', () => {
  it('sugere a ação parecida mantendo o sujeito e a pontuação', () => {
    expect(sugestoesDeFrase('Professor pulla.', 'predicado')).toContain('Professor pula.');
  });

  it('sugere o nome parecido quando o personagem não foi reconhecido', () => {
    expect(sugestoesDeFrase('Erik fala "oi".', 'sujeito')).toContain('Erika fala "oi".');
  });

  it('expressão inexistente é corrigida com as expressões do personagem', () => {
    const candidatos = candidatosDoAtor('Erika faz cara de felis.');
    expect(sugestoesDeFrase('Erika faz cara de felis.', 'predicado', candidatos)).toContain('Erika faz cara de feliz.');
  });

  it('sem nada parecido, não há sugestão', () => {
    expect(sugestoesDeFrase('Professor qwertyuiop.', 'predicado')).toEqual([]);
  });
});

describe('diagnósticos do parser', () => {
  it('marca a frase incoerente com a posição dela e sugere a correção', () => {
    const texto = 'Professor acena.\nProfessor pulla.\nAluno dança.';
    const r = parseRoteiro(texto);
    expect(r.diagnosticos).toHaveLength(1);
    const d = r.diagnosticos[0]!;
    expect(texto.slice(d.ini, d.fim)).toBe('Professor pulla.');
    expect(d.gravidade).toBe('erro');
    expect(d.sugestoes).toContain('Professor pula.');
  });

  it('personagem não reconhecido gera sugestão de nome', () => {
    const texto = 'Erik fala "oi".';
    const r = parseRoteiro(texto);
    expect(r.diagnosticos[0]).toMatchObject({ gravidade: 'erro', ini: 0, fim: texto.length });
    expect(r.diagnosticos[0]!.sugestoes).toContain('Erika fala "oi".');
  });

  it('frase correta não gera diagnóstico', () => {
    expect(parseRoteiro('Professor acena. Aluno dança.').diagnosticos).toEqual([]);
  });

  it('mensagem que não é de erro vira aviso', () => {
    expect(diagnosticoDe('algo a conferir', 'Professor acena.', 0, 16).gravidade).toBe('aviso');
  });
});

describe('candidatosDoAtor', () => {
  it('só traz as expressões do personagem citado', () => {
    const lista = candidatosDoAtor('Erika faz cara de xx.');
    expect(lista).toContain('faz cara de feliz');
    expect(lista.every((c) => c.startsWith('faz '))).toBe(true);
  });

  it('frase sem personagem não tem candidatos', () => {
    expect(candidatosDoAtor('pula muito alto.')).toEqual([]);
  });
});
