/** API pública da feature "personagens": o resto do app só importa daqui. */
export { EditorSpritesModal } from './components/EditorSpritesModal';
export { ImportarPacoteModal } from './components/ImportarPacoteModal';
export { PersonagemModal } from './components/PersonagemModal';
export { PropriedadesPanel } from './components/PropriedadesPanel';
export { SeletorSkin, useSkins } from './hooks/useSkins';
export { carregarPersonagens } from './services/bibliotecaSprites';
export { carregarPersonagensSalvos, gravarSkins } from './services/cadastro';
export { obterSprite } from './services/exportarSprites';
export { gravarFichas } from './services/fichas';
export { aplicarPacote, descompactarComLimites, lerPacote } from './services/pacotes';
export { carregarPacotesSalvos, lerEntradasSalvas, limparPacotesSalvos } from './services/spritesSalvos';
export type { PacoteLido } from './services/pacotes';

export { carregarAnimacoesSalvas, lerAnimacoes, mesclarAnimacoes, removerAnimacoesDe, salvarClipes, salvarExpressoes } from './services/animacoes';
export { EditorAnimacaoModal } from './components/EditorAnimacaoModal';
