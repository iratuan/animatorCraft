import { useEffect, useRef } from 'react';
import { agendaDeAudio } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro';
import { pararAudio, tocarAgenda } from '../services/mixer';

/** Toca a trilha de áudio junto com a animação; refaz o agendamento ao pular na linha do tempo ou editar o roteiro. */
export function useAudioPreview() {
  const tocandoAgora = useEditor((s) => s.tocando);
  const t = useEditor((s) => s.t);
  const versaoAudio = useEditor((s) => s.versaoAudio);
  const { timeline } = useRoteiroDerivado();
  const esperado = useRef<{ t0: number; relogio: number } | null>(null);

  useEffect(() => {
    if (!tocandoAgora) { pararAudio(); esperado.current = null; return; }
    const t0 = useEditor.getState().t;
    esperado.current = { t0, relogio: performance.now() };
    void tocarAgenda(agendaDeAudio(timeline), t0);
    return () => pararAudio();
    // reagenda quando a animação começa a tocar, o roteiro muda ou os áudios mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tocandoAgora, timeline, versaoAudio]);

  // pulo na linha do tempo durante a reprodução: recomeça o áudio no novo ponto
  useEffect(() => {
    const e = esperado.current;
    if (!tocandoAgora || !e) return;
    const previsto = e.t0 + (performance.now() - e.relogio) / 1000;
    if (Math.abs(t - previsto) > 0.4) { esperado.current = { t0: t, relogio: performance.now() }; void tocarAgenda(agendaDeAudio(timeline), t); }
  }, [t, tocandoAgora, timeline]);
}
