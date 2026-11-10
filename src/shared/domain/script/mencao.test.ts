import { afterEach, describe, expect, it } from 'vitest';
import { ATORES, registrarAtor, removerAtor } from '../characters';
import { inserirMencao, mencaoNoCursor, opcoesMencao } from './mencao';

describe('mencaoNoCursor', () => {
  it('abre com "@" no início do texto e no início de uma palavra', () => {
    expect(mencaoNoCursor('@', 1)).toEqual({ inicio: 0, filtro: '' });
    expect(mencaoNoCursor('Erika fala. @', 13)).toEqual({ inicio: 12, filtro: '' });
    expect(mencaoNoCursor('Erika fala.\n@ce', 15)).toEqual({ inicio: 12, filtro: 'ce' });
  });

  it('lê o filtro digitado depois do "@", com acento', () => {
    expect(mencaoNoCursor('@Véi', 4)).toEqual({ inicio: 0, filtro: 'Véi' });
  });

  it('não abre no meio de e-mail ou de palavra', () => {
    expect(mencaoNoCursor('contato a@b', 11)).toBeNull();
    expect(mencaoNoCursor('texto', 5)).toBeNull();
  });

  it('não atravessa quebra de linha nem pontuação no filtro', () => {
    expect(mencaoNoCursor('@Erika\nDario', 12)).toBeNull();
    expect(mencaoNoCursor('@Erika.', 7)).toBeNull();
  });

  it('usa a posição do cursor, não o fim do texto', () => {
    expect(mencaoNoCursor('@Erika diz oi', 3)).toEqual({ inicio: 0, filtro: 'Er' });
  });
});

describe('opcoesMencao', () => {
  it('lista papéis e elenco quando não há filtro', () => {
    const ids = opcoesMencao('').map((o) => o.chave);
    expect(ids.slice(0, 2)).toEqual(['papel:professor', 'papel:aluno']);
    expect(ids).toContain('ator:erika');
    expect(ids).toContain('ator:mingau');
  });

  it('filtra por apelido, sem acento e sem diferenciar maiúsculas', () => {
    expect(opcoesMencao('gato').map((o) => o.insercao)).toEqual(['Mingau']);
    expect(opcoesMencao('VEIA').map((o) => o.insercao)).toContain('Véia');
    expect(opcoesMencao('zzzz')).toEqual([]);
  });

  it('quem começa com o filtro vem antes de quem só o contém', () => {
    const nomes = opcoesMencao('ar').map((o) => o.insercao);
    expect(nomes.indexOf('Artur')).toBeLessThan(nomes.indexOf('Dario'));
  });

  it('insere sempre o nome canônico do personagem', () => {
    expect(opcoesMencao('paraiba')[0]!.insercao).toBe('Paraíba');
  });

  describe('personagem criado pelo usuário', () => {
    const id = 'ze-mencao-teste';
    afterEach(() => removerAtor(id));

    it('aparece no seletor logo depois de ser criado', () => {
      expect(registrarAtor({ nome: 'Zé Menção Teste' })).toMatchObject({ id });
      expect(ATORES[id]).toBeDefined();
      expect(opcoesMencao('menção').map((o) => o.insercao)).toContain('Zé Menção Teste');
      expect(opcoesMencao('ze').map((o) => o.chave)).toContain(`ator:${id}`);
    });
  });
});

describe('inserirMencao', () => {
  const texto = '@Er';
  const mencao = { inicio: 0, filtro: 'Er' };

  it('troca "@filtro" pelo nome e põe um espaço depois', () => {
    expect(inserirMencao(texto, mencao, 3, 'Erika')).toEqual({ texto: 'Erika ', cursor: 6 });
  });

  it('não duplica espaço quando já há um depois do cursor', () => {
    expect(inserirMencao('@Er diz oi', { inicio: 0, filtro: 'Er' }, 3, 'Erika')).toEqual({ texto: 'Erika diz oi', cursor: 5 });
  });

  it('não põe espaço antes de pontuação', () => {
    expect(inserirMencao('@Er.', { inicio: 0, filtro: 'Er' }, 3, 'Erika')).toEqual({ texto: 'Erika.', cursor: 5 });
  });

  it('preserva o texto antes do "@"', () => {
    const antes = 'Dario entra. ';
    const r = inserirMencao(`${antes}@da`, { inicio: antes.length, filtro: 'da' }, antes.length + 3, 'Dario');
    expect(r.texto).toBe('Dario entra. Dario ');
    expect(r.cursor).toBe(antes.length + 6);
  });
});
