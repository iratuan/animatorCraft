import { Painel } from '@renderer/components/Painel';
import { useEditor, type AbaLateral } from '@renderer/store/editor-store';
import { AulaPanel } from '@renderer/features/aula/components/AulaPanel';
import { ImagensPanel } from '@renderer/features/imagens/components/ImagensPanel';
import { AudioPanel } from '@renderer/features/audio/components/AudioPanel';
import { BibliotecaPanel } from './BibliotecaPanel';
import { PropriedadesPanel } from './PropriedadesPanel';

const ABAS: { id: AbaLateral; rotulo: string }[] = [
  { id: 'props', rotulo: 'Personagem' },
  { id: 'biblioteca', rotulo: 'Biblioteca' },
  { id: 'imagens', rotulo: 'Imagens' },
  { id: 'audio', rotulo: 'Áudio' },
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
      {aba === 'aula' ? <AulaPanel /> : aba === 'imagens' ? <ImagensPanel /> : aba === 'audio' ? <AudioPanel /> : aba === 'biblioteca' ? <BibliotecaPanel /> : <PropriedadesPanel />}
    </Painel>
  );
}


