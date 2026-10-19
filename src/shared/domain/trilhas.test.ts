import { describe, expect, it } from 'vitest';
import { TRILHA_PADRAO, agendaDeAudio, construirTimeline, ganhoDaTrilha, nomeDeTrilha, nomeExibidoDaTrilha, ordenarTrilhas, parseRoteiro, registrarAudio, removerAudio, sanearTrilhas, trilhaDoEvento } from './index';

const AUDIOS = ['fala1.wav', 'fala2.wav', 'musica.mp3', 'chuva.wav', 'palmas.wav'];
const preparar = () => { for (const n of AUDIOS) registrarAudio({ nome: n, duracao: 2 }); };
const limpar = () => { for (const n of AUDIOS) removerAudio(n); };
const agenda = (txt: string) => { const r = parseRoteiro(txt); expect(r.avisos).toEqual([]); const tl = construirTimeline(r); return { itens: agendaDeAudio(tl), duracao: tl.duracao }; };

describe('trilhas de áudio', () => {
  it('cada personagem tem a sua trilha de voz; efeitos e música têm as suas', () => {
    preparar();
    const { itens } = agenda('# C\nCringeFather entra pela esquerda andando. BetaSon entra pela direita andando.\nCringeFather diz "Oi". [áudio: fala1.wav]\nBetaSon diz "Olá". [áudio: fala2.wav]\n[efeito: palmas.wav]\n[música: musica.mp3]');
    expect(itens.map((i) => i.trilha).sort()).toEqual(['efeitos', 'musica', 'voz:betason', 'voz:cringefather']);
    limpar();
  });

  it('trilhas nomeadas tocam juntas; parar pode ser por trilha ou geral', () => {
    preparar();
    const { itens, duracao } = agenda('# C\nCringeFather entra pela esquerda andando.\n[música: musica.mp3, volume 30%]\n[música: chuva.wav, volume 20%, trilha ambiente]\nEspera 2 segundos.\n[música: parar trilha ambiente]\nEspera 2 segundos.\n[música: chuva.wav, trilha Ambiente Forte]\nEspera 1 segundos.\n[música: parar]');
    const m = itens.filter((i) => i.papel === 'musica');
    expect(m.map((i) => [i.arquivo, i.trilha])).toEqual([['musica.mp3', 'musica'], ['chuva.wav', 'ambiente'], ['chuva.wav', 'ambiente-forte']]);
    expect(m[0]!.volume).toBeCloseTo(0.3); expect(m[1]!.volume).toBeCloseTo(0.2);
    // as duas primeiras começam juntas; "parar trilha ambiente" corta só a chuva e a música padrão continua
    expect(m[1]!.inicio).toBeCloseTo(m[0]!.inicio, 3);
    expect(m[1]!.fim).toBeCloseTo(m[0]!.inicio + 2, 1);
    expect(m[0]!.fim).toBeGreaterThan(m[1]!.fim + 1.5);
    // o "parar" geral corta as que ainda tocam
    expect(m[0]!.fim).toBeCloseTo(m[2]!.fim, 3);
    expect(m[2]!.fim).toBeLessThanOrEqual(duracao + 1e-6);
    limpar();
  });

  it('na mesma trilha a música nova corta a anterior', () => {
    preparar();
    const { itens } = agenda('# C\nCringeFather entra pela esquerda andando.\n[música: musica.mp3]\nEspera 2 segundos.\n[música: chuva.wav]');
    expect(itens[0]!.fim).toBeCloseTo(itens[1]!.inicio, 3);
    limpar();
  });

  it('mudo, solo e volume', () => {
    expect(ganhoDaTrilha({}, 'musica')).toBe(1);
    expect(ganhoDaTrilha({ musica: { ...TRILHA_PADRAO, mudo: true } }, 'musica')).toBe(0);
    expect(ganhoDaTrilha({ musica: { ...TRILHA_PADRAO, volume: 0.4 } }, 'musica')).toBe(0.4);
    const solo = { efeitos: { ...TRILHA_PADRAO, solo: true } };
    expect(ganhoDaTrilha(solo, 'efeitos')).toBe(1); expect(ganhoDaTrilha(solo, 'musica')).toBe(0); expect(ganhoDaTrilha(solo, 'previa')).toBe(1);
    expect(ganhoDaTrilha({ x: { volume: NaN, mudo: false, solo: false } }, 'x')).toBe(1);
    expect(ganhoDaTrilha({ x: { volume: 99, mudo: false, solo: false } }, 'x')).toBe(1.5);
  });

  it('dados de fora são saneados', () => {
    expect(sanearTrilhas(null)).toEqual({}); expect(sanearTrilhas([1])).toEqual({}); expect(sanearTrilhas('x')).toEqual({});
    expect(sanearTrilhas({ a: { volume: 'alto', mudo: 'sim', solo: 1 }, b: 5, c: { volume: -3, mudo: true } })).toEqual({ a: { volume: 1, mudo: false, solo: false }, c: { volume: 0, mudo: true, solo: false } });
  });

  it('nomes e ordem', () => {
    expect(nomeDeTrilha('Ambiente Forte!')).toBe('ambiente-forte'); expect(nomeDeTrilha('???')).toBe('trilha');
    expect(nomeExibidoDaTrilha('voz:erika', () => 'Erika')).toBe('Voz — Erika'); expect(nomeExibidoDaTrilha('ambiente-forte')).toBe('Ambiente forte');
    expect(ordenarTrilhas(['musica', 'zzz', 'efeitos', 'voz:b', 'voz:a'])).toEqual(['voz:b', 'voz:a', 'efeitos', 'musica', 'zzz']);
    expect(trilhaDoEvento({ tipo: 'nota', texto: '' })).toBeUndefined();
  });
});
