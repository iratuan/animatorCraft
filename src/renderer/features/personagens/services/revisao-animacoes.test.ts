// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  AMP_PADRAO, ATORES, MAX_PASSOS_CLIPE, MAX_QUADROS_EXPRESSAO, MOVIMENTOS, POSES, QUADROS_EXPRESSAO_POR_SEGUNDO, acharClipe, avaliarClipe, clipesPersonalizados,
  construirTimeline, definirClipesPersonalizados, definirExpressoesBoneco, duracaoDoClipe, ehExpressao, estadoEm, expressoesBoneco, expressoesDe, nomeDeClipe,
  nomeDeExpressao, parseRoteiro, rostoBonecoDe, type ClipePersonalizado, type ExpressaoBoneco,
} from '@shared/domain';
import { carregarAnimacoesSalvas, lerAnimacoes, mesclarAnimacoes, removerAnimacoesDe, salvarClipes, salvarExpressoes } from './animacoes';

/** Revisão de lançamento — expressões e clipes (criar, validar, persistir, mesclar, usar no roteiro). Dados de fora nunca podem derrubar o app. */

class Memoria { private m = new Map<string, string>(); getItem(k: string) { return this.m.get(k) ?? null; } setItem(k: string, v: string) { this.m.set(k, String(v)); } removeItem(k: string) { this.m.delete(k); } clear() { this.m.clear(); } }
const poseValida = (p: string) => (POSES as readonly string[]).includes(p);

beforeEach(() => { (globalThis as { localStorage?: unknown }).localStorage = new Memoria(); definirClipesPersonalizados([]); definirExpressoesBoneco([]); });
afterEach(() => { definirClipesPersonalizados([]); definirExpressoesBoneco([]); });

const clipe = (o: Partial<ClipePersonalizado> = {}): ClipePersonalizado => ({ ator: 'betason', id: 'tchau', nome: 'tchau', categoria: 'Movimento', loop: false, estilo: 'ambos', passos: [{ tags: ['parado'], dur: 0.5, mov: 'balancar', amp: 4 }], ...o });

describe('clipes: validação de dados de fora', () => {
  it('limites: passos, duração, intensidade, movimento e etiquetas são corrigidos', () => {
    const passos = Array.from({ length: 60 }, () => ({ tags: ['a', 'b', 'c', 'd', 'e', 'f'], dur: 99, mov: 'voar' as never, amp: 1e9 }));
    definirClipesPersonalizados([clipe({ passos: passos as never })], poseValida);
    const c = clipesPersonalizados('betason')[0]!;
    expect(c.passos.length).toBe(MAX_PASSOS_CLIPE);
    for (const p of c.passos) { expect(p.dur).toBe(10); expect(p.tags.length).toBe(4); expect(MOVIMENTOS).toContain(p.mov); expect(p.amp).toBeUndefined(); } // 'voar' vira respirar: sem intensidade
    definirClipesPersonalizados([clipe({ passos: [{ tags: ['parado'], dur: 1, mov: 'quicar', amp: 1e9 }, { tags: [], dur: -3, mov: 'pular', amp: -5 }, { tags: ['x'], dur: NaN, mov: 'balancar' }] as never })]);
    const q = clipesPersonalizados('betason')[0]!.passos;
    expect(q[0]!.amp).toBe(AMP_PADRAO.quicar! * 5);
    expect(q[1]).toMatchObject({ tags: ['parado'], dur: 0.1, amp: 0 });
    expect(q[2]!.dur).toBe(0.5);
  });

  it('descarta o que não tem como funcionar: sem ator, sem nome, sem passos, duplicados, tipos errados', () => {
    definirClipesPersonalizados([
      clipe({ ator: '' }), clipe({ nome: '!!!', id: '' }), clipe({ passos: [] }), clipe({ passos: 'x' as never }),
      null as never, 7 as never, 'texto' as never, clipe({ nome: 'Dança do Foguete!' }), clipe({ nome: 'dança do foguete' }), clipe({ nome: 'dança do foguete', estilo: 'stickman' }),
    ]);
    expect(clipesPersonalizados().map((c) => `${c.id}|${c.estilo}`)).toEqual(['danca-do-foguete|stickman']);
    expect(() => definirClipesPersonalizados('lixo' as never)).not.toThrow();
    expect(clipesPersonalizados()).toEqual([]);
  });

  it('o nome vira o id do roteiro (sem acento, hífen) e o nome de exibição é limitado', () => {
    expect(nomeDeClipe('Tchau Longo!')).toBe('tchau-longo');
    expect(nomeDeClipe('  --Ação & Reação--  ')).toBe('acao-reacao');
    definirClipesPersonalizados([clipe({ nome: 'x'.repeat(200) })]);
    expect(clipesPersonalizados()[0]!.nome.length).toBe(60);
  });

  it('pose substituída inexistente é ignorada; existente é mantida', () => {
    definirClipesPersonalizados([clipe({ substitui: 'voar' as never }), clipe({ id: 'b', nome: 'b', substitui: 'danca_atual' })], poseValida);
    expect(clipesPersonalizados().map((c) => c.substitui)).toEqual([undefined, 'danca_atual']);
  });

  it('avaliarClipe devolve sempre números finitos, para qualquer instante (inclusive NaN, negativo e infinito)', () => {
    for (const mov of MOVIMENTOS) {
      definirClipesPersonalizados([clipe({ loop: true, passos: [{ tags: ['parado'], dur: 0.3, mov, amp: AMP_PADRAO[mov] }, { tags: ['andar'], dur: 0.7, mov, amp: AMP_PADRAO[mov] }] })]);
      const c = acharClipe('betason', 'tchau')!;
      for (const t of [0, 0.15, 0.3, 0.999, 1, 2.5, 1e6, -1, -1e9, NaN, Infinity, -Infinity]) {
        const r = avaliarClipe(c, t);
        for (const k of ['dx', 'dy', 'rot', 'sx', 'sy'] as const) expect(Number.isFinite(r[k]), `${mov} t=${t} ${k}`).toBe(true);
      }
    }
  });

  it('clipe sem repetição congela no último passo; com repetição volta ao começo', () => {
    const base = [{ tags: ['a'], dur: 1, mov: 'respirar' as const }, { tags: ['b'], dur: 1, mov: 'respirar' as const }];
    definirClipesPersonalizados([clipe({ loop: false, passos: base, id: 'u', nome: 'u' }), clipe({ loop: true, passos: base, id: 'l', nome: 'l' })]);
    expect(avaliarClipe(acharClipe('betason', 'u')!, 50).tags[0]).toBe('b');
    expect(avaliarClipe(acharClipe('betason', 'l')!, 2.1).tags[0]).toBe('a');
    expect(duracaoDoClipe(acharClipe('betason', 'l')!)).toBe(2);
  });

  it('acharClipe encontra o clipe do personagem pelo id', () => {
    definirClipesPersonalizados([clipe({ id: 'x', nome: 'x', estilo: 'stickman' })]);
    expect(acharClipe('betason', 'x')!.estilo).toBe('stickman');
    expect(acharClipe('betason', 'x', 'stickman')!.estilo).toBe('stickman');
    expect(acharClipe('erika', 'x')).toBeUndefined();
  });
});

