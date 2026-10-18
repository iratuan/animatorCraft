import { describe, expect, it } from 'vitest';
import { latexParaTexto } from './latex';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';

const tl = construirTimeline(
  parseRoteiro(`# A
Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Olá turma, vamos começar". [close na lousa] Professor escreve $x^2$ no quadro. [plano aberto] Aluno tem uma ideia.
# B
Aluno sai pela direita.`),
);

describe('timeline', () => {
  it('encadeia eventos em sequência e insere limpeza entre cenas', () => {
    for (let i = 1; i < tl.eventos.length; i++) expect(tl.eventos[i]!.inicio).toBeCloseTo(tl.eventos[i - 1]!.fim);
    expect(tl.cenas).toHaveLength(2);
    expect(tl.eventos.some((e) => e.acao.tipo === 'apagar')).toBe(true);
  });

  it('move o ator durante a entrada e o deixa parado no destino', () => {
    const meio = estadoEm(tl, 0.8);
    expect(meio.atores.cringefather.visivel).toBe(true);
    expect(meio.atores.cringefather.pose).toBe('andar');
    expect(meio.atores.cringefather.x).toBeGreaterThan(-0.12);
    const depois = estadoEm(tl, 1.7);
    expect(depois.atores.cringefather.pose).toBe('parado');
    expect(depois.atores.cringefather.x).toBeCloseTo(0.13);
    expect(estadoEm(tl, 1.0).atores.betason.visivel).toBe(false);
    expect(depois.atores.betason.x).toBeGreaterThan(0.87);
  });

  it('revela fala por palavras e expõe o progresso para a sincronia labial', () => {
    const fala = tl.eventos.find((e) => e.acao.tipo === 'fala')!;
    const s = estadoEm(tl, fala.inicio + 0.1);
    expect(s.atores.cringefather.fala?.texto.split(' ').length).toBeLessThan(5);
    expect(s.atores.cringefather.fala?.completo).toBe('Olá turma, vamos começar');
    expect(s.atores.cringefather.fala?.progresso).toBeGreaterThan(0);
  });

  it('escreve no quadro com a mão', () => {
    const esc = tl.eventos.find((e) => e.acao.tipo === 'escrever')!;
    const m = estadoEm(tl, (esc.inicio + esc.fim) / 2);
    expect(m.mao?.progresso).toBeCloseTo(0.5);
    expect(m.quadro).toHaveLength(1);
  });

  it('transiciona a câmera para a lousa e de volta ao plano aberto', () => {
    const cam = tl.eventos.find((e) => e.acao.tipo === 'camera')!;
    expect(estadoEm(tl, cam.inicio - 0.1).camera.atual.alvo).toBe('aberto');
    const meio = estadoEm(tl, (cam.inicio + cam.fim) / 2).camera;
    expect(meio.atual.alvo).toBe('lousa');
    expect(meio.progresso).toBeCloseTo(0.5);
    expect(estadoEm(tl, cam.fim + 0.1).camera.progresso).toBe(1);
    const volta = tl.eventos.filter((e) => e.acao.tipo === 'camera')[1]!;
    const s = estadoEm(tl, volta.fim + 0.01).camera;
    expect(s.atual.alvo).toBe('aberto');
    expect(s.anterior.alvo).toBe('lousa');
  });

  it('limpa o quadro na troca de cena', () => {
    const fim = estadoEm(tl, tl.duracao);
    expect(fim.quadro).toHaveLength(0);
  });
});

describe('latexParaTexto', () => {
  it('converte potências, frações e símbolos', () => {
    expect(latexParaTexto('(a+b)^2 = a^2 + 2ab + b^2')).toBe('(a+b)² = a² + 2ab + b²');
    expect(latexParaTexto('\\frac{1}{2}')).toBe('1⁄2');
    expect(latexParaTexto('\\sqrt{x}\\cdot\\pi')).toBe('√(x)·π');
    expect(latexParaTexto('x_1^{n+1}')).toBe('x₁ⁿ⁺¹');
  });
});
