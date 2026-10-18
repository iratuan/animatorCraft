import { carregarFontes } from '@renderer/features/fontes/services/fontes';
import { carregarPersonagens } from '@renderer/features/pacotes-sprites/services/personagens';
import { plataforma } from '@renderer/features/arquivos/services/plataforma';
import { FORMATOS, FPS } from '@shared/constants/video';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroDerivado } from '@renderer/features/roteiro/hooks/useRoteiroDerivado';
import { exportarMp4 } from '../services/exportarMp4';

/** Exporta o vídeo: renderiza, codifica em MP4 e entrega ao sistema (diálogo no Electron, compartilhar no Android, download na web). */
export function useExportar() {
  const exportando = useEditor((s) => s.exportando);
  const spritesOk = useEditor((s) => s.spritesOk);
  const set = useEditor((s) => s.set);
  const { timeline } = useRoteiroDerivado();

  const exportar = async () => {
    if (useEditor.getState().exportando !== null) return;
    const formato = useEditor.getState().formato;
    const dim = FORMATOS[formato];
    set({ exportando: 0, tocando: false, mensagem: `Exportando ${dim.nome}…` });
    try {
      await carregarPersonagens();
      await carregarFontes();
      const blob = await exportarMp4(timeline, { w: dim.w, h: dim.h, fps: FPS, onProgresso: (p) => set({ exportando: p }) });
      const resposta = await plataforma.salvarVideo(blob, `stickboard-${dim.sufixo}.mp4`);
      set({ mensagem: `MP4 exportado (${(blob.size / 1e6).toFixed(1)} MB). ${resposta}` });
    } catch (err) {
      set({ mensagem: `Falha na exportação: ${(err as Error).message}` });
    } finally {
      set({ exportando: null });
    }
  };

  return { exportando, exportar, podeExportar: spritesOk };
}
