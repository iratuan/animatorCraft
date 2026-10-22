import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './script/parser';
import { construirTimeline } from './timeline';
import { extrairRelatorioGravacao, gerarRoteiroGravacaoMarkdown } from './roteiro-gravacao';

describe('roteiro de gravacao', () => {
  const roteiro = `
[papéis: professor=CringeFather, aluno=BetaSon]

# Cena 1: Apresentação
Professor diz "Bem-vindos ao episódio inaugural!" feliz.
Aluno diz "Estou pronto para começar." curioso.

# Cena 2: Explicação
Professor diz "Vejamos a fórmula principal na lousa." confiante.
`;

  it('extrai linhas de fala e agrupa por personagem corretamente', () => {
    const parsed = parseRoteiro(roteiro);
    const timeline = construirTimeline(parsed);
    const relatorio = extrairRelatorioGravacao(timeline);

    expect(relatorio.totalFalas).toBe(3);
    expect(relatorio.linhas.length).toBe(3);
    expect(relatorio.linhas[0].atorNome).toBe('CringeFather');
    expect(relatorio.linhas[0].texto).toBe('Bem-vindos ao episódio inaugural!');

    expect(relatorio.porPersonagem['cringefather']).toBeDefined();
    expect(relatorio.porPersonagem['cringefather'].totalFalas).toBe(2);
    expect(relatorio.porPersonagem['betason'].totalFalas).toBe(1);
    expect(relatorio.tempoTotalFalas).toBeGreaterThan(0);
  });

  it('gera markdown estruturado com resumo, ordem cronológica e por personagem', () => {
    const parsed = parseRoteiro(roteiro);
    const timeline = construirTimeline(parsed);
    const md = gerarRoteiroGravacaoMarkdown(timeline, 'Episódio Piloto');

    expect(md).toContain('# Roteiro de Gravação de Voz — Episódio Piloto');
    expect(md).toContain('**Total de Falas:** 3');
    expect(md).toContain('## Resumo por Personagem');
    expect(md).toContain('## Guia de Gravação (Cronológico por Cena)');
    expect(md).toContain('## Falas Agrupadas por Personagem (Para Sessão Individual)');
    expect(md).toContain('🎙️ CringeFather');
    expect(md).toContain('🎙️ BetaSon');
    expect(md).toContain('"Bem-vindos ao episódio inaugural!"');
  });
});
