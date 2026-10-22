import { ATORES, MODELOS, ORDEM_ATORES, type ActorId } from '@shared/domain';
import { FORMATOS } from '@shared/constants/video';
import { useEditor } from '@renderer/store/editor-store';
import { FONTES } from '@renderer/features/fontes';
import { useRoteiroEstatico } from '@renderer/features/roteiro';
import { fmtTempo } from '@renderer/features/palco';

/** Aba "Aula": papéis (professor/aluno), fontes, modelos de roteiro, cheat-sheet da câmera. */
export function AulaPanel() {
  const fonteLousa = useEditor((s) => s.fonteLousa);
  const fonteFala = useEditor((s) => s.fonteFala);
  const set = useEditor((s) => s.set);
  useEditor((s) => s.versaoPersonagens); // redesenha quando a lista de personagens muda
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const definirPapeis = useEditor((s) => s.definirPapeis);
  const formato = useEditor((s) => s.formato);
  const { roteiro, timeline } = useRoteiroEstatico();

  const carregarModelo = (texto: string, nome: string) => {
    setRoteiro(texto);
    set({ t: 0, mensagem: `Modelo “${nome}” carregado. Troque o que está entre {chaves}.` });
  };

  return (
    <div className="propriedades">
      <h4>Papéis desta aula</h4>
      <p className="dica">O roteiro fala “Professor” e “Aluno”. Escolha quem cumpre cada papel (a linha <code>[papéis: …]</code> é escrita no topo do roteiro).</p>
      <label className="campo">Professor
        <select value={roteiro.papeis.professor} onChange={(e) => definirPapeis(e.target.value as ActorId, roteiro.papeis.aluno)}>
          {ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}
        </select>
      </label>
      <label className="campo">Aluno
        <select value={roteiro.papeis.aluno} onChange={(e) => definirPapeis(roteiro.papeis.professor, e.target.value as ActorId)}>
          {ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}
        </select>
      </label>

      <h4>Fontes</h4>
      <label className="campo">Fonte da lousa
        <select value={fonteLousa} onChange={(e) => set({ fonteLousa: e.target.value })}>
          {FONTES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </label>
      <label className="campo">Fonte das falas (balões)
        <select value={fonteFala} onChange={(e) => set({ fonteFala: e.target.value })}>
          {FONTES.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </label>
      <p className="dica">O conteúdo da lousa é revelado aos poucos, sem mão nem caneta. Comic Sans é a do sistema; onde não existir (Android) entra a Comic Neue, empacotada no app.</p>

      <h4>Modelos de roteiro</h4>
      <div className="modelos">
        {MODELOS.map((m) => (
          <button key={m.id} className="seq" onClick={() => carregarModelo(m.roteiro, m.nome)}>
            <b>[{m.formato.toUpperCase()}] {m.area}: {m.nome}</b><small>{m.descricao}</small>
          </button>
        ))}
      </div>

      <h4>Câmera</h4>
      <dl className="cheat">
        <dt>[close na lousa]</dt><dd>zoom na lousa; só o conteúdo, personagens somem</dd>
        <dt>[close no professor]</dt><dd>só o rosto (também: aluno, ou o nome: Erika, Dario…)</dd>
        <dt>[plano aberto]</dt><dd>volta ao palco inteiro</dd>
      </dl>
      <h4>Posição no palco</h4>
      <dl className="cheat">
        <dt>Arraste o personagem no palco</dt><dd>grava “Fulano fica na posição N%.”</dd>
        <dt>Fulano anda para a posição 70%.</dt><dd>caminha até lá</dd>
      </dl>

      <h4>Ações ao mesmo tempo</h4>
      <dl className="cheat">
        <dt>Enquanto Professor diz &quot;Oi&quot;, Aluno dança.</dt><dd>as duas começam juntas</dd>
        <dt>Aluno dança enquanto Erika acena.</dt><dd>mesma coisa, em outra ordem</dd>
        <dt>Ao mesmo tempo, Dario pula.</dt><dd>junto com a frase anterior</dd>
        <dt>Ao mesmo tempo: A. B. C.</dt><dd>bloco: tudo no parágrafo roda junto</dd>
      </dl>
      <p className="dica">A próxima ação espera a mais longa terminar. Na linha do tempo, arraste um bloco sobre outro para juntá-los.</p>

      <h4>Cores e destaque na fala</h4>
      <dl className="cheat">
        <dt>[azul:x] · [verde:y]</dt><dd>destaca variáveis com contraste sobre fundo branco</dd>
        <dt>[vermelho:erro] · [laranja:alerta]</dt><dd>cores semânticas para avisos e termos-chave</dd>
        <dt>[marca:fórmula]</dt><dd>fundo estilo marca-texto suave</dd>
        <dt>[#2563eb:termo]</dt><dd>código hexadecimal livre</dd>
      </dl>

      <p className="dica">O que for escrito na lousa se ajusta ao tamanho dela; se não couber nem na menor letra, o editor avisa.</p>

      <h4>Documento</h4>
      <dl>
        <dt>Formato</dt><dd>{FORMATOS[formato].nome}</dd>
        <dt>Duração</dt><dd>{fmtTempo(timeline.duracao)}</dd>
        <dt>Cenas</dt><dd>{timeline.cenas.length}</dd>
        <dt>Ações</dt><dd>{timeline.eventos.length}</dd>
      </dl>
    </div>
  );
}




