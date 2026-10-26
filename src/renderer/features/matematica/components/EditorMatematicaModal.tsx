import { useState, useEffect, useRef, useMemo } from 'react';
import katex from 'katex';
import { useEditor } from '@renderer/store/editor-store';
import { Modal, fecharSeguro } from '@renderer/components/Modal';
import { useAlterado } from '@renderer/components/useAlterado';
import {
  CATALOGO_LATEX,
  SIMBOLOS_PALETA,
  encontrarRaizes,
  calcularIntegral,
  amostrarFuncao,
  ATORES,
  type ActorId,
  inserirNoCursor,
} from '@shared/domain';
import './EditorMatematicaModal.css';

const PRESETS_FUNCOES = [
  { rotulo: 'Parábola (x² - 4)', expr: 'x^2 - 4', xmin: -4, xmax: 4, raizes: true, integral: false, a: -2, b: 2 },
  { rotulo: 'Senoide sen(x)', expr: 'sin(x)', xmin: -3.14, xmax: 6.28, raizes: true, integral: true, a: 0, b: 3.14 },
  { rotulo: 'Gaussiana e^(-x²)', expr: 'exp(-x^2)', xmin: -3, xmax: 3, raizes: false, integral: true, a: -1.5, b: 1.5 },
  { rotulo: 'Cúbica (x³ - 3x)', expr: 'x^3 - 3x', xmin: -3, xmax: 3, raizes: true, integral: false, a: -1.73, b: 1.73 },
  { rotulo: 'Racional 1/(1+x²)', expr: '1 / (1 + x^2)', xmin: -4, xmax: 4, raizes: false, integral: true, a: -2, b: 2 },
  { rotulo: 'Amortecida e^(-0.2x) cos(2x)', expr: 'exp(-0.2*x) * cos(2*x)', xmin: 0, xmax: 10, raizes: true, integral: false, a: 0, b: 5 },
];

