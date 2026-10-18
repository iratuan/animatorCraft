import { useEffect, useState } from 'react';
import { ATORES, EXPRESSOES, POSES_DE_DANCA, NOME_POSE, type ActorId, type ExpressaoId, type ModeloPalito } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { excluirPersonagem, salvarPersonagem } from '../services/cadastro';

const MODELOS: { id: ModeloPalito; nome: string }[] = [
  { id: 'professor', nome: 'Adulto de jaleco' }, { id: 'aluno', nome: 'Pré-adolescente' }, { id: 'mae', nome: 'Adulta de cabelo longo' },
  { id: 'cacula', nome: 'Criança pequena' }, { id: 'priminha', nome: 'Menininha' },
];

interface Form { nome: string; apelidos: string; idade: string; descricao: string; altura: number; modelo: ModeloPalito; expressao: ExpressaoId; danca: string }
const VAZIO: Form = { nome: '', apelidos: '', idade: '', descricao: '', altura: 440, modelo: 'aluno', expressao: 'feliz', danca: 'danca_atual' };

/**
 * Ficha do personagem: cria um personagem novo, edita um criado por você ou duplica qualquer um (inclusive os do elenco original).
 * Depois de salvar, os espaços de sprites ficam no editor de sprites, prontos para receber os PNGs.
 */
export function PersonagemModal() {
  const aberta = useEditor((s) => s.fichaPersonagem);
  const set = useEditor((s) => s.set);
  const novaVersao = useEditor((s) => s.novaVersaoPersonagens);
  const [f, setF] = useState<Form>(VAZIO);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setErro('');
    if (!aberta) return;
    const base = aberta.id ?? aberta.duplicarDe;
    const a = base ? ATORES[base] : undefined;
    setF(a ? {
      nome: aberta.duplicarDe ? `${a.nome} 2` : a.nome, apelidos: aberta.duplicarDe ? '' : a.apelidos.slice(1).join(', '), idade: a.idade, descricao: a.descricao,
      altura: a.altura, modelo: a.modeloPalito, expressao: a.expressaoPadrao, danca: a.dancaPadrao ?? 'danca_atual',
    } : VAZIO);
  }, [aberta]);
  if (!aberta) return null;

  const editando = !!aberta.id;
  const fechar = () => set({ fichaPersonagem: null });
  const campo = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  const salvar = () => {
    const r = salvarPersonagem({
      nome: f.nome, apelidos: f.apelidos.split(',').map((s) => s.trim()).filter(Boolean), idade: f.idade, descricao: f.descricao,
      altura: f.altura, modeloPalito: f.modelo, expressaoPadrao: f.expressao, dancaPadrao: f.danca,
    }, aberta.id);
    if ('erro' in r) { setErro(r.erro); return; }
    novaVersao();
    set({ fichaPersonagem: null, selecionado: r.id, mensagem: editando ? `${f.nome} atualizado.` : `${f.nome} criado. Abra “Editar / exportar sprites” para enviar os PNGs de cada pose e expressão; até lá aparece como boneco de palito.` });
  };
  const excluir = async () => {
    if (!aberta.id || !window.confirm(`Excluir ${ATORES[aberta.id]!.nome} e os sprites dele? Isso não afeta os personagens originais.`)) return;
    await excluirPersonagem(aberta.id);
    novaVersao();
    set({ fichaPersonagem: null, selecionado: 'cringefather', mensagem: 'Personagem excluído.' });
  };

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal" role="dialog" aria-label="Ficha do personagem" onClick={(e) => e.stopPropagation()}>
        <h3>{editando ? `Editar ${ATORES[aberta.id!]!.nome}` : aberta.duplicarDe ? `Duplicar ${ATORES[aberta.duplicarDe]!.nome}` : 'Novo personagem'}</h3>
        <p className="dica">O nome (e os apelidos) é como o roteiro chama o personagem. Os sprites de cada pose e expressão você envia depois, no editor de sprites.</p>
        <label className="campo">Nome<input value={f.nome} autoFocus onChange={(e) => campo('nome', e.target.value)} placeholder="ex.: Tia Marta" /></label>
        <label className="campo">Outros nomes no roteiro <small>(separados por vírgula)</small><input value={f.apelidos} onChange={(e) => campo('apelidos', e.target.value)} placeholder="ex.: tia, martinha" /></label>
        <div className="duas-colunas">
          <label className="campo">Idade<input value={f.idade} onChange={(e) => campo('idade', e.target.value)} placeholder="ex.: 38 anos" /></label>
          <label className="campo">Altura no palco: {f.altura}<input type="range" min={240} max={620} step={5} value={f.altura} onChange={(e) => campo('altura', Number(e.target.value))} /></label>
        </div>
        <label className="campo">Descrição<textarea rows={2} value={f.descricao} onChange={(e) => campo('descricao', e.target.value)} placeholder="Aparência e personalidade (ajuda a lembrar)" /></label>
        <div className="duas-colunas">
          <label className="campo">Boneco de palito base
            <select value={f.modelo} onChange={(e) => campo('modelo', e.target.value as ModeloPalito)}>{MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
          </label>
          <label className="campo">Expressão padrão
            <select value={f.expressao} onChange={(e) => campo('expressao', e.target.value as ExpressaoId)}>{EXPRESSOES.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          </label>
        </div>
        <label className="campo">Dança padrão (“{f.nome || 'Fulano'} dança.”)
          <select value={f.danca} onChange={(e) => campo('danca', e.target.value)}>{POSES_DE_DANCA.map((p) => <option key={p} value={p}>{NOME_POSE[p]}</option>)}</select>
        </label>
        {erro && <ul className="erros-pacote"><li>✖ {erro}</li></ul>}
        <div className="modal-botoes">
          {editando && <button className="perigo" onClick={() => void excluir()}>Excluir</button>}
          <button onClick={fechar}>Cancelar</button>
          <button className="primario" disabled={!f.nome.trim()} onClick={salvar}>{editando ? 'Salvar' : 'Criar personagem'}</button>
        </div>
      </div>
    </div>
  );
}

export type { ActorId };
