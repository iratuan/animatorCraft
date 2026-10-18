import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { carregarFontes } from '@renderer/features/fontes';
import { carregarAudiosSalvos } from '@renderer/features/audio';
import { carregarImagensSalvas } from '@renderer/features/imagens';
import { carregarPacotesSalvos, carregarPersonagens } from '@renderer/features/personagens';

/** Ao abrir o app: carrega os sprites, reaplica os pacotes importados antes e espera as fontes. */
export function useCargaInicial() {
  const set = useEditor((s) => s.set);
  useEffect(() => {
    carregarPersonagens()
      .then(() => carregarPacotesSalvos())
      .then((n) => {
        set({ spritesOk: true, mensagem: n ? `Pronto. ${n} sprites de pacotes importados foram reaplicados.` : 'Pronto.' });
        useEditor.getState().novaVersaoBib();
      })
      .catch((e: Error) => set({ mensagem: `Falha ao carregar personagens: ${e.message}` }));
    void carregarImagensSalvas().then(() => useEditor.getState().novaVersaoImagens());
    void carregarAudiosSalvos().then(() => useEditor.getState().novaVersaoAudio());
    void carregarFontes().then(() => set({ fontesOk: true }));
  }, [set]);
}


