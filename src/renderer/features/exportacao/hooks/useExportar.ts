import { carregarFontes } from '@renderer/features/fontes';
import { plataforma } from '@renderer/features/sistema';
import { FORMATOS, FPS, type FormatoVideo } from '@shared/constants/video';
import { useEditor } from '@renderer/store/editor-store';
import { useRoteiroEstatico } from '@renderer/features/roteiro';
import { exportarMp4 } from '../services/exportarMp4';
import { confirmarExportacao } from '../components/ConfirmarExportacaoModal';

/** Exporta o vídeo: renderiza, codifica em MP4 e entrega ao sistema (diálogo no Electron, compartilhar no Android, download na web). */
export function useExportar() {
  const exportando = useEditor((s) => s.exportando);
  const spritesOk = useEditor((s) => s.spritesOk);
  const set = useEditor((s) => s.set);
  const { timeline, roteiro: parseado } = useRoteiroEstatico();

  const exportar = async (formatoPedido?: FormatoVideo) => {
    if (useEditor.getState().exportando !== null) return;
    // frases que o app não consegue executar ficam de fora do vídeo: pergunta antes, em vez de exportar em silêncio
    const erros = parseado.diagnosticos.filter((d) => d.gravidade === 'erro');
    if (erros.length) {
      const escolha = await confirmarExportacao(erros);
      if (escolha === 'corrigir') { set({ mensagem: 'Frase marcada no roteiro. Corrija e exporte de novo.' }); return; }
      if (escolha === 'cancelar') { set({ mensagem: 'Exportação cancelada. Corrija as frases marcadas no roteiro.' }); return; }
    }
    const formato = formatoPedido ?? useEditor.getState().formato;
    const dim = FORMATOS[formato];
    set({ exportando: 0, tocando: false, mensagem: `Exportando ${dim.nome}…` });
    try {
      await carregarFontes();
      const blob = await exportarMp4(timeline, { w: dim.w, h: dim.h, fps: FPS, onProgresso: (p) => set({ exportando: p }), avisos: (m) => m && set({ mensagem: m }) });
      const nomeProjetoAtual = useEditor.getState().nomeProjeto || 'stickboard';
      const nomeBase = nomeProjetoAtual.replace(/[\s/\\?%*:|"<>]+/g, '_');
      const resposta = await plataforma.salvarVideo(blob, `${nomeBase}-${dim.sufixo}.mp4`);
      set({ mensagem: `MP4 exportado (${(blob.size / 1e6).toFixed(1)} MB). ${resposta}` });
    } catch (err) {
      set({ mensagem: `Falha na exportação: ${(err as Error).message}` });
    } finally {
      set({ exportando: null });
    }
  };

  /** Os dois formatos em sequência (16:9 para o YouTube e 9:16 para Shorts). */
  const exportarTodos = async () => { for (const f of ['16:9', '9:16'] as FormatoVideo[]) { await exportar(f); } };

  return { exportando, exportar, exportarTodos, podeExportar: spritesOk };
}


