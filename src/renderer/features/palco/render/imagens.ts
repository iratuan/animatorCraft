/** Imagens da lousa já decodificadas (o domínio só guarda nome e proporção). */
const cache = new Map<string, ImageBitmap | HTMLImageElement>();
const chave = (n: string) => n.trim().toLowerCase();
export const guardarImagemQuadro = (nome: string, img: ImageBitmap | HTMLImageElement): void => { cache.set(chave(nome), img); };
export const esquecerImagemQuadro = (nome: string): void => { cache.delete(chave(nome)); };
export const imagemDoQuadro = (nome: string): ImageBitmap | HTMLImageElement | undefined => cache.get(chave(nome));
