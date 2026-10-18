import { describe, expect, it } from 'vitest';
import { analisarPacote } from './nomenclatura';

const op = {
  personagens: ['betason', 'erika'],
  expressoes: ['neutra', 'feliz', 'brava'],
  posesConhecidas: ['parado', 'andar', 'comemorar'],
};

describe('analisarPacote (padrão de nomes dos sprites)', () => {
  it('aceita pastas por personagem, quadros de animação, rostos e props', () => {
    const r = analisarPacote([
      'betason/pose_parado.png', 'betason/pose_andar_1.png', 'betason/pose_andar_2.png', 'betason/pose_comemorar.png',
      'betason/rosto_feliz.png', 'betason/rosto_boca-a.png', 'betason/rosto_olhos-fechados.png', 'betason/prop_skate.png', 'betason/meta.json',
    ], op);
    expect(r.erros).toEqual([]);
    expect(r.resumo.betason).toEqual({ poses: ['parado', 'andar', 'comemorar'], rostos: ['feliz', 'boca-a', 'olhos-fechados'], props: ['skate'], quadros: { andar: 2 } });
    expect(r.meta.betason).toBe('betason/meta.json');
  });

  it('aceita o formato plano com prefixo e pasta-raiz do zip', () => {
    const r = analisarPacote(['pacote/erika_pose_parado.png', 'pacote/erika_rosto_brava.png'], op);
    expect(r.erros).toEqual([]);
    expect(r.sprites.map((s) => [s.personagem, s.tipo, s.nome])).toEqual([['erika', 'pose', 'parado'], ['erika', 'rosto', 'brava']]);
  });

  it('normaliza maiúsculas e acentos e avisa que renomeou', () => {
    const r = analisarPacote(['Betason/Pose_Parado.PNG', 'Betason/pose_Bracos Cruzados.png'], op);
    expect(r.erros).toEqual([]);
    expect(r.sprites.every((s) => s.renomeado)).toBe(true);
    expect(r.sprites[1]!.nome).toBe('bracos-cruzados');
  });

  it('exige pose_parado e relata nomes inválidos, rostos desconhecidos e duplicados', () => {
    const r = analisarPacote([
      'betason/pose_andar.png', 'betason/foto_01.png', 'betason/rosto_assustadissimo.png', 'betason/pose_andar.png', 'solto.png',
    ], op);
    expect(r.erros.some((e) => e.includes('falta a pose obrigatória pose_parado'))).toBe(true);
    expect(r.erros.some((e) => e.includes('foto_01') && e.includes('nome inválido'))).toBe(true);
    expect(r.erros.some((e) => e.includes('assustadissimo'))).toBe(true);
    expect(r.erros.some((e) => e.includes('duplicado'))).toBe(true);
    expect(r.erros.some((e) => e.includes('solto.png') && e.includes('de qual personagem'))).toBe(true);
  });

  it('avisa de pose nova, buracos nos quadros e mistura de quadro com imagem única', () => {
    const r = analisarPacote(['betason/pose_parado.png', 'betason/pose_pular-corda_1.png', 'betason/pose_pular-corda_3.png', 'betason/pose_andar.png', 'betason/pose_andar_1.png'], op);
    expect(r.avisos.some((a) => a.includes('pose nova "pular-corda"') && a.includes('betason faz a pose pular-corda'))).toBe(true);
    expect(r.avisos.some((a) => a.includes('sem buracos'))).toBe(true);
    expect(r.erros.some((e) => e.includes('"andar" tem versão sem número e com número'))).toBe(true);
  });

  it('ignora lixo de zip (__MACOSX, arquivos ocultos) e avisa de arquivos que não são png', () => {
    const r = analisarPacote(['__MACOSX/betason/._pose_parado.png', 'betason/.DS_Store', 'betason/pose_parado.png', 'betason/leia-me.txt'], op);
    expect(r.erros).toEqual([]);
    expect(r.sprites).toHaveLength(1);
    expect(r.avisos.some((a) => a.includes('leia-me.txt'))).toBe(true);
  });
});
