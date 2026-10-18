import { HashRouter } from 'react-router-dom';
import { Rotas } from '@renderer/routes';

export function App() {
  return (
    <HashRouter>
      <Rotas />
    </HashRouter>
  );
}
