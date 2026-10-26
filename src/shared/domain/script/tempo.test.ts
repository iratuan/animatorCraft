import { describe, expect, it } from 'vitest';
import { construirTimeline } from '../timeline';
import { parseRoteiro } from './parser';

const eventosDe = (texto: string) => construirTimeline(parseRoteiro(texto)).eventos;

describe('temporização no roteiro: "às N s" e "por N segundos"', () => {
  it('"às 3 s" faz a ação começar em 3 segundos, sem esperar a anterior', () => {
    const ev = eventosDe('# T\nProfessor entra pela esquerda andando.\nAluno acena às 3 s.\n');
    const acena = ev.find((e) => e.acao.tipo === 'pose' && e.acao.ator === 'betason' && e.acao.pose === 'acenar')
      ?? ev.find((e) => e.rotulo.toLowerCase().includes('acena'));
    expect(acena).toBeDefined();
    expect(acena!.inicio).toBeCloseTo(3, 6);
  });

  it('"por 4 segundos" numa fala dá a duração da fala', () => {
    const ev = eventosDe('# T\nProfessor diz "Olá, turma!" por 4 segundos.\n');
    const fala = ev.find((e) => e.acao.tipo === 'fala');
    expect(fala).toBeDefined();
    expect(fala!.fim - fala!.inicio).toBeCloseTo(4, 6);
  });

  it('"às" dentro de uma fala entre aspas não é lido como horário', () => {
    const ev = eventosDe('# T\nProfessor diz "Vamos às 5 s de aula" .\n');
    const fala = ev.find((e) => e.acao.tipo === 'fala');
    expect(fala).toBeDefined();
    expect(fala!.inicio).toBe(0);
    expect(fala!.acao.tipo === 'fala' && fala!.acao.texto).toContain('às 5 s');
  });

  it('depois de um início fixo, a ação seguinte continua a partir do fim dela', () => {
    const ev = eventosDe('# T\nProfessor entra pela esquerda andando às 2 s.\nAluno entra pela direita andando.\n');
    const primeiro = ev[0]!;
    const segundo = ev[1]!;
    expect(primeiro.inicio).toBeCloseTo(2, 6);
    expect(segundo.inicio).toBeCloseTo(primeiro.fim, 6);
  });
});
