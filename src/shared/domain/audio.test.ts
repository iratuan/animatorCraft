import { describe, expect, it } from 'vitest';
import { agendaDeAudio, calcularEnvelope, registrarAudio, removerAudio, visemaDoAudio } from './audio';
import { parseRoteiro } from './script/parser';
import { construirTimeline, estadoEm } from './timeline';

describe('áudio da aula', () => {
  it('[áudio: x] anexa a narração à fala e ela passa a durar o tempo do áudio', () => {
    registrarAudio({ nome: 'oi.wav', duracao: 5 });
    const r = parseRoteiro('Professor diz "Oi, turma!". [áudio: OI.wav]\nAluno diz "Oi".');
    expect(r.avisos).toEqual([]);
    expect(r.cenas[0]!.acoes[0]).toMatchObject({ tipo: 'fala', audio: 'OI.wav' });
    const l = construirTimeline(r);
    expect(l.eventos[0]!.fim - l.eventos[0]!.inicio).toBeCloseTo(5.25);
    expect(l.eventos[1]!.inicio).toBeCloseTo(5.25);
    expect(estadoEm(l, 1).atores.cringefather!.fala?.audio).toBe('OI.wav');
    // a etiqueta faz parte da frase: mover/excluir a fala leva junto
    const o = l.eventos[0]!.origem!;
    expect(r.cenas[0]!.origens.length).toBe(r.cenas[0]!.acoes.length);
    expect('Professor diz "Oi, turma!". [áudio: OI.wav]\nAluno diz "Oi".'.slice(o.ini, o.fim)).toBe('Professor diz "Oi, turma!". [áudio: OI.wav]');
    removerAudio('oi.wav');
  });

  it('música, volume, parar e efeito viram agenda sem atrasar as ações', () => {
    registrarAudio({ nome: 'fundo.mp3', duracao: 30 }); registrarAudio({ nome: 'palmas.wav', duracao: 2 });
    const r = parseRoteiro('[música: fundo.mp3, volume 30%]\nProfessor entra pela esquerda andando. [efeito: palmas.wav]\nAluno entra pela direita andando. [música: parar]\nAluno diz "Fim".');
    expect(r.avisos).toEqual([]);
    const l = construirTimeline(r);
    const ag = agendaDeAudio(l);
    const musica = ag.find((i) => i.papel === 'musica')!;
    expect(musica).toMatchObject({ arquivo: 'fundo.mp3', volume: 0.3, inicio: 0 });
    expect(musica.fim).toBeCloseTo(l.eventos.find((e) => e.acao.tipo === 'audio' && e.acao.parar)!.inicio);
    expect(ag.find((i) => i.papel === 'efeito')).toMatchObject({ arquivo: 'palmas.wav', fim: expect.any(Number) });
    // áudio não atrasa: a 2ª entrada começa quando a 1ª termina
    const entradas = l.eventos.filter((e) => e.acao.tipo === 'entrar');
    expect(entradas[1]!.inicio).toBeCloseTo(entradas[0]!.fim);
    removerAudio('fundo.mp3'); removerAudio('palmas.wav');
  });

  it('a boca acompanha o volume: fechada no silêncio, aberta nos picos', () => {
    const amostras = new Float32Array(48000);
    for (let i = 24000; i < 48000; i++) amostras[i] = Math.sin(i / 20) * 0.8;
    const env = calcularEnvelope(amostras, 48000);
    expect(visemaDoAudio(env, 0.2)).toBe('m');
    expect(visemaDoAudio(env, 0.75)).toBe('a');
  });
});
