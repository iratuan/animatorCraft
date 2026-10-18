import { ATORES, fraseDaImagem, type InfoImagem } from '@shared/domain';
import { useEditor } from '@renderer/store/editor-store';
import { importarImagem } from './armazenamento';

/** Escreve no roteiro (no ponto do cursor) a frase que mostra a imagem na lousa. */
export function inserirImagemNoRoteiro(info: InfoImagem): void {
  const s = useEditor.getState();
  const frase = fraseDaImagem('Professor', { tipo: 'imagem', arquivo: info.nome, entrada: 'surgir', posicao: 'centro', tamanho: 'media' });
  s.inserirNoCursor(frase);
  s.set({ mensagem: `Imagem “${info.nome}” inserida no roteiro. Troque o efeito clicando no bloco dela na linha do tempo.` });
}

/** Abre o seletor de arquivos, importa as imagens e insere no roteiro a primeira (ou todas, em sequência). */
export async function escolherEInserirImagem(): Promise<void> {
  const arquivos = await new Promise<File[]>((ok) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'; inp.multiple = true;
    inp.onchange = () => ok(Array.from(inp.files ?? []));
    inp.addEventListener('cancel', () => ok([]));
    inp.click();
  });
  const st = useEditor.getState();
  const falhas: string[] = [];
  for (const f of arquivos) {
    try { const info = await importarImagem(f); inserirImagemNoRoteiro(info); } catch { falhas.push(f.name); }
  }
  st.novaVersaoImagens();
  if (falhas.length) st.set({ mensagem: `Não consegui ler: ${falhas.join(', ')} (use PNG, JPG ou WebP).` });
  void ATORES;
}
