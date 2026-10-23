import { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import { Rotas } from '@renderer/routes';
import { SplashScreen } from '@renderer/components/SplashScreen';

export function App() {
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
