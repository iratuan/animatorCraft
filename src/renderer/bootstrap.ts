import { useEditor } from '@renderer/store/editor-store';
import { carregarFontes } from '@renderer/features/fontes';
import { carregarAudiosSalvos } from '@renderer/features/audio';
import { carregarImagensSalvas } from '@renderer/features/imagens';
import { carregarPersonagensSalvos } from '@renderer/features/personagens';

/**
 * Preparação do app, feita só quando alguma tela precisa dela (o editor ou o prompt mestre), nunca na tela inicial:
 * assim a tela inicial abre sem carregar fontes nem personagens. Cada etapa roda uma vez; chamar de novo devolve a mesma promessa.
 */

let personagens = false;
/** Reinstala os personagens criados pelo usuário. Síncrono: precisa existir antes da primeira interpretação do roteiro. */
export function prepararPersonagens(): void {
  if (personagens) return;
  personagens = true;
  carregarPersonagensSalvos();
}

let elenco: Promise<void> | null = null;
/** Elenco pronto: todos os personagens são bonecos de palito e já estão no código, então basta reinstalar os criados pelo usuário. */
export function carregarElenco(): Promise<void> {
  prepararPersonagens();
  elenco ??= Promise.resolve().then(() => {
    useEditor.setState({ spritesOk: true });
    useEditor.getState().novaVersaoBib();
  });
  return elenco;
}

let biblioteca: Promise<void> | null = null;
/** Imagens e áudios já importados pelo usuário (os nomes que o roteiro pode citar). */
export function carregarImagensEAudios(): Promise<void> {
  biblioteca ??= Promise.all([
    carregarImagensSalvas().then(() => useEditor.getState().novaVersaoImagens()),
    carregarAudiosSalvos().then(() => useEditor.getState().novaVersaoAudio()),
  ]).then(() => undefined);
  return biblioteca;
}

let fontes: Promise<void> | null = null;
export function carregarFontesDoApp(): Promise<void> {
  fontes ??= carregarFontes().then(() => useEditor.setState({ fontesOk: true }));
  return fontes;
}
