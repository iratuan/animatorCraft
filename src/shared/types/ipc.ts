/** Contrato dos dados que atravessam o IPC do Electron. Importado pelos dois lados. */
export interface RoteiroAberto { nome: string; texto: string }

export interface PedidoSalvarVideo {
  nomeSugerido: string;
  /** conteúdo do MP4 (ArrayBuffer atravessa o IPC como Uint8Array) */
  dados: Uint8Array;
}

export interface ArquivoEscolhido { nome: string; dados: Uint8Array }

export interface InfoApp { versao: string; plataforma: string; electron: string }

/** API exposta pelo preload em `window.stickboard`. Só existe dentro do Electron. */
export interface StickboardApi {
  abrirRoteiro(): Promise<RoteiroAberto | null>;
  /** devolve o caminho salvo, ou null se o usuário cancelou */
  salvarRoteiro(texto: string, nomeSugerido: string): Promise<string | null>;
  salvarVideo(pedido: PedidoSalvarVideo): Promise<string | null>;
  abrirZip(): Promise<ArquivoEscolhido | null>;
  /** grava o .zip escolhido; devolve o caminho, ou null se o usuário cancelou */
  salvarZip(pedido: PedidoSalvarVideo): Promise<string | null>;
  info(): Promise<InfoApp>;
  /** copia texto para a área de transferência do sistema (o navegador do Electron bloqueia a API web) */
  copiarTexto(texto: string): Promise<boolean>;
  /** avisa o processo principal se há alterações não salvas: ao fechar a janela, ele pergunta antes */
  definirAlteracoesPendentes(pendentes: boolean): Promise<void>;
}
