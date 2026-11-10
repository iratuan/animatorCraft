import { useEffect, useState } from 'react';
import {
  ATORES, EXPRESSOES, POSES_DE_DANCA, NOME_POSE,
  gerarSvgCabeca, gerarSvgCompleto,
  serializarPersonagemJSON, clipesPersonalizados,
  type ActorId, type ExpressaoId, type ModeloPalito, type PoseId,
} from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { Modal, fecharSeguro } from '@renderer/components/Modal';
import { useAlterado } from '@renderer/components/useAlterado';
import { excluirPersonagem, salvarPersonagem, importarPersonagemConfig } from '../services/cadastro';

const MODELOS: { id: ModeloPalito; nome: string }[] = [
  { id: 'professor', nome: 'Adulto de jaleco' }, { id: 'aluno', nome: 'Pré-adolescente' }, { id: 'mae', nome: 'Adulta de cabelo longo' },
  { id: 'cacula', nome: 'Criança pequena' }, { id: 'priminha', nome: 'Menininha' },
];

interface Form { nome: string; apelidos: string; idade: string; descricao: string; altura: number; modelo: ModeloPalito; expressao: ExpressaoId; danca: string }
const VAZIO: Form = { nome: '', apelidos: '', idade: '', descricao: '', altura: 440, modelo: 'aluno', expressao: 'feliz', danca: 'danca_atual' };

const POSES_PREVIA: { id: PoseId; label: string }[] = [
  { id: 'parado', label: 'Parado' },
  { id: 'andar', label: 'Andar' },
  { id: 'correr', label: 'Correr' },
  { id: 'pular', label: 'Pular' },
  { id: 'acenar', label: 'Acenar' },
  { id: 'apontar', label: 'Apontar' },
  { id: 'apresentar', label: 'Apresentar' },
  { id: 'bracos_cruzados', label: 'Cruzados' },
  { id: 'pensar', label: 'Pensar' },
  { id: 'ideia', label: 'Ideia' },
  { id: 'danca_atual', label: 'Dança' },
  { id: 'danca_funky', label: 'Funky' },
];

/**
 * Ficha do personagem: cria um personagem novo, edita um criado por você ou duplica qualquer um (inclusive os do elenco original).
 * Inclui pré-visualização vetorial SVG em tempo real de corpo inteiro com movimentos/poses e exportação direta de SVG (.svg).
 */
