import { Painel } from '@renderer/components/Painel';
import { useEditor, type AbaLateral } from '@renderer/store/editor-store';
import { AulaPanel } from '@renderer/features/aula';
import { ImagensPanel } from '@renderer/features/imagens';
import { AudioPanel } from '@renderer/features/audio';
import { BibliotecaPanel } from '@renderer/features/biblioteca';
import { PropriedadesPanel } from '@renderer/features/personagens';

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
      titulo={
        <>
          {/* janela larga: abas lado a lado */}
          <div className="abas" role="tablist" aria-label="Painel de propriedades">
            {ABAS.map((a) => (
              <button key={a.id} role="tab" aria-selected={aba === a.id} className={aba === a.id ? 'on' : ''} onClick={() => set({ aba: a.id })}>{a.rotulo}</button>
            ))}
          </div>
          {/* janela estreita: as mesmas abas num seletor compacto, para nenhuma ficar cortada */}
          <select className="abas-compacto" aria-label="Aba do painel" value={aba} onChange={(e) => set({ aba: e.target.value as AbaLateral })}>
            {ABAS.map((a) => <option key={a.id} value={a.id}>{a.rotulo}</option>)}
          </select>
        </>
      }
    >
      {aba === 'aula' ? <AulaPanel /> : aba === 'imagens' ? <ImagensPanel /> : aba === 'audio' ? <AudioPanel /> : aba === 'biblioteca' ? <BibliotecaPanel /> : <PropriedadesPanel />}
    </Painel>
  );
}
