import { ATORES, ORDEM_ATORES, roteiroDaSequencia, sequenciasPara } from '@shared/domain';
import { Miniatura } from '@renderer/components/Miniatura';
import { useEditor } from '@renderer/store/editor-store';

const GRUPOS = ['Comemoração', 'Encerramento', 'Dança', 'Reação', 'Expressões'] as const;

/** Biblioteca: personagens e os clipes/sequências prontos (inserem um trecho de roteiro). */
export function BibliotecaPanel() {
  const selecionado = useEditor((s) => s.selecionado);
  const set = useEditor((s) => s.set);
  useEditor((s) => s.versaoPersonagens); // redesenha quando a lista de personagens muda
  const inserir = useEditor((s) => s.inserir);
  const ator = selecionado ?? 'cringefather';
  const nome = ATORES[ator]!.nome;

  return (
    <div className="biblioteca">
      <h4>Personagens</h4>
      <button className="botao-novo-personagem" onClick={() => set({ fichaPersonagem: {} })}>＋ Novo personagem</button>
      {ORDEM_ATORES.map((id) => (
        <button key={id} className={`ficha ${selecionado === id ? 'on' : ''}`} onClick={() => set({ selecionado: id, aba: 'props' })}>
          <Miniatura ator={id} expressao={ATORES[id]!.expressaoPadrao} tamanho={72} />
          <b>{ATORES[id]!.nome} <em>{ATORES[id]!.idade}</em></b><small>{ATORES[id]!.descricao}</small>
        </button>
      ))}
      <h4>Clipes e sequências <small>para {nome} — clique para inserir</small></h4>
      {GRUPOS.map((cat) => {
        const lista = sequenciasPara(ator).filter((s) => s.categoria === cat);
        return lista.length === 0 ? null : (
          <div key={cat} className="grupo-seq">
            <span className="cat">{cat}</span>
            {lista.map((s) => (
              <button key={s.id} className="seq" title={roteiroDaSequencia(s, ator)} onClick={() => { inserir(roteiroDaSequencia(s, ator)); set({ mensagem: `Clipe “${s.nome}” inserido.` }); }}>
                <b>{s.nome}</b><small>{s.descricao}</small>
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}


