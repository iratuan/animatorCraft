import { contextBridge, ipcRenderer } from 'electron';
import { CANAIS_IPC } from '@shared/constants/ipc-canais';
import type { StickboardApi } from '@shared/types/ipc';

/** Única ponte entre o renderer e o Node: só expõe funções específicas, nunca o ipcRenderer inteiro. */
const api: StickboardApi = {
  abrirRoteiro: () => ipcRenderer.invoke(CANAIS_IPC.roteiroAbrir),
  salvarRoteiro: (texto, nomeSugerido) => ipcRenderer.invoke(CANAIS_IPC.roteiroSalvar, texto, nomeSugerido),
  salvarVideo: (pedido) => ipcRenderer.invoke(CANAIS_IPC.videoSalvar, pedido),
  abrirZip: () => ipcRenderer.invoke(CANAIS_IPC.zipAbrir),
  salvarZip: (pedido) => ipcRenderer.invoke(CANAIS_IPC.zipSalvar, pedido),
  info: () => ipcRenderer.invoke(CANAIS_IPC.infoApp),
  copiarTexto: (texto) => ipcRenderer.invoke(CANAIS_IPC.copiarTexto, texto),
  definirAlteracoesPendentes: (pendentes) => ipcRenderer.invoke(CANAIS_IPC.alteracoesPendentes, pendentes),
};

contextBridge.exposeInMainWorld('stickboard', api);
