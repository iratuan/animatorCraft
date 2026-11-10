/** API pública da feature "personagens": o resto do app só importa daqui. */
export { PersonagemModal } from './components/PersonagemModal';
export { PropriedadesPanel } from './components/PropriedadesPanel';
export { carregarPersonagensSalvos, importarPersonagemConfig } from './services/cadastro';
export { gravarFichas } from './services/fichas';

export { carregarAnimacoesSalvas, lerAnimacoes, mesclarAnimacoes, removerAnimacoesDe, salvarClipes, salvarExpressoes } from './services/animacoes';
export { EditorAnimacaoModal } from './components/EditorAnimacaoModal';