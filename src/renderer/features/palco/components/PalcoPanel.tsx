import { useRef, useState, useEffect } from 'react';
import { ATORES, posicionarNoRoteiro, type Evento } from '@shared/domain';
import { atorEm } from '@renderer/features/cena';
import { Painel } from '@renderer/components/Painel';
import { useEditor } from '@renderer/store/editor-store';
import { FPS } from '@shared/constants/video';
import { useRoteiroDerivado } from '@renderer/features/roteiro';
import { usePalcoCanvas } from '../hooks/usePalcoCanvas';
import { Transporte } from './Transporte';

/** Onde inserir a frase de posição: logo depois da última ação que já terminou (a ação tem duração zero e não atrasa nada). */
function ancoraDaPosicao(eventos: Evento[], t: number, ator: string): { ancora?: Evento; existente?: Evento } {
  const comOrigem = eventos.filter((e) => e.origem);
  const terminadas = comOrigem.filter((e) => e.fim <= t + 1e-6);
  const ancora = [...terminadas].sort((a, b) => a.fim - b.fim || a.indice - b.indice).pop() ?? comOrigem.filter((e) => e.inicio <= t).pop();
  // se essa âncora já é "fica na posição" do mesmo personagem, só troca o número
  const existente = ancora && ancora.acao.tipo === 'posicionar' && ancora.acao.ator === ator && !ancora.acao.andando ? ancora : undefined;
  return { ancora, existente };
}

export function PalcoPanel() {
  const [telaCheia, setTelaCheia] = useState(false);
  const formato = useEditor((s) => s.formato);
  const set = useEditor((s) => s.set);
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const t = useEditor((s) => s.t);
  const arrasto = useEditor((s) => s.arrastoPalco);
  const { estado, timeline, dim } = useRoteiroDerivado();
  const { canvas, area, estilo } = usePalcoCanvas();
  const pegada = useRef<{ id: string; dx: number; x0: number; moveu: boolean } | null>(null);

  useEffect(() => {
    if (!telaCheia) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTelaCheia(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [telaCheia]);

  const fracao = (e: React.PointerEvent) => { const r = canvas.current!.getBoundingClientRect(); return (e.clientX - r.left) / r.width; };
  const emPlanoAberto = estado.camera.atual.alvo === 'aberto' && estado.camera.progresso > 0.99;

  const baixar = (e: React.PointerEvent) => {
    const fx = fracao(e);
    const id = atorEm(estado, fx);
    set({ selecionado: id });
    if (!id || !emPlanoAberto) return;
    // o sprite só "gruda" no ponteiro depois de um pequeno movimento, para o clique simples continuar sendo só seleção
    pegada.current = { id, dx: estado.atores[id]!.x - fx, x0: e.clientX, moveu: false };
    canvas.current!.setPointerCapture(e.pointerId);
  };
  const mover = (e: React.PointerEvent) => {
    const p = pegada.current;
    if (!p) return;
    if (!p.moveu && Math.abs(e.clientX - p.x0) < 4) return;
    p.moveu = true;
    set({ arrastoPalco: { id: p.id, x: Math.min(0.97, Math.max(0.03, fracao(e) + p.dx)) } });
  };
  const soltar = () => {
    const p = pegada.current;
    pegada.current = null;
    const a = useEditor.getState().arrastoPalco;
    set({ arrastoPalco: null });
    if (!p?.moveu || !a) return;
    const nome = ATORES[a.id]!.nome;
    const { ancora, existente } = ancoraDaPosicao(timeline.eventos, t, a.id);
    setRoteiro(posicionarNoRoteiro(roteiro, nome, a.x * 100, ancora?.origem, existente?.origem));
    set({ mensagem: `${nome} agora fica na posição ${Math.round(a.x * 100)}% a partir de ${(ancora?.fim ?? 0).toFixed(1)} s.` });
  };

  return (
    <Painel
      className={`palco ${telaCheia ? 'em-tela-cheia' : ''}`}
      titulo={<>Palco <small>{dim.w}×{dim.h} · {FPS} fps · escala de cinza · arraste um personagem para posicioná-lo</small></>}
      acoes={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="seg">
            <button className={formato === '16:9' ? 'on' : ''} title="Formato horizontal 16:9 (YouTube / Desktop / 1920×1080)" onClick={() => set({ formato: '16:9' })}>16:9</button>
            <button className={formato === '9:16' ? 'on' : ''} title="Formato vertical 9:16 (Shorts / Reels / TikTok / 1080×1920)" onClick={() => set({ formato: '9:16' })}>9:16</button>
          </div>
          <button
            className={telaCheia ? 'on' : ''}
            style={{ padding: '2px 8px', fontSize: '11px', borderRadius: 3, border: '1px solid #444', background: telaCheia ? 'var(--azul, #2d9cff)' : 'transparent', color: telaCheia ? '#fff' : 'inherit' }}
            onClick={() => setTelaCheia((v) => !v)}
            title={telaCheia ? 'Sair da tela cheia (Esc)' : 'Modo apresentação / tela cheia'}
          >
            {telaCheia ? '✕ Sair' : '⛶ Tela cheia'}
          </button>
        </div>
      }
    >
      <div className="area-palco" ref={area}>
        <canvas ref={canvas} onPointerDown={baixar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar} style={{ ...estilo, touchAction: 'none', cursor: arrasto ? 'grabbing' : 'default' }} />
      </div>
      <Transporte />
    </Painel>
  );
}
