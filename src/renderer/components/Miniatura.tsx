import { useEffect, useRef } from 'react';
import type { ActorId, ExpressaoId, PoseId } from '@shared/domain';
import { desenharMiniatura } from '@renderer/features/palco/render';
import { useEditor } from '@renderer/store/editor-store';

interface Props { ator: ActorId; pose?: PoseId; expressao?: ExpressaoId; tamanho?: number; modo?: 'corpo' | 'rosto'; etiqueta?: string }

/** Miniatura de um personagem (sprite da pose, ou boneco de reserva). Redesenha quando os sprites carregam ou mudam. */
export function Miniatura({ ator, pose = 'parado', expressao = 'neutra', tamanho = 64, modo = 'corpo', etiqueta }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const prontos = useEditor((s) => s.spritesOk);
  const versao = useEditor((s) => s.versaoBib);
  useEffect(() => {
    const c = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    c.width = tamanho * dpr; c.height = tamanho * dpr;
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    desenharMiniatura(ctx, ator, pose, expressao, tamanho, modo, 0.8, etiqueta);
  }, [ator, pose, expressao, tamanho, modo, prontos, versao, etiqueta]);
  return <canvas ref={ref} style={{ width: tamanho, height: tamanho }} />;
}
