import { useEffect } from 'react';
import { desfazer, refazer, useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';

/** Avança o relógio da animação enquanto estiver tocando (e repete, se pedido). */
export function useReproducao() {
  const tocando = useEditor((s) => s.tocando);
  const { timeline } = useRoteiroDerivado();
  const duracao = timeline.duracao;

  useEffect(() => {
    if (!tocando) return;
    let ultimo = performance.now();
    let id = 0;
    const passo = (agora: number) => {
      const dt = (agora - ultimo) / 1000; ultimo = agora;
      const { t, repetir } = useEditor.getState();
      const prox = t + dt;
      if (prox < duracao) useEditor.setState({ t: prox });
      else if (repetir) useEditor.setState({ t: 0 });
      else useEditor.setState({ t: duracao, tocando: false });
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [tocando, duracao]);
}

/** Barra de espaço toca/pausa (fora de campos de texto). */
export function useAtalhos() {
  const { timeline } = useRoteiroDerivado();
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'z') { if (desfazer()) { e.preventDefault(); useEditor.getState().set({ mensagem: 'Desfeito.' }); } return; }
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { if (refazer()) { e.preventDefault(); useEditor.getState().set({ mensagem: 'Refeito.' }); } return; }
      if (e.key === 'F1') { e.preventDefault(); useEditor.getState().set({ manualAberto: true }); return; }
      if (e.key === 'Escape' && useEditor.getState().manualAberto) { useEditor.getState().set({ manualAberto: false }); return; }
      if (e.code === 'Space' && !(alvo instanceof HTMLTextAreaElement) && !(alvo instanceof HTMLInputElement) && !(alvo instanceof HTMLSelectElement)) {
        e.preventDefault();
        useEditor.getState().alternarReproducao(timeline.duracao);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [timeline.duracao]);
}


