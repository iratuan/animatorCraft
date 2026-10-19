import { useEffect } from 'react';
import { useEditor } from '@renderer/store/editor-store';
import { carregarFontesDoApp, carregarImagensEAudios, carregarSprites } from '@renderer/bootstrap';

/** Ao abrir o editor: carrega os sprites, reaplica os pacotes importados antes e espera as fontes. */
export function useCargaInicial() {
  const set = useEditor((s) => s.set);
  useEffect(() => {
    carregarSprites()
      .then((n) => set({ spritesOk: true, mensagem: n ? `Pronto. ${n} sprites de pacotes importados foram reaplicados.` : 'Pronto.' }))
      .catch((e: Error) => set({ mensagem: `Falha ao carregar personagens: ${e.message}` }));
    void carregarImagensEAudios();
    void carregarFontesDoApp();
  }, [set]);
}
