import { useEffect, useRef, useState } from 'react';
import { definirEstiloTraco, definirFontes, renderizarCena, type EstiloTraco } from '@renderer/features/cena';
import { useEditor } from '@renderer/store/editor-store';
import { fontePorId } from '@renderer/features/fontes';
import { useRoteiroDerivado } from '@renderer/features/roteiro';

const consulta = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);

/** Desenha o palco no canvas a cada mudança e ajusta o tamanho do canvas à área disponível. */
export function usePalcoCanvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const [areaTam, setAreaTam] = useState({ w: 0, h: 0 });
  const { estado, dim } = useRoteiroDerivado();
  const formato = useEditor((s) => s.formato);
  const selecionado = useEditor((s) => s.selecionado);
  const spritesOk = useEditor((s) => s.spritesOk);
  const versaoBib = useEditor((s) => s.versaoBib);
  const fonteLousa = useEditor((s) => s.fonteLousa);
  const fonteFala = useEditor((s) => s.fonteFala);
  const fontesOk = useEditor((s) => s.fontesOk);
  const arrasto = useEditor((s) => s.arrastoPalco);

  useEffect(() => {
    const el = area.current!;
    const ro = new ResizeObserver(() => setAreaTam({ w: el.clientWidth - 28, h: el.clientHeight - 28 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    definirEstiloTraco((consulta.get('estilo') as EstiloTraco | null) ?? 'limpo');
    const c = canvas.current!;
    const k = formato === '16:9' ? 0.667 : 0.5; // o preview desenha em resolução menor que a exportação
    c.width = Math.round(dim.w * k); c.height = Math.round(dim.h * k);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    definirFontes({ lousa: fontePorId(fonteLousa), fala: fontePorId(fonteFala) });
    // durante o arrasto o personagem acompanha o ponteiro (a posição só entra no roteiro ao soltar)
    const ator = arrasto ? estado.atores[arrasto.id] : undefined;
    const vista = arrasto && ator ? { ...estado, atores: { ...estado.atores, [arrasto.id]: { ...ator, x: arrasto.x } } } : estado;
    renderizarCena(ctx, vista, dim.w, dim.h, { selecionado });
  }, [estado, formato, selecionado, dim.w, dim.h, spritesOk, versaoBib, fonteLousa, fonteFala, fontesOk, arrasto]);

  const ajuste = Math.min(areaTam.w / dim.w, areaTam.h / dim.h);
  const estilo = { width: Math.max(1, dim.w * ajuste), height: Math.max(1, dim.h * ajuste) };
  return { canvas, area, estilo };
}


