import { describe, expect, it } from 'vitest';
import { fraseDaImagem, reescreverImagem } from './script/editar';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';
import { lerEfeito, paramsDoEfeito, registrarImagem, removerImagem } from './imagem';

const tl = (t: string) => { const r = parseRoteiro(t); return { r, tl: construirTimeline(r) }; };

describe('imagens na lousa', () => {
  it('lê a frase com efeito, canto, tamanho e tempo', () => {
    const { r } = tl('Professor mostra a imagem ciclo.png no quadro no canto direito pequena com efeito deslizar da direita e sai com efeito zoom por 6 segundos.');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes[0]).toEqual({ tipo: 'escrever', ator: 'cringefather', conteudo: { tipo: 'imagem', arquivo: 'ciclo.png', entrada: 'deslizar-direita', saida: 'zoom', exibirPor: 6, posicao: 'direita', tamanho: 'pequena' } });
  });

  it('nome entre aspas, efeito padrão "surgir", e o nome do arquivo não vira efeito', () => {
    const { r } = tl('Professor coloca a imagem "meu desenho.png" na lousa.');
    expect(r.cenas[0]!.acoes[0]).toMatchObject({ conteudo: { arquivo: 'meu desenho.png', entrada: 'surgir', posicao: 'centro', tamanho: 'media' } });
    expect(tl('Professor mostra a imagem zoom.png no quadro.').r.cenas[0]!.acoes[0]).toMatchObject({ conteudo: { entrada: 'surgir' } });
  });

  it('a imagem fica na lousa até apagar, ou sai sozinha depois de "por N segundos"', () => {
    registrarImagem({ nome: 'a.png', w: 400, h: 300 });
    const { tl: l } = tl('Professor entra pela esquerda andando.\nProfessor mostra a imagem a.png no quadro por 3 segundos.\nEspera 6 segundos.');
    const ev = l.eventos[1]!;
    expect(estadoEm(l, ev.inicio + 0.2).quadro.length).toBe(1);
    expect(estadoEm(l, ev.inicio + 0.2).quadro[0]!.progresso).toBeCloseTo(0.25, 1);
    expect(estadoEm(l, ev.inicio + 2).quadro[0]!.saida).toBeUndefined();
    const saindo = estadoEm(l, ev.inicio + 3.4).quadro[0]!;
    expect(saindo.saida!.p).toBeGreaterThan(0.3);
    expect(estadoEm(l, ev.inicio + 4.5).quadro.length).toBe(0);
    removerImagem('a.png');
  });

  it('"tira a imagem" remove só essa imagem, com efeito de saída', () => {
    const { r, tl: l } = tl('Professor mostra a imagem a.png no quadro.\nProfessor mostra a imagem b.png no quadro.\nProfessor tira a imagem a.png com efeito zoom.\nEspera 2 segundos.');
    expect(r.cenas[0]!.acoes[2]).toEqual({ tipo: 'remover', ator: 'cringefather', arquivo: 'a.png', saida: 'zoom' });
    const meio = estadoEm(l, l.eventos[2]!.inicio + 0.4);
    expect(meio.quadro.map((i) => i.saida ? 'saindo' : 'fica')).toEqual(['saindo', 'fica']);
    const fim = estadoEm(l, l.duracao);
    expect(fim.quadro.length).toBe(1);
    expect(fim.quadro[0]!.conteudo).toMatchObject({ arquivo: 'b.png' });
  });

  it('"apaga o quadro" continua limpando tudo; "apaga a imagem" é só a imagem', () => {
    const { r } = tl('Professor apaga o quadro. Professor apaga a imagem x.png.');
    expect(r.cenas[0]!.acoes.map((a) => a.tipo)).toEqual(['apagar', 'remover']);
  });

  it('efeitos: lê em português e calcula alpha/deslocamento/escala', () => {
    expect(lerEfeito('com efeito deslizar da esquerda')).toBe('deslizar-esquerda');
    expect(lerEfeito('zoom')).toBe('zoom');
    expect(lerEfeito('revelando')).toBe('revelar');
    expect(paramsDoEfeito('surgir', 0.5).alpha).toBeCloseTo(0.5);
    expect(paramsDoEfeito('deslizar-esquerda', 0).dx).toBeLessThan(0);
    expect(paramsDoEfeito('deslizar-esquerda', 1).dx).toBeCloseTo(0);
    expect(paramsDoEfeito('zoom', 0).escala).toBeLessThan(0.3);
    expect(paramsDoEfeito('revelar', 0.5).clip).toBeCloseTo(0.5);
  });

  it('a frase gerada volta a ser lida igual (inserir e editar efeito pela linha do tempo)', () => {
    const c = { tipo: 'imagem' as const, arquivo: 'meu desenho.png', entrada: 'deslizar-cima' as const, saida: 'surgir' as const, exibirPor: 4.5, posicao: 'esquerda' as const, tamanho: 'grande' as const };
    const frase = fraseDaImagem('Professor', c);
    expect(frase).toBe('Professor mostra a imagem "meu desenho.png" no quadro no canto esquerdo grande com efeito deslizar de cima e sai com efeito surgir por 4,5 segundos.');
    expect(tl(frase).r.cenas[0]!.acoes[0]).toMatchObject({ conteudo: c });
    const base = 'Professor acena. Professor mostra a imagem a.png no quadro. Professor aponta.';
    const o = tl(base).tl.eventos[1]!.origem!;
    expect(reescreverImagem(base, o, 'Professor', { ...c, arquivo: 'a.png', posicao: 'centro', tamanho: 'media', saida: undefined, exibirPor: undefined, entrada: 'zoom' })).toBe('Professor acena. Professor mostra a imagem a.png no quadro com efeito zoom. Professor aponta.');
  });
});


import { inserirNoCursor } from './script/editar';
describe('inserir no cursor', () => {
  const base = 'Professor acena. Aluno diz "Oi".\nProfessor aponta.';
  it('depois da frase do cursor, ou da anterior se o cursor está entre frases', () => {
    expect(inserirNoCursor(base, base.indexOf('Aluno') + 3, 'Erika acena.')).toBe('Professor acena. Aluno diz "Oi". Erika acena.\nProfessor aponta.');
    expect(inserirNoCursor(base, base.indexOf('\n'), 'Erika acena.')).toBe('Professor acena. Aluno diz "Oi". Erika acena.\nProfessor aponta.');
    expect(inserirNoCursor(base, 0, 'Erika acena.')).toBe('Professor acena. Erika acena. Aluno diz "Oi".\nProfessor aponta.');
    expect(inserirNoCursor(base, base.length, 'Erika acena.')).toBe('Professor acena. Aluno diz "Oi".\nProfessor aponta. Erika acena.');
  });
});
