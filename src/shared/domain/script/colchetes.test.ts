import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './parser';
import { colchetesNoCursor, imagensCitadas, inserirColchetes, opcoesColchetes, teclaColchetes } from './colchetes';

describe('imagensCitadas', () => {
  it('lista cada imagem do roteiro uma vez, sem pontuação final, com aspas quando há espaço', () => {
    const texto = 'Professor mostra a imagem ciclo.png. Aluno mostra a imagem ciclo.png. Erika mostra a imagem "meu grafico.png".';
    expect(imagensCitadas(texto)).toEqual(['ciclo.png', 'meu grafico.png']);
  });
});

const acoesDe = (texto: string) => parseRoteiro(texto).cenas[0]!.acoes;

describe('colchetesNoCursor', () => {
  it('abre com "[[" e lê o filtro', () => {
    expect(colchetesNoCursor('Professor [[', 12)).toEqual({ inicio: 10, filtro: '' });
    expect(colchetesNoCursor('Professor [[apo', 15)).toEqual({ inicio: 10, filtro: 'apo' });
  });

  it('não abre com "[" sozinho, nem depois de fechar', () => {
    expect(colchetesNoCursor('Professor [', 11)).toBeNull();
    expect(colchetesNoCursor('Professor [[lousa]] ', 20)).toBeNull();
  });
});

describe('opcoesColchetes', () => {
  it('lista elementos antes das ações e inclui imagens citadas', () => {
    const ops = opcoesColchetes('', ['ciclo.png']);
    expect(ops[0]!.grupo).toBe('Elementos');
    expect(ops.map((o) => o.conteudo)).toContain('mostra a imagem ciclo.png');
    expect(ops.find((o) => o.grupo === 'Ações')).toBeDefined();
  });

  it('filtra por texto sem acento', () => {
    const ops = opcoesColchetes('danca', []);
    expect(ops.map((o) => o.conteudo)).toContain('dança');
  });

  it('nome de imagem com espaço vai entre aspas', () => {
    const ops = opcoesColchetes('', ['meu grafico.png']);
    expect(ops.map((o) => o.conteudo)).toContain('mostra a imagem "meu grafico.png"');
  });

  it('ações do menu são frases que o parser entende', () => {
    for (const op of opcoesColchetes('', []).filter((o) => o.grupo === 'Ações')) {
      const acoes = acoesDe(`Professor ${op.conteudo}.`);
      expect(acoes.length, op.conteudo).toBeGreaterThan(0);
    }
  });
});

describe('inserirColchetes', () => {
  it('troca "[[filtro" pelo conteúdo entre colchetes e posiciona o cursor depois do "]]"', () => {
    const r = inserirColchetes('Professor [[apo', { inicio: 10, filtro: 'apo' }, 15, 'aponta para a lousa');
    expect(r.texto).toBe('Professor [[aponta para a lousa]]');
    expect(r.cursor).toBe(10 + 'aponta para a lousa'.length + 4);
  });

  it('aproveita o "]]" automático que já está depois do cursor', () => {
    const r = inserirColchetes('Professor [[]]', { inicio: 10, filtro: '' }, 12, 'dança');
    expect(r.texto).toBe('Professor [[dança]]');
  });
});

describe('teclaColchetes', () => {
  it('o segundo "[" fecha com "]]" e deixa o cursor no meio', () => {
    expect(teclaColchetes('Professor [', 11, '[')).toEqual({ texto: 'Professor [[]]', cursor: 12 });
  });

  it('"]" logo antes de um "]]" automático só avança', () => {
    expect(teclaColchetes('Professor [[lousa]]', 17, ']')).toEqual({ texto: 'Professor [[lousa]]', cursor: 18 });
  });

  it('o segundo "]" também só avança, depois do primeiro', () => {
    expect(teclaColchetes('Dario [[x]]', 10, ']')).toEqual({ texto: 'Dario [[x]]', cursor: 11 });
  });

  it('outras teclas seguem o caminho normal', () => {
    expect(teclaColchetes('abc', 3, 'd')).toBeNull();
    expect(teclaColchetes('abc', 3, ']')).toBeNull();
  });
});

describe('parser e "[[...]]"', () => {
  it('ação dentro da frase equivale à frase sem colchetes', () => {
    expect(acoesDe('Professor [[aponta para a lousa]].')).toEqual(acoesDe('Professor aponta para a lousa.'));
  });

  it('frase inteira entre colchetes duplos é lida como ação', () => {
    expect(acoesDe('[[Professor aponta para a lousa]]')).toEqual(acoesDe('Professor aponta para a lousa.'));
  });

  it('a frase seguinte continua separada corretamente', () => {
    const acoes = acoesDe('Professor [[dança]]. Aluno acena.');
    expect(acoes.map((a) => ('ator' in a ? a.ator : undefined))).toEqual(['cringefather', 'betason']);
    expect(acoes[1]).toMatchObject({ tipo: 'pose', pose: 'acenar' });
  });

  it('elemento de imagem entre colchetes vira a imagem na cena, sem aviso', () => {
    const r = parseRoteiro('Erika [[mostra a imagem ciclo.png]].');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes[0]).toMatchObject({ tipo: 'escrever', ator: 'erika', conteudo: { tipo: 'imagem', arquivo: 'ciclo.png' } });
  });

  it('elemento "lousa" entre colchetes funciona como palavra do aponte', () => {
    expect(acoesDe('Professor aponta para [[lousa]].')).toEqual(acoesDe('Professor aponta para lousa.'));
  });

  it('comandos de colchete simples continuam funcionando', () => {
    const r = parseRoteiro('Professor acena. [nota: revisar] Aluno acena.');
    expect(r.cenas[0]!.acoes.some((a) => a.tipo === 'nota')).toBe(true);
    expect(r.avisos).toEqual([]);
  });
});
