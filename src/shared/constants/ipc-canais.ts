/** Nomes dos canais IPC entre o processo principal (Node) e o renderer (React). Um só lugar para não errar string. */
export const CANAIS_IPC = {
  roteiroAbrir: 'roteiro:abrir',
  roteiroSalvar: 'roteiro:salvar',
  videoSalvar: 'video:salvar',
  pacoteAbrir: 'pacote:abrir',
  pacoteSalvar: 'pacote:salvar',
  infoApp: 'app:info',
  copiarTexto: 'area-de-transferencia:copiar',
  alteracoesPendentes: 'janela:alteracoes-pendentes',
} as const;

export type CanalIpc = (typeof CANAIS_IPC)[keyof typeof CANAIS_IPC];
