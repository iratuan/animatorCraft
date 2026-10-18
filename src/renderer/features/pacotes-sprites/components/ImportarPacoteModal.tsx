import { ATORES, type ActorId } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { aplicarPacote } from '../services/pacotes';

/** Relatório de validação do pacote de sprites antes de importar. Erros de nome bloqueiam; avisos não. */
export function ImportarPacoteModal() {
  const importacao = useEditor((s) => s.importacao);
  const set = useEditor((s) => s.set);
  const novaVersao = useEditor((s) => s.novaVersaoBib);
  if (!importacao) return null;

  const r = importacao.pacote.relatorio;
  const bloqueado = r.erros.length > 0;
  const fechar = () => set({ importacao: null });

  const confirmar = async () => {
    set({ mensagem: 'Importando sprites…' });
    const { importados, falhas } = await aplicarPacote(importacao.pacote, importacao.substituir);
    set({ importacao: null });
    novaVersao();
    set({ mensagem: falhas.length ? `Importados ${importados} sprites; ${falhas.length} falharam: ${falhas[0]}` : `Pacote importado: ${importados} sprites. A biblioteca e as animações já usam os novos sprites.` });
  };

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal" role="dialog" aria-label="Importar pacote de sprites" onClick={(e) => e.stopPropagation()}>
        <h3>Importar pacote de sprites</h3>
        <p className="dica">{importacao.nome} — {r.sprites.length} sprite(s) reconhecido(s)</p>
        {Object.entries(r.resumo).map(([id, s]) => (
          <div key={id} className="resumo-pacote">
            <b>{ATORES[id as ActorId]?.nome ?? importacao.pacote.fichas[id]?.nome ?? id}{importacao.pacote.fichas[id] ? ' (personagem novo)' : ''}</b>
            <span>{s.poses.length} poses{Object.keys(s.quadros).length ? ` (animações: ${Object.entries(s.quadros).map(([n, q]) => `${n}×${q}`).join(', ')})` : ''} · {s.rostos.length} rostos · {s.props.length} props</span>
          </div>
        ))}
        {r.erros.length > 0 && <ul className="erros-pacote">{r.erros.map((e, i) => <li key={i}>✖ {e}</li>)}</ul>}
        {r.avisos.length > 0 && <ul className="avisos-pacote">{r.avisos.map((e, i) => <li key={i}>⚠ {e}</li>)}</ul>}
        <label className="campo-check">
          <input type="checkbox" checked={importacao.substituir} onChange={(e) => set({ importacao: { ...importacao, substituir: e.target.checked } })} />
          Substituir todos os sprites antigos dos personagens deste pacote (recomendado quando o pacote traz uma ficha completa)
        </label>
        <div className="modal-botoes">
          <button onClick={fechar}>Cancelar</button>
          <button className="primario" disabled={bloqueado} onClick={confirmar}>{bloqueado ? 'Corrija os erros e tente de novo' : 'Importar'}</button>
        </div>
      </div>
    </div>
  );
}

