import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MODELOS, ROTEIRO_EXEMPLO, resumirRoteiro } from '@shared/domain';
import { useEditor, type AcaoInicial } from '@renderer/store/editor-store';
import { plataforma } from '@renderer/features/sistema';
import { precarregarEditor } from '@renderer/routes/editor-lazy';
import './home.css';

declare const __APP_VERSION__: string;
const VERSAO = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';

const ROTEIRO_EM_BRANCO = '[papéis: professor=CringeFather, aluno=BetaSon]\n\n# Cena 1\n\n';

function Boneco() {
  return (
    <svg className="home-boneco" viewBox="0 0 64 64" aria-hidden="true" role="img">
      <circle cx="32" cy="12" r="8" /><path d="M32 20v22M32 27l-13 9M32 27l13 -9M32 42l-10 16M32 42l10 16" />
      <rect x="40" y="6" width="20" height="14" rx="1.5" className="lousa" /><path d="M43 11h14M43 15h9" className="lousa" />
    </svg>
  );
}

/**
 * Tela inicial. Fica leve de propósito: não carrega sprites, fontes nem o motor de desenho (o editor é um pedaço separado do app,
 * baixado em segundo plano enquanto você escolhe). Tudo que ela faz é escolher o que o editor abre e navegar para ele.
 */
export function HomePage() {
  const navegar = useNavigate();
  const set = useEditor((s) => s.set);
  const setRoteiro = useEditor((s) => s.setRoteiro);
  const roteiro = useEditor((s) => s.roteiro);
  const resumo = useMemo(() => resumirRoteiro(roteiro), [roteiro]);
  const continuavel = !resumo.vazio && !resumo.exemplo;

  // o editor começa a chegar assim que a tela inicial aparece; no clique ele já está pronto
  useEffect(() => {
    const id = window.setTimeout(precarregarEditor, 150);
    return () => window.clearTimeout(id);
  }, []);

  const abrir = (texto?: string, mensagem?: string, acao?: AcaoInicial) => {
    if (texto !== undefined) setRoteiro(texto);
    set({ t: 0, tocando: false, acaoInicial: acao ?? null, ...(mensagem ? { mensagem } : {}) });
    navegar('/editor');
  };
  const abrirRoteiroDeArquivo = async () => {
    const r = await plataforma.abrirRoteiro();
    if (r) abrir(r.texto, `Aberto: ${r.nome}`);
  };

  return (
    <main className="home" aria-label="Tela inicial do StickBoard">
      <header className="home-topo">
        <Boneco />
        <div>
          <h1>StickBoard</h1>
          <p>Escreva o roteiro, ganhe o vídeo: aulas de quadro branco com personagens animados, em MP4 horizontal ou vertical.</p>
        </div>
      </header>

      <section className="home-principais" aria-label="Começar">
        {continuavel && (
          <button className="home-card destaque" autoFocus onPointerEnter={precarregarEditor} onClick={() => abrir()} data-teste="continuar">
            <b>Continuar o último roteiro</b>
            <span className="home-resumo">{resumo.titulo ? `“${resumo.titulo}” · ` : ''}{resumo.cenas} cena{resumo.cenas === 1 ? '' : 's'} · {resumo.palavras} palavras</span>
          </button>
        )}
        <button className="home-card" autoFocus={!continuavel} onPointerEnter={precarregarEditor} onClick={() => abrir(ROTEIRO_EM_BRANCO)} data-teste="novo">
          <b>Novo roteiro em branco</b>
          <span>Começa do zero, com Professor e Aluno prontos.</span>
        </button>
        <button className="home-card ia" onClick={() => set({ promptMestreAberto: true })} data-teste="prompt-mestre">
          <b>Gerar roteiro com qualquer IA</b>
          <span>Copie o prompt mestre, cole no Claude, ChatGPT ou Gemini e traga o roteiro de volta já conferido.</span>
        </button>
      </section>

      <section aria-label="Modelos">
        <h2>Começar de um modelo</h2>
        <div className="home-modelos">
          {MODELOS.map((m) => (
            <button key={m.id} className="home-modelo" onPointerEnter={precarregarEditor} onClick={() => abrir(m.roteiro, `Modelo “${m.nome}” carregado. Troque o que está entre {chaves}.`)} data-teste={`modelo-${m.id}`}>
              <small>{m.area}</small>
              <b>{m.nome}</b>
              <span>{m.descricao}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Mais opções">
        <h2>Mais</h2>
        <div className="home-mais">
          <button onClick={() => void abrirRoteiroDeArquivo()} data-teste="abrir-roteiro">Abrir roteiro…</button>
          <button onClick={() => abrir(undefined, undefined, 'abrir-projeto')} data-teste="abrir-projeto">Abrir projeto (.zip)…</button>
          <button onClick={() => abrir(ROTEIRO_EXEMPLO, 'Exemplo carregado.')} data-teste="exemplo">Ver o exemplo pronto</button>
          <button onClick={() => abrir(undefined, undefined, 'novo-personagem')} data-teste="novo-personagem">Criar personagem</button>
          <button onClick={() => abrir(undefined, undefined, 'editar-sprites')} data-teste="sprites">Sprites e biblioteca</button>
          <button onClick={() => set({ manualAberto: true })} data-teste="manual">Manual</button>
        </div>
      </section>

      <footer className="home-rodape">StickBoard {VERSAO} · Windows e Android · funciona sem internet · seus roteiros ficam neste aparelho</footer>
    </main>
  );
}
