/** API pública da feature "audio": o resto do app só importa daqui. */
export { AudioPanel } from './components/AudioPanel';
export { useAudioPreview } from './hooks/useAudioPreview';
export { bufferBrutoDoAudio, carregarAudiosSalvos, importarAudio } from './services/armazenamento';
export { mixarParaExportacao } from './services/mixer';

