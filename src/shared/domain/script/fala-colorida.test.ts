import { describe, expect, it } from 'vitest';
import {
  CORES_FALA,
  FUNDOS_FALA,
  parsearPalavrasFala,
  quebrarLinhasFala,
  removerMarcasFala,
  resolverEstiloFala,
} from './fala-colorida';

describe('fala-colorida', () => {
  describe('removerMarcasFala', () => {
    it('retorna o texto idêntico quando não há tags', () => {
      expect(removerMarcasFala('Olá turma, bem-vindos à aula!')).toBe('Olá turma, bem-vindos à aula!');
      expect(removerMarcasFala('')).toBe('');
    });

    it('remove tags de cores semânticas preservando o texto', () => {
      const entrada = 'Isolamos o [azul:x] e somamos ao [laranja:2y].';
      expect(removerMarcasFala(entrada)).toBe('Isolamos o x e somamos ao 2y.');
    });

    it('remove tags de fundo e destaques de múltiplas palavras', () => {
      const entrada = 'Atenção para a [marca:fórmula de Bhaskara] no quadro.';
      expect(removerMarcasFala(entrada)).toBe('Atenção para a fórmula de Bhaskara no quadro.');
    });

    it('remove tags hexadecimais', () => {
      const entrada = 'O valor [#3b82f6:final] é [#10b981:positivo].';
      expect(removerMarcasFala(entrada)).toBe('O valor final é positivo.');
    });
  });

  describe('resolverEstiloFala', () => {
    it('resolve cores semânticas em português e inglês', () => {
      expect(resolverEstiloFala('azul')).toEqual({ cor: CORES_FALA.azul });
      expect(resolverEstiloFala('blue')).toEqual({ cor: CORES_FALA.blue });
      expect(resolverEstiloFala('vermelho')).toEqual({ cor: CORES_FALA.vermelho });
      expect(resolverEstiloFala('verde')).toEqual({ cor: CORES_FALA.verde });
      expect(resolverEstiloFala('amarelo')).toEqual({ cor: CORES_FALA.amarelo });
      expect(resolverEstiloFala('roxo')).toEqual({ cor: CORES_FALA.roxo });
    });

    it('resolve estilos de fundo/marca-texto com cores calibradas', () => {
      expect(resolverEstiloFala('marca')).toEqual(FUNDOS_FALA.marca);
      expect(resolverEstiloFala('destaque')).toEqual(FUNDOS_FALA.destaque);
      expect(resolverEstiloFala('marca-verde')).toEqual(FUNDOS_FALA['marca-verde']);
      expect(resolverEstiloFala('fundo-azul')).toEqual(FUNDOS_FALA['fundo-azul']);
    });

    it('resolve códigos hexadecimais válidos de 3 e 6 dígitos', () => {
      expect(resolverEstiloFala('#2563eb')).toEqual({ cor: '#2563eb' });
      expect(resolverEstiloFala('#fff')).toEqual({ cor: '#fff' });
    });

    it('retorna objeto vazio para tags desconhecidas', () => {
      expect(resolverEstiloFala('desconhecido')).toEqual({});
    });
  });

  describe('parsearPalavrasFala', () => {
    it('divide texto simples em palavras comuns', () => {
      const res = parsearPalavrasFala('Olá turma, vamos lá');
      expect(res).toEqual([
        { texto: 'Olá' },
        { texto: 'turma,' },
        { texto: 'vamos' },
        { texto: 'lá' },
      ]);
    });

    it('aplica cores em variáveis destacadas', () => {
      const res = parsearPalavrasFala('Temos [azul:x] e [verde:y]');
      expect(res).toEqual([
        { texto: 'Temos' },
        { texto: 'x', cor: CORES_FALA.azul },
        { texto: 'e' },
        { texto: 'y', cor: CORES_FALA.verde },
      ]);
    });

    it('anexa pontuação colada à palavra destacada', () => {
      const res = parsearPalavrasFala('Considere [azul:x], depois calcule [laranja:y].');
      expect(res).toEqual([
        { texto: 'Considere' },
        { texto: 'x,', cor: CORES_FALA.azul },
        { texto: 'depois' },
        { texto: 'calcule' },
        { texto: 'y.', cor: CORES_FALA.laranja },
      ]);
    });

    it('estiliza múltiplas palavras sob uma única tag de destaque', () => {
      const res = parsearPalavrasFala('Veja a [marca:grande novidade] hoje.');
      expect(res).toEqual([
        { texto: 'Veja' },
        { texto: 'a' },
        { texto: 'grande', cor: FUNDOS_FALA.marca.cor, fundo: FUNDOS_FALA.marca.fundo },
        { texto: 'novidade', cor: FUNDOS_FALA.marca.cor, fundo: FUNDOS_FALA.marca.fundo },
        { texto: 'hoje.' },
      ]);
    });
  });

  describe('quebrarLinhasFala', () => {
    const mockCtx = {
      measureText: (texto: string) => ({ width: texto.length * 10 }),
    } as unknown as CanvasRenderingContext2D;

    it('quebra linhas respeitando a largura máxima e calcula larguras', () => {
      // Cada caractere mede 10px. Com larguraMax 80px, linhas comportam até 8 caracteres.
      const texto = 'Um dois tres quatro cinco';
      const linhas = quebrarLinhasFala(mockCtx, texto, 80);
      expect(linhas.length).toBeGreaterThan(1);
      expect(linhas[0]!.temDestaque).toBe(false);
    });

    it('identifica linhas que contêm destaques e cores', () => {
      const texto = 'Aqui temos [azul:x] em destaque';
      const linhas = quebrarLinhasFala(mockCtx, texto, 500);
      expect(linhas).toHaveLength(1);
      expect(linhas[0]!.temDestaque).toBe(true);
      expect(linhas[0]!.palavras.some((p) => p.cor === CORES_FALA.azul)).toBe(true);
    });
  });
});