export function PersonagemModal() {
  const aberta = useEditor((s) => s.fichaPersonagem);
  const set = useEditor((s) => s.set);
  const novaVersao = useEditor((s) => s.novaVersaoPersonagens);
  const [f, setF] = useState<Form>(VAZIO);
  const [erro, setErro] = useState('');
  const [expressaoPrevia, setExpressaoPrevia] = useState<ExpressaoId>('feliz');
  const [posePrevia, setPosePrevia] = useState<PoseId>('parado');
  const [modoVisao, setModoVisao] = useState<'corpo' | 'cabeca'>('corpo');
  const [copiado, setCopiado] = useState(false);
  // o que foi carregado na ficha: referência para saber se o usuário mudou algo (e perguntar antes de descartar)
  const [carregado, setCarregado] = useState<Form | null>(null);
  const alterado = useAlterado(f, carregado);
  const carregar = (v: Form) => { setF(v); setCarregado(v); };

  useEffect(() => {
    setErro('');
    if (!aberta) return;
    const base = aberta.id ?? aberta.duplicarDe;
    const a = base ? ATORES[base] : undefined;
    if (a) {
      carregar({
        nome: aberta.duplicarDe ? `${a.nome} 2` : a.nome,
        apelidos: aberta.duplicarDe ? '' : a.apelidos.slice(1).join(', '),
        idade: a.idade,
        descricao: a.descricao,
        altura: a.altura,
        modelo: a.modeloPalito,
        expressao: a.expressaoPadrao,
        danca: a.dancaPadrao ?? 'danca_atual',
      });
      setExpressaoPrevia(a.expressaoPadrao);
      setPosePrevia('parado');
    } else {
      carregar(VAZIO);
      setExpressaoPrevia('feliz');
      setPosePrevia('parado');
    }
  }, [aberta]);

  if (!aberta) return null;

  const baseId = aberta.id ?? aberta.duplicarDe;
  const atorBase = baseId ? ATORES[baseId] : undefined;
  const canonico = aberta.id ? !atorBase?.personalizado : false;
  const editando = !!aberta.id && !canonico;
  const fechar = () => set({ fichaPersonagem: null });
  const campo = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  // Determinar identificador do molde SVG
  const moldeId = baseId ?? (f.modelo === 'professor' ? 'cringefather' : f.modelo === 'mae' ? 'erika' : 'betason');

  // Gerar SVG XML em tempo real com corpo todo e pose selecionada
  const svgXml = modoVisao === 'corpo'
    ? gerarSvgCompleto(moldeId, { expressao: expressaoPrevia, pose: posePrevia })
    : gerarSvgCabeca(moldeId, { expressao: expressaoPrevia });

  const exportarArquivoSvg = () => {
    const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sufixo = modoVisao === 'corpo' ? `${posePrevia}_${expressaoPrevia}` : expressaoPrevia;
    link.download = `${(f.nome || moldeId).toLowerCase().replace(/\s+/g, '_')}_${modoVisao}_${sufixo}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const copiarSvg = async () => {
    try {
      await navigator.clipboard.writeText(svgXml);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard fallback
    }
  };

  const salvar = () => {
    const r = salvarPersonagem({
      nome: f.nome, apelidos: f.apelidos.split(',').map((s) => s.trim()).filter(Boolean), idade: f.idade, descricao: f.descricao,
      altura: f.altura, modeloPalito: f.modelo, expressaoPadrao: f.expressao, dancaPadrao: f.danca,
    }, aberta.id);
    if ('erro' in r) { setErro(r.erro); return; }
    novaVersao();
    set({ fichaPersonagem: null, selecionado: r.id, mensagem: editando ? `${f.nome} atualizado.` : `${f.nome} criado. Ele já aparece no roteiro como boneco de palito.` });
  };

  const exportarArquivoJson = () => {
    const spec = atorBase ?? {
      id: (aberta.id || f.nome.toLowerCase().replace(/\s+/g, '-')) as ActorId,
      nome: f.nome,
      apelidos: f.apelidos.split(',').map((s) => s.trim()).filter(Boolean),
      idade: f.idade,
      descricao: f.descricao,
      altura: f.altura,
      temSprites: false,
      modeloPalito: f.modelo,
      expressaoPadrao: f.expressao,
      slotPadrao: 0.5,
      dancaPadrao: f.danca,
    };
    const clipes = baseId ? clipesPersonalizados(baseId) : [];
    const conteudo = serializarPersonagemJSON(spec, clipes);
    const blob = new Blob([conteudo], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(spec.id || 'personagem').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importarArquivoJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const texto = reader.result as string;
      const r = importarPersonagemConfig(texto);
      if ('erro' in r) {
        setErro(r.erro);
      } else {
        novaVersao();
        set({ selecionado: r.id, fichaPersonagem: { id: r.id }, mensagem: `Personagem carregado do JSON com sucesso!` });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const excluir = async () => {
    if (!aberta.id || !window.confirm(`Excluir ${ATORES[aberta.id]!.nome} e tudo o que você criou para ele? Isso não afeta os personagens originais.`)) return;
    await excluirPersonagem(aberta.id);
    novaVersao();
    set({ fichaPersonagem: null, selecionado: 'cringefather', mensagem: 'Personagem excluído.' });
  };

  return (
    <Modal titulo="Ficha do personagem" classe="largo" sujo={alterado} onFechar={fechar}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0 }}>
            {canonico
              ? `Ficha de ${atorBase?.nome}`
              : editando
                ? `Editar ${atorBase?.nome}`
                : aberta.duplicarDe
                  ? `Duplicar ${atorBase?.nome}`
                  : 'Novo personagem'}
          </h3>
          <span className="badge-svg">🎨 Desenho vetorial</span>
        </div>
        <p className="dica" style={{ marginTop: 0 }}>
          {canonico
            ? 'Os personagens do elenco original só podem ser vistos. Para mudar algo, use Duplicar para editar. O desenho é vetorial: fica nítido em qualquer tamanho.'
            : 'O nome (e os apelidos) é como o roteiro chama o personagem. Os moldes SVG garantem renderização vetorial nítida em qualquer resolução.'}
        </p>

        <div className="modal-personagem-grid">
          {/* Coluna 1: Campos do formulário */}
          <div>
            <label className="campo">Nome
              <input
                value={f.nome}
                disabled={canonico}
                autoFocus={!canonico}
                onChange={(e) => campo('nome', e.target.value)}
                placeholder="ex.: Tia Marta"
              />
            </label>
            <label className="campo">Outros nomes no roteiro <small>(separados por vírgula)</small>
              <input
                value={f.apelidos}
                disabled={canonico}
                onChange={(e) => campo('apelidos', e.target.value)}
                placeholder="ex.: tia, martinha"
              />
            </label>
            <div className="duas-colunas">
              <label className="campo">Idade
                <input
                  value={f.idade}
                  disabled={canonico}
                  onChange={(e) => campo('idade', e.target.value)}
                  placeholder="ex.: 38 anos"
                />
              </label>
              <label className="campo">Altura no palco: {f.altura}
                <input
                  type="range"
                  min={240}
                  max={620}
                  step={5}
                  value={f.altura}
                  disabled={canonico}
                  onChange={(e) => campo('altura', Number(e.target.value))}
                />
              </label>
            </div>
            <label className="campo">Descrição
              <textarea
                rows={2}
                value={f.descricao}
                disabled={canonico}
                onChange={(e) => campo('descricao', e.target.value)}
                placeholder="Aparência e personalidade"
              />
            </label>
            <div className="duas-colunas">
              <label className="campo">Boneco de palito base
                <select
                  value={f.modelo}
                  disabled={canonico}
                  onChange={(e) => campo('modelo', e.target.value as ModeloPalito)}
                >
                  {MODELOS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </label>
              <label className="campo">Expressão padrão
                <select
                  value={f.expressao}
                  disabled={canonico}
                  onChange={(e) => {
                    campo('expressao', e.target.value as ExpressaoId);
                    setExpressaoPrevia(e.target.value as ExpressaoId);
                  }}
                >
                  {EXPRESSOES.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>
              </label>
            </div>
            <label className="campo">Dança padrão (“{f.nome || 'Fulano'} dança.”)
              <select
                value={f.danca}
                disabled={canonico}
                onChange={(e) => campo('danca', e.target.value)}
              >
                {POSES_DE_DANCA.map((p) => <option key={p} value={p}>{NOME_POSE[p]}</option>)}
              </select>
            </label>
            {erro && <ul className="erros-pacote"><li>✖ {erro}</li></ul>}
          </div>

          {/* Coluna 2: Pré-visualização Vetorial SVG e Exportador */}
          <div className="painel-preview-svg">
            <div className="painel-preview-topo">
              <strong style={{ fontSize: 13, color: 'var(--txt)' }}>Pré-visualização</strong>
              <div className="preview-svg-abas">
                <button
                  type="button"
                  className={modoVisao === 'corpo' ? 'on' : ''}
                  onClick={() => setModoVisao('corpo')}
                >
                  Corpo Inteiro
                </button>
                <button
                  type="button"
                  className={modoVisao === 'cabeca' ? 'on' : ''}
                  onClick={() => setModoVisao('cabeca')}
                >
                  Rosto
                </button>
              </div>
            </div>

            <div
              className="preview-svg-box"
              dangerouslySetInnerHTML={{ __html: svgXml }}
              title={`SVG: ${f.nome || moldeId} (${expressaoPrevia} - ${posePrevia})`}
            />

            <div className="preview-svg-controles">
              {/* Seletor de Movimentos / Poses se visão for Corpo Inteiro */}
              {modoVisao === 'corpo' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <small style={{ color: 'var(--txt2)', fontSize: 11 }}>Pose:</small>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--azul)' }}>
                      {POSES_PREVIA.find((p) => p.id === posePrevia)?.label ?? posePrevia}
                    </span>
                  </div>
                  <div className="grade-expressoes-svg" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    {POSES_PREVIA.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={posePrevia === p.id ? 'on' : ''}
                        onClick={() => setPosePrevia(p.id)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Seletor de Expressão Facial */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <small style={{ color: 'var(--txt2)', fontSize: 11 }}>Expressão:</small>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--azul)', textTransform: 'capitalize' }}>
                  {expressaoPrevia}
                </span>
              </div>
              <div className="grade-expressoes-svg">
                {EXPRESSOES.map((x) => (
                  <button
                    key={x}
                    type="button"
                    className={expressaoPrevia === x ? 'on' : ''}
                    onClick={() => setExpressaoPrevia(x)}
                    title={`Ver a expressão ${x}`}
                  >
                    {x}
                  </button>
                ))}
              </div>

              <div className="preview-svg-botoes">
                <button type="button" onClick={exportarArquivoSvg} title="Baixar arquivo .svg vetorial puro da pose e expressão atuais">
                  ⬇ Exportar SVG (.svg)
                </button>
                <button
                  type="button"
                  className={copiado ? 'sucesso' : ''}
                  onClick={() => void copiarSvg()}
                  title="Copiar código XML do SVG para a área de transferência"
                >
                  {copiado ? '✓ Copiado!' : '📋 Copiar SVG'}
                </button>
                <button type="button" onClick={exportarArquivoJson} title="Exportar ficha e clipes do personagem em arquivo individual .json">
                  💾 Exportar JSON (.json)
                </button>
                <label className="botao" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: 0 }} title="Importar arquivo JSON de personagem">
                  📂 Importar JSON (.json)
                  <input type="file" accept=".json,application/json" onChange={importarArquivoJson} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-botoes" style={{ marginTop: 14 }}>
          {canonico ? (
            <>
              <button
                type="button"
                className="primario"
                onClick={() => set({ fichaPersonagem: { duplicarDe: aberta.id } })}
              >
                Duplicar para editar
              </button>
              <button type="button" onClick={() => fecharSeguro(alterado, fechar)}>Fechar</button>
            </>
          ) : (
            <>
              {editando && <button type="button" className="perigo" onClick={() => void excluir()}>Excluir</button>}
              <button type="button" onClick={() => fecharSeguro(alterado, fechar)}>Cancelar</button>
              <button type="button" className="primario" disabled={!f.nome.trim()} onClick={salvar}>
                {editando ? 'Salvar' : 'Criar personagem'}
              </button>
            </>
          )}
        </div>
    </Modal>
  );
}

export type { ActorId };

