/** Utilidades de arquivo e de bytes usadas por várias features (importar, exportar, projeto). */

/** data URL, blob: ou URL de arquivo → bytes (fetch resolve todos). */
export async function bytesDeUrl(url: string): Promise<Uint8Array> {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

/** Blob → conteúdo em base64 (sem o prefixo data:). */
export const blobParaBase64 = (blob: Blob): Promise<string> =>
  new Promise((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] ?? '');
    r.onerror = () => erro(r.error);
    r.readAsDataURL(blob);
  });

/** Abre o seletor de arquivos do navegador. Devolve [] se o usuário cancelar. */
export function escolherArquivos(accept: string, multiplos = false): Promise<File[]> {
  return new Promise((ok) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept; inp.multiple = multiplos;
    inp.onchange = () => ok(Array.from(inp.files ?? []));
    inp.addEventListener('cancel', () => ok([]));
    inp.click();
  });
}

/** Baixa `blob` como arquivo (navegador). */
export function baixarArquivo(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
