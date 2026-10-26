import { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Rotas } from '@renderer/routes';
import { SplashScreen } from '@renderer/components/SplashScreen';
import { useProtecaoFechamento } from '@renderer/pages/editor/useProtecaoFechamento';

export function App() {
  // vale para o app inteiro: as alterações ficam no store mesmo quando o usuário volta à tela inicial
  useProtecaoFechamento();
  const [mostrarSplash, setMostrarSplash] = useState(() => {
    if (typeof window !== 'undefined') {
      if (window.__VSCODE_API__) return false;
      const p = new URLSearchParams(window.location.search);
      return p.get('splash') !== '0';
    }
    return true;
  });

  return (
    <>
      <HashRouter>
        <Rotas />
      </HashRouter>
      {mostrarSplash && <SplashScreen onFinalizar={() => setMostrarSplash(false)} />}
    </>
  );
}