describe('expressões do boneco: validação', () => {
  const q = { olho: 'normal' as const, sobr: 3, boca: 'sorriso' as const };
  it('quadros, olhos, bocas e sobrancelhas fora do permitido são corrigidos ou descartados', () => {
    definirExpressoesBoneco([
      { ator: 'betason', nome: 'Apaixonada!', quadros: Array.from({ length: 9 }, () => ({ ...q, sobr: 99 })) },
      { ator: 'betason', nome: 'feliz', quadros: [q] }, // nome padrão
      { ator: 'betason', nome: 'ruim', quadros: [{ olho: 'laser', sobr: 0, boca: 'sorriso' }] as never },
      { ator: 'betason', nome: 'nan', quadros: [{ ...q, sobr: NaN }] },
      { ator: '', nome: 'sem-ator', quadros: [q] }, { ator: 'betason', nome: '', quadros: [q] }, { ator: 'betason', nome: 'vazia', quadros: [] },
      null as never, 'x' as never, { ator: 'betason', nome: 'apaixonada', quadros: [q] }, // duplicada
    ]);
    const lista = expressoesBoneco('betason');
    expect(lista.map((e) => e.nome)).toEqual(['apaixonada']);
    expect(lista[0]!.quadros.length).toBe(MAX_QUADROS_EXPRESSAO);
    expect(lista[0]!.quadros.every((x) => x.sobr === 14)).toBe(true);
    expect(() => definirExpressoesBoneco('lixo' as never)).not.toThrow();
  });
  it('a expressão criada é aceita no roteiro e anima entre os quadros', () => {
    const e: ExpressaoBoneco = { ator: 'betason', nome: 'apaixonada', quadros: [q, { ...q, boca: 'o' }] };
    definirExpressoesBoneco([e]);
    expect(ehExpressao('betason', 'apaixonada')).toBe(true);
    expect(ehExpressao('erika', 'apaixonada')).toBe(false);
    expect(expressoesDe('betason')).toContain('apaixonada');
    expect(nomeDeExpressao('Com Sono!')).toBe('com-sono');
    const t0 = rostoBonecoDe('betason', 'apaixonada', 0)!, t1 = rostoBonecoDe('betason', 'apaixonada', 1 / QUADROS_EXPRESSAO_POR_SEGUNDO)!;
    expect([t0.boca, t1.boca]).toEqual(['sorriso', 'o']);
    expect(rostoBonecoDe('betason', 'apaixonada', 100 / QUADROS_EXPRESSAO_POR_SEGUNDO)!.boca).toBe('sorriso'); // dá a volta
    expect(rostoBonecoDe('betason', 'apaixonada', -5)).toBeDefined();
    const r = parseRoteiro('# C\nBetaSon entra pela esquerda andando. BetaSon faz cara de apaixonada. Erika entra pela direita andando. Erika faz cara de apaixonada.');
    expect(r.avisos.length).toBe(1);
    expect(r.avisos[0]).toContain('Erika não tem a expressão “apaixonada”');
  });
});

