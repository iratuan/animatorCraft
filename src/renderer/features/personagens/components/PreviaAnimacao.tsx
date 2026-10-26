import { useEffect, useMemo, useRef, useState } from 'react';
import { construirTimeline, estadoEm, parseRoteiro } from '@shared/domain';
import { renderizarCena } from '@renderer/features/cena';
import { useEditor } from '@renderer/store/editor-store';

interface Props {
  /** trecho de roteiro tocado em repetição (a prévia usa o mesmo motor do vídeo) */
  roteiro: string;
}

const L = 480, A = 270;

/** Prévia ao vivo de uma expressão ou de um clipe: interpreta `roteiro` e toca em repetição num palco pequeno. */
export function PreviaAnimacao({ roteiro }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spritesOk = useEditor((s) => s.spritesOk);
  const [avisos, setAvisos] = useState<string[]>([]);
  const { timeline, avisosRoteiro } = useMemo(() => {
    const r = parseRoteiro(roteiro);
    return { timeline: construirTimeline(r), avisosRoteiro: r.avisos };
  }, [roteiro]);
  useEffect(() => setAvisos(avisosRoteiro), [avisosRoteiro]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !spritesOk) return;
    const ctx = c.getContext('2d')!;
    let id = 0, ini = performance.now();
    const duracao = Math.max(0.5, timeline.duracao);
    const quadro = (agora: number) => {
      let t = (agora - ini) / 1000;
      if (t > duracao + 0.6) { ini = agora; t = 0; }
      // o palco é desenhado em 1920×1080 (as medidas do motor são em px desse palco) e reduzido para a prévia
      ctx.save(); ctx.scale(L / 1920, A / 1080);
      renderizarCena(ctx, estadoEm(timeline, Math.min(t, duracao)), 1920, 1080, {});
      ctx.restore();
      id = requestAnimationFrame(quadro);
    };
    id = requestAnimationFrame(quadro);
    return () => cancelAnimationFrame(id);
  }, [timeline, spritesOk]);

  return (
    <div className="previa-animacao">
      <canvas ref={ref} width={L} height={A} aria-label="Prévia da animação" />
      {avisos.length > 0 && <p className="aviso-previa">{avisos[0]}</p>}
    </div>
  );
}
