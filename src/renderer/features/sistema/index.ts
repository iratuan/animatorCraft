/** API pública da feature "sistema": plataforma (Electron/Android/web), arquivos e armazenamento local. */
export { plataforma } from './services/plataforma';
export type { Plataforma } from './services/plataforma';
export { baixarArquivo, blobParaBase64, bytesDeUrl, escolherArquivos } from './services/arquivos';
export { gravarJson, gravarTexto, lerJson, lerTexto } from './services/armazenamento-local';
export { criarLoja } from './services/indexeddb';
export type { Loja } from './services/indexeddb';
