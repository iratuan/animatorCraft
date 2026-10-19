import { dialog } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import type { PacoteEscolhido, RoteiroAberto } from '@shared/types/ipc';

export async function abrirRoteiro(): Promise<RoteiroAberto | null> {
  const r = await dialog.showOpenDialog({ title: 'Abrir roteiro', filters: [{ name: 'Roteiro', extensions: ['txt', 'stk'] }], properties: ['openFile'] });
  const caminho = r.filePaths[0];
  if (r.canceled || !caminho) return null;
  return { nome: basename(caminho), texto: await readFile(caminho, 'utf8') };
}

/** Filtro do diálogo de salvar de acordo com o arquivo (roteiro, legendas ou o prompt mestre): o Windows não troca a extensão que o usuário vê. */
export function filtroDeTexto(nome: string): Electron.FileFilter {
  if (/\.srt$/i.test(nome)) return { name: 'Legendas (.srt)', extensions: ['srt'] };
  if (/\.md$/i.test(nome)) return { name: 'Markdown (.md)', extensions: ['md', 'txt'] };
  return { name: 'Roteiro', extensions: ['stk.txt', 'txt'] };
}

export async function salvarRoteiro(texto: string, nomeSugerido: string): Promise<string | null> {
  const r = await dialog.showSaveDialog({ title: 'Salvar', defaultPath: nomeSugerido, filters: [filtroDeTexto(nomeSugerido)] });
  if (r.canceled || !r.filePath) return null;
  await writeFile(r.filePath, texto, 'utf8');
  return r.filePath;
}

export async function abrirPacote(): Promise<PacoteEscolhido | null> {
  const r = await dialog.showOpenDialog({ title: 'Importar pacote de sprites', filters: [{ name: 'Pacote de sprites (.zip)', extensions: ['zip'] }], properties: ['openFile'] });
  const caminho = r.filePaths[0];
  if (r.canceled || !caminho) return null;
  return { nome: basename(caminho), dados: new Uint8Array(await readFile(caminho)) };
}
