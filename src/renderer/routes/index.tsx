import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { HomePage } from '@renderer/pages/home/HomePage';
import { EditorPage } from '@renderer/routes/editor-lazy';
import { useEditor } from '@renderer/store/editor-store';

// janelas que podem abrir em qualquer tela; só são baixadas quando alguém as abre
const PromptMestreModal = lazy(() => import('@renderer/features/prompt-mestre').then((m) => ({ default: m.PromptMestreModal })));
const ManualModal = lazy(() => import('@renderer/features/ajuda').then((m) => ({ default: m.ManualModal })));

const Carregando = ({ texto }: { texto: string }) => <div className="carregando-tela" role="status">{texto}</div>;

function JanelasGlobais() {
  const prompt = useEditor((s) => s.promptMestreAberto);
  const manual = useEditor((s) => s.manualAberto);
  const set = useEditor((s) => s.set);
  useEffect(() => {
    if (!prompt && !manual) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') set(prompt ? { promptMestreAberto: false } : { manualAberto: false, manualSecao: null }); };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [prompt, manual, set]);
  return (
    <Suspense fallback={null}>
      {prompt && <PromptMestreModal />}
      {manual && <ManualModal />}
    </Suspense>
  );
}

/** Rotas do app. HashRouter (em App.tsx) funciona em file:// no Electron e no WebView do Android. "/" é a tela inicial; "/editor" o editor. */
export function Rotas() {
  const isVsCode = typeof window !== 'undefined' && !!window.__VSCODE_API__;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            isVsCode ? (
              <Suspense fallback={<Carregando texto="Abrindo o StickBoard no VS Code…" />}>
                <EditorPage />
              </Suspense>
            ) : (
              <HomePage />
            )
          }
        />
        <Route path="/editor" element={<Suspense fallback={<Carregando texto="Abrindo o editor…" />}><EditorPage /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JanelasGlobais />
    </>
  );
}
