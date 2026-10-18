import { useEffect } from 'react';
import { desfazer, refazer, useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro';

const emCampoDeTexto = (alvo: EventTarget | null) => alvo instanceof HTMLTextAreaElement || alvo instanceof HTMLInputElement || alvo instanceof HTMLSelectElement;

/**
 * Atalhos globais do editor: Ctrl+Z / Ctrl+Y (roteiro), F1 (manual) e Espaço (tocar/pausar).
 * Com uma janela (modal) aberta as teclas são dela: o editor de imagem usa Espaço e Ctrl+Z para o desenho, por exemplo.
 */
export function useAtalhos() {
  const { timeline } = useRoteiroDerivado();
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const st = useEditor.getState();
      if (e.key === 'F1') { e.preventDefault(); st.set({ manualAberto: true }); return; }
      if (e.key === 'Escape' && st.manualAberto) { st.set({ manualAberto: false }); return; }
      if (st.editorImagem || st.iaAberta || st.fichaPersonagem || st.importacao || st.editorPersonagem || st.manualAberto) return;
      const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (ctrl && !e.shiftKey && k === 'z') { if (desfazer()) { e.preventDefault(); st.set({ mensagem: 'Desfeito.' }); } return; }
      if (ctrl && (k === 'y' || (e.shiftKey && k === 'z'))) { if (refazer()) { e.preventDefault(); st.set({ mensagem: 'Refeito.' }); } return; }
      if (e.code === 'Space' && !emCampoDeTexto(e.target)) { e.preventDefault(); st.alternarReproducao(timeline.duracao); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [timeline.duracao]);
}