describe('clipe no roteiro (parser)', () => {
  it('"faz o clipe X [por N segundos]" com a duração certa e aviso para clipe inexistente', () => {
    definirClipesPersonalizados([clipe({ passos: [{ tags: ['parado'], dur: 1.5, mov: 'balancar', amp: 4 }, { tags: ['parado'], dur: 0.5, mov: 'quicar', amp: 0.05 }] })]);
    const r = parseRoteiro('# C\nBetaSon entra pela esquerda andando. BetaSon faz o clipe tchau. BetaSon faz o clipe "tchau" por 6 segundos. BetaSon faz o clipe sumiu.');
    const poses = r.cenas[0]!.acoes.filter((a) => a.tipo === 'pose') as Extract<ReturnType<typeof parseRoteiro>['cenas'][0]['acoes'][0], { tipo: 'pose' }>[];
    expect(poses.map((p) => p.duracao)).toEqual([2, 6]);
    expect(poses.every((p) => p.clipe === 'tchau')).toBe(true);
    expect(r.avisos.length).toBe(1);
    expect(r.avisos[0]).toContain('não tem o clipe “sumiu”');
    expect(r.avisos[0]).toContain('tchau');
    const tl = construirTimeline(r);
    const e = estadoEm(tl, tl.eventos.find((x) => x.acao.tipo === 'pose')!.inicio + 0.2);
    expect(e.atores['betason']!.clipe).toBe('tchau');
  });

  it('clipes cujo nome é uma palavra de comando continuam sendo clipes', () => {
    for (const nome of ['pausa', 'apaga', 'espera', 'aguarda', 'erika', 'todos', 'dança', 'sai', 'entra']) {
      definirClipesPersonalizados([clipe({ id: nomeDeClipe(nome), nome })]);
      const r = parseRoteiro(`# C\nBetaSon entra pela esquerda andando. BetaSon faz o clipe ${nome} por 3 segundos.`);
      const ultima = r.cenas[0]!.acoes.at(-1)!;
      expect(r.avisos, nome).toEqual([]);
      expect(ultima, nome).toMatchObject({ tipo: 'pose', ator: 'betason', clipe: nomeDeClipe(nome), duracao: 3 });
    }
  });

  it('pose por nome de sprite também não é confundida com comandos ("faz a pose apaga")', () => {
    const r = parseRoteiro('# C\nBetaSon entra pela esquerda andando. BetaSon faz a pose apaga por 2 segundos. BetaSon faz a pose pausa.');
    const poses = r.cenas[0]!.acoes.filter((a) => a.tipo === 'pose');
    expect(poses.length).toBe(2);
    expect(r.cenas[0]!.acoes.some((a) => a.tipo === 'apagar' || a.tipo === 'esperar')).toBe(false);
  });

  it('clipe de um personagem não existe para outro', () => {
    definirClipesPersonalizados([clipe()]);
    const r = parseRoteiro('# C\nErika entra pela esquerda andando. Erika faz o clipe tchau.');
    expect(r.avisos[0]).toContain('Erika não tem o clipe');
  });
});

