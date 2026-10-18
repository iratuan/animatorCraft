import { dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import type { PedidoSalvarVideo } from '@shared/types/ipc';

/** Pergunta onde salvar e grava o MP4. Devolve o caminho, ou null se o usuário cancelou. */
export async function salvarVideo(pedido: PedidoSalvarVideo): Promise<string | null> {
  const r = await dialog.showSaveDialog({ title: 'Salvar vídeo', defaultPath: pedido.nomeSugerido, filters: [{ name: 'Vídeo MP4', extensions: ['mp4'] }] });
  if (r.canceled || !r.filePath) return null;
  await writeFile(r.filePath, Buffer.from(pedido.dados));
  return r.filePath;
}
