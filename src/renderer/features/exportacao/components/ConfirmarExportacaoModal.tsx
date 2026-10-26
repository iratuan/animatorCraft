import { useEditor } from '@renderer/store/editor-store';
import { Modal } from '@renderer/components/Modal';
import { EVENTO_IR_PARA_TRECHO } from '@shared/constants/eventos';

export type EscolhaExportacao = 'exportar' | 'corrigir' | 'cancelar';

// resposta pendente: quem chamou `confirmarExportacao` espera nesta promessa
let responder: ((escolha: EscolhaExportacao) => void) | null = null;

/**
 * Antes de exportar, mostra as frases que não serão executadas e pergunta o que fazer.
 * "Corrigir" leva o cursor até a primeira frase com erro e não exporta.
 */
export function confirmarExportacao(erros: { mensagem: string; ini: number; fim: number }[]): Promise<EscolhaExportacao> {
  responder?.('cancelar');
  return new Promise((resolver) => {
    responder = resolver;
    useEditor.getState().set({ pedidoExportacao: { erros } });
  });
}

function concluir(escolha: EscolhaExportacao): void {
  const r = responder;
  responder = null;
  useEditor.getState().set({ pedidoExportacao: null });
  r?.(escolha);
}

/** Montado uma vez na página do editor. */
export function ConfirmarExportacaoModal() {
  const pedido = useEditor((s) => s.pedidoExportacao);
  if (!pedido) return null;
  const total = pedido.erros.length;
  const primeira = pedido.erros[0]!;
  return (
    <Modal titulo="Exportar com frases que não serão executadas" onFechar={() => concluir('cancelar')} classe="confirmar-exportacao">
      <h3>{total === 1 ? '1 frase não será executada' : `${total} frases não serão executadas`}</h3>
      <p className="dica">O vídeo sai sem essas frases. Você pode corrigi-las antes de exportar.</p>
      <ul className="lista-erros">
        {pedido.erros.slice(0, 5).map((e, i) => <li key={i}>✖ {e.mensagem}</li>)}
        {total > 5 && <li>… e mais {total - 5}.</li>}
      </ul>
      <div className="modal-botoes">
        <button type="button" onClick={() => concluir('cancelar')}>Cancelar</button>
        <button type="button" onClick={() => concluir('exportar')}>Exportar mesmo assim</button>
        <button type="button" className="primario" autoFocus onClick={() => {
          concluir('corrigir');
          // depois que o modal fecha (ele devolve o foco a quem o abriu), o roteiro recebe o cursor
          setTimeout(() => window.dispatchEvent(new CustomEvent(EVENTO_IR_PARA_TRECHO, { detail: { ini: primeira.ini, fim: primeira.fim } })), 0);
        }}>
          Corrigir primeira frase
        </button>
      </div>
    </Modal>
  );
}
