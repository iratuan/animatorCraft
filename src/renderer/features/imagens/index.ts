/** API pública da feature "imagens": o resto do app só importa daqui. */
export { ImagensPanel } from './components/ImagensPanel';
export { bytesDaImagem, carregarImagensSalvas, importarImagem } from './services/armazenamento';
export { escolherEInserirImagem } from './services/inserir';
