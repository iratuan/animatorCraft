import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './script/parser';
import { construirTimeline } from './timeline';
import { detectarConflitosTimeline } from './conflitos';

describe('detecção de conflitos na timeline', () => {
  it('detecta sobreposição de vozes/falas entre personagens', () => {
    const roteiro = `
Ao mesmo tempo: Professor diz "Eu falo a frase um". Aluno diz "Eu falo a frase dois".
`;
    const parsed = parseRoteiro(roteiro);
    const timeline = construirTimeline(parsed);
    const conflitos = detectarConflitosTimeline(timeline);

    const conflitoVoz = conflitos.find((c) => c.id.startsWith('fala-sobreposta'));
    expect(conflitoVoz).toBeDefined();
    expect(conflitoVoz?.severidade).toBe('aviso');
    expect(conflitoVoz?.mensagem).toContain('Sobreposição de vozes');
  });

  it('não reporta conflito para ações sequenciais normais', () => {
    const roteiro = `
Professor entra pela esquerda andando. Professor diz "Olá". Aluno entra pela direita andando.
`;
    const parsed = parseRoteiro(roteiro);
    const timeline = construirTimeline(parsed);
    const conflitos = detectarConflitosTimeline(timeline);

    expect(conflitos).toHaveLength(0);
  });
});
