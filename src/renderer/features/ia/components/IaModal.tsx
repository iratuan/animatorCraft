import { useState } from 'react';
import { ATORES, MODELOS, ORDEM_ATORES, gerarRoteiro, promptGerar, promptMelhorar, promptSistema, type FormatoProducao, type PedidoRoteiro } from '@shared/domain';
import { bibliotecaAtual } from '@renderer/features/prompt-mestre';
import { useEditor } from '@renderer/store/editor-store';
import { criarPedidoIA, gravarConfigIA, lerConfigIA, PREDEFINICOES, type ConfigIA } from '../services/cliente';
import { Modal, fecharSeguro } from '@renderer/components/Modal';
import { useAlterado } from '@renderer/components/useAlterado';
import { Icones, type NomeIcone } from '@renderer/components/Icones';

const FORMATOS: { id: FormatoProducao; rotulo: string; icone: string; desc: string }[] = [
  { id: 'aula', rotulo: 'Aula com Lousa', icone: 'formatoAula', desc: 'Explicações didáticas passo a passo na lousa com fórmulas e gráficos' },
  { id: 'podcast', rotulo: 'Podcast / Mesa', icone: 'formatoPodcast', desc: 'Bancada com microfones Shure, fones de ouvido e debate entre participantes' },
  { id: 'telejornal', rotulo: 'Telejornal / Drops', icone: 'formatoTelejornal', desc: 'Bancada de estúdio de TV, videowall global e tarja de notícias ao vivo' },
  { id: 'debate', rotulo: 'Grande Debate', icone: 'formatoDebate', desc: 'Mesa de debate oficial com microfones gooseneck, mediação e cronômetro de tempo' },
  { id: 'papo_livre', rotulo: 'Papo Livre / Lounge', icone: 'formatoPapoLivre', desc: 'Sala confortável descontraída com poltronas, mesa de centro e conversa espontânea' },
  { id: 'livre', rotulo: 'Esquete Livre', icone: 'formatoLivre', desc: 'Palco aberto sem lousa com atuação física cômica e mascotes' },
];

const OPCOES_MATERIA: Record<FormatoProducao, { rotulo: string; opcoes: string[] }> = {
  aula: { rotulo: 'Matéria', opcoes: ['Matemática', 'Ciências', 'Inglês', 'Física', 'Química', 'Biologia', 'História', 'Geografia'] },
  podcast: { rotulo: 'Categoria', opcoes: ['Tecnologia', 'Ciências', 'Educação', 'Cultura Pop', 'Filosofia', 'Humor'] },
  telejornal: { rotulo: 'Editoria', opcoes: ['Ciência & Tecnologia', 'Geral / Drops', 'Mundo & Sociedade', 'Inovação & Saúde', 'Educação'] },
  debate: { rotulo: 'Tema Central', opcoes: ['Sociedade & Futuro', 'Ética & Inteligência Artificial', 'Economia & Sustentabilidade', 'Educação & Gerações', 'Ciência vs Tradição'] },
  papo_livre: { rotulo: 'Assunto', opcoes: ['Conversa Espontânea', 'Histórias de Vida', 'Curiosidades & Fatos', 'Comédia & Bastidores', 'Reflexões Criativas'] },
  livre: { rotulo: 'Gênero', opcoes: ['Comédia', 'Aventura', 'Dia a Dia em Família', 'Desafio & Dança', 'Mistério Engraçado'] },
};

const OPCOES_SERIE: Record<FormatoProducao, { rotulo: string; padrao: string; placeholder: string }> = {
  aula: { rotulo: 'Série / público', padrao: '8º ano', placeholder: 'ex.: 8º ano ou Ensino Médio' },
  podcast: { rotulo: 'Estilo / Ritmo', padrao: 'Descontraído e curioso', placeholder: 'ex.: Descontraído, Debate Crítico' },
  telejornal: { rotulo: 'Edição', padrao: 'Drops da Semana', placeholder: 'ex.: Drops da Semana, Plantão Urgente' },
  debate: { rotulo: 'Regras / Tempo', padrao: 'Turnos de 1 min e réplica', placeholder: 'ex.: Turnos de 1 min, Mediação ativa' },
  papo_livre: { rotulo: 'Ambiente', padrao: 'Lounge aconchegante', placeholder: 'ex.: Lounge informal, Sala de estar' },
  livre: { rotulo: 'Clima', padrao: 'Muito cômico e ágil', placeholder: 'ex.: Muito cômico, Caótico, Em família' },
};

