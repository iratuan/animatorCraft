import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroEstatico } from '@renderer/features/roteiro';

/** Avança o relógio da animação enquanto estiver tocando (e repete, se pedido). */
export function useReproducao() {
  const tocando = useEditor((s) => s.tocando);
  const { timeline } = useRoteiroEstatico();
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

