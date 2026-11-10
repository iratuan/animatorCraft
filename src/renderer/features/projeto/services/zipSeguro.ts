import { unzipSync } from 'fflate';

export const LIMITE_ARQUIVO_ZIP = 40 * 1024 * 1024;
export const LIMITE_TOTAL_ZIP = 400 * 1024 * 1024;
export const LIMITE_ENTRADAS_ZIP = 3000;

/** Descompacta conferindo tamanhos antes de gastar memória (o zip declara o tamanho de cada arquivo). */
export function descompactarComLimites(zip: Uint8Array): Record<string, Uint8Array> {
  let total = 0, n = 0;
  return unzipSync(zip, { filter: (f) => {
    if (f.name.endsWith('/')) return false;
    if (++n > LIMITE_ENTRADAS_ZIP) throw new Error('O zip tem arquivos demais (mais de ' + LIMITE_ENTRADAS_ZIP + ').');
    if (f.originalSize > LIMITE_ARQUIVO_ZIP) throw new Error('O arquivo ' + f.name + ' é grande demais (' + Math.round(f.originalSize / 1048576) + ' MB; o limite é ' + LIMITE_ARQUIVO_ZIP / 1048576 + ' MB).');
    total += f.originalSize;
    if (total > LIMITE_TOTAL_ZIP) throw new Error('O zip descompactado passa de ' + LIMITE_TOTAL_ZIP / 1048576 + ' MB.');
    return true;
  } });
}