export function EditorMatematicaModal() {
  const aberto = useEditor((s) => s.editorMatematicaAberto);
  const abaInicial = useEditor((s) => s.abaMatematicaInicial);
  const roteiro = useEditor((s) => s.roteiro);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const set = useEditor((s) => s.set);

  const [abaAtiva, setAbaAtiva] = useState<'latex' | 'grafico'>('latex');
  const [categoriaLatex, setCategoriaLatex] = useState<string>('calculo');

  // Estado do LaTeX
  const [latex, setLatex] = useState<string>('\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)');
  const [ator, setAtor] = useState<ActorId>('cringefather');
  const [copiado, setCopiado] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Estado do Gráfico
  const [expr, setExpr] = useState<string>('x^2 - 4');
  const [xmin, setXmin] = useState<number>(-4);
  const [xmax, setXmax] = useState<number>(4);
  const [destacarRaizes, setDestacarRaizes] = useState<boolean>(true);
  const [destacarGrade, setDestacarGrade] = useState<boolean>(true);
  const [destacarIntegral, setDestacarIntegral] = useState<boolean>(false);
  const [intA, setIntA] = useState<number>(-2);
  const [intB, setIntB] = useState<number>(2);
  // fórmula e gráfico digitados se perdem ao fechar: pergunta antes
  const alterado = useAlterado({ latex, expr, xmin, xmax, intA, intB, destacarRaizes, destacarGrade, destacarIntegral });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (aberto) {
      setAbaAtiva(abaInicial || 'latex');
      setCopiado(null);
    }
  }, [aberto, abaInicial]);

  // Pré-visualização KaTeX
  const { previewHtml, previewErro } = useMemo(() => {
    try {
      const html = katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
      return { previewHtml: html, previewErro: null };
    } catch (e) {
      return { previewHtml: '', previewErro: (e as Error).message };
    }
  }, [latex]);

  // Cálculos matemáticos em tempo real para o gráfico
  const raizesCalculadas = useMemo(() => {
    if (!destacarRaizes || xmin >= xmax) return [];
    return encontrarRaizes(expr, xmin, xmax);
  }, [expr, xmin, xmax, destacarRaizes]);

  const valorIntegral = useMemo(() => {
    if (!destacarIntegral) return 0;
    return calcularIntegral(expr, intA, intB);
  }, [expr, intA, intB, destacarIntegral]);

  // Renderização do preview do Canvas
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || abaAtiva !== 'grafico') return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const w = cvs.width;
    const h = cvs.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    if (xmin >= xmax) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Intervalo inválido: início deve ser menor que o fim', w / 2, h / 2);
      return;
    }

    try {
      const { pontos, ymin, ymax } = amostrarFuncao({ tipo: 'funcao', expr, xmin, xmax });
      const margem = 32;
      const ex = margem;
      const ey = 16;
      const ew = w - margem * 2;
      const eh = h - margem - 16;

      const X = (v: number) => ex + ((v - xmin) / (xmax - xmin)) * ew;
      const Y = (v: number) => ey + eh - ((v - ymin) / (ymax - ymin)) * eh;

      const eixoY = xmin <= 0 && xmax >= 0 ? X(0) : ex;
      const eixoX = ymin <= 0 && ymax >= 0 ? Y(0) : ey + eh;

      // Grade
      if (destacarGrade) {
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        const dx = (xmax - xmin) / 8;
        for (let vx = xmin; vx <= xmax; vx += dx) {
          ctx.beginPath();
          ctx.moveTo(X(vx), ey);
          ctx.lineTo(X(vx), ey + eh);
          ctx.stroke();
        }
        const dy = (ymax - ymin) / 6;
        for (let vy = ymin; vy <= ymax; vy += dy) {
          ctx.beginPath();
          ctx.moveTo(ex, Y(vy));
          ctx.lineTo(ex + ew, Y(vy));
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Área sombreada da integral
      if (destacarIntegral) {
        const aClamped = Math.max(xmin, Math.min(xmax, intA));
        const bClamped = Math.max(xmin, Math.min(xmax, intB));
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(X(aClamped), eixoX);
        for (let k = 0; k <= 80; k++) {
          const xVal = aClamped + ((bClamped - aClamped) * k) / 80;
          const pt = pontos.find((p) => p && Math.abs(p.x - xVal) < (xmax - xmin) / 100);
          if (pt) ctx.lineTo(X(pt.x), Y(pt.y));
        }
        ctx.lineTo(X(bClamped), eixoX);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Eixos principais
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Eixo X
      ctx.moveTo(ex, eixoX);
      ctx.lineTo(ex + ew, eixoX);
      // Eixo Y
      ctx.moveTo(eixoY, ey + eh);
      ctx.lineTo(eixoY, ey);
      ctx.stroke();

      // Setas dos eixos
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(ex + ew, eixoX);
      ctx.lineTo(ex + ew - 8, eixoX - 4);
      ctx.lineTo(ex + ew - 8, eixoX + 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(eixoY, ey);
      ctx.lineTo(eixoY - 4, ey + 8);
      ctx.lineTo(eixoY + 4, ey + 8);
      ctx.fill();

      // Curva da função
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      let started = false;
      for (const pt of pontos) {
        if (!pt) {
          started = false;
          continue;
        }
        if (!started) {
          ctx.moveTo(X(pt.x), Y(pt.y));
          started = true;
        } else {
          ctx.lineTo(X(pt.x), Y(pt.y));
        }
      }
      ctx.stroke();

      // Destaque das raízes
      if (destacarRaizes && raizesCalculadas.length > 0) {
        for (const r of raizesCalculadas) {
          if (r >= xmin && r <= xmax) {
            const rx = X(r);
            ctx.save();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(rx, eixoX, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.fillStyle = '#b91c1c';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`x=${r}`, rx, Math.max(14, eixoX - 8));
            ctx.restore();
          }
        }
      }

      // Rótulos dos eixos
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('x', ex + ew - 4, eixoX + 16);
      ctx.fillText('y', eixoY - 8, ey + 12);
    } catch (e) {
      ctx.fillStyle = '#dc2626';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Erro ao traçar: ${(e as Error).message}`, w / 2, h / 2);
    }
  }, [expr, xmin, xmax, destacarGrade, destacarRaizes, destacarIntegral, intA, intB, raizesCalculadas, abaAtiva]);

  if (!aberto) return null;

  const inserirSimbolo = (codigo: string) => {
    const el = textareaRef.current;
    if (!el) {
      setLatex((prev) => `${prev} ${codigo}`);
      return;
    }
    const start = el.selectionStart ?? latex.length;
    const end = el.selectionEnd ?? latex.length;
    const novo = latex.slice(0, start) + codigo + latex.slice(end);
    setLatex(novo);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + codigo.length, start + codigo.length);
    }, 0);
  };

  const fechar = () => set({ editorMatematicaAberto: false });

  const aplicarPreset = (preset: typeof PRESETS_FUNCOES[0]) => {
    setExpr(preset.expr);
    setXmin(preset.xmin);
    setXmax(preset.xmax);
    setDestacarRaizes(preset.raizes);
    setDestacarIntegral(preset.integral);
    setIntA(preset.a);
    setIntB(preset.b);
  };

  const nomeAtor = ATORES[ator]?.nome ?? 'Professor';

  const comandoLatexRoteiro = `${nomeAtor} escreve fórmula "${latex}" no quadro.`;

  const comandoGraficoRoteiro = `${nomeAtor} desenha o gráfico de y = ${expr} de ${xmin} a ${xmax}${destacarRaizes ? ' com raízes' : ''}${destacarIntegral ? ` integral de ${intA} a ${intB}` : ''}${destacarGrade ? ' com grade' : ''} no quadro.`;

  const inserirNoRoteiro = (comando: string) => {
    const cursor = useEditor.getState().cursorRoteiro ?? roteiro.length;
    const novo = inserirNoCursor(roteiro, cursor, comando);
    setRoteiro(novo);
    set({ mensagem: `Inserido no quadro: “${comando}”`, editorMatematicaAberto: false });
  };

  const copiarTexto = async (texto: string, rotulo: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(rotulo);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      setCopiado('Falha ao copiar');
    }
  };

  return (
    <Modal titulo="Editor de fórmulas e gráficos" fundoClasse="modal-overlay-matematica" caixaClasse="modal-matematica" sujo={alterado} onFechar={fechar}>
        <header>
          <h2>
            <span>📐</span> Editor Matemático para a Lousa
            <span className="badge-offline">100% Offline (KaTeX)</span>
          </h2>
          <button type="button" className="btn-fechar" onClick={() => fecharSeguro(alterado, fechar)} title="Fechar">✕</button>
        </header>

        <div className="abas-matematica">
          <button
            type="button"
            className={`aba-btn ${abaAtiva === 'latex' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('latex')}
          >
            <span>∑</span> Fórmulas LaTeX
          </button>
          <button
            type="button"
            className={`aba-btn ${abaAtiva === 'grafico' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('grafico')}
          >
            <span>📈</span> Gráficos de Funções f(x)
          </button>
        </div>

        <div className="corpo-matematica">
          {abaAtiva === 'latex' ? (
            <>
              <div className="secao-grid">
                <div className="painel-coluna">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Fórmula em LaTeX</label>
                    <select
                      value={categoriaLatex}
                      onChange={(e) => setCategoriaLatex(e.target.value)}
                      className="campo-input-matematica"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                    >
                      {CATALOGO_LATEX.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Modelos da categoria */}
                  <div className="grade-modelos">
                    {CATALOGO_LATEX.find((c) => c.id === categoriaLatex)?.itens.map((it, idx) => (
                      <div
                        key={idx}
                        className="card-modelo"
                        onClick={() => setLatex(it.latex)}
                        title={`Clique para aplicar: ${it.latex}`}
                      >
                        <div className="card-modelo-titulo">{it.rotulo}</div>
                        <div className="card-modelo-desc">{it.descricao || it.latex}</div>
                      </div>
                    ))}
                  </div>

                  <label>Paleta de Símbolos Rápidos</label>
                  <div className="paleta-chips">
                    {SIMBOLOS_PALETA.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chip-simbolo"
                        onClick={() => inserirSimbolo(s.codigo)}
                        title={`Inserir ${s.codigo}`}
                      >
                        {s.rotulo}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={textareaRef}
                    className="editor-textarea-latex"
                    value={latex}
                    onChange={(e) => setLatex(e.target.value)}
                    placeholder="Digite sua fórmula LaTeX aqui..."
                    spellCheck={false}
                  />
                </div>

                <div className="painel-coluna">
                  <label>Pré-visualização na Lousa</label>
                  <div className="preview-lousa-container">
                    <div className="moldura-lousa-preview">
                      {previewErro ? (
                        <div className="erro-katex">⚠ Erro no LaTeX: {previewErro}</div>
                      ) : (
                        <div
                          className="preview-katex-conteudo"
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
                    <label style={{ margin: 0, textTransform: 'none', fontSize: 13 }}>Quem escreve na lousa:</label>
                    <select
                      value={ator}
                      onChange={(e) => setAtor(e.target.value as ActorId)}
                      className="campo-input-matematica"
                      style={{ flex: 1 }}
                    >
                      {Object.values(ATORES).map((a) => (
                        <option key={a.id} value={a.id}>{a.nome} ({a.apelidos[0]})</option>
                      ))}
                    </select>
                  </div>

                  <div className="info-matematica-card">
                    <strong>Dica de Uso:</strong>
                    <span>O sistema renderiza a fórmula com traço de escrita progressivo e estilo profissional de lousa escolar. Na exportação MP4, KaTeX é mantido com 100% de nitidez!</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="secao-grid">
                <div className="painel-coluna">
                  <label>Funções Notáveis para Aula</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {PRESETS_FUNCOES.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chip-simbolo"
                        onClick={() => aplicarPreset(p)}
                      >
                        {p.rotulo}
                      </button>
                    ))}
                  </div>

                  <label>Expressão da Função: f(x) =</label>
                  <input
                    type="text"
                    className="campo-input-matematica"
                    value={expr}
                    onChange={(e) => setExpr(e.target.value)}
                    placeholder="Ex: x^2 - 4, sin(x), exp(-x^2)"
                  />

                  <div className="linha-dupla">
                    <div>
                      <label>Início do Domínio (xmin)</label>
                      <input
                        type="number"
                        step="any"
                        className="campo-input-matematica"
                        style={{ width: '100%' }}
                        value={xmin}
                        onChange={(e) => setXmin(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label>Fim do Domínio (xmax)</label>
                      <input
                        type="number"
                        step="any"
                        className="campo-input-matematica"
                        style={{ width: '100%' }}
                        value={xmax}
                        onChange={(e) => setXmax(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                    <label className="grupo-checkbox">
                      <input
                        type="checkbox"
                        checked={destacarGrade}
                        onChange={(e) => setDestacarGrade(e.target.checked)}
                      />
                      <span>Exibir grade matemática quadriculada</span>
                    </label>

                    <label className="grupo-checkbox">
                      <input
                        type="checkbox"
                        checked={destacarRaizes}
                        onChange={(e) => setDestacarRaizes(e.target.checked)}
                      />
                      <span>Destacar raízes reais f(x) = 0</span>
                    </label>

                    <label className="grupo-checkbox">
                      <input
                        type="checkbox"
                        checked={destacarIntegral}
                        onChange={(e) => setDestacarIntegral(e.target.checked)}
                      />
                      <span>Destacar área sob a curva (integral ∫)</span>
                    </label>
                  </div>

                  {destacarIntegral && (
                    <div className="linha-dupla" style={{ background: '#172554', padding: 8, borderRadius: 6 }}>
                      <div>
                        <label style={{ color: '#93c5fd' }}>Limite Inferior a</label>
                        <input
                          type="number"
                          step="any"
                          className="campo-input-matematica"
                          style={{ width: '100%' }}
                          value={intA}
                          onChange={(e) => setIntA(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#93c5fd' }}>Limite Superior b</label>
                        <input
                          type="number"
                          step="any"
                          className="campo-input-matematica"
                          style={{ width: '100%' }}
                          value={intB}
                          onChange={(e) => setIntB(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ margin: 0, textTransform: 'none', fontSize: 13 }}>Quem desenha na lousa:</label>
                    <select
                      value={ator}
                      onChange={(e) => setAtor(e.target.value as ActorId)}
                      className="campo-input-matematica"
                      style={{ flex: 1 }}
                    >
                      {Object.values(ATORES).map((a) => (
                        <option key={a.id} value={a.id}>{a.nome} ({a.apelidos[0]})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="painel-coluna">
                  <label>Pré-visualização do Gráfico no Quadro</label>
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={230}
                    className="canvas-grafico-preview"
                  />

                  <div className="info-matematica-card">
                    {destacarRaizes && (
                      <div>
                        <strong>Raízes encontradas: </strong>
                        {raizesCalculadas.length > 0 ? (
                          <span>{raizesCalculadas.map((r) => `x = ${r}`).join(', ')}</span>
                        ) : (
                          <span>Nenhuma raiz real no intervalo [{xmin}, {xmax}]</span>
                        )}
                      </div>
                    )}
                    {destacarIntegral && (
                      <div>
                        <strong>Área calculada (Simpson): </strong>
                        <span>∫_{intA}^{intB} {expr} dx = {valorIntegral}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <footer>
          <div style={{ fontSize: 12, color: copiado ? '#34d399' : '#94a3b8' }}>
            {copiado ? `✓ ${copiado}` : (abaAtiva === 'latex' ? comandoLatexRoteiro : comandoGraficoRoteiro)}
          </div>
          <div className="grupo-acoes-footer">
            {abaAtiva === 'latex' ? (
              <>
                <button
                  type="button"
                  className="btn-mat-secundario"
                  onClick={() => copiarTexto(latex, 'Código LaTeX copiado!')}
                >
                  Copiar LaTeX
                </button>
                <button
                  type="button"
                  className="btn-mat-secundario"
                  onClick={() => copiarTexto(comandoLatexRoteiro, 'Comando copiado!')}
                >
                  Copiar Comando
                </button>
                <button
                  type="button"
                  className="btn-mat-primario"
                  onClick={() => inserirNoRoteiro(comandoLatexRoteiro)}
                >
                  <span>✍</span> Inserir no Roteiro
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-mat-secundario"
                  onClick={() => copiarTexto(comandoGraficoRoteiro, 'Comando de gráfico copiado!')}
                >
                  Copiar Comando
                </button>
                <button
                  type="button"
                  className="btn-mat-primario"
                  onClick={() => inserirNoRoteiro(comandoGraficoRoteiro)}
                >
                  <span>📈</span> Inserir no Roteiro
                </button>
              </>
            )}
          </div>
        </footer>
    </Modal>
  );
}
