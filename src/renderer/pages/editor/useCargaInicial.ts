import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { carregarElenco, carregarFontesDoApp, carregarImagensEAudios } from '@renderer/bootstrap';

/** Ao abrir o editor: carrega o elenco de boneco de palito, as imagens e áudios salvos e espera as fontes. */
export function useCargaInicial() {
  const set = useEditor((s) => s.set);
  useEffect(() => {
    carregarElenco()
      .then(() => set({ mensagem: 'Pronto.' }))
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
