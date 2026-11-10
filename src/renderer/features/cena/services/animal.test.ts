import { describe, expect, it } from 'vitest';
import { ehExpressao, expressoesDe, poseDef, type PoseId } from '@shared/domain';
import { ehAnimal, poseDeAnimal, resolverAnimal } from './animal';

const POSES_TESTADAS: PoseId[] = ['parado', 'andar', 'pular', 'correr', 'tropecar', 'sentar'];

describe('animais do elenco (corpo de quadrúpede)', () => {
  it('só Paraíba e Mingau são animais', () => {
    expect(ehAnimal('paraiba')).toBe(true);
    expect(ehAnimal('mingau')).toBe(true);
    expect(ehAnimal('dario')).toBe(false);
    expect(ehAnimal(undefined)).toBe(false);
  });

  it.each(POSES_TESTADAS)('em "%s" a pata mais baixa toca o chão e o corpo fica na horizontal', (pose) => {
    const chao = 900;
    for (const t of [0, 0.37, 1.2]) {
      const p = poseDef(pose, 0.9, t);
      const e = resolverAnimal(poseDeAnimal(p), 500, chao, 1, 1, 1);
      const maisBaixo = Math.max(e.peF.y, e.peT.y, e.maoF.y, e.maoT.y);
      // o salto da pose eleva o corpo inteiro; sem salto, a pata mais baixa fica exatamente no chão
      expect(maisBaixo).toBeCloseTo(chao - p.salto, 6);
      // corpo horizontal: o ombro fica quase na mesma altura do quadril
      expect(Math.abs(e.ombro.y - e.quadril.y)).toBeLessThan(0.2 * 150);
      // a cabeça fica acima do ombro
      expect(e.cabeca.y).toBeLessThan(e.ombro.y);
    }
  });

  it('a pose de quadrúpede não muda a escala nem o lado para onde o animal olha', () => {
    const p = poseDeAnimal(poseDef('andar', 0, 0));
    expect(p.torso).toBeGreaterThan(80);
    const e = resolverAnimal(p, 500, 900, 2, 1, -1);
    // olhando para a esquerda: a cabeça fica à esquerda do quadril
    expect(e.cabeca.x).toBeLessThan(e.quadril.x);
  });
});

describe('expressões de fábrica do elenco', () => {
  it('Paraíba, Mingau, Véio, Véia, Elizendra, Artur e Carol têm expressões próprias aceitas pelo roteiro', () => {
    expect(ehExpressao('paraiba', 'pidindo')).toBe(true);
    expect(ehExpressao('mingau', 'manhoso')).toBe(true);
    expect(ehExpressao('veio', 'teatral')).toBe(true);
    expect(ehExpressao('veia', 'desconfiada')).toBe(true);
    expect(ehExpressao('elizendra', 'orgulhosa')).toBe(true);
    expect(ehExpressao('artur', 'concentrado')).toBe(true);
    expect(ehExpressao('carol', 'animada')).toBe(true);
  });

  it('as expressões padrão continuam valendo para todos, e uma expressão de outro personagem não vale aqui', () => {
    expect(expressoesDe('dario')).toContain('neutra');
    expect(ehExpressao('dario', 'pidindo')).toBe(false);
  });
});
