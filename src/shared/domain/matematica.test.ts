import { describe, it, expect } from 'vitest';
import {
  encontrarRaizes,
  calcularIntegral,
  lerGrafico,
  parseRoteiro,
  CATALOGO_LATEX,
  SIMBOLOS_PALETA,
  compilarFuncao,
  latexParaTexto,
} from './index';

describe('Matemática avançada na lousa', () => {
  it('encontra raízes de funções polinomiais e trigonométricas com precisão', () => {
    // Parábola x^2 - 4 tem raízes em -2 e 2
    const raizesParabola = encontrarRaizes('x^2 - 4', -4, 4);
    expect(raizesParabola.length).toBe(2);
    expect(raizesParabola[0]).toBeCloseTo(-2, 1);
    expect(raizesParabola[1]).toBeCloseTo(2, 1);

    // Seno de x em [0, 4] tem raiz em 0 e pi (~3.1416)
    const raizesSeno = encontrarRaizes('sin(x)', 0.1, 4);
    expect(raizesSeno.length).toBeGreaterThanOrEqual(1);
    expect(raizesSeno[0]).toBeCloseTo(Math.PI, 1);
  });

  it('calcula integral numérica com a regra de Simpson', () => {
    // Integral de x de 0 a 2 é [x^2 / 2]_0^2 = 2
    const intReta = calcularIntegral('x', 0, 2);
    expect(intReta).toBeCloseTo(2, 2);

    // Integral de x^2 de 0 a 3 é [x^3 / 3]_0^3 = 9
    const intParabola = calcularIntegral('x^2', 0, 3);
    expect(intParabola).toBeCloseTo(9, 2);

    // Integral de sin(x) de 0 a pi é [-cos(x)]_0^pi = 1 - (-1) = 2
    const intSeno = calcularIntegral('sin(x)', 0, Math.PI);
    expect(intSeno).toBeCloseTo(2, 1);
  });

  it('compila funções trigonométricas hiperbólicas e especiais', () => {
    const fSinh = compilarFuncao('sinh(x)');
    expect(fSinh(0)).toBe(0);

    const fExp = compilarFuncao('exp(-x^2)');
    expect(fExp(0)).toBe(1);

    const fSign = compilarFuncao('sign(x)');
    expect(fSign(-5)).toBe(-1);
    expect(fSign(5)).toBe(1);
  });

  it('interpreta frase DSL de gráfico com opções de raízes, área e grade', () => {
    const res = lerGrafico('Professor desenha o gráfico de y = x^2 - 4 de -3 a 3 com raízes com grade no quadro.');
    expect(res).not.toBeNull();
    expect('grafico' in res!).toBe(true);
    if (res && 'grafico' in res) {
      expect(res.grafico.tipo).toBe('funcao');
      if (res.grafico.tipo === 'funcao') {
        expect(res.grafico.expr).toBe('x^2 - 4');
        expect(res.grafico.xmin).toBe(-3);
        expect(res.grafico.xmax).toBe(3);
        expect(res.grafico.raizes).toBe(true);
        expect(res.grafico.grade).toBe(true);
      }
    }

    const resArea = lerGrafico('Professor desenha gráfico de f(x) = sin(x) de 0 a 6 integral de 0 a 3.14 no quadro');
    expect(resArea).not.toBeNull();
    if (resArea && 'grafico' in resArea && resArea.grafico.tipo === 'funcao') {
      expect(resArea.grafico.areaIntegral).toEqual({ a: 0, b: 3.14 });
    }
  });

  it('interpreta escrita de fórmula LaTeX pelo roteiro', () => {
    const roteiro = `
Erika entra pela esquerda.
Erika escreve fórmula "\\int_{0}^{1} x^2 dx" no quadro.
Dario escreve $E = mc^2$ no quadro.
Dario escreve $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$ no quadro.
`;
    const parsed = parseRoteiro(roteiro);
    expect(parsed.avisos).toHaveLength(0);
    const acoes = parsed.cenas[0]!.acoes;

    const escrita1 = acoes.find((a) => a.tipo === 'escrever' && a.ator === 'erika');
    expect(escrita1).toBeDefined();
    if (escrita1 && escrita1.tipo === 'escrever') {
      expect(escrita1.conteudo.tipo).toBe('latex');
      if (escrita1.conteudo.tipo === 'latex') {
        expect(escrita1.conteudo.latex).toBe('\\int_{0}^{1} x^2 dx');
      }
    }

    const escritasDario = acoes.filter((a) => a.tipo === 'escrever' && a.ator === 'dario');
    expect(escritasDario.length).toBe(2);
    if (escritasDario[0]?.tipo === 'escrever') {
      expect(escritasDario[0].conteudo.tipo).toBe('latex');
    }
    if (escritasDario[1]?.tipo === 'escrever') {
      expect(escritasDario[1].conteudo.tipo).toBe('latex');
    }
  });

  it('fornece catálogo de fórmulas e símbolos estruturado e completo', () => {
    expect(CATALOGO_LATEX.length).toBeGreaterThanOrEqual(4);
    const calculo = CATALOGO_LATEX.find((c) => c.id === 'calculo');
    expect(calculo).toBeDefined();
    expect(calculo!.itens.some((it) => it.latex.includes('\\int'))).toBe(true);

    expect(SIMBOLOS_PALETA.length).toBeGreaterThan(15);
    expect(SIMBOLOS_PALETA.some((s) => s.codigo === '\\sqrt{x}')).toBe(true);
    expect(SIMBOLOS_PALETA.some((s) => s.codigo === '\\pi')).toBe(true);
  });

  it('converte formulas LaTeX complexas com alta fidelidade sem virgulas espurias', () => {
    // Integral Gaussiana com espacamento \, e limite infinito
    const g = latexParaTexto('\\int_{0}^{\\infty} e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}');
    expect(g).toContain('∫');
    expect(g).not.toContain('int');
    expect(g).not.toContain(','); // \, nao pode virar virgula!
    expect(g).toContain('dx');
    expect(g).toContain('√(π)⁄2');

    // Bhaskara com \pm e raiz quadrada
    const b = latexParaTexto('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
    expect(b).toContain('±');
    expect(b).toContain('√(b² - 4ac)');
    expect(b).toContain('⁄2a');

    // Reconhece formula na escrita mesmo sem a palavra "formula"
    const parsed = parseRoteiro('CringeFather escreve "\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}" na lousa.');
    const escrita = parsed.cenas[0]!.acoes[0]!;
    expect(escrita.tipo).toBe('escrever');
    if (escrita.tipo === 'escrever') {
      expect(escrita.conteudo.tipo).toBe('latex');
    }
  });
});