const OPCOES_PAPEIS: Record<FormatoProducao, { principal: string; secundario: string }> = {
  aula: { principal: 'Professor', secundario: 'Aluno' },
  podcast: { principal: 'Host / Apresentador', secundario: 'Convidado / Co-host' },
  telejornal: { principal: 'Âncora principal', secundario: 'Comentarista / Repórter' },
  debate: { principal: 'Debatedor A / Propositor', secundario: 'Debatedor B / Opositor' },
  papo_livre: { principal: 'Interlocutor A', secundario: 'Interlocutor B' },
  livre: { principal: 'Protagonista', secundario: 'Co-protagonista / Parceiro' },
};

/** Gera ou melhora o roteiro com a IA que você configurar (Claude, OpenAI e compatíveis, Ollama local). O resultado é conferido pelo próprio interpretador do app. */
export function IaModal() {
  const aberto = useEditor((s) => s.iaAberta);
  const set = useEditor((s) => s.set);
  const roteiroAtual = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  useEditor((s) => s.versaoPersonagens);
  const [cfg, setCfg] = useState<ConfigIA>(lerConfigIA);
  const [modo, setModo] = useState<'novo' | 'melhorar'>('novo');
  const [formato, setFormato] = useState<FormatoProducao>('aula');
  const [pedido, setPedido] = useState<PedidoRoteiro>({
    tema: '',
    materia: 'Matemática',
    serie: '8º ano',
    duracao: 'curta',
    personagens: [],
    professor: 'cringefather',
    aluno: 'betason',
    extras: '',
    formato: 'aula',
  });
  const [instrucao, setInstrucao] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{ roteiro: string; avisos: string[]; rodadas: number } | null>(null);
  // um pedido digitado ou um roteiro gerado e ainda não usado se perdem ao fechar: pergunta antes
  const alterado = useAlterado({ pedido, instrucao }) || resultado !== null;

  if (!aberto) return null;

  const fechar = () => set({ iaAberta: false });
  const campoCfg = <K extends keyof ConfigIA>(k: K, v: ConfigIA[K]) => { const n = { ...cfg, [k]: v }; setCfg(n); gravarConfigIA(n); };
  const campo = <K extends keyof PedidoRoteiro>(k: K, v: PedidoRoteiro[K]) => setPedido((p) => ({ ...p, [k]: v }));
  const precisaChave = cfg.baseUrl.includes('localhost') ? false : !cfg.chave.trim();

  const trocarFormato = (novoFormato: FormatoProducao) => {
    setFormato(novoFormato);
    const mat = OPCOES_MATERIA[novoFormato];
    const ser = OPCOES_SERIE[novoFormato];
    setPedido((p) => ({
      ...p,
      formato: novoFormato,
      materia: mat.opcoes[0] ?? p.materia,
      serie: ser.padrao,
    }));
  };

  const aplicarModeloPrompt = (tema: string, extras?: string) => {
    setPedido((p) => ({
      ...p,
      tema,
      ...(extras ? { extras } : {}),
    }));
  };

  const modelosDoFormato = MODELOS.filter((m) => m.formato === formato);

  const gerar = async () => {
    setErro(''); setResultado(null); setOcupado(true);
    try {
      const msg = modo === 'novo' ? promptGerar({ ...pedido, formato }) : promptMelhorar(roteiroAtual, instrucao);
      const r = await gerarRoteiro(criarPedidoIA(cfg), msg, 2, promptSistema(bibliotecaAtual(modo === 'novo' ? pedido.personagens : [])));
      setResultado({ roteiro: r.roteiro, avisos: r.avisosFinais, rodadas: r.rodadas });
    } catch (e) {
      const m = (e as Error).message;
      setErro(/Failed to fetch|NetworkError/i.test(m) ? 'Não consegui falar com o serviço. Confira o endereço, a internet e (no Ollama) a opção OLLAMA_ORIGINS=*.' : m);
    } finally { setOcupado(false); }
  };

  const usar = (acrescentar: boolean) => {
    if (!resultado) return;
    setRoteiro(acrescentar ? `${roteiroAtual.trimEnd()}\n\n${resultado.roteiro.replace(/^\[pap[eé]is[^\n]*\n+/i, '')}` : resultado.roteiro);
    set({ iaAberta: false, t: 0, mensagem: 'Roteiro da IA aplicado. Ctrl+Z desfaz.' });
  };

  const papeis = OPCOES_PAPEIS[formato];
  const materiaCfg = OPCOES_MATERIA[formato];
  const serieCfg = OPCOES_SERIE[formato];

  return (
    <Modal titulo="Roteiro com IA" classe="largo" sujo={alterado} onFechar={fechar}>
        <h3>Roteiro com IA</h3>
        <div className="seletor-personagem">
          <button className={modo === 'novo' ? 'on' : ''} onClick={() => setModo('novo')}>Criar roteiro novo</button>
          <button className={modo === 'melhorar' ? 'on' : ''} onClick={() => setModo('melhorar')}>Melhorar o roteiro atual</button>
        </div>

        {modo === 'novo' ? (
          <>
            <div style={{ marginTop: 8, marginBottom: 12 }}>
              <small style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--cor-texto-suave)' }}>Formato de produção de mídia:</small>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                {FORMATOS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`botao-formato ${formato === f.id ? 'on primario' : ''}`}
                    style={{
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      borderRadius: 8,
                      border: formato === f.id ? '2px solid var(--cor-destaque)' : '1px solid var(--cor-borda)',
                      background: formato === f.id ? 'var(--cor-fundo-ativo, #e0f2fe)' : 'var(--cor-fundo-card, #f8fafc)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onClick={() => trocarFormato(f.id)}
                  >
                    <span style={{ marginBottom: 2 }}>{Icones[f.icone as NomeIcone]}</span>
                    <strong style={{ fontSize: '0.85rem' }}>{f.rotulo}</strong>
                  </button>
                ))}
              </div>
            </div>

            {modelosDoFormato.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <small style={{ color: 'var(--cor-texto-suave)', display: 'block', marginBottom: 4 }}>💡 Sugestões de pautas para este formato (clique para preencher):</small>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {modelosDoFormato.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: 12, border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
                      onClick={() => aplicarModeloPrompt(m.sugestaoPrompt ?? m.nome, `Seguir estrutura do modelo “${m.nome}”`)}
                    >
                      {m.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="campo">
              {formato === 'podcast' ? 'Tema do podcast' : formato === 'telejornal' ? 'Manchete / Notícia principal' : formato === 'livre' ? 'História / Situação da esquete' : 'Assunto da aula'}
              <input
                value={pedido.tema}
                autoFocus
                onChange={(e) => campo('tema', e.target.value)}
                placeholder={formato === 'podcast' ? 'ex.: como a IA vai transformar o trabalho e as escolas' : formato === 'telejornal' ? 'ex.: telescópio descobre atmosfera com oxigênio em exoplaneta' : formato === 'livre' ? 'ex.: Mingau e Paraíba criam uma confusão na hora do café' : 'ex.: produtos notáveis (quadrado da soma)'}
              />
            </label>

            <div className="duas-colunas">
              <label className="campo">
                {materiaCfg.rotulo}
                <select value={pedido.materia} onChange={(e) => campo('materia', e.target.value)}>
                  {materiaCfg.opcoes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label className="campo">
                {serieCfg.rotulo}
                <input value={pedido.serie} onChange={(e) => campo('serie', e.target.value)} placeholder={serieCfg.placeholder} />
              </label>
            </div>

            <div className="duas-colunas">
              <label className="campo">
                Duração
                <select value={pedido.duracao} onChange={(e) => campo('duracao', e.target.value as PedidoRoteiro['duracao'])}>
                  <option value="curta">Curta (~1 min)</option>
                  <option value="media">Média (~3 min)</option>
                  <option value="longa">Longa (~6 min)</option>
                </select>
              </label>
              <label className="campo">
                {papeis.principal}
                <select value={pedido.professor} onChange={(e) => campo('professor', e.target.value)}>
                  {ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}
                </select>
              </label>
            </div>

            <div className="duas-colunas">
              <label className="campo">
                {papeis.secundario}
                <select value={pedido.aluno} onChange={(e) => campo('aluno', e.target.value)}>
                  {ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}
                </select>
              </label>
              <label className="campo">
                Pedidos extras (opcional)
                <input value={pedido.extras} onChange={(e) => campo('extras', e.target.value)} placeholder="ex.: inclua uma piada, reações engraçadas e efeito sonoro" />
              </label>
            </div>

            <div className="campo">
              Quem pode aparecer <small>(nenhum marcado = todos)</small>
              <div className="seletor-personagem">
                {ORDEM_ATORES.map((id) => (
                  <button
                    key={id}
                    className={pedido.personagens.includes(id) ? 'on' : ''}
                    onClick={() => campo('personagens', pedido.personagens.includes(id) ? pedido.personagens.filter((x) => x !== id) : [...pedido.personagens, id])}
                  >
                    {ATORES[id]!.nome}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <label className="campo">
            O que melhorar
            <textarea rows={3} value={instrucao} onChange={(e) => setInstrucao(e.target.value)} placeholder="Em branco = acrescentar reações e gestos enquanto os outros falam, sem mudar a aula" />
          </label>
        )}

        <details className="config-ia">
          <summary>Serviço de IA: {PREDEFINICOES.find((p) => p.config.baseUrl === cfg.baseUrl)?.nome ?? cfg.baseUrl} {precisaChave ? '— falta a chave' : ''}</summary>
          <label className="campo">Serviço
            <select value={PREDEFINICOES.find((p) => p.config.baseUrl === cfg.baseUrl)?.id ?? ''} onChange={(e) => { const p = PREDEFINICOES.find((x) => x.id === e.target.value); if (p) { const n = { ...cfg, ...p.config }; setCfg(n); gravarConfigIA(n); } }}>
              <option value="">Personalizado</option>{PREDEFINICOES.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </label>
          <p className="dica">{PREDEFINICOES.find((p) => p.config.baseUrl === cfg.baseUrl)?.dica ?? 'Informe o endereço de um serviço compatível com /chat/completions.'}</p>
          <div className="duas-colunas">
            <label className="campo">Endereço<input value={cfg.baseUrl} onChange={(e) => campoCfg('baseUrl', e.target.value)} /></label>
            <label className="campo">Modelo<input value={cfg.modelo} onChange={(e) => campoCfg('modelo', e.target.value)} /></label>
          </div>
          <label className="campo">Chave da API <small>(fica só neste aparelho e só vai para o endereço acima)</small><input type="password" autoComplete="off" value={cfg.chave} onChange={(e) => campoCfg('chave', e.target.value)} /></label>
        </details>

        {erro && <ul className="erros-pacote"><li>✖ {erro}</li></ul>}
        {resultado && (
          <>
            <p className="dica">{resultado.avisos.length ? `Pronto, mas o app não entendeu ${resultado.avisos.length} trecho(s): ${resultado.avisos.slice(0, 3).join(' · ')}` : `Roteiro conferido pelo app${resultado.rodadas > 1 ? ` (corrigido ${resultado.rodadas - 1}×)` : ''}: sem avisos.`}</p>
            <textarea className="previa-ia" readOnly value={resultado.roteiro} rows={10} />
          </>
        )}
        <div className="modal-botoes">
          <button onClick={() => fecharSeguro(alterado, fechar)}>Fechar</button>
          {resultado && modo === 'novo' && <button onClick={() => usar(true)}>Acrescentar ao roteiro</button>}
          {resultado && <button className="primario" onClick={() => usar(false)}>Substituir o roteiro</button>}
          <button className="primario" disabled={ocupado || precisaChave || (modo === 'novo' && !pedido.tema.trim())} onClick={() => void gerar()}>{ocupado ? 'Gerando…' : resultado ? 'Gerar de novo' : 'Gerar'}</button>
        </div>
    </Modal>
  );
}
