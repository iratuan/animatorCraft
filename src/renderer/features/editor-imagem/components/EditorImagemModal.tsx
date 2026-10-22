import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ATORES, type ActorId } from '@shared/domain';
import { hexDeCor, paletaDoSprite, type Pixels } from '@shared/editor-imagem';
import { useEditor } from '@renderer/store/editor-store';
import { Icones } from '@renderer/components/Icones';
import { obterSprite } from '@renderer/features/personagens';
import { MotorEditor, type Ferramenta } from '../services/motor';
import { salvarSpriteEditado } from '../services/salvar';

const SVG = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const ICONES: Record<Ferramenta, ReactNode> = {
  mover: <svg {...SVG}><path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" /></svg>,
  selRet: <svg {...SVG}><rect x="4" y="5" width="16" height="14" strokeDasharray="3 3" /></svg>,
  selElipse: <svg {...SVG}><ellipse cx="12" cy="12" rx="8" ry="6" strokeDasharray="3 3" /></svg>,
  laco: <svg {...SVG}><path d="M5 9c0-3 6-5 10-3s4 6 0 8-7 0-8 3 3 3 5 1" strokeDasharray="3 3" /></svg>,
  varinha: <svg {...SVG}><path d="M4 20L15 9M15 9l1-4 1 4 4 1-4 1-1 4-1-4-4-1z" /></svg>,
  pincel: <svg {...SVG}><path d="M4 20c3 0 4-2 4-4l9-9-3-3-9 9c-2 0-3 1-3 4 0 2 0 3 2 3zM14 6l3 3" /></svg>,
  lapis: <svg {...SVG}><path d="M4 20l1-4L16 5l3 3L8 19l-4 1zM14 7l3 3" /></svg>,
  borracha: <svg {...SVG}><path d="M5 15l8-9 6 5-6 8H8L5 15zM9 19h11" /></svg>,
  balde: <svg {...SVG}><path d="M5 11l7-7 7 7-7 7-7-7zM4 20c1 0 2-1 2-2s-2-3-2-3-2 2-2 3 1 2 2 2z" /></svg>,
  conta: <svg {...SVG}><path d="M5 19l1-4 8-8 3 3-8 8-4 1zM14 7l3-3 3 3-3 3" /></svg>,
  linha: <svg {...SVG}><path d="M5 19L19 5" /></svg>,
  retangulo: <svg {...SVG}><rect x="4" y="6" width="16" height="12" /></svg>,
  elipse: <svg {...SVG}><ellipse cx="12" cy="12" rx="8" ry="6" /></svg>,
  texto: <svg {...SVG}><path d="M6 6h12M12 6v13M9 19h6" /></svg>,
  mao: <svg {...SVG}><path d="M8 13V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v7c0 4-2 7-6 7-3 0-4-2-6-5l-1-2a1.5 1.5 0 012-2l2 2" /></svg>,
};
const FERRAMENTAS: { id: Ferramenta; nome: string; tecla: string }[] = [
  { id: 'mover', nome: 'Mover / transformar (a seleção ou a camada)', tecla: 'V' },
  { id: 'selRet', nome: 'Seleção retangular (Shift soma, Alt subtrai)', tecla: 'M' },
  { id: 'selElipse', nome: 'Seleção elíptica', tecla: 'S' },
  { id: 'laco', nome: 'Laço (seleção livre)', tecla: 'L' },
  { id: 'varinha', nome: 'Varinha mágica (seleciona por cor)', tecla: 'W' },
  { id: 'pincel', nome: 'Pincel', tecla: 'B' },
  { id: 'lapis', nome: 'Lápis (sem suavização)', tecla: 'P' },
  { id: 'borracha', nome: 'Borracha', tecla: 'E' },
  { id: 'balde', nome: 'Balde de tinta', tecla: 'G' },
  { id: 'conta', nome: 'Conta-gotas (Alt também pega a cor)', tecla: 'I' },
  { id: 'linha', nome: 'Linha (Shift: 45°)', tecla: 'Q' },
  { id: 'retangulo', nome: 'Retângulo (Shift: quadrado)', tecla: 'R' },
  { id: 'elipse', nome: 'Elipse (Shift: círculo)', tecla: 'O' },
  { id: 'texto', nome: 'Texto', tecla: 'T' },
  { id: 'mao', nome: 'Mão: mover a tela (ou segure Espaço)', tecla: 'H' },
];
const CORES_BASICAS = ['#000000', '#444444', '#888888', '#cccccc', '#ffffff', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#8d5a3b', '#f2c9a0', '#ffd7b5'];
const FONTES_TEXTO = ['"Comic Sans MS","Comic Neue",cursive', 'Arial, sans-serif', 'Georgia, serif', '"Courier New", monospace'];

const dePixels = (c: CanvasImageSource, w: number, h: number): Pixels => {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d', { willReadFrequently: true })!; x.drawImage(c, 0, 0);
  return { w, h, data: x.getImageData(0, 0, w, h).data };
};
const bitmapDeUrl = async (url: string): Promise<ImageBitmap> => createImageBitmap(await (await fetch(url)).blob());

/** Janela do editor de imagem de um sprite (poses, rostos e objetos de um personagem). */
export function EditorImagemModal() {
  const alvo = useEditor((s) => s.editorImagem);
  if (!alvo) return null;
  return <Editor key={`${alvo.personagem}/${alvo.tipo}/${alvo.nome}`} alvo={alvo} />;
}

function Editor({ alvo }: { alvo: { personagem: ActorId; tipo: 'pose' | 'rosto' | 'prop'; nome: string } }) {
  const set = useEditor((s) => s.set);
  const novaVersaoBib = useEditor((s) => s.novaVersaoBib);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const [motor, setMotor] = useState<MotorEditor | null>(null);
  const [, forcar] = useState(0);
  const [msg, setMsg] = useState('Carregando…');
  const [paleta, setPaleta] = useState<string[]>([]);
  const [texto, setTexto] = useState<{ x: number; y: number; valor: string; tamanho: number; negrito: boolean; fonte: number } | null>(null);
  const [tam, setTam] = useState({ w: 0, h: 0, telaW: 0, telaH: 0 });
  const [encaixe, setEncaixe] = useState<{ x: number; y: number; escala: number } | undefined>();
  const [salvando, setSalvando] = useState(false);
  const [renomeando, setRenomeando] = useState<number | null>(null);

  // ---- carrega o sprite atual (ou cria uma tela em branco do tamanho certo) e monta o motor
  useEffect(() => {
    let vivo = true, m: MotorEditor | null = null;
    (async () => {
      const { personagem: id, tipo, nome } = alvo;
      const atual = await obterSprite(id, tipo, nome);
      const parado = await obterSprite(id, 'pose', 'parado');
      let base: Pixels | null = null, w = 400, h = 400;
      if (atual) { const b = await bitmapDeUrl(atual.url); w = b.width; h = b.height; base = dePixels(b, w, h); }
      else if (tipo === 'rosto') { const n = await obterSprite(id, 'rosto', 'neutra'); if (n) { w = n.info.w; h = n.info.h; } else { w = 280; h = 280; } }
      else if (tipo === 'pose') { if (parado) { w = parado.info.w; h = parado.info.h; } else { w = 400; h = 640; } }
      else { w = 300; h = 300; }
      if (!vivo || !canvasRef.current) return;
      m = new MotorEditor(canvasRef.current, base, w, h, `${tipo}_${nome}`);
      m.original = base;
      m.aoMudar = () => forcar((n) => n + 1);
      m.aoAvisar = (t) => setMsg(t);
      m.aoPedirTexto = (p) => setTexto({ ...p, valor: '', tamanho: Math.max(16, Math.round(h / 12)), negrito: true, fonte: 0 });
      // guias: caixa da cabeça e chão (poses); corpo de apoio no encaixe (rostos)
      const enc = atual?.info.encaixe ?? (tipo === 'rosto' ? (await obterSprite(id, 'rosto', 'neutra'))?.info.encaixe : undefined);
      setEncaixe(atual?.info.encaixe);
      if (tipo === 'pose') {
        m.guias.chao = h;
        if (nome === 'parado' && parado?.info.rosto) { const c = parado.info.rosto.cabeca; m.guias.cabeca = { x: c.x * w, y: c.y * h, w: c.w * w, h: c.h * h }; }
        else if (parado?.info.rosto) { const c = parado.info.rosto.cabeca; m.guias.cabeca = { x: c.x * w, y: c.y * h, w: c.w * w, h: c.h * h }; }
      } else if (tipo === 'rosto' && parado && enc) {
        const corpo = await bitmapDeUrl(parado.url), cv = document.createElement('canvas'); cv.width = corpo.width; cv.height = corpo.height; cv.getContext('2d')!.drawImage(corpo, 0, 0);
        m.guias.corpo = { imagem: cv, x: -enc.x / enc.escala, y: -enc.y / enc.escala, escala: 1 / enc.escala };
      }
      const fonteCores = base ?? (parado ? dePixels(await bitmapDeUrl(parado.url), parado.info.w, parado.info.h) : null);
      if (fonteCores) setPaleta(paletaDoSprite(fonteCores, 14).map(hexDeCor));
      // gancho dos testes automatizados (abra o app com ?teste): dá acesso ao motor para conferir os pixels
      if (new URLSearchParams(location.search).has('teste')) (window as unknown as { __motorEditor?: MotorEditor }).__motorEditor = m;
      setMotor(m);
      setTam({ w, h, telaW: w, telaH: h });
      setMsg(atual ? 'Sprite carregado. Edite e use “Salvar no sprite”.' : 'Espaço vazio: desenhe um novo sprite (fundo transparente).');
      requestAnimationFrame(() => { m!.iniciar(); m!.ajustarNaTela(); });
    })().catch((e: Error) => setMsg(`Erro ao abrir o sprite: ${e.message}`));
    return () => {
      vivo = false; m?.destruir();
      const g = window as unknown as { __motorEditor?: MotorEditor };
      if (g.__motorEditor === m) delete g.__motorEditor;
    };
  }, [alvo]);

  // as caixas de largura/altura acompanham a tela quando ela muda (girar, cortar, redimensionar, desfazer...)
  useEffect(() => { if (motor) setTam((t) => ({ ...t, telaW: motor.ui.w, telaH: motor.ui.h })); }, [motor, motor?.ui.w, motor?.ui.h]);

  // ---- tamanho da área de desenho
  useEffect(() => {
    const el = areaRef.current;
    if (!el || !motor) return;
    const ro = new ResizeObserver(() => { motor.redimensionarVisao(el.clientWidth, el.clientHeight); });
    ro.observe(el);
    // primeiro tamanho: só depois dele a imagem pode ser ajustada (centralizada) na área de desenho
    motor.redimensionarVisao(el.clientWidth, el.clientHeight);
    motor.ajustarNaTela();
    return () => ro.disconnect();
  }, [motor]);

  // ---- roda do mouse (precisa ser não passiva para impedir a rolagem da página)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !motor) return;
    const f = (e: WheelEvent) => motor.aoRolar(e);
    c.addEventListener('wheel', f, { passive: false });
    return () => c.removeEventListener('wheel', f);
  }, [motor]);

  const fechar = () => {
    if (motor?.ui.alterado && !window.confirm('Descartar as alterações deste sprite?')) return;
    set({ editorImagem: null });
  };
  const salvar = async () => {
    if (!motor || salvando) return;
    if (motor.conteudoVazio()) { setMsg('A imagem está vazia: desenhe algo antes de salvar.'); return; }
    setSalvando(true);
    try {
      const blob = await motor.exportarPng();
      await salvarSpriteEditado(alvo.personagem, alvo.tipo, alvo.nome, new Uint8Array(await blob.arrayBuffer()), alvo.tipo === 'rosto' && motor.ui.w === tam.telaW && motor.ui.h === tam.telaH ? encaixe : undefined);
      novaVersaoBib();
      set({ editorImagem: null, mensagem: `${alvo.tipo}_${alvo.nome} de ${ATORES[alvo.personagem]?.nome ?? alvo.personagem} salvo pelo editor de imagem.` });
    } catch (e) { setMsg(`Não consegui salvar: ${(e as Error).message}`); setSalvando(false); }
  };
  const abrirComoCamada = async (f: File | undefined) => {
    if (!f || !motor) return;
    try {
      const b = await createImageBitmap(f);
      const px = dePixels(b, b.width, b.height);
      b.close();
      motor.adicionarImagemComoCamada(px, f.name.replace(/\.[^.]+$/, ''));
      setMsg(`“${f.name}” entrou como camada nova.`);
    }
    catch { setMsg('Não consegui ler essa imagem (use PNG, JPG ou WebP).'); }
  };

  // ---- teclado e área de transferência
  useEffect(() => {
    if (!motor) return;
    const digitando = (t: EventTarget | null) => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;
    const mapa: Record<string, Ferramenta> = { v: 'mover', m: 'selRet', s: 'selElipse', l: 'laco', w: 'varinha', b: 'pincel', p: 'lapis', e: 'borracha', g: 'balde', i: 'conta', q: 'linha', r: 'retangulo', o: 'elipse', t: 'texto', h: 'mao' };
    const kd = (e: KeyboardEvent) => {
      if (digitando(e.target)) { if (e.key === 'Escape') (e.target as HTMLElement).blur(); return; }
      const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
      if (e.code === 'Space') { motor.definirEspaco(true); e.preventDefault(); return; }
      if (ctrl) {
        if (k === 'z' && !e.shiftKey) motor.desfazer();
        else if (k === 'y' || (k === 'z' && e.shiftKey)) motor.refazer();
        else if (k === 'c') motor.copiar();
        else if (k === 'x') motor.cortar();
        else if (k === 'v') return; // quem cola é o evento "paste" (imagem do sistema ou o que foi copiado aqui)
        else if (k === 'a') motor.selecionarTudo();
        else if (k === 'd') motor.desselecionar();
        else if (k === 'i' && e.shiftKey) motor.inverterSelecao();
        else if (k === 'j') motor.duplicar();
        else if (k === '0') motor.ajustarNaTela();
        else if (k === '=' || k === '+') motor.zoomPara(motor.ui.zoom * 1.25);
        else if (k === '-') motor.zoomPara(motor.ui.zoom / 1.25);
        else return;
        e.preventDefault(); return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') { motor.apagarConteudo(); e.preventDefault(); }
      else if (e.key === 'Enter') { motor.confirmarFlutuante(); e.preventDefault(); }
      else if (e.key === 'Escape') { if (motor.ui.flutuante) motor.cancelarFlutuante(); else if (motor.ui.temSelecao) motor.desselecionar(); else fechar(); }
      else if (e.key === '[') motor.definir('tamanho', Math.max(1, Math.round(motor.ui.tamanho * 0.85 - 1)));
      else if (e.key === ']') motor.definir('tamanho', Math.min(300, Math.round(motor.ui.tamanho * 1.18 + 1)));
      else if (e.key === '+' || e.key === '=') motor.zoomPara(motor.ui.zoom * 1.25);
      else if (e.key === '-') motor.zoomPara(motor.ui.zoom / 1.25);
      else if (e.key === '0') motor.ajustarNaTela();
      else if (mapa[k] && !e.altKey) motor.definir('ferramenta', mapa[k]!);
    };
    const ku = (e: KeyboardEvent) => { if (e.code === 'Space') motor.definirEspaco(false); };
    const colar = (e: ClipboardEvent) => {
      if (digitando(e.target)) return;
      const arq = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith('image/'));
      e.preventDefault();
      if (!arq) { motor.colar(); return; }
      void createImageBitmap(arq).then((b) => {
        const px = dePixels(b, b.width, b.height);
        b.close();
        motor.colarPixels(px);
        setMsg('Imagem colada: mova, escale ou gire; Enter confirma.');
      });
    };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('paste', colar);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('paste', colar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [motor]);

  const ui = motor?.ui;
  const f = ui?.ferramenta;
  const comTolerancia = f === 'balde' || f === 'varinha';
  const comPincel = f === 'pincel' || f === 'lapis' || f === 'borracha' || f === 'linha' || f === 'retangulo' || f === 'elipse';
  const comForma = f === 'retangulo' || f === 'elipse';
  const camadaAtiva = ui ? ui.camadas.findIndex((_c, i) => ui.camadas.length - 1 - i === ui.ativa) : -1;

  return (
    <div className="ei-fundo" role="dialog" aria-label="Editor de imagem do sprite">
      <div className="ei">
        <header className="ei-topo">
          <b className="ei-titulo">Editor de imagem · {ATORES[alvo.personagem]?.nome ?? alvo.personagem} · {alvo.tipo}_{alvo.nome}</b>
          <div className="ei-grupo">
            <button disabled={!ui?.podeDesfazer} onClick={() => motor?.desfazer()} title="Desfazer (Ctrl+Z)">↶ Desfazer</button>
            <button disabled={!ui?.podeRefazer} onClick={() => motor?.refazer()} title="Refazer (Ctrl+Y)">↷ Refazer</button>
          </div>
          <div className="ei-grupo">
            <button onClick={() => motor?.zoomPara((ui?.zoom ?? 1) / 1.25)} title="Menos zoom (-)">−</button>
            <button onClick={() => motor?.zoomPara(1)} title="Zoom 100%">{ui ? Math.round(ui.zoom * 100) : 100}%</button>
            <button onClick={() => motor?.zoomPara((ui?.zoom ?? 1) * 1.25)} title="Mais zoom (+)">+</button>
            <button onClick={() => motor?.ajustarNaTela()} title="Ajustar à janela (0)">Ajustar</button>
          </div>
          <div className="ei-grupo">
            <button className={ui?.mostrarOriginal ? 'on' : ''} disabled={!motor?.original} onClick={() => motor?.definir('mostrarOriginal', !ui?.mostrarOriginal)} title="Sobrepõe o sprite original a 45% para comparar">Original</button>
            <button className={ui?.mostrarGuias ? 'on' : ''} onClick={() => motor?.definir('mostrarGuias', !ui?.mostrarGuias)} title="Caixa da cabeça (laranja), chão (verde) e corpo de apoio">Guias</button>
          </div>
          <span className="ei-espaco" />
          <button onClick={fechar}>Cancelar</button>
          <button className="primario" disabled={!motor || salvando} onClick={() => void salvar()}>{salvando ? 'Salvando…' : 'Salvar no sprite'}</button>
        </header>

        <div className="ei-corpo">
          <aside className="ei-ferramentas" aria-label="Ferramentas">
            {FERRAMENTAS.map((t) => (
              <button key={t.id} className={f === t.id ? 'on' : ''} title={`${t.nome} (${t.tecla})`} aria-label={t.nome} onClick={() => motor?.definir('ferramenta', t.id)}>{ICONES[t.id]}</button>
            ))}
          </aside>

          <main className="ei-tela" ref={areaRef}>
            <canvas
              ref={canvasRef}
              data-testid="ei-canvas"
              style={{ touchAction: 'none', cursor: f === 'mao' ? 'grab' : f === 'conta' ? 'copy' : 'crosshair' }}
              onPointerDown={(e) => motor?.aoPressionar(e.nativeEvent)}
              onPointerMove={(e) => motor?.aoMover(e.nativeEvent)}
              onPointerUp={(e) => motor?.aoSoltar(e.nativeEvent)}
              onPointerCancel={(e) => motor?.aoCancelar(e.nativeEvent)}
              onPointerLeave={() => motor?.aoSair()}
              onContextMenu={(e) => e.preventDefault()}
            />
            {texto && motor && (
              <div className="ei-texto">
                <textarea autoFocus rows={2} value={texto.valor} placeholder="Digite o texto" onChange={(e) => setTexto({ ...texto, valor: e.target.value })} />
                <div className="ei-linha">
                  <label>Tamanho <input type="number" min={6} max={600} value={texto.tamanho} onChange={(e) => setTexto({ ...texto, tamanho: Number(e.target.value) || 24 })} /></label>
                  <label><input type="checkbox" checked={texto.negrito} onChange={(e) => setTexto({ ...texto, negrito: e.target.checked })} /> Negrito</label>
                  <select value={texto.fonte} onChange={(e) => setTexto({ ...texto, fonte: Number(e.target.value) })}>
                    {['Comic Sans', 'Arial', 'Georgia', 'Courier'].map((n, i) => <option key={n} value={i}>{n}</option>)}
                  </select>
                </div>
                <div className="ei-linha">
                  <button onClick={() => setTexto(null)}>Cancelar</button>
                  <button className="primario" onClick={() => { motor.inserirTexto(texto.valor, texto.x, texto.y, texto.tamanho, texto.negrito, FONTES_TEXTO[texto.fonte]!); setTexto(null); setMsg('Texto inserido: mova, escale ou gire; Enter confirma.'); }}>Inserir</button>
                </div>
              </div>
            )}
          </main>

          <aside className="ei-painel">
            <section>
              <h5>Cor</h5>
              <div className="ei-linha">
                <input type="color" aria-label="Cor" value={ui?.cor ?? '#222222'} onChange={(e) => motor?.definir('cor', e.target.value)} />
                <input className="ei-hex" aria-label="Cor em hexadecimal" value={ui?.cor ?? ''} onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && motor?.definir('cor', e.target.value.toLowerCase())} />
              </div>
              <div className="ei-amostras">{CORES_BASICAS.map((c) => <button key={c} style={{ background: c }} title={c} aria-label={`Cor ${c}`} onClick={() => motor?.definir('cor', c)} />)}</div>
              {paleta.length > 0 && (<><small>Cores do personagem</small><div className="ei-amostras">{paleta.map((c) => <button key={c} style={{ background: c }} title={c} aria-label={`Cor do personagem ${c}`} onClick={() => motor?.definir('cor', c)} />)}</div></>)}
            </section>

            <section>
              <h5>Ferramenta</h5>
              {comPincel && (<>
                <Campo rotulo={`Tamanho ${ui?.tamanho ?? 0}px`}><input type="range" min={1} max={200} value={ui?.tamanho ?? 1} onChange={(e) => motor?.definir('tamanho', Number(e.target.value))} /></Campo>
                {f !== 'lapis' && f !== 'linha' && f !== 'retangulo' && f !== 'elipse' && <Campo rotulo={`Dureza ${ui?.dureza ?? 0}%`}><input type="range" min={0} max={100} value={ui?.dureza ?? 0} onChange={(e) => motor?.definir('dureza', Number(e.target.value))} /></Campo>}
              </>)}
              {(comPincel || f === 'balde') && <Campo rotulo={`Opacidade ${ui?.opacidade ?? 100}%`}><input type="range" min={1} max={100} value={ui?.opacidade ?? 100} onChange={(e) => motor?.definir('opacidade', Number(e.target.value))} /></Campo>}
              {comTolerancia && (<>
                <Campo rotulo={`Tolerância ${ui?.tolerancia ?? 0}`}><input type="range" min={0} max={255} value={ui?.tolerancia ?? 0} onChange={(e) => motor?.definir('tolerancia', Number(e.target.value))} /></Campo>
                <label className="ei-check"><input type="checkbox" checked={ui?.contiguo ?? true} onChange={(e) => motor?.definir('contiguo', e.target.checked)} /> Só a região ligada</label>
                <label className="ei-check"><input type="checkbox" checked={ui?.amostrarTudo ?? false} onChange={(e) => motor?.definir('amostrarTudo', e.target.checked)} /> Olhar todas as camadas</label>
              </>)}
              {comForma && <label className="ei-check"><input type="checkbox" checked={ui?.formaPreenchida ?? false} onChange={(e) => motor?.definir('formaPreenchida', e.target.checked)} /> Preenchida</label>}
              {f === 'conta' && <small>Clique para pegar a cor (da camada ou de todas, conforme “Olhar todas as camadas”). Com Alt, qualquer pincel também pega.</small>}
              {!comPincel && !comTolerancia && f !== 'conta' && <small>{FERRAMENTAS.find((t) => t.id === f)?.nome}</small>}
            </section>

            <section>
              <h5>Seleção</h5>
              <div className="ei-linha">
                <button onClick={() => motor?.selecionarTudo()} title="Ctrl+A">Tudo</button>
                <button disabled={!ui?.temSelecao} onClick={() => motor?.desselecionar()} title="Ctrl+D">Nenhuma</button>
                <button onClick={() => motor?.inverterSelecao()} title="Ctrl+Shift+I">Inverter</button>
              </div>
              <div className="ei-linha">
                <button onClick={() => motor?.copiar()} title="Ctrl+C">Copiar</button>
                <button onClick={() => motor?.cortar()} title="Ctrl+X">Cortar</button>
                <button onClick={() => motor?.colar()} title="Ctrl+V">Colar</button>
              </div>
              {ui?.flutuante && <div className="ei-linha"><button className="primario" onClick={() => motor?.confirmarFlutuante()}>Confirmar (Enter)</button><button onClick={() => motor?.cancelarFlutuante()}>Cancelar (Esc)</button></div>}
            </section>

            <section>
              <h5>Camadas</h5>
              <ul className="ei-camadas" aria-label="Camadas">
                {ui?.camadas.map((c, i) => (
                  <li key={c.id} className={i === camadaAtiva ? 'on' : ''} onClick={() => motor?.escolherCamada(i)}>
                    <button className="olho" aria-label={c.visivel ? 'Ocultar camada' : 'Mostrar camada'} title={c.visivel ? 'Ocultar' : 'Mostrar'} onClick={(e) => { e.stopPropagation(); motor?.alternarVisivel(i); }}>{c.visivel ? Icones.olhoAberto : Icones.olhoFechado}</button>
                    {renomeando === i
                      ? <input autoFocus defaultValue={c.nome} onClick={(e) => e.stopPropagation()} onBlur={(e) => { motor?.renomear(i, e.target.value); setRenomeando(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
                      : <span className="nome" onDoubleClick={() => setRenomeando(i)} title="Duplo clique para renomear">{c.nome}</span>}
                  </li>
                ))}
              </ul>
              {ui && camadaAtiva >= 0 && (
                <Campo rotulo={`Opacidade da camada ${Math.round(ui.camadas[camadaAtiva]!.opacidade * 100)}%`}>
                  <input type="range" min={0} max={100} value={Math.round(ui.camadas[camadaAtiva]!.opacidade * 100)}
                    onChange={(e) => motor?.opacidadeDaCamada(camadaAtiva, Number(e.target.value) / 100, false)}
                    onPointerUp={(e) => motor?.opacidadeDaCamada(camadaAtiva, Number((e.target as HTMLInputElement).value) / 100, true)}
                    onKeyUp={(e) => motor?.opacidadeDaCamada(camadaAtiva, Number((e.target as HTMLInputElement).value) / 100, true)} />
                </Campo>
              )}
              <div className="ei-linha">
                <button onClick={() => motor?.novaCamada()} title="Nova camada">{Icones.mais} <span>Nova</span></button>
                <button onClick={() => motor?.duplicar()} title="Duplicar (Ctrl+J)">{Icones.duplicar} <span>Duplicar</span></button>
                <button onClick={() => motor?.excluirCamada()}>{Icones.lixo} <span>Excluir</span></button>
              </div>
              <div className="ei-linha">
                <button onClick={() => motor?.moverCamadaAtiva(1)} title="Subir camada">{Icones.setaCima} <span>Subir</span></button>
                <button onClick={() => motor?.moverCamadaAtiva(-1)} title="Descer camada">{Icones.setaBaixo} <span>Descer</span></button>
                <button onClick={() => motor?.mesclar()} title="Mesclar com camada abaixo">{Icones.mesclarCamadas} <span>Mesclar</span></button>
              </div>
              <input ref={arquivoRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { void abrirComoCamada(e.target.files?.[0]); e.target.value = ''; }} />
              <button className="ei-largo" onClick={() => arquivoRef.current?.click()}>Abrir imagem como camada…</button>
            </section>

            <section>
              <h5>Imagem</h5>
              <div className="ei-linha">
                <button onClick={() => motor?.espelhar(true)} title="Espelhar horizontalmente">{Icones.espelharH} <span>Espelhar H</span></button>
                <button onClick={() => motor?.espelhar(false)} title="Espelhar verticalmente">{Icones.espelharV} <span>Espelhar V</span></button>
              </div>
              <div className="ei-linha">
                <button onClick={() => motor?.girar(false)} title="Girar anti-horário">{Icones.girarAntiHorario} <span>90°</span></button>
                <button onClick={() => motor?.girar(true)} title="Girar horário">{Icones.girarHorario} <span>90°</span></button>
                <button onClick={() => motor?.cortarAoConteudo()} title="Remove as bordas transparentes">{Icones.cortarConteudo} <span>Cortar</span></button>
              </div>
              <small>Tela: {ui?.w}×{ui?.h}px</small>
              <div className="ei-linha">
                <input aria-label="Largura" type="number" min={1} max={2048} value={tam.telaW || ''} onChange={(e) => setTam({ ...tam, telaW: Number(e.target.value) })} />×
                <input aria-label="Altura" type="number" min={1} max={2048} value={tam.telaH || ''} onChange={(e) => setTam({ ...tam, telaH: Number(e.target.value) })} />
              </div>
              <div className="ei-linha">
                <button onClick={() => tam.telaW > 0 && tam.telaH > 0 && motor?.tamanhoDaImagem(tam.telaW, tam.telaH)} title="Escala a imagem toda para esse tamanho">Redimensionar</button>
                <button onClick={() => tam.telaW > 0 && tam.telaH > 0 && motor?.tamanhoDaTela(tam.telaW, tam.telaH)} title="Muda só a tela (mais espaço ou corta), sem escalar">Tela</button>
              </div>
            </section>
          </aside>
        </div>

        <footer className="ei-rodape">
          <span role="status">{msg}</span>
          <span className="ei-espaco" />
          {ui?.cursor && <span>{Math.floor(ui.cursor.x)}, {Math.floor(ui.cursor.y)}</span>}
          <span>{ui?.w}×{ui?.h}</span>
        </footer>
      </div>
    </div>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return <label className="ei-campo"><span>{rotulo}</span>{children}</label>;
}



