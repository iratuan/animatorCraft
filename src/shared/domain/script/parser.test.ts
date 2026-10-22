import { describe, expect, it } from 'vitest';
import { parseRoteiro } from './parser';

describe('parseRoteiro', () => {
  it('interpreta um parágrafo de ações (professor = CringeFather, aluno = BetaSon por padrão)', () => {
    const r = parseRoteiro(
      `# Produtos notáveis

Professor entra pela esquerda andando. Aluno entra correndo pela direita. Professor diz "Hoje vamos aprender!" irritado. Professor escreve $(a+b)^2$ no quadro. Aluno fica confuso. Espera 1,5 segundos. Apaga o quadro.`,
    );
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.titulo).toBe('Produtos notáveis');
    expect(r.cenas[0]!.acoes).toEqual([
      { tipo: 'entrar', ator: 'cringefather', lado: 'esquerda', pose: 'andar' },
      { tipo: 'entrar', ator: 'betason', lado: 'direita', pose: 'correr' },
      { tipo: 'fala', ator: 'cringefather', texto: 'Hoje vamos aprender!' },
      { tipo: 'pose', ator: 'cringefather', pose: 'bravo' },
      { tipo: 'expressao', ator: 'cringefather', expressao: 'brava' },
      { tipo: 'escrever', ator: 'cringefather', conteudo: { tipo: 'latex', latex: '(a+b)^2' } },
      { tipo: 'pose', ator: 'betason', pose: 'confuso' },
      { tipo: 'expressao', ator: 'betason', expressao: 'confusa' },
      { tipo: 'esperar', segundos: 1.5 },
      { tipo: 'apagar' },
    ]);
  });

  it('não corta frases em pontuação dentro de aspas', () => {
    const r = parseRoteiro('Aluno grita "Não entendi nada. Nada!" assustado.');
    expect(r.cenas[0]!.acoes[0]).toEqual({ tipo: 'fala', ator: 'betason', texto: 'Não entendi nada. Nada!' });
  });

  it('gera avisos para frases desconhecidas e aceita notas de áudio', () => {
    const r = parseRoteiro('Ninguém faz nada. [nota: gravar com voz sarcástica]');
    expect(r.avisos).toHaveLength(1);
    expect(r.cenas[0]!.acoes).toEqual([{ tipo: 'nota', texto: 'gravar com voz sarcástica' }]);
  });

  it('troca os papéis da aula pela linha [papéis: ...]', () => {
    const r = parseRoteiro('[papéis: professor=Erika, aluno=Dario]\n\nProfessor entra pela esquerda andando. Aluno diz "Oi, mãe!" feliz.');
    expect(r.avisos).toEqual([]);
    expect(r.papeis).toEqual({ professor: 'erika', aluno: 'dario' });
    expect(r.cenas[0]!.acoes[0]).toMatchObject({ tipo: 'entrar', ator: 'erika' });
    expect(r.cenas[0]!.acoes[1]).toMatchObject({ tipo: 'fala', ator: 'dario' });
  });

  it('entende os comandos de câmera entre colchetes', () => {
    const r = parseRoteiro(
      'Professor entra pela esquerda andando. [close na lousa] Professor escreve "x" no quadro. [close no professor] [close em Erika] [plano aberto]',
    );
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes.filter((a) => a.tipo === 'camera')).toEqual([
      { tipo: 'camera', alvo: 'lousa' },
      { tipo: 'camera', alvo: 'personagem', ator: 'cringefather' },
      { tipo: 'camera', alvo: 'personagem', ator: 'erika' },
      { tipo: 'camera', alvo: 'aberto' },
    ]);
  });

  it('"faz a pose <nome>" escolhe um sprite do pacote pelo nome', () => {
    const r = parseRoteiro('Dario faz a pose pular-corda por 3 segundos. Laura usa a pose girar.');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes).toEqual([
      { tipo: 'pose', ator: 'dario', pose: 'parado', etiqueta: 'pular-corda', duracao: 3 },
      { tipo: 'pose', ator: 'laura', pose: 'parado', etiqueta: 'girar' },
    ]);
  });

  it('câmera em "close no aluno" respeita o papel da aula', () => {
    const r = parseRoteiro('[papéis: professor=BetaSon, aluno=CringeFather]\n[close no aluno]');
    expect(r.cenas[0]!.acoes).toEqual([{ tipo: 'camera', alvo: 'personagem', ator: 'cringefather' }]);
  });

  it('interpreta tags de cenário, formato de produção e sem lousa por cena', () => {
    const script = `# Episódio Podcast
[cenário: podcast]
[formato: podcast]
Professor diz "Bem-vindos ao episódio!".

# Plantão Urgente
[cenário: telejornal]
[formato: telejornal]
[sem lousa]
Aluno diz "Últimas notícias!".`;
    const r = parseRoteiro(script);
    expect(r.avisos).toEqual([]);
    expect(r.cenas).toHaveLength(2);
    expect(r.cenas[0]!.cenario).toBe('podcast');
    expect(r.cenas[0]!.formato).toBe('podcast');
    expect(r.cenas[1]!.cenario).toBe('telejornal');
    expect(r.cenas[1]!.formato).toBe('telejornal');
    expect(r.cenas[1]!.semLousa).toBe(true);
  });
});
