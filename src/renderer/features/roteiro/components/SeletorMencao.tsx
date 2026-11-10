import { Fragment } from 'react';

/** Item do seletor: `escolher` insere a opção no roteiro. */
export interface ItemSeletor { chave: string; rotulo: string; detalhe: string; grupo?: string; escolher: () => void }

interface Props {
  itens: ItemSeletor[];
  selecionado: number;
  /** posição em px dentro do contêiner do textarea */
  posicao: { top: number; left: number; altura: number };
  onPassar: (indice: number) => void;
}

/** Lista que aparece junto ao cursor do roteiro ("@" ou "[["). Não rouba o foco: o textarea continua com o cursor. */
export function SeletorMencao({ itens, selecionado, posicao, onPassar }: Props) {
  return (
    <ul
      className="seletor-mencao"
      role="listbox"
      aria-label="Sugestões do roteiro"
      style={{ top: posicao.top + posicao.altura + 4, left: Math.max(0, posicao.left) }}
    >
      {itens.map((o, i) => (
        <Fragment key={o.chave}>
          {o.grupo && (i === 0 || itens[i - 1]!.grupo !== o.grupo) && <li className="grupo" role="presentation">{o.grupo}</li>}
          <li
            role="option"
            aria-selected={i === selecionado}
            className={i === selecionado ? 'ativo' : undefined}
            onMouseMove={() => { if (i !== selecionado) onPassar(i); }}
            // mousedown (e não click) e sem trocar o foco: o textarea continua com o cursor
            onMouseDown={(e) => { e.preventDefault(); o.escolher(); }}
          >
            <span className="nome">{o.rotulo}</span>
            <span className="detalhe">{o.detalhe}</span>
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
