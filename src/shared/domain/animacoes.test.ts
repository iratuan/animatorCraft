import { afterEach, describe, expect, it } from 'vitest';
import { acharClipe, avaliarClipe, clipeDaPose, definirClipesPersonalizados, duracaoDoClipe, nomeDeClipe, type ClipePersonalizado } from './clipes';
import { definirExpressoesBoneco, definirExpressoesDeSprites, ehExpressao, expressoesDe, nomeDeExpressao, rostoBonecoDe } from './expressoes';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';

const rosto = { olho: 'grande', sobr: 5, boca: 'o' } as const;
const clipe = (extra: Partial<ClipePersonalizado> = {}): ClipePersonalizado => ({
  id: 'tchau', nome: 'Tchau', categoria: 'Movimento', loop: true, ator: 'betason', estilo: 'ambos',
  passos: [{ tags: ['comemorar'], dur: 0.5, mov: 'balancar', amp: 6, poseBoneco: 'acenar' }, { tags: ['parado'], dur: 0.5, mov: 'quicar', espelhar: true }], ...extra,
});

afterEach(() => { definirClipesPersonalizados([]); definirExpressoesBoneco([]); definirExpressoesDeSprites('betason', []); definirExpressoesDeSprites('erika', []); });

describe('expressões próprias', () => {
  it('normaliza nomes e aceita as padrão, as do boneco e as dos sprites', () => {
    expect(nomeDeExpressao('Com Sono!')).toBe('com-sono');
    definirExpressoesBoneco([{ ator: 'betason', nome: 'Apaixonada', quadros: [rosto] }]);
    definirExpressoesDeSprites('betason', ['sonolenta', 'boca-a', 'olhos-fechados']);
    expect(expressoesDe('betason')).toEqual(expect.arrayContaining(['feliz', 'apaixonada', 'sonolenta']));
    expect(expressoesDe('betason')).not.toContain('boca-a');
    expect(ehExpressao('erika', 'apaixonada')).toBe(false); // vale só para quem a criou
  });

  it('descarta receitas inválidas e repetidas, e limita os valores', () => {
    definirExpressoesBoneco([
      { ator: 'betason', nome: 'ok', quadros: [{ olho: 'normal', sobr: 999, boca: 'reta' }] },
      { ator: 'betason', nome: 'ok', quadros: [rosto] }, // repetida
      { ator: 'betason', nome: 'feliz', quadros: [rosto] }, // nome de expressão padrão
      { ator: 'betason', nome: 'ruim', quadros: [{ olho: 'xyz', sobr: 0, boca: 'reta' } as never] },
      { ator: 'betason', nome: '', quadros: [rosto] },
      { ator: 'betason', nome: 'sem-quadros', quadros: [] },
    ]);
    const lista = expressoesDe('betason');
    expect(lista).toContain('ok'); expect(lista).not.toContain('ruim'); expect(lista).not.toContain('sem-quadros');
    expect(rostoBonecoDe('betason', 'ok')!.sobr).toBe(14);
  });

  it('expressão animada alterna os quadros', () => {
    definirExpressoesBoneco([{ ator: 'betason', nome: 'pisca', quadros: [rosto, { olho: 'meia', sobr: 0, boca: 'reta' }] }]);
    expect(rostoBonecoDe('betason', 'pisca', 0)!.olho).toBe('grande');
    expect(rostoBonecoDe('betason', 'pisca', 0.3)!.olho).toBe('meia');
    expect(rostoBonecoDe('betason', 'pisca', 0.55)!.olho).toBe('grande');
  });

  it('o roteiro entende "faz cara de <expressão nova>" e avisa quando ela não existe', () => {
    definirExpressoesBoneco([{ ator: 'betason', nome: 'apaixonada', quadros: [rosto] }]);
    const r = parseRoteiro('Betason entra pela esquerda andando. Betason faz cara de apaixonada. Betason faz cara de brava. Betason faz cara de nojo. Erika faz cara de apaixonada.');
    expect(r.cenas[0]!.acoes.filter((a) => a.tipo === 'expressao').map((a) => (a as { expressao: string }).expressao)).toEqual(['apaixonada', 'brava']);
    expect(r.avisos).toHaveLength(2);
    expect(r.avisos[0]).toContain('nojo');
    const estado = estadoEm(construirTimeline(parseRoteiro('Betason faz cara de apaixonada.')), 5);
    expect(estado.atores.betason!.expressao).toBe('apaixonada');
  });
});

