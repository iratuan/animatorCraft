import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { Painel } from '@renderer/components/Painel';
import {
  imagensCitadas, inserirColchetes, inserirMencao, inserirNoCursor, mencaoNoCursor, opcoesColchetes, opcoesMencao, teclaColchetes, colchetesNoCursor,
} from '@shared/domain';
import { useRoteiroEstatico } from '../hooks/useRoteiroDerivado';
import { SeletorMencao, type ItemSeletor } from './SeletorMencao';
import { CamadaSublinhado } from './CamadaSublinhado';
import { EVENTO_IR_PARA_TRECHO } from '@shared/constants/eventos';
import { posicaoDoCaret } from '../services/posicao-caret';

const chipEstilo: React.CSSProperties = {
  fontSize: '11px',
  padding: '5px 10px',
  borderRadius: 12,
  background: '#333',
  color: '#ddd',
  border: '1px solid #444',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

export function RoteiroPanel() {
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const set = useEditor((s) => s.set);
  const cursorGuardado = useEditor((s) => s.cursorRoteiro);
  const cursor = cursorGuardado ?? roteiro.length;
  // lembra onde o cursor está para inserir imagens, falas e clipes no trecho certo do roteiro
  const marcar = (e: React.SyntheticEvent<HTMLTextAreaElement>) => set({ cursorRoteiro: e.currentTarget.selectionStart });
  const { avisos, timeline, roteiro: parseado } = useRoteiroEstatico();
  const irParaCena = (inicio: number) => set({ t: inicio, tocando: false });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const camadaRef = useRef<HTMLDivElement>(null);
  // problemas com posição no texto: sublinhados no roteiro e listados embaixo; os demais avisos (imagens, conflitos) só listados
  const diagnosticos = parseado.diagnosticos;
  const outrosAvisos = avisos.filter((a) => !diagnosticos.some((d) => d.mensagem === a));
  const diagnosticoAtual = diagnosticos.find((d) => cursor >= d.ini && cursor <= d.fim);

  // seletor junto ao cursor: "@" abre a lista de personagens; "[[" abre elementos e ações
  const mencao = mencaoNoCursor(roteiro, cursor);
  const colch = mencao ? null : colchetesNoCursor(roteiro, cursor);
  const gatilho = mencao ? `ator:${mencao.inicio}` : colch ? `colchete:${colch.inicio}` : null;
  const filtro = mencao?.filtro ?? colch?.filtro ?? '';
  const [dispensado, setDispensado] = useState<string | null>(null);
  // seleção do seletor, guardada junto do texto que a gerou: ao digitar outro filtro ela volta ao primeiro item sem depender de efeito
  const [navegacao, setNavegacao] = useState<{ chave: string; i: number }>({ chave: '', i: 0 });
  // espelho síncrono da seleção: duas teclas seguidas (seta, seta, Enter) chegam antes do re-render
  const navegacaoRef = useRef(navegacao);
  const [posicao, setPosicao] = useState({ top: 0, left: 0, altura: 18 });

  // posição que o cursor deve ter depois da próxima atualização do texto (o React move o cursor para o fim ao trocar o valor)
  const cursorPendente = useRef<number | null>(null);
  const aplicar = (texto: string, pos: number, mensagem?: string) => {
    set({ cursorRoteiro: pos, ...(mensagem ? { mensagem } : {}) });
    if (texto === roteiro) {
      // só o cursor mudou (ex.: "]" que avança sobre o "]" automático): não há atualização de texto para o efeito abaixo
      textareaRef.current?.setSelectionRange(pos, pos);
      return;
    }
    cursorPendente.current = pos;
    setRoteiro(texto);
  };
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (el && cursorPendente.current !== null) {
      el.setSelectionRange(cursorPendente.current, cursorPendente.current);
      cursorPendente.current = null;
    }
  }, [roteiro]);

  const itens: ItemSeletor[] = gatilho && gatilho !== dispensado
    ? mencao
      ? opcoesMencao(mencao.filtro).map((o) => ({
        chave: o.chave, rotulo: o.rotulo, detalhe: o.detalhe,
        escolher: () => { const r = inserirMencao(roteiro, mencao, cursor, o.insercao); aplicar(r.texto, r.cursor, `Personagem: ${o.rotulo}`); },
      }))
      : opcoesColchetes(colch!.filtro, imagensCitadas(roteiro)).map((o) => ({
        chave: o.chave, rotulo: o.rotulo, detalhe: o.detalhe, grupo: o.grupo,
        escolher: () => { const r = inserirColchetes(roteiro, colch!, cursor, o.conteudo); aplicar(r.texto, r.cursor, `Inserido: [[${o.conteudo}]]`); },
      }))
    : [];
  const aberto = itens.length > 0;

  // ao digitar outro texto, volta para a primeira opção; ao sair do gatilho, esquece o Esc
  const chaveSel = `${gatilho}|${filtro}`;
  const selecionado = navegacao.chave === chaveSel ? navegacao.i : 0;
  const setSelecionado = (i: number) => { navegacaoRef.current = { chave: chaveSel, i }; setNavegacao(navegacaoRef.current); };
  const selecaoAtual = () => (navegacaoRef.current.chave === chaveSel ? navegacaoRef.current.i : 0);
  useEffect(() => { if (!gatilho) setDispensado(null); }, [gatilho]);
  // a posição é medida depois que o texto novo está no DOM
  useLayoutEffect(() => {
    if (aberto && textareaRef.current) setPosicao(posicaoDoCaret(textareaRef.current, cursor));
  }, [aberto, roteiro, cursor]);

  // outras telas (ex.: "Corrigir primeira frase" na exportação) pedem que o cursor vá até um trecho
  useEffect(() => {
    const ouvir = (e: Event) => irParaDiagnostico((e as CustomEvent<{ ini: number; fim: number }>).detail);
    window.addEventListener(EVENTO_IR_PARA_TRECHO, ouvir);
    return () => window.removeEventListener(EVENTO_IR_PARA_TRECHO, ouvir);
  }, []);

  const tecla = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (aberto) {
      const n = itens.length;
      const sel = Math.min(selecaoAtual(), n - 1);
      // atualização funcional: duas setas em sequência rápida partem da seleção mais recente, não da que estava na tela
      const mover = (passo: number) => setSelecionado((selecaoAtual() + passo + n) % n);
      if (e.key === 'ArrowDown') { e.preventDefault(); mover(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); itens[sel]!.escolher(); return; }
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setDispensado(gatilho); return; }
    }
    // "[[" fecha sozinho e "]" não duplica: tratado aqui porque o cursor precisa estar certo no momento da tecla
    const pos = e.currentTarget.selectionStart;
    const r = teclaColchetes(roteiro, pos, e.key);
    if (r) { e.preventDefault(); aplicar(r.texto, r.cursor); }
  };

  /** Leva o cursor para o começo do problema e seleciona a frase toda. */
  const irParaDiagnostico = (d: { ini: number; fim: number }) => {
    set({ cursorRoteiro: d.ini });
    const el = textareaRef.current;
    if (el) { el.focus(); el.setSelectionRange(d.ini, d.fim); }
  };

  /** Troca a frase com problema pela sugestão escolhida. Entra no desfazer como qualquer edição. */
  const corrigir = (d: { ini: number; fim: number }, sugestao: string) => {
    const novo = `${roteiro.slice(0, d.ini)}${sugestao}${roteiro.slice(d.fim)}`;
    aplicar(novo, d.ini + sugestao.length, `Corrigido: “${sugestao}”`);
  };

  const inserirTrecho = (trecho: string) => {
    const pos = useEditor.getState().cursorRoteiro ?? roteiro.length;
    const novo = inserirNoCursor(roteiro, pos, trecho);
    setRoteiro(novo);
    set({ mensagem: `Inserido: “${trecho}”` });
  };

  return (
    <Painel
      titulo="Roteiro"
      className="roteiro"
      acoes={
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {timeline.cenas.length > 1 && (
            <select
              style={{ fontSize: '0.8em', padding: '1px 4px', borderRadius: 4, background: 'var(--bg-elevado, #222)', color: 'inherit', border: '1px solid #444' }}
              title="Saltar para cena"
              onChange={(e) => {
                const idx = Number(e.target.value);
                if (timeline.cenas[idx]) irParaCena(timeline.cenas[idx]!.inicio);
              }}
            >
              <option value="">Ir para cena…</option>
              {timeline.cenas.map((c, i) => (
                <option key={i} value={i}>
                  {i + 1}. {c.titulo} ({c.inicio.toFixed(1)}s)
                </option>
              ))}
            </select>
          )}
          <span className={`badge ${avisos.length ? 'aviso' : 'ok'}`}>{avisos.length ? `${avisos.length} aviso(s)` : 'sem avisos'}</span>
        </div>
      }
    >
      <div className="chips-roteiro" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '4px 8px', background: '#222', borderBottom: '1px solid #1a1a1a' }}>
        <button type="button" onClick={() => inserirTrecho('Erika diz "Olá!" feliz.')} style={chipEstilo} title="Inserir fala de personagem">+ Fala</button>
        <button type="button" onClick={() => inserirTrecho('Dario entra pela direita andando.')} style={chipEstilo} title="Inserir entrada em cena">+ Entrar</button>
        <button type="button" onClick={() => inserirTrecho('Erika escreve "Texto" no quadro.')} style={chipEstilo} title="Inserir escrita no quadro">+ Lousa</button>
        <button type="button" onClick={() => set({ editorMatematicaAberto: true, abaMatematicaInicial: 'latex' })} style={{ ...chipEstilo, borderColor: '#0284c7', color: '#38bdf8' }} title="Abrir editor de fórmulas LaTeX">+ LaTeX</button>
        <button type="button" onClick={() => set({ editorMatematicaAberto: true, abaMatematicaInicial: 'grafico' })} style={{ ...chipEstilo, borderColor: '#0284c7', color: '#38bdf8' }} title="Abrir editor de gráfico de funções f(x)">+ Gráfico f(x)</button>
        <button type="button" onClick={() => inserirTrecho('[câmera: lousa]')} style={chipEstilo} title="Inserir foco de câmera">[câmera]</button>
        <button type="button" onClick={() => inserirTrecho('Espera 1 segundos.')} style={chipEstilo} title="Inserir pausa no vídeo">+ Pausa</button>
      </div>
      <div className="roteiro-corpo">
        <CamadaSublinhado ref={camadaRef} texto={roteiro} diagnosticos={diagnosticos} />
        <textarea
          ref={textareaRef}
          id="campo-roteiro"
          aria-label="Texto do roteiro"
          className="com-camada"
          spellCheck={false}
          value={roteiro}
          onChange={(e) => { setRoteiro(e.target.value); marcar(e); }}
          onSelect={marcar}
          onClick={marcar}
          onKeyUp={marcar}
          onKeyDown={tecla}
          onBlur={() => setDispensado(gatilho)}
          onScroll={(e) => { if (camadaRef.current) camadaRef.current.scrollTop = e.currentTarget.scrollTop; }}
        />
        {aberto && (
          <SeletorMencao
            itens={itens}
            selecionado={Math.min(selecionado, itens.length - 1)}
            posicao={posicao}
            onPassar={setSelecionado}
          />
        )}
      </div>
      {(diagnosticos.length > 0 || outrosAvisos.length > 0) && (
        <ul className="avisos diagnosticos">
          {diagnosticos.map((d, i) => (
            <li key={i} className={`diag ${d.gravidade}${d === diagnosticoAtual ? ' atual' : ''}`}>
              <button type="button" className="diag-ir" onClick={() => irParaDiagnostico(d)} title="Ir para o trecho">
                {d.gravidade === 'erro' ? '✖' : '⚠'} {d.mensagem}
              </button>
              {d.sugestoes.map((s) => (
                <button key={s} type="button" className="diag-sugestao" onClick={() => corrigir(d, s)}>usar: {s}</button>
              ))}
            </li>
          ))}
          {outrosAvisos.map((a, i) => <li key={`o${i}`}>⚠ {a}</li>)}
        </ul>
      )}
    </Painel>
  );
}
