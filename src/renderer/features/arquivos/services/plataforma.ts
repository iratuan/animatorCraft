import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { PacoteEscolhido, RoteiroAberto } from '@shared/types/ipc';

/**
 * Porta de plataforma: o resto do app pede "abrir/salvar" sem saber onde roda.
 *  - Electron: diálogos nativos e gravação em disco via IPC (window.stickboard, definido no preload)
 *  - Android (Capacitor): grava no cache e abre a folha de compartilhamento
 *  - Navegador: download e seletor de arquivos do HTML
 */
export interface Plataforma {
  nome: 'electron' | 'android' | 'web';
  abrirRoteiro(): Promise<RoteiroAberto | null>;
  salvarRoteiro(texto: string, nomeSugerido: string): Promise<string | null>;
  /** devolve uma mensagem para mostrar ao usuário */
  salvarVideo(video: Blob, nomeSugerido: string): Promise<string>;
  abrirPacoteSprites(): Promise<PacoteEscolhido | null>;
  /** devolve uma mensagem para mostrar ao usuário */
  salvarPacoteSprites(zip: Uint8Array, nomeSugerido: string): Promise<string>;
}

// ---------------------------------------------------------------- utilitários do navegador

function escolherArquivoHtml(accept: string): Promise<File | null> {
  return new Promise((ok) => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => ok(inp.files?.[0] ?? null);
    inp.addEventListener('cancel', () => ok(null));
    inp.click();
  });
}

export function baixarArquivo(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const blobParaBase64 = (blob: Blob) =>
  new Promise<string>((ok, erro) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(',')[1] ?? '');
    r.onerror = () => erro(r.error);
    r.readAsDataURL(blob);
  });

const lerArquivo = async (f: File): Promise<PacoteEscolhido> => ({ nome: f.name, dados: new Uint8Array(await f.arrayBuffer()) });

// ---------------------------------------------------------------- implementações

const web: Plataforma = {
  nome: 'web',
  async abrirRoteiro() { const f = await escolherArquivoHtml('.txt,.stk'); return f ? { nome: f.name, texto: await f.text() } : null; },
  async salvarRoteiro(texto, nome) { baixarArquivo(new Blob([texto], { type: 'text/plain' }), nome); return nome; },
  async salvarVideo(video, nome) { baixarArquivo(video, nome); return `Arquivo baixado: ${nome}`; },
  async abrirPacoteSprites() { const f = await escolherArquivoHtml('.zip'); return f ? lerArquivo(f) : null; },
  async salvarPacoteSprites(zip, nome) { baixarArquivo(new Blob([zip as BlobPart], { type: 'application/zip' }), nome); return `Arquivo baixado: ${nome}`; },
};

const electron: Plataforma = {
  nome: 'electron',
  abrirRoteiro: () => window.stickboard!.abrirRoteiro(),
  salvarRoteiro: (texto, nome) => window.stickboard!.salvarRoteiro(texto, nome),
  async salvarVideo(video, nome) {
    const caminho = await window.stickboard!.salvarVideo({ nomeSugerido: nome, dados: new Uint8Array(await video.arrayBuffer()) });
    return caminho ? `Vídeo salvo em ${caminho}` : 'Salvamento cancelado.';
  },
  abrirPacoteSprites: () => window.stickboard!.abrirPacoteSprites(),
  async salvarPacoteSprites(zip, nome) {
    const caminho = await window.stickboard!.salvarPacoteSprites({ nomeSugerido: nome, dados: zip });
    return caminho ? `Sprites exportados em ${caminho}` : 'Exportação cancelada.';
  },
};

const android: Plataforma = {
  nome: 'android',
  abrirRoteiro: web.abrirRoteiro,
  async salvarRoteiro(texto, nome) {
    await Filesystem.writeFile({ path: nome, data: texto, directory: Directory.Cache, encoding: Encoding.UTF8 });
    const { uri } = await Filesystem.getUri({ path: nome, directory: Directory.Cache });
    try { await Share.share({ title: nome, files: [uri] }); } catch { /* o usuário fechou a folha */ }
    return nome;
  },
  async salvarVideo(video, nome) {
    // grava em fatias para não estourar a memória com vídeos grandes
    const FATIA = 3 * 1024 * 1024;
    for (let inicio = 0; inicio < video.size; inicio += FATIA) {
      const data = await blobParaBase64(video.slice(inicio, inicio + FATIA));
      if (inicio === 0) await Filesystem.writeFile({ path: nome, data, directory: Directory.Cache });
      else await Filesystem.appendFile({ path: nome, data, directory: Directory.Cache });
    }
    const { uri } = await Filesystem.getUri({ path: nome, directory: Directory.Cache });
    try { await Share.share({ title: nome, files: [uri], dialogTitle: 'Salvar ou enviar o vídeo' }); } catch { /* o usuário fechou a folha */ }
    return `Arquivo pronto: ${nome} (${(video.size / 1e6).toFixed(1)} MB)`;
  },
  abrirPacoteSprites: web.abrirPacoteSprites,
  async salvarPacoteSprites(zip, nome) {
    const data = await blobParaBase64(new Blob([zip as BlobPart]));
    await Filesystem.writeFile({ path: nome, data, directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: nome, directory: Directory.Cache });
    try { await Share.share({ title: nome, files: [uri], dialogTitle: 'Salvar ou enviar os sprites' }); } catch { /* o usuário fechou a folha */ }
    return `Pacote pronto: ${nome}`;
  },
};

export function obterPlataforma(): Plataforma {
  if (typeof window !== 'undefined' && window.stickboard) return electron;
  if (Capacitor.isNativePlatform()) return android;
  return web;
}

export const plataforma = obterPlataforma();

