import { registrarImagem, removerImagem, type InfoImagem } from '@shared/domain';
import { esquecerImagemQuadro, guardarImagemQuadro } from '@renderer/features/cena';
import { criarLoja } from '@renderer/features/sistema';

/**
 * Biblioteca de imagens da lousa (PNG, JPG, WebP). Os arquivos ficam no navegador/app (IndexedDB); o nome usado em
 * "Professor mostra a imagem nome.png no quadro." aponta para cá. O domínio guarda só nome e proporção.
 */
interface Registro { nome: string; mime: string; dados: ArrayBuffer; w: number; h: number }
const loja = criarLoja<Registro>('stickboard-imagens', 'imagens', { keyPath: 'nome' });

export const TIPOS_IMAGEM = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';
const LIMITE_PX = 2400; // imagens maiores que isso são reduzidas (a lousa nunca mostra mais que 1920 px)

async function decodificar(dados: ArrayBuffer, mime: string): Promise<{ bmp: ImageBitmap; w: number; h: number }> {
  const bmp = await createImageBitmap(new Blob([dados], { type: mime || 'image/png' }));
  return { bmp, w: bmp.width, h: bmp.height };
}

const mimeDe = (arquivo: File) => arquivo.type || (/\.jpe?g$/i.test(arquivo.name) ? 'image/jpeg' : /\.webp$/i.test(arquivo.name) ? 'image/webp' : 'image/png');

/** Lê o arquivo, guarda e deixa pronto para uso. Devolve o nome com que ele entra no roteiro. */
export async function importarImagem(arquivo: File): Promise<InfoImagem> {
  let dados = await arquivo.arrayBuffer();
  let mime = mimeDe(arquivo);
  let { bmp, w, h } = await decodificar(dados, mime);
  if (Math.max(w, h) > LIMITE_PX) { // reduz imagens gigantes para economizar memória
    const k = LIMITE_PX / Math.max(w, h), c = document.createElement('canvas');
    c.width = Math.round(w * k); c.height = Math.round(h * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob>((ok, erro) => c.toBlob((b) => (b ? ok(b) : erro(new Error('não consegui reduzir a imagem'))), 'image/png'));
    dados = await blob.arrayBuffer(); mime = 'image/png';
    ({ bmp, w, h } = await decodificar(dados, mime));
  }
  const info: InfoImagem = { nome: arquivo.name.replace(/\s+/g, '-'), w, h };
  registrarImagem(info); guardarImagemQuadro(info.nome, bmp);
  await loja.guardar({ nome: info.nome, mime, dados, w, h }).catch(() => { /* sem IndexedDB: a imagem vale só nesta sessão */ });
  return info;
}

/** Ao abrir o app: devolve ao domínio e à lousa as imagens já importadas. */
export async function carregarImagensSalvas(): Promise<number> {
  try {
    const todos = await loja.todos();
    for (const r of todos) {
      registrarImagem({ nome: r.nome, w: r.w, h: r.h });
      try { guardarImagemQuadro(r.nome, (await decodificar(r.dados, r.mime)).bmp); } catch { /* arquivo corrompido: fica o aviso na lousa */ }
    }
    return todos.length;
  } catch { return 0; }
}

export async function excluirImagem(nome: string): Promise<void> {
  removerImagem(nome); esquecerImagemQuadro(nome);
  await loja.remover(nome).catch(() => { /* nada guardado */ });
}

/** Bytes originais (para guardar no projeto). */
export async function bytesDaImagem(nome: string): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try { const r = await loja.obter(nome); return r ? { bytes: new Uint8Array(r.dados), mime: r.mime } : null; } catch { return null; }
}
