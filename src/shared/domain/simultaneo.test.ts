import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';

describe('ações simultâneas ("junto")', () => {
  it('"A e B dançam juntos" gera uma ação por ator, todas começando juntas', () => {
    const r = parseRoteiro('Professor e Aluno dançam juntos por 3 segundos.');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes).toEqual([
      { tipo: 'pose', ator: 'cringefather', pose: 'danca_funky', duracao: 3 },
      { tipo: 'pose', ator: 'betason', pose: 'danca_atual', duracao: 3, junto: true },
    ]);
    const tl = construirTimeline(r);
    expect(tl.eventos.map((e) => e.inicio)).toEqual([0, 0]);
    expect(tl.duracao).toBe(3);
  });

  it('"Todos" usa quem já entrou em cena e respeita quem saiu', () => {
    const r = parseRoteiro('Professor entra pela esquerda andando. Aluno entra pela direita andando. Mãe entra pela esquerda andando. Mãe sai pela esquerda. Todos dançam por 2 segundos.');
    const dancas = r.cenas[0]!.acoes.filter((a) => a.tipo === 'pose');
    expect(dancas.map((a) => 'ator' in a && a.ator)).toEqual(['cringefather', 'betason']);
    expect(dancas[1]).toMatchObject({ junto: true });
  });

  it('entram juntos e continuam a sequência só depois do mais longo', () => {
    const r = parseRoteiro('Professor e Caçula entram juntos pela esquerda. Aluno entra pela direita andando.');
    const tl = construirTimeline(r);
    expect(tl.eventos[0]!.inicio).toBe(tl.eventos[1]!.inicio);
    expect(tl.eventos[2]!.inicio).toBeCloseTo(Math.max(tl.eventos[0]!.fim, tl.eventos[1]!.fim));
    const s = estadoEm(tl, 0.9);
    expect(s.atores.cringefather.visivel && s.atores.dario.visivel).toBe(true);
    const fim = estadoEm(tl, 1.7);
    expect(Math.abs(fim.atores.cringefather.x - fim.atores.dario.x)).toBeGreaterThan(0.05);
  });

  it('plurais irregulares', () => {
    const r = parseRoteiro('Aluno e Priminha riem juntos. Aluno e Mãe saem juntos pela direita.');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes.map((a) => a.tipo)).toEqual(['pose', 'pose', 'sair', 'sair']);
  });
});
