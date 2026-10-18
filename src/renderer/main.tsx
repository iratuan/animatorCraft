import { createRoot } from 'react-dom/client';
import { App } from '@renderer/App';
import { ErroBoundary } from '@renderer/components/ErroBoundary';
import { useEditor } from '@renderer/store/editor-store';
import './assets/estilos/global.css';
import { carregarPersonagensSalvos } from '@renderer/features/personagens';

// os personagens criados pelo usuário precisam existir antes da primeira interpretação do roteiro
const skins = carregarPersonagensSalvos();
useEditor.setState({ skinPadrao: skins.padrao, skins: skins.porPersonagem });

createRoot(document.getElementById('root')!).render(<ErroBoundary><App /></ErroBoundary>);