describe('persistência e mesclagem de animações', () => {
  it('salvar grava, carregar restaura, e a lista exportada sai igual', () => {
    salvarClipes([clipe(), clipe({ id: 'b', nome: 'b', ator: 'erika' })]);
    salvarExpressoes([{ ator: 'betason', nome: 'x', quadros: [{ olho: 'normal', sobr: 0, boca: 'reta' }] }]);
    const antes = lerAnimacoes();
    definirClipesPersonalizados([]); definirExpressoesBoneco([]);
    carregarAnimacoesSalvas();
    expect(lerAnimacoes()).toEqual(antes);
    expect(antes.clipes.length).toBe(2);
  });

  it('mesclar: o que chega substitui o mesmo personagem+nome+estilo; o resto fica; repetir não duplica', () => {
    salvarClipes([clipe({ passos: [{ tags: ['parado'], dur: 1, mov: 'respirar' }] }), clipe({ id: 'outro', nome: 'outro' }), clipe({ ator: 'erika' })]);
    const chegando = { clipes: [clipe({ passos: [{ tags: ['andar'], dur: 2, mov: 'andar' }] }), clipe({ id: 'novo', nome: 'novo', estilo: 'stickman' })], expressoes: [] };
    mesclarAnimacoes(chegando);
    const ids = () => lerAnimacoes().clipes.map((c) => `${c.ator}:${c.id}:${c.estilo}`).sort();
    expect(ids()).toEqual(['betason:novo:stickman', 'betason:outro:stickman', 'betason:tchau:stickman', 'erika:tchau:stickman']);
    expect(acharClipe('betason', 'tchau')!.passos[0]!.tags[0]).toBe('andar');
    mesclarAnimacoes(chegando); mesclarAnimacoes(chegando);
    expect(ids().length).toBe(4);
  });

  it('mesclar com lixo não derruba nem apaga o que existe', () => {
    salvarClipes([clipe()]);
    for (const lixo of [undefined, null, {}, { clipes: 'x' }, { clipes: [null, 5] }, { expressoes: {} }, 'texto', []]) expect(() => mesclarAnimacoes(lixo as never)).not.toThrow();
    expect(lerAnimacoes().clipes.length).toBe(1);
  });

  it('armazenamento corrompido ou cheio não derruba o app', () => {
    (globalThis.localStorage as unknown as Memoria).setItem('stickboard.clipes.v1', '{{{ quebrado');
    (globalThis.localStorage as unknown as Memoria).setItem('stickboard.expressoes.v1', '"texto"');
    expect(() => carregarAnimacoesSalvas()).not.toThrow();
    expect(lerAnimacoes()).toEqual({ clipes: [], expressoes: [] });
    (globalThis as { localStorage?: unknown }).localStorage = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('cota cheia'); } };
    expect(() => salvarClipes([clipe()])).not.toThrow();
    expect(clipesPersonalizados().length).toBe(1); // vale nesta sessão
  });

  it('excluir um personagem leva os clipes e expressões dele, só os dele', () => {
    salvarClipes([clipe(), clipe({ ator: 'erika' })]);
    salvarExpressoes([{ ator: 'betason', nome: 'a', quadros: [{ olho: 'normal', sobr: 0, boca: 'reta' }] }, { ator: 'erika', nome: 'a', quadros: [{ olho: 'normal', sobr: 0, boca: 'reta' }] }]);
    removerAnimacoesDe('betason');
    expect(lerAnimacoes().clipes.map((c) => c.ator)).toEqual(['erika']);
    expect(lerAnimacoes().expressoes.map((c) => c.ator)).toEqual(['erika']);
  });

  it('todos os personagens do elenco aceitam clipe e expressão sem aviso', () => {
    for (const id of Object.keys(ATORES)) { definirClipesPersonalizados([clipe({ ator: id })]); expect(parseRoteiro(`# C\n${ATORES[id]!.nome} entra pela esquerda andando. ${ATORES[id]!.nome} faz o clipe tchau.`).avisos, id).toEqual([]); }
  });
});

describe('fuzz de clipes e expressões', () => {
  it('estruturas aleatórias nunca lançam e o resultado é sempre válido', () => {
    let s = 7;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const v = (): unknown => { const k = Math.floor(rnd() * 8); return [undefined, null, NaN, -1, 1e12, 'x', '', ['a', 1, null], { dur: 1 }, 0.5, Infinity][Math.floor(rnd() * 11)] ?? k; };
    for (let n = 0; n < 500; n++) {
      const lista = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => ({ ator: v(), id: v(), nome: v(), estilo: v(), loop: v(), substitui: v(), passos: Array.from({ length: Math.floor(rnd() * 5) }, () => ({ tags: v(), dur: v(), mov: v(), amp: v(), espelhar: v(), poseBoneco: v() })) }));
      definirClipesPersonalizados(lista as never, poseValida);
      for (const c of clipesPersonalizados()) {
        expect(c.passos.length).toBeGreaterThan(0);
        for (const p of c.passos) { expect(p.dur).toBeGreaterThanOrEqual(0.1); expect(p.dur).toBeLessThanOrEqual(10); expect(MOVIMENTOS).toContain(p.mov); expect(p.tags.length).toBeGreaterThan(0); }
        expect(Number.isFinite(avaliarClipe(c, rnd() * 100).dx)).toBe(true);
      }
      definirExpressoesBoneco(Array.from({ length: 3 }, () => ({ ator: v(), nome: v(), quadros: [{ olho: v(), sobr: v(), boca: v() }] })) as never);
      for (const e of expressoesBoneco()) expect(e.quadros.every((q) => Math.abs(q.sobr) <= 14)).toBe(true);
    }
  });
});
