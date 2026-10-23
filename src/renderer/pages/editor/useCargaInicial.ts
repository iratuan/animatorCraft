import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { carregarFontesDoApp, carregarImagensEAudios, carregarSprites } from '@renderer/bootstrap';

/** Ao abrir o editor: carrega os sprites, reaplica os pacotes importados antes e espera as fontes. */
export function useCargaInicial() {
  const set = useEditor((s) => s.set);
  useEffect(() => {
    carregarSprites()
      .then((n) => set({ spritesOk: true, mensagem: n ? `Pronto. ${n} sprites de pacotes importados foram reaplicados.` : 'Pronto.' }))
      .catch((e: Error) => set({ mensagem: `Falha ao carregar personagens: ${e.message}` }));
    void carregarImagensEAudios();
    void carregarFontesDoApp();

    if (typeof window !== 'undefined' && window.__VSCODE_API__) {
      window.__VSCODE_API__.postMessage({ tipo: 'webview-pronto' });
      const onMsg = (event: MessageEvent) => {
        const msg = event.data;
        if (msg?.tipo === 'carregar-roteiro') {
          if (typeof msg.texto === 'string') useEditor.getState().setRoteiro(msg.texto);
          if (msg.nome) useEditor.getState().marcarSalvo(null, msg.nome);
        }
      };
      window.addEventListener('message', onMsg);
      return () => window.removeEventListener('message', onMsg);
    }
  }, [set]);
}
