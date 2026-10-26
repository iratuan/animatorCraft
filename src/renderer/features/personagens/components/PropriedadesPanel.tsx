import {
  ATORES, expressoesDe, FRASE_POSE, NOME_EXPRESSAO, NOME_POSE, POSES, POSES_DE_DANCA,
  type ExpressaoId, type PoseId,
} from '@shared/domain';
import { Miniatura } from '@renderer/components/Miniatura';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro';

/** Propriedades do personagem selecionado: danças, poses, poses e expressões vindas de pacotes importados. */
export function PropriedadesPanel() {
  const selecionado = useEditor((s) => s.selecionado);
  const inserir = useEditor((s) => s.inserir);
  const set = useEditor((s) => s.set);
  const { estado, roteiro } = useRoteiroDerivado();

  if (!selecionado) {
    return <div className="propriedades"><p className="dica">Clique em um personagem no palco ou na biblioteca para ver suas poses e danças. A aba “Aula” escolhe os papéis, os modelos e mostra a sintaxe da câmera.</p></div>;
  }
  const espec = ATORES[selecionado]!;
  const nome = espec.nome;
  const a = estado.atores[selecionado];
  if (!a) return <div className="propriedades"><p className="dica">Atualizando personagens…</p></div>;
  const papel = selecionado === roteiro.papeis.professor ? 'Professor' : selecionado === roteiro.papeis.aluno ? 'Aluno' : null;
  const gridPoses = POSES.filter((p: PoseId) => FRASE_POSE[p] && !POSES_DE_DANCA.includes(p));

  return (
    <div className="propriedades">
      <div className="ator-cab">
        <Miniatura ator={selecionado} pose={a.pose} expressao={a.expressao} tamanho={84} />
        <div>
          <b>{nome}</b> <em className="idade">{espec.idade}</em>
          {papel && <span className="papel">{papel}</span>}
          <p>{espec.descricao}</p>
        </div>
      </div>

      <div className="acoes-ficha">
        {espec.personalizado ? (
          <button onClick={() => set({ fichaPersonagem: { id: selecionado } })}>Editar ficha</button>
        ) : (
          <button onClick={() => set({ fichaPersonagem: { id: selecionado } })}>🎨 Ficha do personagem</button>
        )}
        <button onClick={() => set({ fichaPersonagem: { duplicarDe: selecionado } })}>Duplicar como novo</button>
      </div>

          <h4>Danças <small>clique para inserir no roteiro</small></h4>
          <div className="grade">
            {POSES_DE_DANCA.map((p: PoseId) => (
              <button key={p} className={a.pose === p ? 'on' : ''} title={NOME_POSE[p]} onClick={() => inserir(`${nome} ${FRASE_POSE[p]} por 4 segundos.`)}>
                <Miniatura ator={selecionado} pose={p} tamanho={72} /><span>{NOME_POSE[p]}</span>
              </button>
            ))}
          </div>
          <h4>Poses e movimentos</h4>
          <div className="grade">
            {gridPoses.map((p: PoseId) => (
              <button key={p} className={a.pose === p ? 'on' : ''} title={NOME_POSE[p]} onClick={() => inserir(`${nome} ${FRASE_POSE[p]}.`)}>
                <Miniatura ator={selecionado} pose={p} tamanho={72} /><span>{NOME_POSE[p]}</span>
              </button>
            ))}
          </div>
          <h4>Expressão <small>clique para inserir no roteiro</small></h4>
          <div className="grade">
            {expressoesDe(selecionado).map((x) => (
              <button key={x} className={a.expressao === x ? 'on' : ''} title={NOME_EXPRESSAO[x as ExpressaoId] ?? x} onClick={() => inserir(`${nome} faz cara de ${x}.`)}>
                <Miniatura ator={selecionado} expressao={x} tamanho={72} modo="rosto" /><span>{NOME_EXPRESSAO[x as ExpressaoId] ?? x}</span>
              </button>
            ))}
          </div>
          <button className="botao-editar-clipes" onClick={() => set({ editorAnimacao: { ator: selecionado } })}>Expressões e clipes de {nome}…</button>
    </div>
  );
}