describe('clipes por personagem', () => {
  it('normaliza o nome, sanitiza e acha por personagem e estilo', () => {
    expect(nomeDeClipe('Tchau Longo!')).toBe('tchau-longo');
    definirClipesPersonalizados([
      clipe(), clipe({ id: 'x', nome: 'X', estilo: 'stickman' }), clipe({ ator: 'erika', nome: 'Erika Tchau' }),
      clipe({ nome: 'Tchau', estilo: 'stickman' }),
      { ...clipe({ nome: 'Lixo' }), passos: [{ tags: [], dur: -5, mov: 'voar' as never }] },
      { ...clipe({ nome: 'Vazio' }), passos: [] },
    ]);
    expect(acharClipe('betason', 'Tchau')!.estilo).toBe('stickman');
    expect(acharClipe('betason', 'tchau', 'stickman')!.estilo).toBe('stickman');
    expect(acharClipe('betason', 'x', 'stickman')!.estilo).toBe('stickman');
    expect(acharClipe('erika', 'tchau')).toBeUndefined();
    const lixo = acharClipe('betason', 'lixo')!;
    expect(lixo.passos[0]).toMatchObject({ tags: ['parado'], dur: 0.1, mov: 'respirar' });
    // a intensidade é limitada a 5x o padrão do movimento (pular usa fração da altura: 4 jogaria o personagem para fora do palco)
    definirClipesPersonalizados([clipe({ nome: 'Pulao', passos: [{ tags: ['parado'], dur: 1, mov: 'pular', amp: 4 }, { tags: ['parado'], dur: 1, mov: 'girar', amp: 9 }] })]);
    expect(acharClipe('betason', 'pulao')!.passos[0]!.amp).toBeCloseTo(0.6);
    expect(acharClipe('betason', 'pulao')!.passos[1]!.amp).toBeUndefined();
    expect(acharClipe('betason', 'vazio')).toBeUndefined();
  });

  it('avalia o passo certo e entrega a pose do boneco', () => {
    definirClipesPersonalizados([clipe()]);
    const c = acharClipe('betason', 'tchau')!;
    expect(duracaoDoClipe(c)).toBeCloseTo(1);
    const t1 = avaliarClipe(c, 0.2), t2 = avaliarClipe(c, 0.7);
    expect(t1.tags).toEqual(['comemorar']); expect(t1.poseBoneco).toBe('acenar'); expect(t1.espelhar).toBe(false);
    expect(t2.tags).toEqual(['parado']); expect(t2.poseBoneco).toBeUndefined(); expect(t2.espelhar).toBe(true);
    expect(avaliarClipe(c, 1.2).tags).toEqual(['comemorar']); // loop
  });

  it('um clipe pode substituir uma pose padrão só para aquele personagem', () => {
    definirClipesPersonalizados([clipe({ nome: 'Minha dança', id: 'minha-danca', substitui: 'danca_atual' })]);
    expect(clipeDaPose('danca_atual', 'betason').id).toBe('minha-danca');
    expect(clipeDaPose('danca_atual', 'erika').id).toBe('danca_atual');
    expect(clipeDaPose('danca_atual').id).toBe('danca_atual');
    expect(clipeDaPose('danca_atual', 'betason', 'stickman').id).toBe('minha-danca');
  });

  it('o roteiro executa o clipe com a duração do clipe (ou a pedida) e depois volta ao normal', () => {
    definirClipesPersonalizados([clipe()]);
    const r = parseRoteiro('Betason entra pela esquerda andando. Betason faz o clipe tchau. Betason faz o clipe "Tchau" por 3 segundos. Betason faz o clipe sumiu. Erika faz o clipe tchau.');
    const poses = r.cenas[0]!.acoes.filter((a) => a.tipo === 'pose') as { clipe?: string; duracao?: number }[];
    expect(poses.map((p) => [p.clipe, p.duracao])).toEqual([['tchau', 1], ['tchau', 3]]);
    expect(r.avisos).toHaveLength(2);
    expect(r.avisos[0]).toContain('sumiu'); expect(r.avisos[0]).toContain('Clipes: tchau');
    const tl = construirTimeline(parseRoteiro('Betason faz o clipe tchau por 2 segundos.'));
    expect(estadoEm(tl, 1).atores.betason!.clipe).toBe('tchau');
    expect(estadoEm(tl, 2.5).atores.betason!.clipe).toBeUndefined();
    expect(estadoEm(tl, 2.5).atores.betason!.pose).toBe('parado');
  });

  it('duração absurda é limitada', () => {
    definirClipesPersonalizados([clipe()]);
    const tl = construirTimeline(parseRoteiro('Betason faz o clipe tchau por 99999 segundos.'));
    expect(tl.duracao).toBeLessThanOrEqual(600);
  });
});
