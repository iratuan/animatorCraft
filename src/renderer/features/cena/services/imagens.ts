/** Imagens da lousa já decodificadas (o domínio só guarda nome e proporção). */
const cache = new Map<string, ImageBitmap | HTMLImageElement>();
const chave = (n: string) => n.trim().toLowerCase();

export const guardarImagemQuadro = (nome: string, img: ImageBitmap | HTMLImageElement): void => {
  const c = chave(nome);
  const antigo = cache.get(c);
  if (antigo && antigo !== img && 'close' in antigo && typeof (antigo as ImageBitmap).close === 'function') {
    (antigo as ImageBitmap).close();
  }
  cache.set(c, img);
};

export const esquecerImagemQuadro = (nome: string): void => {
  const c = chave(nome);
  const antigo = cache.get(c);
  if (antigo && 'close' in antigo && typeof (antigo as ImageBitmap).close === 'function') {
    (antigo as ImageBitmap).close();
  }
  cache.delete(c);
};

export const imagemDoQuadro = (nome: string): ImageBitmap | HTMLImageElement | undefined => cache.get(chave(nome));

