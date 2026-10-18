import { useEditor } from '@renderer/store/editor-store';
import { Painel } from '@renderer/components/Painel';
import { useRoteiroDerivado } from '../hooks/useRoteiroDerivado';

export function RoteiroPanel() {
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const { avisos } = useRoteiroDerivado();
  return (
    <Painel titulo="Roteiro" className="roteiro" acoes={<span className={`badge ${avisos.length ? 'aviso' : 'ok'}`}>{avisos.length ? `${avisos.length} aviso(s)` : 'sem avisos'}</span>}>
      <textarea id="campo-roteiro" spellCheck={false} value={roteiro} onChange={(e) => setRoteiro(e.target.value)} />
      {avisos.length > 0 && <ul className="avisos">{avisos.map((a, i) => <li key={i}>⚠ {a}</li>)}</ul>}
    </Painel>
  );
}
