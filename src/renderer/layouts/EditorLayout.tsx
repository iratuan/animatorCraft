import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { gravarJson, lerJson } from '@renderer/features/sistema';

/** Tamanhos dos painéis (px): coluna do roteiro, coluna lateral e altura da linha do tempo. Guardados no aparelho. */
export interface TamanhosPaineis { roteiro: number; lateral: number; tempo: number }
export const PADRAO_PAINEIS: TamanhosPaineis = { roteiro: 360, lateral: 300, tempo: 232 };
const LIMITES = { roteiro: [180, 800], lateral: [200, 700], tempo: [90, 600] } as const;
const CHAVE = 'stickboard.paineis.v1';
export const limitarPainel = (k: keyof TamanhosPaineis, v: number): number => Math.round(Math.max(LIMITES[k][0], Math.min(LIMITES[k][1], Number.isFinite(v) ? v : PADRAO_PAINEIS[k])));
const ler = (): TamanhosPaineis => { const j = lerJson<Partial<TamanhosPaineis>>(CHAVE, {}); return { roteiro: limitarPainel('roteiro', j.roteiro ?? PADRAO_PAINEIS.roteiro), lateral: limitarPainel('lateral', j.lateral ?? PADRAO_PAINEIS.lateral), tempo: limitarPainel('tempo', j.tempo ?? PADRAO_PAINEIS.tempo) }; };

/** Estrutura da janela do editor: barra de menus, barra de ferramentas, ferramentas, três painéis redimensionáveis, linha do tempo e barra de status. */
export function EditorLayout({ menu, barra, ferramentas, roteiro, palco, lateral, linhaDoTempo, status }: {
  menu: ReactNode; barra: ReactNode; ferramentas: ReactNode; roteiro: ReactNode; palco: ReactNode; lateral: ReactNode; linhaDoTempo: ReactNode; status: ReactNode;
}) {
  const [tam, setTam] = useState<TamanhosPaineis>(ler);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { gravarJson(CHAVE, tam); }, [tam]);
  const mudar = useCallback((k: keyof TamanhosPaineis, v: number) => setTam((t) => ({ ...t, [k]: limitarPainel(k, v) })), []);

  /** Arrasta uma divisória. `sinal`: +1 se crescer para a direita/baixo aumenta o painel, -1 se diminui (painéis do lado direito e de baixo). */
  const arrastar = (k: keyof TamanhosPaineis, eixo: 'x' | 'y', sinal: 1 | -1) => (e: React.PointerEvent) => {
    e.preventDefault();
    const ini = eixo === 'x' ? e.clientX : e.clientY, valor0 = tam[k];
    document.body.classList.add('redimensionando');
    const mv = (m: PointerEvent) => mudar(k, valor0 + sinal * ((eixo === 'x' ? m.clientX : m.clientY) - ini));
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); document.body.classList.remove('redimensionando'); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };
  const teclado = (k: keyof TamanhosPaineis, menos: string, mais: string, sinal: 1 | -1) => (e: React.KeyboardEvent) => {
    const passo = e.shiftKey ? 50 : 10;
    if (e.key === menos) { e.preventDefault(); mudar(k, tam[k] - sinal * passo); }
    else if (e.key === mais) { e.preventDefault(); mudar(k, tam[k] + sinal * passo); }
    else if (e.key === 'Home') { e.preventDefault(); mudar(k, PADRAO_PAINEIS[k]); }
  };
  const div = (k: keyof TamanhosPaineis, eixo: 'x' | 'y', sinal: 1 | -1, rotulo: string) => (
    <div
      className={`divisor divisor-${k}`} role="separator" aria-orientation={eixo === 'x' ? 'vertical' : 'horizontal'} tabIndex={0} aria-label={rotulo} aria-valuenow={tam[k]}
      aria-valuemin={LIMITES[k][0]} aria-valuemax={LIMITES[k][1]} title={`${rotulo} — arraste (duplo clique restaura)`}
      onPointerDown={arrastar(k, eixo, sinal)} onDoubleClick={() => mudar(k, PADRAO_PAINEIS[k])}
      onKeyDown={teclado(k, eixo === 'x' ? 'ArrowLeft' : 'ArrowUp', eixo === 'x' ? 'ArrowRight' : 'ArrowDown', sinal)}
    />
  );
  return (
    <div className="app" ref={ref} style={{ '--col-roteiro': `${tam.roteiro}px`, '--col-lateral': `${tam.lateral}px`, '--lin-tempo': `${tam.tempo}px` } as React.CSSProperties}>
      {menu}
      {barra}
      {ferramentas}
      {roteiro}
      {palco}
      {lateral}
      {linhaDoTempo}
      {status}
      {div('roteiro', 'x', 1, 'Largura do roteiro')}
      {div('lateral', 'x', -1, 'Largura do painel lateral')}
      {div('tempo', 'y', -1, 'Altura da linha do tempo')}
    </div>
  );
}
