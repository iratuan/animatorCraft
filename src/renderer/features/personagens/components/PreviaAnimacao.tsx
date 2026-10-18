import { useEffect, useMemo, useRef, useState } from 'react';
import { construirTimeline, estadoEm, parseRoteiro, type ActorId } from '@shared/domain';
import { definirSkins, renderizarCena, type Skin } from '@renderer/features/cena';
import { useEditor } from '@renderer/store/editor-store';

interface Props {
  ator: ActorId;
  /** trecho de roteiro tocado em repetição (a prévia usa o mesmo motor do vídeo) */
  roteiro: string;
  /** força o estilo só durante a prévia (o estilo salvo do personagem volta ao fechar) */
  estilo: Skin | null;
}

const L = 480, A = 270;

/** Prévia ao vivo de uma expressão ou de um clipe: interpreta `roteiro` e toca em repetição num palco pequeno. */
export function PreviaAnimacao({ ator, roteiro, estilo }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const spritesOk = useEditor((s) => s.spritesOk);
  const [avisos, setAvisos] = useState<string[]>([]);
  const { timeline, avisosRoteiro } = useMemo(() => {
    const r = parseRoteiro(roteiro);
    return { timeline: construirTimeline(r), avisosRoteiro: r.avisos };
  }, [roteiro]);
  useEffect(() => setAvisos(avisosRoteiro), [avisosRoteiro]);

  // estilo só da prévia
  useEffect(() => {
    if (!estilo) return;
    const { skinPadrao, skins } = useEditor.getState();
    definirSkins(skinPadrao, { ...skins, [ator]: estilo });
    return () => { const s = useEditor.getState(); definirSkins(s.skinPadrao, s.skins); };
  }, [ator, estilo]);

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
  }, [timeline, spritesOk, estilo]);

  return (
    <div className="previa-animacao">
      <canvas ref={ref} width={L} height={A} aria-label="Prévia da animação" />
      {avisos.length > 0 && <p className="aviso-previa">{avisos[0]}</p>}
    </div>
  );
}
