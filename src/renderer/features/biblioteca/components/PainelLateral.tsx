import { Painel } from '@renderer/components/Painel';
import { useEditor, type AbaLateral } from '@renderer/store/editor-store';
import { AulaPanel } from '@renderer/features/aula/components/AulaPanel';
import { BibliotecaPanel } from './BibliotecaPanel';
import { PropriedadesPanel } from './PropriedadesPanel';

const ABAS: { id: AbaLateral; rotulo: string }[] = [
  { id: 'props', rotulo: 'Propriedades' },
  { id: 'biblioteca', rotulo: 'Biblioteca' },
  { id: 'aula', rotulo: 'Aula' },
];

export function PainelLateral() {
  const aba = useEditor((s) => s.aba);
  const set = useEditor((s) => s.set);
  return (
    <Painel
      className="props"
      titulo={<div className="abas">{ABAS.map((a) => <button key={a.id} className={aba === a.id ? 'on' : ''} onClick={() => set({ aba: a.id })}>{a.rotulo}</button>)}</div>}
    >
      {aba === 'aula' ? <AulaPanel /> : aba === 'biblioteca' ? <BibliotecaPanel /> : <PropriedadesPanel />}
    </Painel>
  );
}
