import { useRef, useState } from 'react';
import { TRILHA_PADRAO, ATORES, EFEITOS_IMAGEM, NOME_EFEITO, ORDEM_ATORES, nomeExibidoDaTrilha, ordenarTrilhas, trilhaDoEvento, excluirFrase, reescreverDuracao, reescreverImagem, tornarSequencial, tornarSimultanea, type Acao, type Conteudo, type EfeitoImagem, type Evento, type PosicaoImagem, type TamanhoImagem, type Timeline } from '@shared/domain';
import { Painel } from '@renderer/components/Painel';
import { useEditor } from '@renderer/store/editor-store';
import { importarAudio } from '@renderer/features/audio';
import EditSpeechDialog from './EditSpeechDialog';
import RecordAudioDialog from './RecordAudioDialog';
import { useRoteiroEstatico } from '@renderer/features/roteiro';

const COR: Record<Acao['tipo'], string> = {
  entrar: '#3b82f6', sair: '#3b82f6', posicionar: '#0ea5e9', remover: '#22c55e', audio: '#f472b6', fala: '#f59e0b', escrever: '#22c55e', pose: '#a855f7', expressao: '#ec4899',
  apontar: '#14b8a6', apagar: '#6b7280', esperar: '#4b5563', nota: '#64748b', camera: '#eab308',
};

// cores só da interface do editor (o desenho do palco é em escala de cinza)
const COR_FAIXA: Record<string, string> = {
  cringefather: '#ef4444', betason: '#3b82f6', erika: '#ec4899', dario: '#10b981', laura: '#a78bfa', elizendra: '#f97316', artur: '#06b6d4', carol: '#84cc16',
};
const PALETA = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#eab308', '#f97316', '#6366f1', '#22c55e'];
const corDoAtor = (id: string) => COR_FAIXA[id] ?? PALETA[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETA.length]!;

const ALTURA_LINHA = 26;
interface Faixa { chave: string; nome: string; cor?: string; eventos: Evento[]; linhas: number; linhaDe: Map<number, number>; /** faixa de áudio: id da trilha (tem mudo e solo) */ trilha?: string }

/** Eventos de uma faixa que se sobrepõem no tempo vão para linhas diferentes (ex.: o personagem fala e gesticula ao mesmo tempo). */
function empilhar(eventos: Evento[]): { linhas: number; linhaDe: Map<number, number> } {
  const fins: number[] = [], linhaDe = new Map<number, number>();
  for (const e of [...eventos].sort((a, b) => a.inicio - b.inicio || a.indice - b.indice)) {
    let l = fins.findIndex((f) => f <= e.inicio + 1e-6);
    if (l < 0) { l = fins.length; fins.push(0); }
    fins[l] = Math.max(e.fim, e.inicio + 0.05);
    linhaDe.set(e.indice, l);
  }
  return { linhas: Math.max(1, fins.length), linhaDe };
}

function faixas(tl: Timeline): Faixa[] {
  const brutas: { chave: string; nome: string; cor?: string; eventos: Evento[]; trilha?: string }[] = [];
  for (const id of ORDEM_ATORES) {
    const evs = tl.eventos.filter((e) => e.acao.tipo !== 'camera' && 'ator' in e.acao && e.acao.ator === id);
    if (evs.length) brutas.push({ chave: id, nome: ATORES[id]!.nome, cor: corDoAtor(id), eventos: evs });
  }
  brutas.push({ chave: 'camera', nome: 'Câmera', cor: '#eab308', eventos: tl.eventos.filter((e) => e.acao.tipo === 'camera') });
  brutas.push({ chave: 'quadro', nome: 'Quadro', eventos: tl.eventos.filter((e) => e.acao.tipo === 'escrever' || e.acao.tipo === 'apagar') });
  // uma faixa por trilha de áudio: a voz de cada personagem, os efeitos, a música e as trilhas que o roteiro criar (\"trilha chuva\")
  for (const id of ordenarTrilhas(tl.eventos.flatMap((e) => trilhaDoEvento(e.acao) ?? []))) {
    brutas.push({ chave: `audio:${id}`, trilha: id, nome: nomeExibidoDaTrilha(id, (a) => ATORES[a]?.nome ?? a), cor: '#f472b6', eventos: tl.eventos.filter((e) => trilhaDoEvento(e.acao) === id) });
  }
  brutas.push({ chave: 'direcao', nome: 'Direção', eventos: tl.eventos.filter((e) => e.acao.tipo === 'esperar' || e.acao.tipo === 'nota') });
  return brutas.map((f) => ({ ...f, ...empilhar(f.eventos) }));
}

