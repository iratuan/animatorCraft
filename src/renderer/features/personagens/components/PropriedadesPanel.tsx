import {
  ATORES, expressoesDe, FRASE_POSE, NOME_EXPRESSAO, NOME_POSE, POSES, POSES_CONHECIDAS, POSES_DE_DANCA, ROSTOS_ESPECIAIS,
  type ExpressaoId, type PoseId,
} from '@shared/domain';
import { listarSprites, possuiSprites } from '@renderer/features/cena';
import { Miniatura } from '@renderer/components/Miniatura';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro';

/** Propriedades do personagem selecionado: danças, poses, poses e expressões vindas de pacotes importados. */
export function PropriedadesPanel() {
  const selecionado = useEditor((s) => s.selecionado);
  const inserir = useEditor((s) => s.inserir);
  const set = useEditor((s) => s.set);
  const versaoBib = useEditor((s) => s.versaoBib);
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
          <button onClick={() => set({ fichaPersonagem: { id: selecionado } })}>🎨 Ficha & Vetores SVG</button>
        )}
        <button onClick={() => set({ fichaPersonagem: { duplicarDe: selecionado } })}>Duplicar como novo</button>
      </div>

      {espec.temSprites || possuiSprites(selecionado) || espec.personalizado ? (
        <>
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
          <PacoteDoPersonagem ator={selecionado} versao={versaoBib} nome={nome} />
          <button className="botao-editar-sprites" onClick={() => set({ editorPersonagem: selecionado })}>Editar / exportar sprites de {nome}</button>
          <button className="botao-editar-sprites" onClick={() => set({ editorAnimacao: { ator: selecionado } })}>Expressões e clipes de {nome}…</button>
        </>
      ) : (
        <>
          <p className="dica">Ficha de sprites pendente: este personagem aparece como boneco de reserva. Importe um pacote (Arquivo → Importar pacote de sprites).</p>
          <h4>Expressão <small>clique para inserir no roteiro</small></h4>
          <div className="grade">
            {expressoesDe(selecionado).map((x) => (
              <button key={x} className={a.expressao === x ? 'on' : ''} title={NOME_EXPRESSAO[x as ExpressaoId] ?? x} onClick={() => inserir(`${nome} faz cara de ${x}.`)}>
                <Miniatura ator={selecionado} expressao={x} tamanho={72} modo="rosto" /><span>{NOME_EXPRESSAO[x as ExpressaoId] ?? x}</span>
              </button>
            ))}
          </div>
          <button className="botao-editar-sprites" onClick={() => set({ editorAnimacao: { ator: selecionado } })}>Expressões e clipes de {nome}…</button>
        </>
      )}
    </div>
  );
}

/** O que o pacote de sprites do personagem trouxe além do básico (poses novas, expressões, fonemas, animações). */
function PacoteDoPersonagem({ ator, versao, nome }: { ator: Parameters<typeof listarSprites>[0]; versao: number; nome: string }) {
  const inserir = useEditor((s) => s.inserir);
  const tem = listarSprites(ator);
  const extras = tem.poses.filter((p) => !POSES_CONHECIDAS.includes(p));
  const rostos = tem.rostos.filter((r) => !ROSTOS_ESPECIAIS.includes(r)); // as padrão e as criadas para o personagem
  const fonemas = tem.rostos.filter((r) => r.startsWith('boca-')).length;
  return (
    <>
      {extras.length > 0 && (<>
        <h4>Poses do pacote <small>“{nome} faz a pose …”</small></h4>
        <div className="grade">
          {extras.map((p) => (
            <button key={`${p}-${versao}`} title={p} onClick={() => inserir(`${nome} faz a pose ${p}.`)}>
              <Miniatura ator={ator} etiqueta={p} tamanho={72} /><span>{p}</span>
            </button>
          ))}
        </div>
      </>)}
      {rostos.length > 0 && (<>
        <h4>Expressões do pacote</h4>
        <div className="grade">
          {rostos.map((r) => (
            <button key={`${r}-${versao}`} onClick={() => inserir(`${nome} faz cara de ${r}.`)}>
              <Miniatura ator={ator} expressao={r} tamanho={72} modo="rosto" /><span>{NOME_EXPRESSAO[r as ExpressaoId] ?? r}</span>
            </button>
          ))}
        </div>
      </>)}
      <p className="dica">
        {Object.keys(tem.quadros).length > 0 && `Animações por quadros: ${Object.entries(tem.quadros).map(([n, q]) => `${n} (${q})`).join(', ')}. `}
        {fonemas >= 4 ? 'Boca em sincronia com a fala: ativa. ' : 'Boca em sincronia: faltam rosto_boca-a, -e, -o e -m no pacote. '}
        {tem.rostos.includes('olhos-fechados') ? 'Piscada: ativa. ' : 'Piscada: falta rosto_olhos-fechados. '}
        Novos sprites entram por Arquivo → Importar pacote (padrão em docs/SPRITES.md).
      </p>
    </>
  );
}




