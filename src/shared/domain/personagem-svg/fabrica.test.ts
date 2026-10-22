import { describe, expect, it } from 'vitest';
import { ORDEM_ATORES } from '../characters';
import { EXPRESSOES } from '../poses';
import { gerarSvgCabeca, gerarSvgCompleto, obterMoldePersonagem } from './fabrica';
import { CATALOGO_MOLDES_SVG } from './catalogo';
import { EXPRESSOES_VETORIAIS, VISEMAS_SVG } from './componentes/expressoes';

describe('fábrica de personagens SVG', () => {
  it('todos os 12 personagens canônicos têm moldes completos cadastrados', () => {
    for (const id of ORDEM_ATORES) {
      const molde = CATALOGO_MOLDES_SVG[id];
      expect(molde, `molde de ${id}`).toBeDefined();
      expect(molde.proporcoes.alturaPadrao).toBeGreaterThan(150);
      expect(molde.cabeca.silhueta).toBeDefined();
      expect(molde.olhos).toBeDefined();
      expect(molde.boca).toBeDefined();
    }
  });

  it('gera SVG da cabeça válido e autocontido para todos os 12 personagens', () => {
    for (const id of ORDEM_ATORES) {
      const svg = gerarSvgCabeca(id);
      expect(svg).toContain('<svg');
      expect(svg).toContain('viewBox=');
      expect(svg).toContain(`id="${id}-cabeca"`);
      expect(svg).toContain('</svg>');
    }
  });

  it('todas as 10 expressões canônicas geram sobrancelhas e bocas correspondentes', () => {
    for (const exp of EXPRESSOES) {
      const geom = EXPRESSOES_VETORIAIS[exp];
      expect(geom, `expressão ${exp}`).toBeDefined();
      expect(geom.sobrancelhaEsq).toContain('M');
      expect(geom.sobrancelhaDir).toContain('M');
      expect(geom.boca).toContain('M');

      const svg = gerarSvgCabeca('cringefather', { expressao: exp });
      expect(svg).toContain('stroke=');
    }
  });

  it('gera visemas de sincronia labial para fala', () => {
    for (const v of ['m', 'o', 'a', 'e']) {
      expect(VISEMAS_SVG[v]).toBeDefined();
      const svg = gerarSvgCabeca('betason', { visema: v });
      expect(svg).toContain('path d="');
    }
  });

  it('gera SVG de corpo inteiro para os personagens com movimentos e poses', () => {
    for (const id of ['cringefather', 'betason', 'erika', 'paraiba', 'mingau'] as const) {
      const svg = gerarSvgCompleto(id, { pose: 'andar' });
      expect(svg).toContain(`<g id="${id}-corpo-inteiro">`);
      expect(svg).toContain(`<g id="${id}-cabeca"`);
      expect(svg).toContain('</svg>');
    }

    // Testa geração com poses diversas
    for (const pose of ['apontar', 'correr', 'acenar', 'danca_atual', 'bracos_cruzados'] as const) {
      const svg = gerarSvgCompleto('cringefather', { pose, expressao: 'feliz' });
      expect(svg).toContain('<svg');
      expect(svg).toContain('cringefather-corpo-inteiro');
    }
  });

  it('suporta modo piscar e direção do olhar', () => {
    const piscando = gerarSvgCabeca('cringefather', { piscar: true });
    expect(piscando).toContain('<line x1=');

    const olhandoLado = gerarSvgCabeca('betason', { olharDirecao: { x: 1, y: 0 } });
    expect(olhandoLado).toContain('<ellipse');
  });

  it('personagens desconhecidos geram molde padrão sem quebrar', () => {
    const moldeCustom = obterMoldePersonagem('meu-personagem-novo');
    expect(moldeCustom).toBeDefined();
    expect(moldeCustom.cabeca).toBeDefined();

    const svg = gerarSvgCabeca('meu-personagem-novo');
    expect(svg).toContain('id="meu-personagem-novo-cabeca"');
  });
});