/** Mudo (M) e solo (S) da trilha de áudio; o volume fica no painel Áudio. */
function ControleTrilha({ id }: { id: string }) {
  const est = useEditor((s) => s.trilhas[id]) ?? TRILHA_PADRAO;
  const definir = useEditor((s) => s.definirTrilha);
  return (
    <span className="ctl-trilha" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button className={est.mudo ? 'on mudo' : ''} aria-label={`Mudo: ${id}`} aria-pressed={est.mudo} title="Mudo (M)" onClick={() => definir(id, { mudo: !est.mudo })}>M</button>
      <button className={est.solo ? 'on solo' : ''} aria-label={`Solo: ${id}`} aria-pressed={est.solo} title="Solo (S): só as trilhas em solo tocam" onClick={() => definir(id, { solo: !est.solo })}>S</button>
    </span>
  );
}

const altura = (f: Faixa) => Math.max(30, f.linhas * ALTURA_LINHA + 6);
const mesmaFrase = (a: Evento, b: Evento) => !!a.origem && !!b.origem && a.origem.ini === b.origem.ini;

function Trilhos() {
  const area = useRef<HTMLDivElement>(null);
  const t = useEditor((s) => s.t);
  const zoom = useEditor((s) => s.zoom);
  const selecionado = useEditor((s) => s.selecionado);
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const set = useEditor((s) => s.set);
  const { timeline: tl } = useRoteiroEstatico();
  const [sel, setSel] = useState<number | null>(null);
  const [arrasto, setArrasto] = useState<{ indice: number; t: number; modo: 'mover' | 'duracao' } | null>(null);
  const [contextMenu, setContextMenu] = useState<{x:number,y:number,evento:Evento|null}|null>(null);
  const [editingEvento, setEditingEvento] = useState<Evento|null>(null);
  const [recordingEvento, setRecordingEvento] = useState<Evento|null>(null);
  const lista = faixas(tl);
  const largura = Math.max(900, (tl.duracao + 2) * zoom);
  const marcas = Array.from({ length: Math.ceil(largura / zoom) + 1 }, (_, i) => i);
  const selEvento = sel !== null ? tl.eventos.find((e) => e.indice === sel) : undefined;

  const tempoDe = (clientX: number) => {
    const r = area.current!.getBoundingClientRect();
    return Math.max(0, (clientX - r.left + area.current!.scrollLeft) / zoom);
  };

  /** Snapping magnético: atrai para bordas de outros blocos ou múltiplos de 0.5s/1.0s */
  const aplicarSnap = (tempoBruto: number, toleranciaSegundos = 0.16): number => {
    let melhorSnap = tempoBruto;
    let menorDist = toleranciaSegundos;
    for (const ev of tl.eventos) {
      const dIni = Math.abs(ev.inicio - tempoBruto);
      if (dIni < menorDist) {
        menorDist = dIni;
        melhorSnap = ev.inicio;
      }
      const dFim = Math.abs(ev.fim - tempoBruto);
      if (dFim < menorDist) {
        menorDist = dFim;
        melhorSnap = ev.fim;
      }
    }
    if (menorDist < toleranciaSegundos) return melhorSnap;

    // Atrai para múltiplos de 0.5s se estiver bem próximo
    const meioSeg = Math.round(tempoBruto * 2) / 2;
    if (Math.abs(meioSeg - tempoBruto) < 0.10) return meioSeg;

    return tempoBruto;
  };

  const buscar = (clientX: number) => set({ t: Math.min(tl.duracao, tempoDe(clientX)), tocando: false });
  const arrastar = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    buscar(e.clientX);
    const mv = (ev: PointerEvent) => buscar(ev.clientX);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const aplicar = (novo: string, mensagem: string) => { setRoteiro(novo); setSel(null); set({ mensagem }); };

  /** Solta o bloco em `tSolto`: dentro de outra ação = simultâneo; em tempo livre = sequencial depois da ação que terminou antes. */
  const soltar = (ev: Evento, tSolto: number) => {
    if (!ev.origem) return;
    const outros = tl.eventos.filter((o) => o.origem && !mesmaFrase(o, ev) && o.acao.tipo !== 'nota');
    const dentro = outros.find((o) => o.inicio <= tSolto && tSolto < o.fim && o.fim > o.inicio);
    if (dentro) {
      aplicar(tornarSimultanea(roteiro, ev.origem, dentro.origem!), `“${ev.rotulo}” agora acontece junto com “${dentro.rotulo}”.`);
      return;
    }
    const antes = outros.filter((o) => o.fim <= tSolto).sort((a, b) => b.fim - a.fim)[0];
    if (antes) aplicar(tornarSequencial(roteiro, ev.origem, antes.origem), `“${ev.rotulo}” agora vem depois de “${antes.rotulo}”.`);
  };

  const iniciarArrasto = (e: React.PointerEvent, ev: Evento, modo: 'mover' | 'duracao') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSel(ev.indice);
    if (!ev.origem) return;
    const x0 = e.clientX;
    let moveu = false;
    const mv = (m: PointerEvent) => {
      if (Math.abs(m.clientX - x0) > 4) moveu = true;
      if (moveu) {
        const tBruto = tempoDe(m.clientX);
        const tSnap = aplicarSnap(tBruto);
        setArrasto({ indice: ev.indice, t: tSnap, modo });
      }
    };
    const up = (u: PointerEvent) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setArrasto(null);
      if (!moveu) return;
      const tSolto = aplicarSnap(tempoDe(u.clientX));
      if (modo === 'duracao') {
        const dur = tSolto - ev.inicio;
        if (dur > 0.4) aplicar(reescreverDuracao(roteiro, ev.origem!, dur), `Duração de “${ev.rotulo}”: ${dur.toFixed(1)} s.`);
      } else soltar(ev, tSolto);
    };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  };

  const comAnterior = () => {
    if (!selEvento?.origem) return;
    const ant = tl.eventos.filter((o) => o.indice < selEvento.indice && o.origem && !mesmaFrase(o, selEvento) && o.acao.tipo !== 'nota').pop();
    if (ant) aplicar(tornarSimultanea(roteiro, selEvento.origem, ant.origem!), `“${selEvento.rotulo}” agora acontece junto com “${ant.rotulo}”.`);
  };
  const ehSimultaneo = !!selEvento && tl.eventos.some((o) => o.indice !== selEvento.indice && o.inicio === selEvento.inicio && o.indice < selEvento.indice);
  // bloco de imagem selecionado: efeitos, tamanho e lugar reescrevem a frase do roteiro
  const imagemSel = selEvento && selEvento.acao.tipo === 'escrever' && selEvento.acao.conteudo.tipo === 'imagem' ? { ator: selEvento.acao.ator, conteudo: selEvento.acao.conteudo } : null;
  const trocarImagem = (mudanca: Partial<Extract<Conteudo, { tipo: 'imagem' }>>) => {
    if (!imagemSel || !selEvento?.origem) return;
    const novo = { ...imagemSel.conteudo, ...mudanca };
    for (const k of Object.keys(mudanca) as (keyof typeof novo)[]) if (novo[k] === undefined) delete novo[k];
    aplicar(reescreverImagem(roteiro, selEvento.origem, ATORES[imagemSel.ator]!.nome, novo), 'Imagem atualizada.');
  };
  const redimensionavel = (e: Evento) => !!e.origem && ((e.acao.tipo === 'pose' && !!e.acao.duracao) || e.acao.tipo === 'esperar');

  return (
    <div className="timeline-geral">
      <div className="barra-evento">
        {selEvento ? (
          <>
            <b title={selEvento.rotulo}>{selEvento.rotulo}</b>
            <span>{selEvento.inicio.toFixed(1)}s → {selEvento.fim.toFixed(1)}s</span>
            <button disabled={!selEvento.origem} onClick={comAnterior} title="Acontece ao mesmo tempo que a ação anterior (reescreve o roteiro com “Ao mesmo tempo,”)">Junto com o anterior</button>
            <button disabled={!selEvento.origem || !ehSimultaneo} onClick={() => selEvento.origem && aplicar(tornarSequencial(roteiro, selEvento.origem), 'Ação agora é sequencial.')} title="Volta a acontecer depois da anterior">Sequencial</button>
            {imagemSel && selEvento.origem && (
              <>
                <label title="Efeito com que a imagem entra na lousa">Entrada
                  <select value={imagemSel.conteudo.entrada} onChange={(e) => trocarImagem({ entrada: e.target.value as EfeitoImagem })}>
                    {EFEITOS_IMAGEM.map((x) => <option key={x} value={x}>{NOME_EFEITO[x]}</option>)}
                  </select>
                </label>
                <label title="Efeito com que sai (vale junto com “por N segundos”)">Saída
                  <select value={imagemSel.conteudo.saida ?? ''} onChange={(e) => trocarImagem({ saida: (e.target.value || undefined) as EfeitoImagem | undefined })}>
                    <option value="">Fica até apagar</option>
                    {EFEITOS_IMAGEM.map((x) => <option key={x} value={x}>{NOME_EFEITO[x]}</option>)}
                  </select>
                </label>
                <label title="Tamanho">Tamanho
                  <select value={imagemSel.conteudo.tamanho} onChange={(e) => trocarImagem({ tamanho: e.target.value as TamanhoImagem })}>
                    <option value="pequena">Pequena</option><option value="media">Média</option><option value="grande">Grande</option>
                  </select>
                </label>
                <label title="Posição na lousa">Lugar
                  <select value={imagemSel.conteudo.posicao} onChange={(e) => trocarImagem({ posicao: e.target.value as PosicaoImagem })}>
                    <option value="centro">Centro</option><option value="esquerda">Canto esquerdo</option><option value="direita">Canto direito</option>
                  </select>
                </label>
                <label title="Segundos na lousa; vazio = até apagar o quadro">Por (s)
                  <input type="number" min={1} step={0.5} style={{ width: 56 }} value={imagemSel.conteudo.exibirPor ?? ''} placeholder="∞"
                    onChange={(e) => trocarImagem({ exibirPor: e.target.value ? Number(e.target.value) : undefined })} />
                </label>
              </>
            )}
            <button disabled={!selEvento.origem} onClick={() => selEvento.origem && aplicar(excluirFrase(roteiro, selEvento.origem), imagemSel ? 'Imagem removida do roteiro.' : 'Frase removida do roteiro.')}>{imagemSel ? 'Excluir imagem' : 'Excluir'}</button>
          </>
        ) : <span className="dica">Clique num bloco para editá-lo. Arraste-o sobre outro bloco para que aconteçam juntos, ou para um espaço livre para ficar em sequência. Arraste a borda direita de uma pose com duração para mudá-la.</span>}
      </div>
      <div className="timeline">
        <div className="camadas">
          <div className="cabecalho-camadas">Camadas</div>
          {lista.map((f) => (
            <div
              key={f.chave}
              style={{ height: altura(f) }}
              className={`camada ${selecionado === f.chave ? 'sel' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={selecionado === f.chave}
              aria-label={`Camada ${f.nome}`}
              onClick={() => ORDEM_ATORES.includes(f.chave) && set({ selecionado: f.chave })}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.click(); } }}
            >
              <span className="cor" style={{ background: f.cor ?? '#94a3b8' }} />
              <span className="nome">{f.nome}</span>
              {f.trilha ? <ControleTrilha id={f.trilha} /> : <span className="olho" title="Visível">●</span>}
            </div>
          ))}
        </div>
        <div className="trilhos" ref={area}>
          <div style={{ width: largura, position: 'relative' }}>
            <div className="regua" onPointerDown={arrastar}>
              {marcas.map((s) => (
                <div key={s} className="marca" style={{ left: s * zoom }}><span>{s % 2 === 0 ? `${s}s` : ''}</span></div>
              ))}
              {tl.cenas.map((c, i) => <div key={i} className="cena-marca" style={{ left: c.inicio * zoom, cursor: 'pointer' }} title={`Ir para “${c.titulo}”`} onPointerDown={(e) => { e.stopPropagation(); set({ t: c.inicio, tocando: false }); }}>{c.titulo}</div>)}
            </div>
            {lista.map((f) => (
              <div key={f.chave} className="trilho" style={{ height: altura(f) }} onPointerDown={(e) => { setSel(null); arrastar(e); }}>
                {f.eventos.map((e) => {
                  const dur = (e.fim - e.inicio);
                  const movendo = arrasto?.indice === e.indice;
                  const durNova = movendo && arrasto!.modo === 'duracao' ? Math.max(0.4, arrasto!.t - e.inicio) : dur;
                  const isFala = e.acao.tipo === 'fala';
                  const audioNome = e.acao.tipo === 'fala' ? e.acao.audio : undefined;
                  const temAudio = Boolean(audioNome);
                  const badge = isFala ? (temAudio ? 'voz ✓' : 'voz +') : '';
                  const tooltip = isFala
                    ? `${e.rotulo} · ${audioNome ? `Áudio: “${audioNome}”` : 'Sem áudio (clique para gravar ou editar)'}`
                    : `${e.rotulo}${e.acao.junto ? ' (junto com a ação anterior)' : ''}`;

                  return (
                    <div
                      key={`${f.chave}-${e.indice}`}
                      className={`bloco ${e.inicio <= t && t < e.fim ? 'ativo' : ''} ${sel === e.indice ? 'sel' : ''} ${movendo ? 'arrastando' : ''} ${e.acao.junto ? 'junto' : ''} ${isFala ? 'fala' : ''}`}
                      style={{ left: e.inicio * zoom, top: 3 + (f.linhaDe.get(e.indice) ?? 0) * ALTURA_LINHA, width: Math.max(4, durNova * zoom - 2), background: COR[e.acao.tipo], cursor: e.origem ? 'grab' : 'default' }}
                      title={tooltip}
                      onPointerDown={(ev) => iniciarArrasto(ev, e, 'mover')}
                      onContextMenu={(ev) => { ev.preventDefault(); ev.stopPropagation(); if (isFala) { setContextMenu({ x: ev.clientX, y: ev.clientY, evento: e }); } }}
                      onClick={(ev) => { if (isFala) { setContextMenu({ x: ev.clientX, y: ev.clientY, evento: e }); } }}
                      onDoubleClick={(ev) => { if (isFala) { ev.stopPropagation(); setEditingEvento(e); setContextMenu(null); } }}
                    >
                      {durNova * zoom > 36 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.acao.junto && '⇉ '}
                          {e.rotulo}
                          {isFala && (
                            <span
                              style={{
                                fontSize: '0.85em',
                                opacity: 0.95,
                                padding: '1px 3px',
                                borderRadius: 3,
                                background: temAudio ? 'rgba(34,197,94,0.35)' : 'rgba(0,0,0,0.25)',
                              }}
                            >
                              {badge}
                            </span>
                          )}
                        </span>
                      )}
                      {redimensionavel(e) && <span className="alca" onPointerDown={(ev) => iniciarArrasto(ev, e, 'duracao')} />}
                    </div>
                  );
                })}
              </div>
            ))}
            {arrasto?.modo === 'mover' && <div className="alvo-soltar" style={{ left: arrasto.t * zoom }} />}
            <div className="playhead" style={{ left: t * zoom }}><div className="cabeca" /></div>
          </div>
        </div>
      </div>
      {/* Context menu for speech events */}
      {contextMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div
            className="context-menu-timeline"
            style={{ left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}
          >
            <button
              type="button"
              onClick={() => {
                setEditingEvento(contextMenu.evento);
                setContextMenu(null);
              }}
            >
              ✏️ Editar fala
            </button>
            <button
              type="button"
              onClick={() => {
                setRecordingEvento(contextMenu.evento);
                setContextMenu(null);
              }}
            >
              🎙️ Gravar áudio
            </button>
          </div>
        </>
      )}
      {/* Dialogs */}
      <EditSpeechDialog open={!!editingEvento} evento={editingEvento} onClose={() => setEditingEvento(null)} onSave={(novoTexto) => {
        if (editingEvento && editingEvento.origem) {
          const trechoAntigo = roteiro.slice(editingEvento.origem.ini, editingEvento.origem.fim);
          const trechoNovo = trechoAntigo.includes('"')
            ? trechoAntigo.replace(/"([^"]*)"/, `"${novoTexto}"`)
            : `${trechoAntigo.trimEnd()} "${novoTexto}".`;
          const novoRoteiro = roteiro.slice(0, editingEvento.origem.ini) + trechoNovo + roteiro.slice(editingEvento.origem.fim);
          aplicar(novoRoteiro, 'Fala editada');
        }
        setEditingEvento(null);
      }} />
      <RecordAudioDialog
        open={!!recordingEvento}
        evento={recordingEvento}
        onClose={() => setRecordingEvento(null)}
        onSave={async (arquivo) => {
          if (recordingEvento && recordingEvento.origem) {
            try {
              await importarAudio(arquivo);
              const trechoAntigo = roteiro.slice(recordingEvento.origem.ini, recordingEvento.origem.fim);
              const trechoNovo = /\[áudio:\s*[^\]]+\]/i.test(trechoAntigo)
                ? trechoAntigo.replace(/\[áudio:\s*[^\]]+\]/i, `[áudio: ${arquivo.name}]`)
                : `${trechoAntigo.trimEnd()} [áudio: ${arquivo.name}]`;
              const novoRoteiro = roteiro.slice(0, recordingEvento.origem.ini) + trechoNovo + roteiro.slice(recordingEvento.origem.fim);
              aplicar(novoRoteiro, `Áudio “${arquivo.name}” anexado à fala`);
            } catch (err: unknown) {
              console.error('Erro ao importar áudio:', err);
            }
          }
          setRecordingEvento(null);
        }}
      />
    </div>
  );
}

export function LinhaDoTempoPanel() {
  const { timeline } = useRoteiroEstatico();
  return (
    <Painel titulo="Linha do tempo" className="tempo-painel" acoes={<small>{timeline.cenas.length} cena(s) · {timeline.eventos.length} ações</small>}>
      <Trilhos />
    </Painel>
  );
}




