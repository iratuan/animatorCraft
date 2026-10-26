import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ATORES, DURACAO_AULA, MODELOS, ORDEM_ATORES, extrairRoteiro, gerarPromptMestre, parseRoteiro, type DuracaoAula, type FormatoProducao, type OpcoesPromptMestre } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { carregarImagensEAudios, carregarSprites } from '@renderer/bootstrap';
import { plataforma } from '@renderer/features/sistema';
import { bibliotecaAtual } from '../services/biblioteca';
import { copiarTexto } from '../services/area-de-transferencia';
import { Modal, fecharSeguro } from '@renderer/components/Modal';
import { useAlterado } from '@renderer/components/useAlterado';
import { Icones, type NomeIcone } from '@renderer/components/Icones';

type Aba = 'prompt' | 'resposta';

/** Estimativa grosseira (1 token ≈ 3,6 caracteres em português) para o usuário saber se cabe na IA que usa. */
const tokens = (t: string) => Math.round(t.length / 3.6);

const FORMATOS: { id: FormatoProducao; rotulo: string; icone: string }[] = [
  { id: 'aula', rotulo: 'Aula com Lousa', icone: 'formatoAula' },
  { id: 'podcast', rotulo: 'Podcast / Mesa', icone: 'formatoPodcast' },
  { id: 'telejornal', rotulo: 'Telejornal / Drops', icone: 'formatoTelejornal' },
  { id: 'debate', rotulo: 'Grande Debate', icone: 'formatoDebate' },
  { id: 'papo_livre', rotulo: 'Papo Livre / Lounge', icone: 'formatoPapoLivre' },
  { id: 'livre', rotulo: 'Esquete Livre', icone: 'formatoLivre' },
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

/**
 * Prompt mestre: o texto que se cola em QUALQUER IA (Claude, ChatGPT, Gemini...) para ela escrever um roteiro que o StickBoard entende.
 * Ele leva dentro tudo o que a IA precisa: o formato, cada frase aceita, os personagens, sprites, clipes, imagens e áudios da biblioteca.
 * A segunda aba recebe a resposta da IA, confere com o interpretador do app e a aplica no editor.
 */
export function PromptMestreModal() {
  const aberto = useEditor((s) => s.promptMestreAberto);
  const set = useEditor((s) => s.set);
  const navegar = useNavigate();
  const roteiroAtual = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const versao = useEditor((s) => s.versaoBib + s.versaoPersonagens + s.versaoAudio + s.versaoImagens);
  const [aba, setAba] = useState<Aba>('prompt');
  const [formato, setFormato] = useState<FormatoProducao>('aula');
  const [op, setOp] = useState<OpcoesPromptMestre>({
    modo: 'novo',
    formato: 'aula',
    tema: '',
    materia: 'Matemática',
    serie: '8º ano',
    duracao: 'curta',
    professor: 'cringefather',
    aluno: 'betason',
    personagens: [],
    extras: '',
    instrucao: '',
  });
  const [aviso, setAviso] = useState('');
  const [resposta, setResposta] = useState('');
  const [carregando, setCarregando] = useState(true);
  // opções escolhidas e resposta colada da IA se perdem ao fechar: pergunta antes
  const alterado = useAlterado({ op, resposta });

  // a biblioteca (sprites, imagens, áudios) precisa estar carregada para o prompt listar tudo; vindo da tela inicial ela ainda não está
  useEffect(() => {
    if (!aberto) return;
    setCarregando(true);
    void Promise.all([carregarSprites(), carregarImagensEAudios()]).catch(() => undefined).finally(() => setCarregando(false));
  }, [aberto]);

  const opcoes: OpcoesPromptMestre = useMemo(() => ({ ...op, formato, roteiroAtual }), [op, formato, roteiroAtual]);
  const prompt = useMemo(() => (aberto ? gerarPromptMestre(bibliotecaAtual(op.personagens), opcoes) : ''), [aberto, opcoes, versao, carregando]);
  const conferido = useMemo(() => {
    if (!resposta.trim()) return null;
    const roteiro = extrairRoteiro(resposta);
    const r = parseRoteiro(roteiro);
    return { roteiro, avisos: r.avisos, cenas: r.cenas.length, acoes: r.cenas.reduce((n, c) => n + c.acoes.length, 0) };
  }, [resposta, versao]);

  if (!aberto) return null;
  const fechar = () => set({ promptMestreAberto: false });
  const campo = <K extends keyof OpcoesPromptMestre>(k: K, v: OpcoesPromptMestre[K]) => setOp((o) => ({ ...o, [k]: v }));
  const nomeDe = (id: string) => ATORES[id]?.nome ?? id;
  const falta = op.modo === 'novo' && !op.tema?.trim();

  const trocarFormato = (f: FormatoProducao) => {
    setFormato(f);
    const mat = OPCOES_MATERIA[f];
    const ser = OPCOES_SERIE[f];
    setOp((o) => ({
      ...o,
      formato: f,
      materia: mat.opcoes[0] ?? o.materia,
      serie: ser.padrao,
    }));
  };

  const aplicarModelo = (tema: string, extras?: string) => {
    setOp((o) => ({ ...o, tema, ...(extras ? { extras } : {}) }));
  };

  const copiar = async () => {
    const ok = await copiarTexto(prompt);
    setAviso(ok ? `Prompt copiado (${prompt.length.toLocaleString('pt-BR')} caracteres). Cole na IA que preferir.` : 'Não consegui copiar automaticamente: selecione o texto abaixo e copie com Ctrl+C.');
  };
  const salvar = async () => {
    const caminho = await plataforma.salvarRoteiro(prompt, 'prompt-mestre-stickboard.md');
    if (caminho) setAviso(`Prompt salvo: ${caminho}`);
  };
  const usar = (acrescentar: boolean) => {
    if (!conferido) return;
    setRoteiro(acrescentar ? `${roteiroAtual.trimEnd()}\n\n${conferido.roteiro.replace(/^\[pap[eé]is[^\n]*\n+/i, '')}` : conferido.roteiro);
    set({ promptMestreAberto: false, t: 0, mensagem: 'Roteiro da IA aplicado. Ctrl+Z desfaz.' });
    navegar('/editor');
  };

  const papeis = OPCOES_PAPEIS[formato];
  const materiaCfg = OPCOES_MATERIA[formato];
  const serieCfg = OPCOES_SERIE[formato];
  const modelosDoFormato = MODELOS.filter((m) => m.formato === formato);

  return (
    <Modal titulo="Prompt mestre" classe="largo prompt-mestre" sujo={alterado} onFechar={fechar}>
        <h3>Prompt mestre para qualquer IA</h3>
        <p className="dica" style={{ marginTop: 0 }}>Copie o prompt, cole numa IA (Claude, ChatGPT, Gemini, Llama…), peça o roteiro e traga a resposta de volta. O prompt já leva tudo: formato, frases aceitas, seus personagens, sprites, clipes, imagens e áudios.</p>
        <div className="abas-modal">
          <button className={aba === 'prompt' ? 'on' : ''} onClick={() => { setAba('prompt'); setAviso(''); }}>1. Copiar o prompt</button>
          <button className={aba === 'resposta' ? 'on' : ''} onClick={() => { setAba('resposta'); setAviso(''); }}>2. Colar o roteiro da IA</button>
        </div>

        {aba === 'prompt' ? (
          <>
            <div className="seletor-personagem">
              <button className={op.modo === 'novo' ? 'on' : ''} onClick={() => campo('modo', 'novo')}>Roteiro novo</button>
              <button className={op.modo === 'melhorar' ? 'on' : ''} onClick={() => campo('modo', 'melhorar')}>Melhorar o roteiro atual</button>
            </div>
            {op.modo === 'novo' ? (
              <>
                <div style={{ marginTop: 8, marginBottom: 10 }}>
                  <small style={{ fontWeight: 600, display: 'block', marginBottom: 6, color: 'var(--cor-texto-suave)' }}>Formato de produção de mídia:</small>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6 }}>
                    {FORMATOS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={formato === f.id ? 'on' : ''}
                        style={{
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          borderRadius: 8,
                          border: formato === f.id ? '2px solid var(--cor-destaque)' : '1px solid var(--cor-borda)',
                          background: formato === f.id ? 'var(--cor-fundo-ativo, #e0f2fe)' : 'var(--cor-fundo-card, #f8fafc)',
                          cursor: 'pointer',
                        }}
                        onClick={() => trocarFormato(f.id)}
                      >
                        <span>{Icones[f.icone as NomeIcone]}</span>
                        <strong>{f.rotulo}</strong>
                      </button>
                    ))}
                  </div>
                </div>

                {modelosDoFormato.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <small style={{ color: 'var(--cor-texto-suave)', display: 'block', marginBottom: 4 }}>💡 Sugestões de pauta:</small>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {modelosDoFormato.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          style={{ fontSize: '0.78rem', padding: '3px 8px', borderRadius: 12, border: '1px solid var(--cor-borda)', background: 'var(--cor-fundo-suave)' }}
                          onClick={() => aplicarModelo(m.sugestaoPrompt ?? m.nome, `Seguir estrutura do modelo “${m.nome}”`)}
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
                    value={op.tema}
                    autoFocus
                    onChange={(e) => campo('tema', e.target.value)}
                    placeholder={formato === 'podcast' ? 'ex.: como a IA vai transformar o trabalho' : formato === 'telejornal' ? 'ex.: astrônomos detectam planeta com atmosfera' : formato === 'livre' ? 'ex.: Mingau e Paraíba criam uma confusão na hora do café' : 'ex.: produtos notáveis (quadrado da soma)'}
                  />
                </label>
                <div className="duas-colunas">
                  <label className="campo">
                    {materiaCfg.rotulo}
                    <select value={op.materia} onChange={(e) => campo('materia', e.target.value)}>
                      {materiaCfg.opcoes.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className="campo">
                    {serieCfg.rotulo}
                    <input value={op.serie} onChange={(e) => campo('serie', e.target.value)} placeholder={serieCfg.placeholder} />
                  </label>
                </div>
                <div className="duas-colunas">
                  <label className="campo">Duração<select value={op.duracao} onChange={(e) => campo('duracao', e.target.value as DuracaoAula)}>{(Object.keys(DURACAO_AULA) as DuracaoAula[]).map((d) => <option key={d} value={d}>{DURACAO_AULA[d].rotulo}</option>)}</select></label>
                  <label className="campo">Pedidos extras (opcional)<input value={op.extras} onChange={(e) => campo('extras', e.target.value)} placeholder="ex.: inclua reações cômicas e música de fundo" /></label>
                </div>
                <div className="duas-colunas">
                  <label className="campo">{papeis.principal}<select value={op.professor} onChange={(e) => campo('professor', e.target.value)}>{ORDEM_ATORES.map((id) => <option key={id} value={id}>{nomeDe(id)}</option>)}</select></label>
                  <label className="campo">{papeis.secundario}<select value={op.aluno} onChange={(e) => campo('aluno', e.target.value)}>{ORDEM_ATORES.map((id) => <option key={id} value={id}>{nomeDe(id)}</option>)}</select></label>
                </div>
                <div className="campo">Quem pode aparecer <small>(nenhum marcado = todos)</small>
                  <div className="seletor-personagem">{ORDEM_ATORES.map((id) => <button key={id} className={op.personagens?.includes(id) ? 'on' : ''} onClick={() => campo('personagens', op.personagens?.includes(id) ? op.personagens.filter((x) => x !== id) : [...(op.personagens ?? []), id])}>{nomeDe(id)}</button>)}</div>
                </div>
              </>
            ) : (
              <label className="campo">O que melhorar<textarea rows={3} value={op.instrucao} onChange={(e) => campo('instrucao', e.target.value)} placeholder="Em branco = acrescentar reações e gestos enquanto os outros falam, sem mudar a aula" /></label>
            )}
            {carregando && <p className="dica">Carregando a biblioteca (sprites, imagens e áudios)…</p>}
            <textarea className="previa-ia" readOnly aria-label="Prompt mestre gerado" value={prompt} rows={10} onFocus={(e) => e.currentTarget.select()} />
            <p className="dica" style={{ marginTop: 4 }}>{prompt.length.toLocaleString('pt-BR')} caracteres · ≈ {tokens(prompt).toLocaleString('pt-BR')} tokens{falta ? ' · escreva o assunto acima ou complete o trecho <<…>> na própria IA' : ''}</p>
          </>
        ) : (
          <>
            <label className="campo">Resposta da IA <small>(cole o texto inteiro; cercas de código e conversa em volta são ignoradas)</small>
              <textarea className="previa-ia" aria-label="Resposta da IA" rows={12} autoFocus value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder={'[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Abertura\nProfessor entra pela esquerda andando…'} />
            </label>
            {conferido && (
              <>
                <p className="dica conferencia" style={{ marginTop: 4 }}>{conferido.cenas} cena(s), {conferido.acoes} ação(ões). {conferido.avisos.length ? `O app não entendeu ${conferido.avisos.length} trecho(s) — cole-os de volta na IA pedindo a correção:` : 'Roteiro conferido pelo app: sem avisos.'}</p>
                {conferido.avisos.length > 0 && <ul className="erros-pacote">{conferido.avisos.slice(0, 8).map((a, i) => <li key={i}>⚠ {a}</li>)}{conferido.avisos.length > 8 && <li>… e mais {conferido.avisos.length - 8}</li>}</ul>}
              </>
            )}
          </>
        )}

        {aviso && <p className="dica" role="status">{aviso}</p>}
        <div className="modal-botoes">
          <button onClick={() => fecharSeguro(alterado, fechar)}>Fechar</button>
          {aba === 'prompt' ? (
            <>
              <button onClick={() => void salvar()}>Salvar como arquivo (.md)</button>
              <button className="primario" onClick={() => void copiar()}>Copiar prompt</button>
            </>
          ) : (
            <>
              <button disabled={!conferido} onClick={() => usar(true)}>Acrescentar ao roteiro</button>
              <button className="primario" disabled={!conferido} onClick={() => usar(false)}>Substituir o roteiro</button>
            </>
          )}
        </div>
    </Modal>
  );
}
