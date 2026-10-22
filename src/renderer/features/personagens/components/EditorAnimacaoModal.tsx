import { useState } from 'react';
import {
  AMP_PADRAO, ATORES, BOCAS, clipesPersonalizados, definirClipesPersonalizados, definirExpressoesBoneco, duracaoDoClipe, EXPRESSOES, expressoesBoneco,
  expressoesDe, MAX_PASSOS_CLIPE, MAX_QUADROS_EXPRESSAO, MOVIMENTOS, NOME_EXPRESSAO, NOME_POSE, nomeDeClipe, nomeDeExpressao, OLHOS, ORDEM_ATORES, POSES,
  type ActorId, type ClipePersonalizado, type EstiloClipe, type ExpressaoBoneco, type Movimento, type PassoClipe, type PoseId, type RostoBoneco,
} from '@shared/domain';
import { listarSprites } from '@renderer/features/cena';
import { Miniatura } from '@renderer/components/Miniatura';
import { useEditor } from '@renderer/store/editor-store';
import { carregarAnimacoesSalvas, salvarClipes, salvarExpressoes } from '../services/animacoes';
import { PreviaAnimacao } from './PreviaAnimacao';

const NOME_MOV: Record<Movimento, string> = {
  respirar: 'Respirar', quicar: 'Quicar', balancar: 'Balançar', tremer: 'Tremer', girar: 'Girar (vira de lado)', pular: 'Pular', inclinar: 'Inclinar', andar: 'Andar', correr: 'Correr', encolher: 'Encolher',
};
const NOME_OLHO: Record<(typeof OLHOS)[number], string> = { normal: 'Normais', grande: 'Grandes', meia: 'Meio fechados', estreito: 'Estreitos (bravos)' };
const NOME_BOCA: Record<(typeof BOCAS)[number], string> = { sorriso: 'Sorriso', triste: 'Triste', o: 'Surpresa (O)', reta: 'Reta', lado: 'De lado', dentes: 'Dentes', onda: 'Ondulada', aberta: 'Aberta' };
const NOME_ESTILO: Record<EstiloClipe, string> = { stickman: 'Stickman', ambos: 'Stickman' };

/** `existentes`: nomes das expressões do boneco que já estavam salvas quando a edição começou (o rascunho em si já está no registro, para a prévia) */
interface RascunhoExpr { original?: string; nome: string; quadros: RostoBoneco[]; existentes: string[] }
interface RascunhoClipe { original?: { id: string; estilo: EstiloClipe }; nome: string; estilo: EstiloClipe; loop: boolean; substitui: string; passos: PassoClipe[]; /** chaves "id|estilo" dos clipes já salvos quando a edição começou */ existentes: string[] }

const rostoNovo = (): RostoBoneco => ({ olho: 'normal', sobr: 3, boca: 'sorriso' });
const passoNovo = (): PassoClipe => ({ tags: ['parado'], dur: 0.5, mov: 'balancar', amp: AMP_PADRAO.balancar, poseBoneco: 'parado' });
/** intensidade do passo em relação ao padrão do movimento (1 = normal) */
const fatorDe = (p: PassoClipe): number => (AMP_PADRAO[p.mov] ? (p.amp ?? AMP_PADRAO[p.mov]!) / AMP_PADRAO[p.mov]! : 1);
const poseValida = (p: string) => (POSES as readonly string[]).includes(p);

function clipeDoRascunho(ator: ActorId, r: RascunhoClipe): ClipePersonalizado {
  return {
    id: nomeDeClipe(r.nome), nome: r.nome.trim(), categoria: 'Movimento', loop: r.loop, passos: r.passos, ator, estilo: r.estilo,
    ...(r.substitui ? { substitui: r.substitui as PoseId } : {}),
  };
}
const mesmoClipe = (c: ClipePersonalizado, ator: string, id: string, estilo: EstiloClipe) => c.ator === ator && c.id === id && (c.estilo ?? 'stickman') === estilo;

