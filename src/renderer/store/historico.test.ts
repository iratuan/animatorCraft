import { describe, expect, it } from 'vitest';
import { desfazer, podeDesfazer, podeRefazer, refazer, useEditor } from './editor-store';

describe('desfazer/refazer do roteiro', () => {
  it('edições separadas no tempo viram passos; desfazer e refazer andam pela pilha', async () => {
    useEditor.setState({ roteiro: 'A' });
    const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await esperar(900); useEditor.getState().setRoteiro('B');
    await esperar(900); useEditor.getState().setRoteiro('C');
    expect(desfazer()).toBe(true); expect(useEditor.getState().roteiro).toBe('B');
    expect(desfazer()).toBe(true); expect(useEditor.getState().roteiro).toBe('A');
    expect(podeRefazer()).toBe(true);
    expect(refazer()).toBe(true); expect(useEditor.getState().roteiro).toBe('B');
    useEditor.getState().setRoteiro('D'); // nova edição descarta o "refazer"
    expect(podeRefazer()).toBe(false);
    expect(podeDesfazer()).toBe(true);
  });
});
