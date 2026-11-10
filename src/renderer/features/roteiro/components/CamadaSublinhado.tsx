import { forwardRef, type ReactNode } from 'react';
import type { Diagnostico } from '@shared/domain';

interface Props { texto: string; diagnosticos: Diagnostico[] }

/**
 * Texto do roteiro por baixo do textarea, com o trecho de cada problema sublinhado.
 * Tem a mesma fonte, o mesmo padding e a mesma quebra de linha do textarea (ver global.css), então os trechos caem exatamente sob as letras.
 * Não recebe o mouse: os cliques e a digitação continuam no textarea.
 */
export const CamadaSublinhado = forwardRef<HTMLDivElement, Props>(function CamadaSublinhado({ texto, diagnosticos }, ref) {
  const partes: ReactNode[] = [];
  let pos = 0;
  for (const d of [...diagnosticos].sort((a, b) => a.ini - b.ini)) {
    // sobreposto a um trecho já sublinhado, ou fora do texto: não sublinha de novo
    if (d.ini < pos || d.fim > texto.length || d.fim <= d.ini) continue;
    if (d.ini > pos) partes.push(texto.slice(pos, d.ini));
    partes.push(<span key={`${d.ini}-${d.fim}`} className={`sub-${d.gravidade}`}>{texto.slice(d.ini, d.fim)}</span>);
    pos = d.fim;
  }
  // o espaço final garante que uma última linha vazia ocupe altura, como no textarea
  partes.push(`${texto.slice(pos)} `);
  return <div ref={ref} className="camada-roteiro" aria-hidden="true">{partes}</div>;
});
