import { describe, expect, it } from 'vitest';
import { reescreverDuracao } from './editar';

const frase = (texto: string) => ({ ini: 0, fim: texto.length });

describe('arrastar a borda do bloco reescreve o "por N segundos" da frase', () => {
  it('acrescenta "por N segundos" numa fala que não tinha duração', () => {
    const t = 'Professor diz "Olá, turma!" feliz.';
    expect(reescreverDuracao(t, frase(t), 4)).toBe('Professor diz "Olá, turma!" feliz por 4 segundos.');
  });

  it('troca o "por N segundos" existente, sem mexer no resto', () => {
    const t = 'Professor diz "Olá!" por 2 segundos.';
    expect(reescreverDuracao(t, frase(t), 5.5)).toBe('Professor diz "Olá!" por 5,5 segundos.');
  });

  it('um número dentro da fala entre aspas não é trocado', () => {
    const t = 'Professor diz "Esperei 3 segundos aqui" por 2 segundos.';
    expect(reescreverDuracao(t, frase(t), 6)).toBe('Professor diz "Esperei 3 segundos aqui" por 6 segundos.');
  });

  it('uma fala com "segundos" só dentro das aspas ganha o "por" no fim, sem tocar no texto', () => {
    const t = 'Professor diz "Dois segundos!" feliz.';
    expect(reescreverDuracao(t, frase(t), 3)).toBe('Professor diz "Dois segundos!" feliz por 3 segundos.');
  });

  it('em "espera N segundos" troca o número da espera', () => {
    const t = 'Espera 2 segundos.';
    expect(reescreverDuracao(t, frase(t), 7)).toBe('Espera 7 segundos.');
  });
});
