import { Navigate, Route, Routes } from 'react-router-dom';
import { EditorPage } from '@renderer/pages/EditorPage';

/** Rotas do app. HashRouter (em App.tsx) funciona em file:// no Electron e no WebView do Android. */
export function Rotas() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
