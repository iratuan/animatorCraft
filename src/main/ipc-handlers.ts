import { app, clipboard, ipcMain } from 'electron';
import { CANAIS_IPC } from '@shared/constants/ipc-canais';
import type { InfoApp, ArquivoEscolhido, PedidoSalvarVideo, RoteiroAberto } from '@shared/types/ipc';
import { abrirZip, abrirRoteiro, salvarRoteiro } from './services/arquivos';
import { salvarVideo } from './services/video';
import { salvarZip } from './services/zip';
import { definirAlteracoesPendentes } from './services/janela';

/** Registra todos os canais IPC. Cada canal só delega para um serviço; a regra de negócio fica em services/. */
export function registrarIpc(): void {
  ipcMain.handle(CANAIS_IPC.roteiroAbrir, (): Promise<RoteiroAberto | null> => abrirRoteiro());
  ipcMain.handle(CANAIS_IPC.roteiroSalvar, (_e, texto: string, nomeSugerido: string): Promise<string | null> => salvarRoteiro(texto, nomeSugerido));
  ipcMain.handle(CANAIS_IPC.videoSalvar, (_e, pedido: PedidoSalvarVideo): Promise<string | null> => salvarVideo(pedido));
  ipcMain.handle(CANAIS_IPC.zipAbrir, (): Promise<ArquivoEscolhido | null> => abrirZip());
  ipcMain.handle(CANAIS_IPC.zipSalvar, (_e, pedido: PedidoSalvarVideo): Promise<string | null> => salvarZip(pedido));
  ipcMain.handle(CANAIS_IPC.copiarTexto, (_e, texto: string): boolean => { if (typeof texto !== 'string' || texto.length > 5_000_000) return false; clipboard.writeText(texto); return true; });
  ipcMain.handle(CANAIS_IPC.alteracoesPendentes, (_e, pendentes: boolean): void => definirAlteracoesPendentes(pendentes));
  ipcMain.handle(CANAIS_IPC.infoApp, (): InfoApp => ({ versao: app.getVersion(), plataforma: process.platform, electron: process.versions.electron }));
}
