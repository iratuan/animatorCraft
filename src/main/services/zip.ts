import { dialog } from 'electron';
import { writeFile } from 'node:fs/promises';
import type { PedidoSalvarVideo } from '@shared/types/ipc';

/** Pergunta onde salvar e grava o .zip do projeto. Devolve o caminho, ou null se o usuário cancelou. */
export async function salvarZip(pedido: PedidoSalvarVideo): Promise<string | null> {
  const r = await dialog.showSaveDialog({ title: 'Salvar projeto', defaultPath: pedido.nomeSugerido, filters: [{ name: 'Projeto StickBoard (.zip)', extensions: ['zip'] }] });
  if (r.canceled || !r.filePath) return null;
  await writeFile(r.filePath, Buffer.from(pedido.dados));
  return r.filePath;
}