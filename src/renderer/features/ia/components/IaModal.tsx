import { useState } from 'react';
import { ATORES, ORDEM_ATORES, gerarRoteiro, promptGerar, promptMelhorar, type PedidoRoteiro } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { criarPedidoIA, gravarConfigIA, lerConfigIA, PREDEFINICOES, type ConfigIA } from '../services/cliente';

/** Gera ou melhora o roteiro com a IA que você configurar (Claude, OpenAI e compatíveis, Ollama local). O resultado é conferido pelo próprio interpretador do app. */
export function IaModal() {
  const aberto = useEditor((s) => s.iaAberta);
  const set = useEditor((s) => s.set);
  const roteiroAtual = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  useEditor((s) => s.versaoPersonagens);
  const [cfg, setCfg] = useState<ConfigIA>(lerConfigIA);
  const [modo, setModo] = useState<'novo' | 'melhorar'>('novo');
  const [pedido, setPedido] = useState<PedidoRoteiro>({ tema: '', materia: 'Matemática', serie: '8º ano', duracao: 'curta', personagens: [], professor: 'cringefather', aluno: 'betason', extras: '' });
  const [instrucao, setInstrucao] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{ roteiro: string; avisos: string[]; rodadas: number } | null>(null);
  if (!aberto) return null;

  const fechar = () => set({ iaAberta: false });
  const campoCfg = <K extends keyof ConfigIA>(k: K, v: ConfigIA[K]) => { const n = { ...cfg, [k]: v }; setCfg(n); gravarConfigIA(n); };
  const campo = <K extends keyof PedidoRoteiro>(k: K, v: PedidoRoteiro[K]) => setPedido((p) => ({ ...p, [k]: v }));
  const precisaChave = cfg.baseUrl.includes('localhost') ? false : !cfg.chave.trim();

  const gerar = async () => {
    setErro(''); setResultado(null); setOcupado(true);
    try {
      const msg = modo === 'novo' ? promptGerar(pedido) : promptMelhorar(roteiroAtual, instrucao);
      const r = await gerarRoteiro(criarPedidoIA(cfg), msg);
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

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal largo" role="dialog" aria-label="Roteiro com IA" onClick={(e) => e.stopPropagation()}>
        <h3>Roteiro com IA</h3>
        <div className="seletor-personagem">
          <button className={modo === 'novo' ? 'on' : ''} onClick={() => setModo('novo')}>Criar roteiro novo</button>
          <button className={modo === 'melhorar' ? 'on' : ''} onClick={() => setModo('melhorar')}>Melhorar o roteiro atual</button>
        </div>

        {modo === 'novo' ? (
          <>
            <label className="campo">Assunto da aula<input value={pedido.tema} autoFocus onChange={(e) => campo('tema', e.target.value)} placeholder="ex.: produtos notáveis (quadrado da soma)" /></label>
            <div className="duas-colunas">
              <label className="campo">Matéria<select value={pedido.materia} onChange={(e) => campo('materia', e.target.value)}>{['Matemática', 'Ciências', 'Inglês', 'Física', 'Química', 'Biologia'].map((m) => <option key={m}>{m}</option>)}</select></label>
              <label className="campo">Série / público<input value={pedido.serie} onChange={(e) => campo('serie', e.target.value)} /></label>
            </div>
            <div className="duas-colunas">
              <label className="campo">Duração<select value={pedido.duracao} onChange={(e) => campo('duracao', e.target.value as PedidoRoteiro['duracao'])}><option value="curta">Curta (~1 min)</option><option value="media">Média (~3 min)</option><option value="longa">Longa (~6 min)</option></select></label>
              <label className="campo">Professor<select value={pedido.professor} onChange={(e) => campo('professor', e.target.value)}>{ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}</select></label>
            </div>
            <div className="duas-colunas">
              <label className="campo">Aluno<select value={pedido.aluno} onChange={(e) => campo('aluno', e.target.value)}>{ORDEM_ATORES.map((id) => <option key={id} value={id}>{ATORES[id]!.nome}</option>)}</select></label>
              <label className="campo">Pedidos extras (opcional)<input value={pedido.extras} onChange={(e) => campo('extras', e.target.value)} placeholder="ex.: inclua um gráfico e uma piada da vovó" /></label>
            </div>
            <div className="campo">Quem pode aparecer <small>(nenhum marcado = todos)</small>
              <div className="seletor-personagem">{ORDEM_ATORES.map((id) => <button key={id} className={pedido.personagens.includes(id) ? 'on' : ''} onClick={() => campo('personagens', pedido.personagens.includes(id) ? pedido.personagens.filter((x) => x !== id) : [...pedido.personagens, id])}>{ATORES[id]!.nome}</button>)}</div>
            </div>
          </>
        ) : (
          <label className="campo">O que melhorar<textarea rows={3} value={instrucao} onChange={(e) => setInstrucao(e.target.value)} placeholder="Em branco = acrescentar reações e gestos enquanto os outros falam, sem mudar a aula" /></label>
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
          <button onClick={fechar}>Fechar</button>
          {resultado && modo === 'novo' && <button onClick={() => usar(true)}>Acrescentar ao roteiro</button>}
          {resultado && <button className="primario" onClick={() => usar(false)}>Substituir o roteiro</button>}
          <button className="primario" disabled={ocupado || precisaChave || (modo === 'novo' && !pedido.tema.trim())} onClick={() => void gerar()}>{ocupado ? 'Gerando…' : resultado ? 'Gerar de novo' : 'Gerar'}</button>
        </div>
      </div>
    </div>
  );
}
