import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useEditor } from './store/editor-store';
import './assets/estilos/global.css';
import { carregarPersonagensSalvos } from './features/personagens/services/personagens';

// os personagens criados pelo usuário precisam existir antes da primeira interpretação do roteiro
const skins = carregarPersonagensSalvos();
useEditor.setState({ skinPadrao: skins.padrao, skins: skins.porPersonagem });

createRoot(document.getElementById('root')!).render(<App />);

