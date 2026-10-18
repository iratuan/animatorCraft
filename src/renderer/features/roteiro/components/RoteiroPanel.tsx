import { useEditor } from '@renderer/store/editor-store';
import { Painel } from '@renderer/components/Painel';
import { useRoteiroDerivado } from '../hooks/useRoteiroDerivado';

export function RoteiroPanel() {
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const set = useEditor((s) => s.set);
  // lembra onde o cursor está para inserir imagens, falas e clipes no trecho certo do roteiro
  const marcar = (e: React.SyntheticEvent<HTMLTextAreaElement>) => set({ cursorRoteiro: e.currentTarget.selectionStart });
  const { avisos } = useRoteiroDerivado();
  return (
    <Painel titulo="Roteiro" className="roteiro" acoes={<span className={`badge ${avisos.length ? 'aviso' : 'ok'}`}>{avisos.length ? `${avisos.length} aviso(s)` : 'sem avisos'}</span>}>
      <textarea id="campo-roteiro" spellCheck={false} value={roteiro} onChange={(e) => { setRoteiro(e.target.value); marcar(e); }} onSelect={marcar} onClick={marcar} onKeyUp={marcar} />
      {avisos.length > 0 && <ul className="avisos">{avisos.map((a, i) => <li key={i}>⚠ {a}</li>)}</ul>}
    </Painel>
  );
}

