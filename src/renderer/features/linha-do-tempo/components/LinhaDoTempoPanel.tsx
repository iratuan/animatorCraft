import { useRef, useState } from 'react';
import { ATORES, ORDEM_ATORES, excluirFrase, reescreverDuracao, tornarSequencial, tornarSimultanea, type Acao, type Evento, type Timeline } from '@shared/domain';
import { Painel } from '@renderer/components/Painel';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';

const COR: Record<Acao['tipo'], string> = {
  entrar: '#3b82f6', sair: '#3b82f6', posicionar: '#0ea5e9', audio: '#f472b6', fala: '#f59e0b', escrever: '#22c55e', pose: '#a855f7', expressao: '#ec4899',
  apontar: '#14b8a6', apagar: '#6b7280', esperar: '#4b5563', nota: '#64748b', camera: '#eab308',
};

// cores só da interface do editor (o desenho do palco é em escala de cinza)
const COR_FAIXA: Record<string, string> = {
  cringefather: '#ef4444', betason: '#3b82f6', erika: '#ec4899', dario: '#10b981', laura: '#a78bfa', elizendra: '#f97316', artur: '#06b6d4', carol: '#84cc16',
};
const PALETA = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#eab308', '#f97316', '#6366f1', '#22c55e'];
const corDoAtor = (id: string) => COR_FAIXA[id] ?? PALETA[[...id].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETA.length]!;

const ALTURA_LINHA = 26;
interface Faixa { chave: string; nome: string; cor?: string; eventos: Evento[]; linhas: number; linhaDe: Map<number, number> }

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
  const brutas: { chave: string; nome: string; cor?: string; eventos: Evento[] }[] = [];
  for (const id of ORDEM_ATORES) {
    const evs = tl.eventos.filter((e) => e.acao.tipo !== 'camera' && 'ator' in e.acao && e.acao.ator === id);
    if (evs.length) brutas.push({ chave: id, nome: ATORES[id]!.nome, cor: corDoAtor(id), eventos: evs });
  }
  brutas.push({ chave: 'camera', nome: 'Câmera', cor: '#eab308', eventos: tl.eventos.filter((e) => e.acao.tipo === 'camera') });
  brutas.push({ chave: 'quadro', nome: 'Quadro', eventos: tl.eventos.filter((e) => e.acao.tipo === 'escrever' || e.acao.tipo === 'apagar') });
  brutas.push({ chave: 'audio', nome: 'Áudio', cor: '#f472b6', eventos: tl.eventos.filter((e) => e.acao.tipo === 'audio' || (e.acao.tipo === 'fala' && !!e.acao.audio)) });
  brutas.push({ chave: 'direcao', nome: 'Direção', eventos: tl.eventos.filter((e) => e.acao.tipo === 'esperar' || e.acao.tipo === 'nota') });
  return brutas.map((f) => ({ ...f, ...empilhar(f.eventos) }));
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
  const { timeline: tl } = useRoteiroDerivado();
  const [sel, setSel] = useState<number | null>(null);
  const [arrasto, setArrasto] = useState<{ indice: number; t: number; modo: 'mover' | 'duracao' } | null>(null);
  const lista = faixas(tl);
  const largura = Math.max(900, (tl.duracao + 2) * zoom);
  const marcas = Array.from({ length: Math.ceil(largura / zoom) + 1 }, (_, i) => i);
  const selEvento = sel !== null ? tl.eventos.find((e) => e.indice === sel) : undefined;

  const tempoDe = (clientX: number) => {
    const r = area.current!.getBoundingClientRect();
    return Math.max(0, (clientX - r.left + area.current!.scrollLeft) / zoom);
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
    e.stopPropagation();
    setSel(ev.indice);
    if (!ev.origem) return;
    const x0 = e.clientX;
    let moveu = false;
    const mv = (m: PointerEvent) => {
      if (Math.abs(m.clientX - x0) > 4) moveu = true;
      if (moveu) setArrasto({ indice: ev.indice, t: tempoDe(m.clientX), modo });
    };
    const up = (u: PointerEvent) => {
      window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);
      setArrasto(null);
      if (!moveu) return;
      const tSolto = tempoDe(u.clientX);
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
            <button disabled={!selEvento.origem} onClick={() => selEvento.origem && aplicar(excluirFrase(roteiro, selEvento.origem), 'Frase removida do roteiro.')}>Excluir</button>
          </>
        ) : <span className="dica">Clique num bloco para editá-lo. Arraste-o sobre outro bloco para que aconteçam juntos, ou para um espaço livre para ficar em sequência. Arraste a borda direita de uma pose com duração para mudá-la.</span>}
      </div>
      <div className="timeline">
        <div className="camadas">
          <div className="cabecalho-camadas">Camadas</div>
          {lista.map((f) => (
            <div key={f.chave} style={{ height: altura(f) }} className={`camada ${selecionado === f.chave ? 'sel' : ''}`} onClick={() => ORDEM_ATORES.includes(f.chave) && set({ selecionado: f.chave })}>
              <span className="cor" style={{ background: f.cor ?? '#94a3b8' }} />
              <span className="nome">{f.nome}</span>
              <span className="olho" title="Visível">●</span>
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
                  return (
                    <div
                      key={`${f.chave}-${e.indice}`}
                      className={`bloco ${e.inicio <= t && t < e.fim ? 'ativo' : ''} ${sel === e.indice ? 'sel' : ''} ${movendo ? 'arrastando' : ''} ${e.acao.junto ? 'junto' : ''}`}
                      style={{ left: e.inicio * zoom, top: 3 + (f.linhaDe.get(e.indice) ?? 0) * ALTURA_LINHA, width: Math.max(4, durNova * zoom - 2), background: COR[e.acao.tipo], cursor: e.origem ? 'grab' : 'default' }}
                      title={`${e.rotulo}${e.acao.junto ? ' (junto com a ação anterior)' : ''}`}
                      onPointerDown={(ev) => iniciarArrasto(ev, e, 'mover')}
                    >
                      {durNova * zoom > 40 && `${e.acao.junto ? '⇉ ' : ''}${e.rotulo}`}
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
    </div>
  );
}

export function LinhaDoTempoPanel() {
  const { timeline } = useRoteiroDerivado();
  return (
    <Painel titulo="Linha do tempo" className="tempo-painel" acoes={<small>{timeline.cenas.length} cena(s) · {timeline.eventos.length} ações</small>}>
      <Trilhos />
    </Painel>
  );
}


