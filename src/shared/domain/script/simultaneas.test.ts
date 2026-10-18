import { describe, expect, it } from 'vitest';
import { construirTimeline, estadoEm } from '../timeline';
import { posicionarNoRoteiro, reescreverDuracao, tornarSequencial, tornarSimultanea } from './editar';
import { parseRoteiro } from './parser';

const tl = (t: string) => { const r = parseRoteiro(t); return { r, tl: construirTimeline(r) }; };

describe('simultaneidade no roteiro', () => {
  it('"Enquanto A, B" roda as duas ações juntas e a seguinte espera a mais longa', () => {
    const { r, tl: l } = tl('Professor entra pela esquerda andando. Enquanto Professor diz "Hoje vamos aprender produtos notáveis!", Aluno dança por 6 segundos. Erika entra pela direita andando.');
    expect(r.avisos).toEqual([]);
    const [entra, fala, danca, erika] = l.eventos;
    expect(fala!.inicio).toBe(danca!.inicio);
    expect(danca!.fim - danca!.inicio).toBe(6);
    expect(erika!.inicio).toBeCloseTo(Math.max(fala!.fim, danca!.fim));
    expect(entra!.fim).toBeCloseTo(fala!.inicio);
  });

  it('"A enquanto B" e "Ao mesmo tempo, C" também', () => {
    const { r, tl: l } = tl('Aluno dança por 4 segundos enquanto Professor diz "Atenção!". Ao mesmo tempo, Erika acena.');
    expect(r.avisos).toEqual([]);
    expect(l.eventos.map((e) => e.inicio)).toEqual([0, 0, 0]);
  });

  it('"Ao mesmo tempo:" abre um bloco de frases simultâneas', () => {
    const { l } = (() => { const x = tl('Ao mesmo tempo: Professor diz "Oi". Aluno dança por 3 segundos. Erika acena.'); return { l: x.tl }; })();
    expect(l.eventos.map((e) => e.inicio)).toEqual([0, 0, 0]);
  });

  it('dois personagens falam ao mesmo tempo, cada um com o seu balão', () => {
    const { tl: l } = tl('Professor diz "Um". Ao mesmo tempo, Aluno diz "Dois".');
    const s = estadoEm(l, 0.5);
    expect(s.atores.cringefather!.fala).toBeDefined();
    expect(s.atores.betason!.fala).toBeDefined();
  });

  it('o balão de quem já terminou some quando o próximo começa', () => {
    const { tl: l } = tl('Professor diz "Um". Aluno diz "Dois".');
    const s = estadoEm(l, l.eventos[1]!.inicio + 0.1);
    expect(s.atores.cringefather!.fala).toBeUndefined();
    expect(s.atores.betason!.fala).toBeDefined();
  });

  it('cada ação guarda a posição da frase no texto original', () => {
    const texto = '[papéis: professor=Erika, aluno=Dario]\n\n# Cena\nProfessor diz "Oi".\nAluno dança.';
    const { tl: l } = tl(texto);
    for (const e of l.eventos) expect(e.origem).toBeDefined();
    const o = l.eventos[1]!.origem!;
    expect(texto.slice(o.ini, o.fim)).toBe('Aluno dança.');
  });
});

describe('edição da linha do tempo reescreve o roteiro', () => {
  const base = 'Professor diz "Oi". Aluno dança por 4 segundos. Erika acena.';
  const origemDe = (texto: string, i: number) => tl(texto).tl.eventos[i]!.origem!;

  it('tornar simultânea move a frase para junto da âncora', () => {
    const novo = tornarSimultanea(base, origemDe(base, 2), origemDe(base, 0));
    expect(novo).toBe('Professor diz "Oi". Ao mesmo tempo, Erika acena. Aluno dança por 4 segundos.');
    const l = tl(novo).tl;
    expect(l.eventos.map((e) => e.inicio)).toEqual([0, 0, 0 + 0].map((_, i) => l.eventos[i]!.inicio));
    expect(l.eventos[1]!.inicio).toBe(l.eventos[0]!.inicio);
  });

  it('tornar sequencial tira a marca', () => {
    const t0 = 'Professor diz "Oi". Ao mesmo tempo, Aluno dança por 4 segundos.';
    expect(tornarSequencial(t0, origemDe(t0, 1))).toBe('Professor diz "Oi". Aluno dança por 4 segundos.');
  });

  it('"Enquanto A, B" vira duas frases em sequência', () => {
    const t0 = 'Enquanto Professor diz "Oi", Aluno dança.';
    expect(tornarSequencial(t0, origemDe(t0, 0))).toBe('Professor diz "Oi". Aluno dança.');
  });

  it('a duração é reescrita na frase', () => {
    expect(reescreverDuracao(base, origemDe(base, 1), 7.5)).toContain('Aluno dança por 7,5 segundos.');
    expect(reescreverDuracao(base, origemDe(base, 2), 3)).toContain('Erika acena por 3 segundos.');
  });
});

describe('posição dos personagens', () => {
  it('"fica na posição 35%" teleporta (duração zero) e "anda para" caminha', () => {
    const r = parseRoteiro('Professor entra pela esquerda andando. Professor fica na posição 35%. Aluno entra pela direita andando na posição 80%. Aluno anda para a posição 60%.');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes[1]).toEqual({ tipo: 'posicionar', ator: 'cringefather', x: 0.35 });
    expect(r.cenas[0]!.acoes[2]).toMatchObject({ tipo: 'entrar', x: 0.8 });
    expect(r.cenas[0]!.acoes[3]).toEqual({ tipo: 'posicionar', ator: 'betason', x: 0.6, andando: true });
    const l = construirTimeline(r);
    expect(l.eventos[1]!.fim - l.eventos[1]!.inicio).toBe(0);
    expect(estadoEm(l, l.eventos[1]!.inicio + 0.01).atores.cringefather!.x).toBeCloseTo(0.35);
    const fim = estadoEm(l, l.duracao + 1);
    expect(fim.atores.betason!.x).toBeCloseTo(0.6);
    expect(fim.atores.betason!.pose).toBe('parado');
    const meio = estadoEm(l, l.eventos[3]!.inicio + 0.6);
    expect(meio.atores.betason!.pose).toBe('andar');
    expect(meio.atores.betason!.x).toBeGreaterThan(0.6);
    expect(meio.atores.betason!.x).toBeLessThan(0.8);
  });

  it('arrastar no palco insere ou substitui a frase de posição', () => {
    const base = 'Professor entra pela esquerda andando. Aluno diz "Oi".';
    const o = tl(base).tl.eventos[0]!.origem!;
    const a = posicionarNoRoteiro(base, 'CringeFather', 41.6, o);
    expect(a).toBe('Professor entra pela esquerda andando. CringeFather fica na posição 42%. Aluno diz "Oi".');
    const o2 = tl(a).tl.eventos[1]!.origem!;
    expect(posicionarNoRoteiro(a, 'CringeFather', 55, undefined, o2)).toContain('CringeFather fica na posição 55%. Aluno');
    expect(tl(a).r.avisos).toEqual([]);
  });
});


describe('posição inserida pelo arrasto no palco', () => {
  it('vale a partir do fim da ação anterior, mesmo com fala e dança depois', () => {
    const { r, tl: l } = tl('[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Posição\nProfessor entra pela esquerda andando. Aluno entra pela direita andando. CringeFather fica na posição 45%.\nProfessor diz "Um momento, por favor." Aluno dança por 6 segundos. Professor aponta.');
    expect(r.avisos).toEqual([]);
    expect(estadoEm(l, 4.17).atores.cringefather!.x).toBeCloseTo(0.45);
  });
});
