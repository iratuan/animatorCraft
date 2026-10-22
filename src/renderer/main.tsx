import { createRoot } from 'react-dom/client';
import { App } from '@renderer/App';
import { ErroBoundary } from '@renderer/components/ErroBoundary';
import './assets/estilos/global.css';
import 'katex/dist/katex.min.css';

// A tela inicial abre sem carregar sprites, fontes nem personagens salvos: quem precisa deles os pede (ver bootstrap.ts).
createRoot(document.getElementById('root')!).render(<ErroBoundary><App /></ErroBoundary>);
