import { useEditor } from '@renderer/store/editor-store';
import { carregarFontes } from '@renderer/features/fontes';
import { carregarAudiosSalvos } from '@renderer/features/audio';
import { carregarImagensSalvas } from '@renderer/features/imagens';
import { carregarPacotesSalvos, carregarPersonagens, carregarPersonagensSalvos } from '@renderer/features/personagens';

/**
 * Preparação do app, feita só quando alguma tela precisa dela (o editor ou o prompt mestre), nunca na tela inicial:
 * assim a tela inicial abre sem baixar sprites nem fontes. Cada etapa roda uma vez; chamar de novo devolve a mesma promessa.
 */

let personagens = false;
/** Reinstala os personagens criados pelo usuário e as skins. Síncrono: precisa existir antes da primeira interpretação do roteiro. */
export function prepararPersonagens(): void {
  if (personagens) return;
  personagens = true;
  const skins = carregarPersonagensSalvos();
  useEditor.setState({ skinPadrao: skins.padrao, skins: skins.porPersonagem });
}

let sprites: Promise<number> | null = null;
/** Carrega os sprites originais e reaplica os pacotes importados. Devolve quantos sprites vieram de pacotes. */
export function carregarSprites(): Promise<number> {
  prepararPersonagens();
  sprites ??= carregarPersonagens().then(() => carregarPacotesSalvos()).then((n) => {
    useEditor.setState({ spritesOk: true });
    useEditor.getState().novaVersaoBib();
    return n;
  });
  return sprites;
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
