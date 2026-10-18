import { describe, expect, it } from 'vitest';
import { amostrarFuncao, compilarFuncao, lerGrafico } from './grafico';
import { parseRoteiro } from './script/parser';
import { construirTimeline } from './timeline';

describe('gráficos', () => {
  it('avalia expressões com precedência, potência, multiplicação implícita e funções', () => {
    expect(compilarFuncao('x^2 - 3x + 1')(2)).toBe(-1);
    expect(compilarFuncao('2x^2')(3)).toBe(18);
    expect(compilarFuncao('-x^2')(3)).toBe(-9);
    expect(compilarFuncao('2^x')(3)).toBe(8);
    expect(compilarFuncao('sen(x)')(Math.PI / 2)).toBeCloseTo(1);
    expect(compilarFuncao('raiz(x)+1')(9)).toBe(4);
    expect(compilarFuncao('y = (x+1)(x-1)')(3)).toBe(8);
    expect(compilarFuncao('1/x')(4)).toBe(0.25);
    expect(() => compilarFuncao('x +')).toThrow();
    expect(() => compilarFuncao('foo(x)')).toThrow(/não conheço/);
  });

  it('lê a frase do gráfico', () => {
    expect(lerGrafico('Professor desenha o gráfico de y = x^2 no quadro.')).toEqual({ grafico: { tipo: 'funcao', expr: 'x^2', xmin: -5, xmax: 5 } });
    expect(lerGrafico('Professor desenha o gráfico de y = 2x + 1 de -3 a 3 na lousa.')).toEqual({ grafico: { tipo: 'funcao', expr: '2x + 1', xmin: -3, xmax: 3 } });
    expect(lerGrafico('Professor desenha um gráfico de barras: Maçã=5, Banana=8, Uva=3.')).toEqual({ grafico: { tipo: 'barras', dados: [{ rotulo: 'Maçã', valor: 5 }, { rotulo: 'Banana', valor: 8 }, { rotulo: 'Uva', valor: 3 }] } });
    expect('erro' in lerGrafico('Professor desenha o gráfico de y = x +')!).toBe(true);
    expect(lerGrafico('Professor diz oi.')).toBeNull();
  });

  it('1/x deixa um buraco no zero e a faixa vertical não explode', () => {
    const a = amostrarFuncao({ tipo: 'funcao', expr: '1/x', xmin: -5, xmax: 5 });
    expect(a.pontos.some((p) => p === null)).toBe(true);
    expect(a.ymax - a.ymin).toBeLessThan(40);
  });

  it('vira uma ação "escrever" com gráfico e avisa quando a função é inválida', () => {
    const r = parseRoteiro('Professor desenha o gráfico de y = x^2 no quadro. Professor desenha o gráfico de y = x + no quadro.');
    expect(r.cenas[0]!.acoes[0]).toMatchObject({ tipo: 'escrever', conteudo: { tipo: 'grafico' } });
    expect(r.avisos.length).toBe(1);
    expect(construirTimeline(r).eventos[0]!.rotulo).toContain('gráfico de y = x^2');
  });
});