/**
 * Expressões e clipes de um personagem no estilo Stickman. Expressões: o rosto do boneco (olhos, sobrancelha, boca; até 4 quadros para animar).
 * Clipes: sequências de passos (pose do boneco stickman, movimento e duração) usadas no roteiro com "Fulano faz o clipe nome.".
 */
export function EditorAnimacaoModal() {
  const alvo = useEditor((s) => s.editorAnimacao);
  const set = useEditor((s) => s.set);
  const inserir = useEditor((s) => s.inserir);
  const novaVersaoPersonagens = useEditor((s) => s.novaVersaoPersonagens);
  const versaoBib = useEditor((s) => s.versaoBib);
  const [aba, setAba] = useState<'expressoes' | 'clipes'>('expressoes');
  const [exprRasc, setExprRasc] = useState<RascunhoExpr | null>(null);
  const [clipeRasc, setClipeRasc] = useState<RascunhoClipe | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [lista, setLista] = useState(0); // força a releitura dos registros depois de salvar/excluir
  const [msg, setMsg] = useState('');
  const [abertoDe, setAbertoDe] = useState<ActorId | null>(null);
  if (!alvo) return null;
  const id: ActorId = alvo.ator;
  // ao abrir (ou trocar de personagem) começa limpo
  if (abertoDe !== id) { setAbertoDe(id); setAba(alvo.aba ?? 'expressoes'); setExprRasc(null); setClipeRasc(null); setPrevia(null); setMsg(''); }

  const espec = ATORES[id]!;
  const ap = espec.apelidos[0]!;
  const tem = listarSprites(id);
  void versaoBib; void lista;

  const fechar = () => { carregarAnimacoesSalvas(); setPrevia(null); setAbertoDe(null); set({ editorAnimacao: null }); novaVersaoPersonagens(); }; // ao reabrir, volta à aba pedida e sem rascunhos
  const atualizar = () => { setLista((n) => n + 1); novaVersaoPersonagens(); };

  // ---------------------------------------------------------------- expressões
  const salvasBoneco = expressoesBoneco(id);
  const doBoneco = new Set(salvasBoneco.map((e) => e.nome));
  const base = new Set<string>(EXPRESSOES);
  const todas = expressoesDe(id);
  const roteiroExpr = (nome: string) => `[close em ${ap}]\n${ap} fica na posição 50%.\n${ap} faz cara de ${nome}.\nEspera 2 segundos.`;

  const nomeExpr = exprRasc ? nomeDeExpressao(exprRasc.nome) : '';
  /** coloca o rascunho no domínio para a prévia (só vale até salvar ou fechar) */
  const aplicarExprRascunho = (r: RascunhoExpr) => {
    const nome = nomeDeExpressao(r.nome);
    carregarAnimacoesSalvas(); // volta ao que está salvo: sem isso, cada letra digitada deixaria uma expressão-fantasma ("s", "so", "son"…) no registro
    if (!nome) return;
    definirExpressoesBoneco([...expressoesBoneco().filter((e) => !(e.ator === id && (e.nome === nome || e.nome === r.original))), { ator: id, nome, quadros: r.quadros }]);
  };
  const salvarExpr = () => {
    if (!exprRasc) return;
    if (!nomeExpr) { setMsg('Dê um nome à expressão (letras e números).'); return; }
    carregarAnimacoesSalvas(); // descarta a prévia do rascunho; o que vale é o que está salvo
    // o nome pode coincidir com um sprite rosto_<nome> (a mesma expressão vale nos dois estilos), mas não com outra expressão do boneco
    const original = exprRasc.original;
    if (base.has(nomeExpr) || (exprRasc.existentes.includes(nomeExpr) && original !== nomeExpr)) { setMsg(`“${nomeExpr}” já existe para ${espec.nome}. Use outro nome.`); return; }
    const outras = expressoesBoneco().filter((e) => !(e.ator === id && (e.nome === nomeExpr || e.nome === original)));
    salvarExpressoes([...outras, { ator: id, nome: nomeExpr, quadros: exprRasc.quadros }]);
    setMsg(`Expressão “${nomeExpr}” salva. No roteiro: ${espec.nome} faz cara de ${nomeExpr}.`);
    setExprRasc(null); atualizar();
  };
  const excluirExpr = (nome: string) => {
    salvarExpressoes(expressoesBoneco().filter((e) => !(e.ator === id && e.nome === nome)));
    setMsg(`Expressão “${nome}” excluída.`); setExprRasc(null); atualizar();
  };
  const editarSprite = (nome: string) => set({ editorImagem: { personagem: id, tipo: 'rosto', nome } });
  const mudarQuadro = (i: number, parte: Partial<RostoBoneco>) => {
    if (!exprRasc) return;
    const r = { ...exprRasc, quadros: exprRasc.quadros.map((q, k) => (k === i ? { ...q, ...parte } : q)) };
    setExprRasc(r); aplicarExprRascunho(r); setPrevia(roteiroExpr(nomeDeExpressao(r.nome)));
  };

  // ---------------------------------------------------------------- clipes
  const meus = clipesPersonalizados(id);
  const opcoesSprite = [...new Set(['parado', ...tem.poses])];
  const mudarClipe = (r: RascunhoClipe) => {
    setClipeRasc(r);
    carregarAnimacoesSalvas(); // volta ao que está salvo: sem isso, cada letra digitada deixaria um clipe-fantasma no registro
    if (!nomeDeClipe(r.nome) || !r.passos.length) return;
    const novo = clipeDoRascunho(id, r);
    const estiloClipe: EstiloClipe = novo.estilo ?? 'stickman';
    definirClipesPersonalizados([...clipesPersonalizados().filter((c) => !mesmoClipe(c, id, novo.id, estiloClipe) && !(r.original && mesmoClipe(c, id, r.original.id, r.original.estilo))), novo], poseValida);
    setPrevia(`${ap} fica na posição 50%.\n${ap} faz o clipe ${novo.id}.\n${ap} faz o clipe ${novo.id}.`);
  };
  const mudarPasso = (i: number, parte: Partial<PassoClipe>) => clipeRasc && mudarClipe({ ...clipeRasc, passos: clipeRasc.passos.map((p, k) => (k === i ? { ...p, ...parte } : p)) });
  const moverPasso = (i: number, d: number) => {
    if (!clipeRasc) return;
    const j = i + d, p = [...clipeRasc.passos];
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j]!, p[i]!];
    mudarClipe({ ...clipeRasc, passos: p });
  };
  const salvarClipe = () => {
    if (!clipeRasc) return;
    const nome = nomeDeClipe(clipeRasc.nome);
    if (!nome) { setMsg('Dê um nome ao clipe (letras e números).'); return; }
    if (!clipeRasc.passos.length) { setMsg('Acrescente pelo menos um passo.'); return; }
    carregarAnimacoesSalvas(); // descarta a prévia do rascunho; o que vale é o que está salvo
    const novo = clipeDoRascunho(id, clipeRasc);
    const origId = clipeRasc.original?.id;
    const jaExiste = origId !== novo.id && clipesPersonalizados().some((c) => c.ator === id && c.id === novo.id);
    if (jaExiste) { setMsg(`Já existe o clipe “${nome}”. Use outro nome.`); return; }
    const outros = clipesPersonalizados().filter((c) => c.ator !== id || (c.id !== novo.id && c.id !== origId));
    salvarClipes([...outros, novo]);
    setMsg(`Clipe “${nome}” salvo. No roteiro: ${espec.nome} faz o clipe ${nome}.`);
    setClipeRasc(null); atualizar();
  };
  const excluirClipe = (c: ClipePersonalizado) => {
    salvarClipes(clipesPersonalizados().filter((x) => !mesmoClipe(x, id, c.id, c.estilo ?? 'stickman')));
    setMsg(`Clipe “${c.nome}” excluído.`); setClipeRasc(null); atualizar();
  };
  const editarClipe = (c: ClipePersonalizado) => {
    const estilo: EstiloClipe = c.estilo ?? 'stickman';
    const r: RascunhoClipe = { original: { id: c.id, estilo }, nome: c.nome, estilo, loop: c.loop, substitui: c.substitui ?? '', existentes: meus.map((x) => `${x.id}|${x.estilo ?? 'stickman'}`), passos: c.passos.map((p) => ({ ...p, tags: [...p.tags] })) };
    setClipeRasc(r); setPrevia(`${ap} fica na posição 50%.\n${ap} faz o clipe ${c.id}.\n${ap} faz o clipe ${c.id}.`);
  };

  return (
    <div className="modal-fundo" onClick={fechar}>
      <div className="modal largo anim" role="dialog" aria-label="Expressões e clipes do personagem" onClick={(ev) => ev.stopPropagation()}>
        <h3>Expressões e clipes de {espec.nome}</h3>
        <div className="seletor-personagem">
          {ORDEM_ATORES.map((a) => <button key={a} className={a === id ? 'on' : ''} onClick={() => { carregarAnimacoesSalvas(); set({ editorAnimacao: { ator: a, aba } }); }}>{ATORES[a]!.nome}</button>)}
        </div>
        <div className="abas-modal">
          <button className={aba === 'expressoes' ? 'on' : ''} onClick={() => { setAba('expressoes'); setClipeRasc(null); setMsg(''); }}>Expressões</button>
          <button className={aba === 'clipes' ? 'on' : ''} onClick={() => { setAba('clipes'); setExprRasc(null); setMsg(''); }}>Clipes de animação</button>
        </div>
        {msg && <p className="dica msg-anim" role="status">{msg}</p>}

        <div className="anim-corpo">
          <div className="anim-esq">
            {aba === 'expressoes' && !exprRasc && (<>
              <p className="dica">Clique em uma expressão para ver a prévia. No roteiro: <code>{espec.nome} faz cara de apaixonada.</code> No estilo <b>Stickman</b> a expressão é o rosto do boneco (abaixo); no <b>Chibi</b> é o sprite <code>rosto_&lt;nome&gt;.png</code>, desenhado no editor de imagem.</p>
              <div className="grade-espacos">
                {todas.map((n) => (
                  <div key={n} className="espaco-caixa">
                    <button className="espaco" data-expressao={n} title="Ver prévia" onClick={() => setPrevia(roteiroExpr(n))}>
                      <Miniatura ator={id} expressao={n} modo="rosto" tamanho={64} />
                      <span>{NOME_EXPRESSAO[n as keyof typeof NOME_EXPRESSAO] ?? n}</span>
                    </button>
                    <button className="espaco-png" title={`Inserir “${espec.nome} faz cara de ${n}.” no roteiro`} onClick={() => inserir(`${espec.nome} faz cara de ${n}.`)}>＋</button>
                  </div>
                ))}
              </div>
              <h4>Expressões criadas <small>boneco e sprites de {espec.nome}</small></h4>
              <ul className="lista-anim">
                {todas.filter((n) => !base.has(n)).map((n) => (
                  <li key={n}>
                    <b>{n}</b>
                    <small>{[doBoneco.has(n) ? `boneco (${salvasBoneco.find((e) => e.nome === n)!.quadros.length} quadro(s))` : null, tem.rostos.includes(n) ? 'sprite chibi' : null].filter(Boolean).join(' + ')}</small>
                    <span className="acoes-lista">
                      <button onClick={() => setPrevia(roteiroExpr(n))}>Prévia</button>
                      {doBoneco.has(n) && <button onClick={() => { const e = salvasBoneco.find((x) => x.nome === n) as ExpressaoBoneco; const r = { original: n, nome: n, quadros: e.quadros.map((q) => ({ ...q })), existentes: [...doBoneco] }; setExprRasc(r); setPrevia(roteiroExpr(n)); }}>Editar boneco</button>}
                      <button onClick={() => editarSprite(n)}>{tem.rostos.includes(n) ? 'Editar sprite' : 'Criar sprite'}</button>
                      {doBoneco.has(n) && <button className="perigo-leve" onClick={() => excluirExpr(n)}>Excluir</button>}
                    </span>
                  </li>
                ))}
                {todas.filter((n) => !base.has(n)).length === 0 && <li className="vazio-lista">Nenhuma ainda.</li>}
              </ul>
              <button className="primario-leve" onClick={() => { const r = { nome: '', quadros: [rostoNovo()], existentes: [...doBoneco] }; setExprRasc(r); setPrevia(null); }}>＋ Nova expressão</button>
            </>)}

            {aba === 'expressoes' && exprRasc && (<>
              <h4>{exprRasc.original ? `Editando “${exprRasc.original}”` : 'Nova expressão'}</h4>
              <label className="campo">Nome (como será escrito no roteiro)
                <input aria-label="Nome da expressão" placeholder="ex.: apaixonada, com sono" value={exprRasc.nome} onChange={(e) => { const r = { ...exprRasc, nome: e.target.value }; setExprRasc(r); aplicarExprRascunho(r); if (nomeDeExpressao(r.nome)) setPrevia(roteiroExpr(nomeDeExpressao(r.nome))); }} />
              </label>
              <p className="dica">Boneco de palito (estilo Stickman). Com mais de um quadro, a expressão é animada ({MAX_QUADROS_EXPRESSAO} no máximo, 4 por segundo).</p>
              {exprRasc.quadros.map((q, i) => (
                <div key={i} className="quadro-expr" data-quadro={i + 1}>
                  <b>Quadro {i + 1}</b>
                  <label className="campo">Olhos
                    <select aria-label={`Olhos do quadro ${i + 1}`} value={q.olho} onChange={(e) => mudarQuadro(i, { olho: e.target.value as RostoBoneco['olho'] })}>{OLHOS.map((o) => <option key={o} value={o}>{NOME_OLHO[o]}</option>)}</select>
                  </label>
                  <label className="campo">Boca
                    <select aria-label={`Boca do quadro ${i + 1}`} value={q.boca} onChange={(e) => mudarQuadro(i, { boca: e.target.value as RostoBoneco['boca'] })}>{BOCAS.map((o) => <option key={o} value={o}>{NOME_BOCA[o]}</option>)}</select>
                  </label>
                  <label className="campo">Sobrancelhas ({q.sobr}) <small>negativo = bravas, positivo = alegres/tristes</small>
                    <input aria-label={`Sobrancelhas do quadro ${i + 1}`} type="range" min={-14} max={14} step={1} value={q.sobr} onChange={(e) => mudarQuadro(i, { sobr: Number(e.target.value) })} />
                  </label>
                  <label className="campo-check"><input type="checkbox" checked={!!q.sobrAssimetrica} onChange={(e) => mudarQuadro(i, { sobrAssimetrica: e.target.checked })} /> Uma sobrancelha mais alta</label>
                  {exprRasc.quadros.length > 1 && <button className="perigo-leve" onClick={() => { const r = { ...exprRasc, quadros: exprRasc.quadros.filter((_, k) => k !== i) }; setExprRasc(r); aplicarExprRascunho(r); }}>Remover quadro</button>}
                </div>
              ))}
              {exprRasc.quadros.length < MAX_QUADROS_EXPRESSAO && <button onClick={() => { const r = { ...exprRasc, quadros: [...exprRasc.quadros, { ...exprRasc.quadros[exprRasc.quadros.length - 1]! }] }; setExprRasc(r); aplicarExprRascunho(r); }}>＋ Quadro de animação</button>}
              <div className="modal-botoes">
                <button onClick={() => { carregarAnimacoesSalvas(); setExprRasc(null); setPrevia(null); atualizar(); }}>Cancelar</button>
                <button className="primario" onClick={salvarExpr}>Salvar expressão</button>
              </div>
            </>)}

            {aba === 'clipes' && !clipeRasc && (<>
              <p className="dica">Clipe = sequência de passos (pose do Stickman, movimento, duração). No roteiro: <code>{espec.nome} faz o clipe tchau por 4 segundos.</code> Sem “por N segundos” o clipe toca uma vez.</p>
              <ul className="lista-anim">
                {meus.map((c) => (
                  <li key={`${c.id}-${c.estilo}`} data-clipe={c.id}>
                    <b>{c.nome}</b>
                    <small>{c.passos.length} passo(s) · {duracaoDoClipe(c).toFixed(1)} s{c.loop ? ' · repete' : ''}{c.substitui ? ` · substitui “${NOME_POSE[c.substitui]}”` : ''}</small>
                    <span className="acoes-lista">
                      <button onClick={() => setPrevia(`${ap} fica na posição 50%.\n${ap} faz o clipe ${c.id}.\n${ap} faz o clipe ${c.id}.`)}>Prévia</button>
                      <button onClick={() => inserir(`${espec.nome} faz o clipe ${c.id}.`)}>Inserir no roteiro</button>
                      <button onClick={() => editarClipe(c)}>Editar</button>
                      <button className="perigo-leve" onClick={() => excluirClipe(c)}>Excluir</button>
                    </span>
                  </li>
                ))}
                {meus.length === 0 && <li className="vazio-lista">Nenhum clipe de {espec.nome} ainda.</li>}
              </ul>
              <button className="primario-leve" onClick={() => { setMsg(''); setClipeRasc({ nome: '', estilo: 'ambos', loop: true, substitui: '', existentes: meus.map((x) => `${x.id}|${x.estilo}`), passos: [passoNovo()] }); setPrevia(null); }}>＋ Novo clipe</button>
            </>)}

            {aba === 'clipes' && clipeRasc && (<>
              <h4>{clipeRasc.original ? `Editando “${clipeRasc.nome}”` : 'Novo clipe'}</h4>
              <div className="duas-colunas">
                <label className="campo">Nome
                  <input aria-label="Nome do clipe" placeholder="ex.: tchau, dança do foguete" value={clipeRasc.nome} onChange={(e) => mudarClipe({ ...clipeRasc, nome: e.target.value })} />
                </label>
                <label className="campo">Vale para
                  <select aria-label="Estilo do clipe" value={clipeRasc.estilo} onChange={(e) => mudarClipe({ ...clipeRasc, estilo: e.target.value as EstiloClipe })}>{(Object.keys(NOME_ESTILO) as EstiloClipe[]).map((k) => <option key={k} value={k}>{NOME_ESTILO[k]}</option>)}</select>
                </label>
                <label className="campo">Substitui a pose padrão <small>(opcional)</small>
                  <select aria-label="Pose que o clipe substitui" value={clipeRasc.substitui} onChange={(e) => mudarClipe({ ...clipeRasc, substitui: e.target.value })}>
                    <option value="">— nenhuma (clipe novo) —</option>
                    {POSES.filter((p) => p !== 'parado').map((p) => <option key={p} value={p}>{NOME_POSE[p]}</option>)}
                  </select>
                </label>
                <label className="campo-check"><input type="checkbox" checked={clipeRasc.loop} onChange={(e) => mudarClipe({ ...clipeRasc, loop: e.target.checked })} /> Repetir enquanto durar (senão, congela no último passo)</label>
              </div>
              <h4>Passos <small>{clipeRasc.passos.length}/{MAX_PASSOS_CLIPE}</small></h4>
              {clipeRasc.passos.map((p, i) => (
                <div key={i} className="passo-clipe" data-passo={i + 1}>
                  <span className="n-passo">{i + 1}</span>
                  <label className="campo">Sprite (Chibi)
                    <select aria-label={`Sprite do passo ${i + 1}`} value={p.tags[0]} onChange={(e) => mudarPasso(i, { tags: [e.target.value, 'parado'] })}>
                      {[...new Set([p.tags[0]!, ...opcoesSprite])].map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </label>
                  <label className="campo">Pose (Stickman)
                    <select aria-label={`Pose do boneco no passo ${i + 1}`} value={p.poseBoneco ?? 'parado'} onChange={(e) => mudarPasso(i, { poseBoneco: e.target.value as PoseId })}>
                      {POSES.map((o) => <option key={o} value={o}>{NOME_POSE[o]}</option>)}
                    </select>
                  </label>
                  <label className="campo">Movimento
                    <select aria-label={`Movimento do passo ${i + 1}`} value={p.mov} onChange={(e) => { const mov = e.target.value as Movimento, fator = fatorDe(p); mudarPasso(i, { mov, amp: AMP_PADRAO[mov] !== undefined ? AMP_PADRAO[mov]! * fator : undefined }); }}>{MOVIMENTOS.map((m) => <option key={m} value={m}>{NOME_MOV[m]}</option>)}</select>
                  </label>
                  <label className="campo">Duração (s)
                    <input aria-label={`Duração do passo ${i + 1}`} type="number" min={0.1} max={10} step={0.1} value={p.dur} onChange={(e) => mudarPasso(i, { dur: Math.max(0.1, Math.min(10, Number(e.target.value) || 0.5)) })} />
                  </label>
                  <label className="campo">Intensidade <small>(1 = normal)</small>
                    <input aria-label={`Intensidade do passo ${i + 1}`} type="number" min={0} max={5} step={0.25} disabled={AMP_PADRAO[p.mov] === undefined} value={AMP_PADRAO[p.mov] === undefined ? 1 : Math.round(fatorDe(p) * 100) / 100} onChange={(e) => AMP_PADRAO[p.mov] !== undefined && mudarPasso(i, { amp: AMP_PADRAO[p.mov]! * Math.max(0, Math.min(5, Number(e.target.value) || 0)) })} />
                  </label>
                  <label className="campo-check"><input type="checkbox" checked={!!p.espelhar} onChange={(e) => mudarPasso(i, { espelhar: e.target.checked })} /> Espelhar</label>
                  <span className="acoes-passo">
                    <button aria-label={`Subir passo ${i + 1}`} disabled={i === 0} onClick={() => moverPasso(i, -1)}>↑</button>
                    <button aria-label={`Descer passo ${i + 1}`} disabled={i === clipeRasc.passos.length - 1} onClick={() => moverPasso(i, 1)}>↓</button>
                    <button aria-label={`Remover passo ${i + 1}`} className="perigo-leve" disabled={clipeRasc.passos.length === 1} onClick={() => mudarClipe({ ...clipeRasc, passos: clipeRasc.passos.filter((_, k) => k !== i) })}>✕</button>
                  </span>
                </div>
              ))}
              {clipeRasc.passos.length < MAX_PASSOS_CLIPE && <button onClick={() => mudarClipe({ ...clipeRasc, passos: [...clipeRasc.passos, { ...clipeRasc.passos[clipeRasc.passos.length - 1]! }] })}>＋ Passo</button>}
              <p className="dica">Duração total: {clipeRasc.passos.reduce((s, p) => s + p.dur, 0).toFixed(1)} s. Os sprites vêm da ficha de {espec.nome} (poses importadas ou criadas no editor de sprites).</p>
              <div className="modal-botoes">
                <button onClick={() => { carregarAnimacoesSalvas(); setClipeRasc(null); setPrevia(null); atualizar(); }}>Cancelar</button>
                <button className="primario" onClick={salvarClipe}>Salvar clipe</button>
              </div>
            </>)}
          </div>

          <div className="anim-dir">
            <b>Prévia (Stickman)</b>
            {previa ? <PreviaAnimacao ator={id} roteiro={previa} estilo="stickman" /> : <p className="dica">Escolha uma expressão ou clipe para ver a prévia aqui.</p>}
          </div>
        </div>

        <div className="modal-botoes"><button className="primario" onClick={fechar}>Fechar</button></div>
      </div>
    </div>
  );
}
