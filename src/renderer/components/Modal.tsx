import { useEffect, useRef, type ReactNode } from 'react';

const FOCAVEIS = 'button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/** Pergunta antes de descartar um texto ou uma edição que ainda não foi salva. */
export function confirmarDescarte(): boolean {
  return window.confirm('Há alterações que ainda não foram salvas. Descartar?');
}

/** Para botões de "Fechar" e "Cancelar" dentro do modal: passam pela mesma pergunta que Esc e clique fora. */
export function fecharSeguro(sujo: boolean, fechar: () => void): void {
  if (!sujo || confirmarDescarte()) fechar();
}

/**
 * Casca comum dos modais:
 *  - Esc e clique fora fecham, mas pedem confirmação quando `sujo` (há edição não salva);
 *  - o foco entra no diálogo ao abrir, fica preso nele com Tab e volta para quem abriu ao fechar;
 *  - arrastar a seleção de texto e soltar fora da caixa não fecha o modal (o clique precisa começar e terminar no fundo).
 */
export function Modal({ titulo, sujo = false, onFechar, classe = '', fundoClasse = 'modal-fundo', caixaClasse = 'modal', estilo, children }: {
  titulo: string;
  /** há alterações que se perdem ao fechar: o usuário é perguntado */
  sujo?: boolean;
  onFechar: () => void;
  /** classes extras da caixa (ex.: "largo", "manual") */
  classe?: string;
  /** casca e fundo com estilo próprio (padrão: as do modal comum) */
  fundoClasse?: string;
  caixaClasse?: string;
  /** estilo inline da caixa (ex.: largura fixa de um diálogo pequeno) */
  estilo?: React.CSSProperties;
  children: ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const cliqueComecouNoFundo = useRef(false);

  const fechar = () => {
    if (sujo && !confirmarDescarte()) return;
    onFechar();
  };

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    const primeiro = caixa.current?.querySelector<HTMLElement>(FOCAVEIS);
    (primeiro ?? caixa.current)?.focus();
    return () => { anterior?.focus?.(); };
  }, []);

  const teclas = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      // Esc fecha só este modal: as teclas globais (F1, Espaço, Ctrl+Z) não devem agir por trás dele
      e.stopPropagation();
      e.preventDefault();
      fechar();
      return;
    }
    if (e.key !== 'Tab' || !caixa.current) return;
    const focaveis = [...caixa.current.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((el) => el.offsetParent !== null);
    if (!focaveis.length) return;
    const primeiro = focaveis[0]!;
    const ultimo = focaveis[focaveis.length - 1]!;
    if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === caixa.current)) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  };

  return (
    <div
      className={fundoClasse}
      onMouseDown={(e) => { cliqueComecouNoFundo.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (cliqueComecouNoFundo.current && e.target === e.currentTarget) fechar(); }}
      onKeyDown={teclas}
    >
      <div ref={caixa} className={`${caixaClasse} ${classe}`.trim()} style={estilo} role="dialog" aria-modal="true" aria-label={titulo} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}
