import { beforeEach, describe, expect, it, vi } from 'vitest';

// o Electron não existe no teste: simulamos só o que o serviço usa
const caixa = vi.hoisted(() => ({ resposta: 0, chamadas: 0 }));
vi.mock('electron', () => ({
  dialog: { showMessageBoxSync: () => { caixa.chamadas++; return caixa.resposta; } },
}));

import { definirAlteracoesPendentes, protegerFechamento } from './janela';

/**
 * Janela falsa: `tentarFechar` dispara o evento "close" como o Electron faria e informa se ele foi bloqueado;
 * `close()` conta o fechamento real (é o que o serviço chama depois de "Fechar sem salvar").
 */
function janelaFalsa() {
  let ouvinte: ((e: { preventDefault: () => void }) => void) | undefined;
  const estado = { fechadas: 0 };
  const janela = {
    on: (_evento: string, f: (e: { preventDefault: () => void }) => void) => { ouvinte = f; },
    close: () => { estado.fechadas++; },
  };
  const tentarFechar = (): { bloqueado: boolean } => {
    let bloqueado = false;
    ouvinte?.({ preventDefault: () => { bloqueado = true; } });
    return { bloqueado };
  };
  return { janela, estado, tentarFechar };
}

describe('protegerFechamento', () => {
  beforeEach(() => {
    caixa.chamadas = 0;
    caixa.resposta = 0;
    definirAlteracoesPendentes(false);
  });

  it('sem alterações pendentes, fecha sem perguntar', () => {
    const { janela, tentarFechar } = janelaFalsa();
    protegerFechamento(janela as never);
    expect(tentarFechar().bloqueado).toBe(false);
    expect(caixa.chamadas).toBe(0);
  });

  it('com alterações pendentes, pergunta e "Cancelar" mantém a janela aberta', () => {
    const { janela, estado, tentarFechar } = janelaFalsa();
    protegerFechamento(janela as never);
    definirAlteracoesPendentes(true);
    caixa.resposta = 0;
    expect(tentarFechar().bloqueado).toBe(true);
    expect(caixa.chamadas).toBe(1);
    expect(estado.fechadas).toBe(0);
  });

  it('"Fechar sem salvar" fecha a janela', () => {
    const { janela, estado, tentarFechar } = janelaFalsa();
    protegerFechamento(janela as never);
    definirAlteracoesPendentes(true);
    caixa.resposta = 1;
    expect(tentarFechar().bloqueado).toBe(true);
    expect(estado.fechadas).toBe(1);
  });

  it('depois que o renderer avisa que está salvo, fecha sem perguntar', () => {
    const { janela, tentarFechar } = janelaFalsa();
    protegerFechamento(janela as never);
    definirAlteracoesPendentes(true);
    definirAlteracoesPendentes(false);
    expect(tentarFechar().bloqueado).toBe(false);
    expect(caixa.chamadas).toBe(0);
  });

  it('a autorização de "Fechar sem salvar" não vaza para outra janela', () => {
    const primeira = janelaFalsa();
    protegerFechamento(primeira.janela as never);
    definirAlteracoesPendentes(true);
    caixa.resposta = 1;
    primeira.tentarFechar();
    // nova janela, com alterações ainda pendentes: tem que perguntar de novo
    const segunda = janelaFalsa();
    protegerFechamento(segunda.janela as never);
    caixa.resposta = 0;
    expect(segunda.tentarFechar().bloqueado).toBe(true);
    expect(caixa.chamadas).toBe(2);
  });
});
