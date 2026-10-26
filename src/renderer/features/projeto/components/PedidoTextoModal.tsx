import { useEffect, useState } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { Modal } from '@renderer/components/Modal';

// resposta pendente: quem chamou `pedirTexto` espera nesta promessa
let responder: ((texto: string | null) => void) | null = null;

/**
 * Pergunta um texto dentro do app (o `window.prompt` não existe no Electron).
 * Devolve o texto digitado, ou null se o usuário cancelou.
 */
export function pedirTexto(titulo: string, valor: string): Promise<string | null> {
  responder?.(null); // um pedido novo cancela o anterior, se ainda estiver aberto
  return new Promise((resolver) => {
    responder = resolver;
    useEditor.getState().set({ pedidoTexto: { titulo, valor } });
  });
}

function concluir(texto: string | null): void {
  const r = responder;
  responder = null;
  useEditor.getState().set({ pedidoTexto: null });
  r?.(texto);
}

/** Montado uma vez na página do editor: mostra o pedido quando `pedirTexto` é chamado. */
export function PedidoTextoModal() {
  const pedido = useEditor((s) => s.pedidoTexto);
  const [texto, setTexto] = useState('');

  useEffect(() => { if (pedido) setTexto(pedido.valor); }, [pedido]);

  if (!pedido) return null;
  return (
    <Modal titulo={pedido.titulo} onFechar={() => concluir(null)} classe="pedido-texto">
      <form onSubmit={(e) => { e.preventDefault(); concluir(texto); }}>
        <h3>{pedido.titulo}</h3>
        <div className="campo">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} aria-label={pedido.titulo} autoFocus />
        </div>
        <div className="modal-botoes">
          <button type="button" onClick={() => concluir(null)}>Cancelar</button>
          <button type="submit" className="primario">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
