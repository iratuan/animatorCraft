import { useEditor } from '@renderer/store/editor-store';
import { Painel } from '@renderer/components/Painel';
import { inserirNoCursor } from '@shared/domain';
import { useRoteiroEstatico } from '../hooks/useRoteiroDerivado';

const chipEstilo: React.CSSProperties = {
  fontSize: '11px',
  padding: '2px 8px',
  borderRadius: 12,
  background: '#333',
  color: '#ddd',
  border: '1px solid #444',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function RoteiroPanel() {
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const set = useEditor((s) => s.set);
  // lembra onde o cursor está para inserir imagens, falas e clipes no trecho certo do roteiro
  const marcar = (e: React.SyntheticEvent<HTMLTextAreaElement>) => set({ cursorRoteiro: e.currentTarget.selectionStart });
  const { avisos, timeline } = useRoteiroEstatico();
  const irParaCena = (inicio: number) => set({ t: inicio, tocando: false });

  const inserirTrecho = (trecho: string) => {
    const cursor = useEditor.getState().cursorRoteiro ?? roteiro.length;
    const novo = inserirNoCursor(roteiro, cursor, trecho);
    setRoteiro(novo);
    set({ mensagem: `Inserido: “${trecho}”` });
  };

  return (
    <Painel
      titulo="Roteiro"
      className="roteiro"
      acoes={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {timeline.cenas.length > 1 && (
            <select
              style={{ fontSize: '0.8em', padding: '1px 4px', borderRadius: 4, background: 'var(--bg-elevado, #222)', color: 'inherit', border: '1px solid #444' }}
              title="Saltar para cena"
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (timeline.cenas[idx]) irParaCena(timeline.cenas[idx]!.inicio);
              }}
            >
              <option value="">Ir para cena…</option>
              {timeline.cenas.map((c, i) => (
                <option key={i} value={i}>
                  {i + 1}. {c.titulo} ({c.inicio.toFixed(1)}s)
                </option>
              ))}
            </select>
          )}
          <span className={`badge ${avisos.length ? 'aviso' : 'ok'}`}>{avisos.length ? `${avisos.length} aviso(s)` : 'sem avisos'}</span>
        </div>
      }
    >
      <div className="chips-roteiro" style={{ display: 'flex', gap: 4, padding: '4px 8px', background: '#222', borderBottom: '1px solid #1a1a1a', overflowX: 'auto' }}>
        <button type="button" onClick={() => inserirTrecho('Erika diz "Olá!" feliz.')} style={chipEstilo} title="Inserir fala de personagem">+ Fala</button>
        <button type="button" onClick={() => inserirTrecho('Dario entra pela direita andando.')} style={chipEstilo} title="Inserir entrada em cena">+ Entrar</button>
        <button type="button" onClick={() => inserirTrecho('Erika escreve "Texto" no quadro.')} style={chipEstilo} title="Inserir escrita no quadro">+ Lousa</button>
        <button type="button" onClick={() => set({ editorMatematicaAberto: true, abaMatematicaInicial: 'latex' })} style={{ ...chipEstilo, borderColor: '#0284c7', color: '#38bdf8' }} title="Abrir editor de fórmulas LaTeX">+ LaTeX</button>
        <button type="button" onClick={() => set({ editorMatematicaAberto: true, abaMatematicaInicial: 'grafico' })} style={{ ...chipEstilo, borderColor: '#0284c7', color: '#38bdf8' }} title="Abrir editor de gráfico de funções f(x)">+ Gráfico f(x)</button>
        <button type="button" onClick={() => inserirTrecho('[câmera: lousa]')} style={chipEstilo} title="Inserir foco de câmera">[câmera]</button>
        <button type="button" onClick={() => inserirTrecho('Espera 1 segundos.')} style={chipEstilo} title="Inserir pausa no vídeo">+ Pausa</button>
      </div>
      <textarea id="campo-roteiro" spellCheck={false} value={roteiro} onChange={(e) => { setRoteiro(e.target.value); marcar(e); }} onSelect={marcar} onClick={marcar} onKeyUp={marcar} />
      {avisos.length > 0 && <ul className="avisos">{avisos.map((a, i) => <li key={i}>⚠ {a}</li>)}</ul>}
    </Painel>
  );
}

