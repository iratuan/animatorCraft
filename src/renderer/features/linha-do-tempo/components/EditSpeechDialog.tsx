import { useState, useEffect } from 'react';
import { ATORES, type Evento } from '@shared/domain';

interface EditSpeechDialogProps {
  open: boolean;
  evento: Evento | null;
  onClose: () => void;
  onSave: (novoTexto: string) => void;
}

export default function EditSpeechDialog({ open, evento, onClose, onSave }: EditSpeechDialogProps) {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (evento && evento.acao && evento.acao.tipo === 'fala') {
      setTexto(evento.acao.texto);
    } else {
      setTexto('');
    }
  }, [evento]);

  if (!open) return null;

  const nomeAtor =
    evento && evento.acao.tipo === 'fala'
      ? (ATORES[evento.acao.ator]?.nome ?? evento.acao.ator)
      : 'Personagem';

  return (
    <div className="modal-fundo" onClick={onClose}>
      <div
        className="modal"
        style={{ width: 480, maxWidth: '92vw' }}
        role="dialog"
        aria-label="Editar fala do personagem"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>✏️ Editar fala: {nomeAtor}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            style={{
              fontSize: '18px',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: 4,
              color: 'var(--txt2)',
            }}
          >
            ✕
          </button>
        </div>

        <div className="campo">
          <label htmlFor="texto-fala-textarea" style={{ marginBottom: 4, color: 'var(--txt2)', fontSize: '12px' }}>
            Texto da fala no roteiro:
          </label>
          <textarea
            id="texto-fala-textarea"
            rows={5}
            style={{
              width: '100%',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              fontSize: '13px',
            }}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Digite o texto da fala..."
            autoFocus
          />
        </div>

        <div className="modal-botoes" style={{ marginTop: 16 }}>
          <button type="button" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="primario"
            disabled={!texto.trim()}
            onClick={() => onSave(texto.trim())}
          >
            Salvar fala
          </button>
        </div>
      </div>
    </div>
  );
}
