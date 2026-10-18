import { describe, expect, it } from 'vitest';
import { avaliarClipe, CLIPES_DANCA, clipeDaPose, duracaoDoClipe } from './clipes';
import { MODELOS } from './modelos';
import { parseRoteiro } from './script/parser';
import { piscando, sequenciaDeVisemas, visemaEm } from './visemas';

describe('sincronia labial', () => {
  it('vogais abrem a boca de formas diferentes e b/m/p fecham', () => {
    expect(sequenciaDeVisemas('boa')).toEqual(['m', 'o', 'a']);
    expect(sequenciaDeVisemas('Mamãe')).toEqual(['m', 'a', 'm', 'a', 'e']);
    expect(sequenciaDeVisemas('...')).toEqual(['m']);
  });

  it('percorre a sequência ao longo da fala', () => {
    expect(visemaEm('boa', 0, 1.2)).toBe('m');
    expect(visemaEm('boa', 0.99, 1.2)).toBe('a');
    expect(visemaEm('', 0.5, 1)).toBe('m');
  });

  it('pisca por ~140 ms a cada 3,6 s, defasado por ator', () => {
    expect(piscando(0, 0)).toBe(true);
    expect(piscando(1, 0)).toBe(false);
    expect(piscando(3.6, 0)).toBe(true);
    expect(piscando(0, 1)).toBe(false);
  });
});

describe('clipes de movimento', () => {
  it('danças são sequências de poses e alternam o lado', () => {
    const c = CLIPES_DANCA.danca_funky!;
    expect(duracaoDoClipe(c)).toBeGreaterThan(2);
    expect(avaliarClipe(c, 0.1).espelhar).toBe(false);
    expect(avaliarClipe(c, 0.6).espelhar).toBe(true);
    expect(avaliarClipe(c, 0.1).tags[0]).toBe('apontar');
    // repete (loop)
    expect(avaliarClipe(c, duracaoDoClipe(c) + 0.1).tags).toEqual(avaliarClipe(c, 0.1).tags);
  });

  it('poses simples viram um passo com movimento; andar quica e balança', () => {
    const c = clipeDaPose('andar');
    expect(c.passos).toHaveLength(1);
    expect(avaliarClipe(c, 0.1).dy).toBeLessThanOrEqual(0);
    expect(avaliarClipe(clipeDaPose('parado'), 1).sy).not.toBe(1);
  });

  it('girar passa por escala negativa (vira de lado)', () => {
    const c = CLIPES_DANCA.danca_ballet!;
    const sxs = [0, 0.25, 0.5, 0.75].map((t) => avaliarClipe(c, t).sx);
    expect(Math.min(...sxs)).toBeLessThan(0.3);
  });
});

describe('modelos de roteiro', () => {
  it('todos os modelos entendem-se sem avisos e usam [close na lousa]', () => {
    for (const m of MODELOS) {
      const r = parseRoteiro(m.roteiro);
      expect(r.avisos, m.id).toEqual([]);
      expect(r.cenas.length, m.id).toBeGreaterThanOrEqual(3);
      expect(r.cenas.flatMap((c) => c.acoes).some((a) => a.tipo === 'camera' && a.alvo === 'lousa'), m.id).toBe(true);
    }
  });

  it('o modelo de inglês troca os papéis: BetaSon ensina e CringeFather é o aluno', () => {
    const r = parseRoteiro(MODELOS.find((m) => m.area === 'Inglês')!.roteiro);
    expect(r.papeis).toEqual({ professor: 'betason', aluno: 'cringefather' });
  });
});
